import { Platform } from 'react-native';

export const PRO_ENTITLEMENT = 'pro';

// Public SDK keys from the RevenueCat dashboard (safe to ship in the app).
const REVENUECAT_API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

export const SUBSCRIPTIONS_AVAILABLE = Platform.OS !== 'web' && !!REVENUECAT_API_KEY;

type PurchasesModule = typeof import('react-native-purchases').default;
type PurchasesUIModule = typeof import('react-native-purchases-ui');

// Required lazily so web bundles (where these native modules are stubbed) never load them.
/* eslint-disable @typescript-eslint/no-require-imports */
const loadPurchases = (): PurchasesModule => require('react-native-purchases').default;
const loadPurchasesUI = (): PurchasesUIModule => require('react-native-purchases-ui');
/* eslint-enable @typescript-eslint/no-require-imports */

let configured = false;

/** Configures RevenueCat for the signed-in user so purchases follow their account. */
export async function identifySubscriber(uid: string): Promise<void> {
  if (!SUBSCRIPTIONS_AVAILABLE) return;
  const Purchases = loadPurchases();
  if (!configured) {
    Purchases.configure({ apiKey: REVENUECAT_API_KEY!, appUserID: uid });
    configured = true;
    return;
  }
  await Purchases.logIn(uid);
}

export async function resetSubscriber(): Promise<void> {
  if (!SUBSCRIPTIONS_AVAILABLE || !configured) return;
  try {
    await loadPurchases().logOut();
  } catch {
    // logOut throws if the current user is already anonymous.
  }
}

export async function hasProEntitlement(): Promise<boolean> {
  if (!SUBSCRIPTIONS_AVAILABLE || !configured) return false;
  const info = await loadPurchases().getCustomerInfo();
  return !!info.entitlements.active[PRO_ENTITLEMENT];
}

/** Shows the RevenueCat paywall. Resolves true if the user purchased or restored. */
export async function presentProPaywall(): Promise<boolean> {
  if (!SUBSCRIPTIONS_AVAILABLE || !configured) return false;
  const { default: RevenueCatUI, PAYWALL_RESULT } = loadPurchasesUI();
  const result = await RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: PRO_ENTITLEMENT,
  });
  return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
}

export async function restorePurchases(): Promise<boolean> {
  if (!SUBSCRIPTIONS_AVAILABLE || !configured) return false;
  const info = await loadPurchases().restorePurchases();
  return !!info.entitlements.active[PRO_ENTITLEMENT];
}

export async function manageSubscription(): Promise<void> {
  if (!SUBSCRIPTIONS_AVAILABLE || !configured) return;
  await loadPurchases().showManageSubscriptions();
}
