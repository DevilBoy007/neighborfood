import { timingSafeEqual } from 'crypto';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { CallableRequest, HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';

// RevenueCat secret API key (v1 REST) and the Authorization value configured on the webhook.
export const revenueCatApiKey = defineSecret('REVENUECAT_SECRET_API_KEY');
export const revenueCatWebhookAuth = defineSecret('REVENUECAT_WEBHOOK_AUTH');

export const PRO_ENTITLEMENT = 'pro';

export type SellerPlan = 'free' | 'pro';

export const PLAN_LIMITS: Record<
  SellerPlan,
  { maxShops: number; maxItems: number; platformFeeWaived: boolean }
> = {
  free: { maxShops: 1, maxItems: 25, platformFeeWaived: false },
  pro: { maxShops: 10, maxItems: 1000, platformFeeWaived: true },
};

export interface StoredSubscription {
  entitlement: string;
  active: boolean;
  /** Epoch ms; null means it never expires (e.g. a granted promotional entitlement). */
  expiresAt: number | null;
  productId: string | null;
  store: string | null;
}

export function isSubscriptionActive(
  subscription: Partial<StoredSubscription> | undefined | null,
  now = Date.now()
): boolean {
  if (!subscription || subscription.entitlement !== PRO_ENTITLEMENT || !subscription.active) {
    return false;
  }
  return subscription.expiresAt === null || Number(subscription.expiresAt) > now;
}

export async function getSellerPlan(uid: string): Promise<SellerPlan> {
  const user = await getFirestore().collection('users').doc(uid).get();
  return isSubscriptionActive(user.data()?.subscription) ? 'pro' : 'free';
}

/** Reads the user's current Pro entitlement from RevenueCat (source of truth). */
export async function fetchProEntitlement(
  appUserId: string,
  apiKey: string
): Promise<StoredSubscription> {
  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    { headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' } }
  );
  if (!response.ok) {
    throw new Error(`RevenueCat lookup failed with HTTP ${response.status}`);
  }
  const body = (await response.json()) as {
    subscriber?: {
      entitlements?: Record<
        string,
        { expires_date: string | null; product_identifier?: string } | undefined
      >;
      subscriptions?: Record<string, { store?: string } | undefined>;
    };
  };
  const entitlement = body.subscriber?.entitlements?.[PRO_ENTITLEMENT];
  if (!entitlement) {
    return {
      entitlement: PRO_ENTITLEMENT,
      active: false,
      expiresAt: 0,
      productId: null,
      store: null,
    };
  }
  const expiresAt = entitlement.expires_date ? Date.parse(entitlement.expires_date) : null;
  const productId = entitlement.product_identifier ?? null;
  return {
    entitlement: PRO_ENTITLEMENT,
    active: expiresAt === null || expiresAt > Date.now(),
    expiresAt,
    productId,
    store: (productId && body.subscriber?.subscriptions?.[productId]?.store) || null,
  };
}

export async function syncSubscriptionForUser(
  uid: string,
  apiKey: string
): Promise<StoredSubscription | null> {
  const userRef = getFirestore().collection('users').doc(uid);
  if (!(await userRef.get()).exists) return null;
  const subscription = await fetchProEntitlement(uid, apiKey);
  await userRef.update({
    subscription: { ...subscription, updatedAt: FieldValue.serverTimestamp() },
  });
  return subscription;
}

async function getPlanStatus(uid: string) {
  const db = getFirestore();
  const [user, shops, items] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('shops').where('userId', '==', uid).count().get(),
    db.collection('items').where('userId', '==', uid).count().get(),
  ]);
  const subscription = user.data()?.subscription as StoredSubscription | undefined;
  const plan: SellerPlan = isSubscriptionActive(subscription) ? 'pro' : 'free';
  return {
    plan,
    limits: PLAN_LIMITS[plan],
    shopCount: shops.data().count,
    itemCount: items.data().count,
    expiresAt: plan === 'pro' ? (subscription?.expiresAt ?? null) : null,
  };
}

export const getSellerPlanStatus = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to perform this action');
  }
  return await getPlanStatus(request.auth.uid);
});

/** Called by the app right after a purchase or restore so benefits apply immediately. */
export const syncSubscription = onCall(
  { secrets: [revenueCatApiKey] },
  async (request: CallableRequest) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to perform this action');
    }
    try {
      await syncSubscriptionForUser(request.auth.uid, revenueCatApiKey.value());
    } catch (error) {
      console.error('Subscription sync failed for', request.auth.uid, error);
      throw new HttpsError('unavailable', 'Could not verify your subscription. Try again soon.');
    }
    return await getPlanStatus(request.auth.uid);
  }
);

function authorizationMatches(received: string | undefined, expected: string): boolean {
  if (!received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(`Bearer ${expected}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** RevenueCat webhook: re-reads entitlements for every user an event touches. */
export const revenueCatWebhook = onRequest(
  { secrets: [revenueCatApiKey, revenueCatWebhookAuth] },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }
    if (!authorizationMatches(req.headers.authorization, revenueCatWebhookAuth.value())) {
      res.status(401).send('Unauthorized');
      return;
    }
    const event = req.body?.event ?? {};
    const candidates: unknown[] = [
      event.app_user_id,
      event.original_app_user_id,
      ...(Array.isArray(event.aliases) ? event.aliases : []),
      ...(Array.isArray(event.transferred_from) ? event.transferred_from : []),
      ...(Array.isArray(event.transferred_to) ? event.transferred_to : []),
    ];
    const userIds = new Set(
      candidates.filter(
        (id): id is string =>
          typeof id === 'string' && !!id && !id.startsWith('$RCAnonymousID') && !id.includes('/')
      )
    );
    try {
      await Promise.all(
        Array.from(userIds).map((uid) => syncSubscriptionForUser(uid, revenueCatApiKey.value()))
      );
    } catch (error) {
      console.error('RevenueCat webhook sync failed', event.type, error);
      res.status(500).send('Sync failed');
      return;
    }
    res.json({ received: true });
  }
);
