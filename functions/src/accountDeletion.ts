import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { HttpsError } from 'firebase-functions/v2/https';
import type Stripe from 'stripe';

// Must match the bucket the client uploads to in handlers/firebaseService.tsx.
export const STORAGE_BUCKET = 'neighborfoods';

const ACTIVE_ESCROW = ['held', 'releasing', 'refunding'];
const ACTIVE_FULFILMENT = ['pending', 'preparing', 'ready', 'in-delivery'];

export interface AccountDeletionSummary {
  shops: number;
  items: number;
  threads: number;
  anonymizedOrders: number;
  cancelledTrades: number;
}

async function getOrdersInvolvingUser(uid: string, shopIds: string[]) {
  const db = getFirestore();
  const byId = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
  const placed = await db.collection('orders').where('userId', '==', uid).get();
  placed.docs.forEach((doc) => byId.set(doc.id, doc));
  for (let i = 0; i < shopIds.length; i += 30) {
    const received = await db
      .collection('orders')
      .where('shopId', 'in', shopIds.slice(i, i + 30))
      .get();
    received.docs.forEach((doc) => byId.set(doc.id, doc));
  }
  return Array.from(byId.values());
}

/**
 * Throws if the user is still party to an order that has money in escrow or goods in
 * motion. Open trade offers (no payment, nothing exchanged yet) don't block deletion.
 */
export async function assertAccountDeletable(uid: string): Promise<void> {
  const db = getFirestore();
  const shops = await db.collection('shops').where('userId', '==', uid).get();
  const orders = await getOrdersInvolvingUser(
    uid,
    shops.docs.map((doc) => doc.id)
  );
  const blocking = orders.filter((doc) => {
    const order = doc.data();
    return ACTIVE_ESCROW.includes(order.escrowStatus) || ACTIVE_FULFILMENT.includes(order.status);
  });
  if (blocking.length) {
    throw new HttpsError(
      'failed-precondition',
      `You have ${blocking.length} open order(s). Complete or cancel them before deleting your account.`
    );
  }
}

function redactOrder(order: FirebaseFirestore.DocumentData, asBuyer: boolean, asSeller: boolean) {
  const updates: Record<string, unknown> = { anonymizedAt: FieldValue.serverTimestamp() };
  if (asBuyer) {
    Object.assign(updates, {
      buyerDeleted: true,
      contactPhone: '',
      deliveryAddress: order.deliveryOption === 'delivery' ? '[deleted]' : 'Pickup',
      specialInstructions: '',
    });
  }
  if (asSeller) {
    Object.assign(updates, { sellerDeleted: true, shopPhotoURL: '' });
  }
  return updates;
}

/**
 * Permanently removes a user's personal data. Financial records (orders and
 * checkout payments) are kept for accounting but stripped of contact details.
 */
export async function deleteUserData(
  uid: string,
  stripe: Stripe | null
): Promise<AccountDeletionSummary> {
  const db = getFirestore();
  const bucket = getStorage().bucket(STORAGE_BUCKET);
  const userRef = db.collection('users').doc(uid);
  const userData = (await userRef.get()).data();

  const shops = await db.collection('shops').where('userId', '==', uid).get();
  const shopIds = shops.docs.map((doc) => doc.id);
  const orders = await getOrdersInvolvingUser(uid, shopIds);

  let cancelledTrades = 0;
  let anonymizedOrders = 0;
  for (const orderDoc of orders) {
    const order = orderDoc.data();
    const asBuyer = order.userId === uid;
    const asSeller = shopIds.includes(order.shopId);
    const updates = redactOrder(order, asBuyer, asSeller);
    if (order.status === 'trade') {
      updates.status = 'cancelled';
      updates.updatedAt = FieldValue.serverTimestamp();
      cancelledTrades += 1;
    }
    await orderDoc.ref.update(updates);
    anonymizedOrders += 1;
    if (asBuyer && typeof order.checkoutPaymentId === 'string') {
      await db
        .collection('checkoutPayments')
        .doc(order.checkoutPaymentId)
        .update({
          'pendingOrder.contactPhone': '',
          'pendingOrder.deliveryAddress': updates.deliveryAddress,
          'pendingOrder.specialInstructions': '',
        })
        .catch(() => undefined);
    }
  }

  const items = await db.collection('items').where('userId', '==', uid).get();
  const writer = db.bulkWriter();
  items.docs.forEach((doc) => writer.delete(doc.ref));
  shops.docs.forEach((doc) => writer.delete(doc.ref));
  await writer.close();

  await Promise.all([
    ...shopIds.map((shopId) => bucket.deleteFiles({ prefix: `product_images/${shopId}/` })),
    bucket.deleteFiles({ prefix: `user_profile_images/${uid}/` }),
  ]).catch((error) => console.error('Error deleting storage files for', uid, error));

  const threads = await db
    .collection('threads')
    .where('participantIds', 'array-contains', uid)
    .get();
  for (const thread of threads.docs) {
    await db.recursiveDelete(thread.ref);
  }

  if (stripe && typeof userData?.stripeCustomerId === 'string') {
    try {
      await stripe.customers.del(userData.stripeCustomerId);
    } catch (error) {
      console.error('Error deleting Stripe customer for', uid, error);
    }
  }

  await db.recursiveDelete(userRef);
  try {
    await getAuth().deleteUser(uid);
  } catch (error) {
    if ((error as { code?: string }).code !== 'auth/user-not-found') throw error;
  }

  return {
    shops: shops.size,
    items: items.size,
    threads: threads.size,
    anonymizedOrders,
    cancelledTrades,
  };
}
