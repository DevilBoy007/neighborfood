import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { CallableRequest } from 'firebase-functions/v2/https';

const PROJECT_ID = process.env.GCLOUD_PROJECT!;

type Callable<T, R> = { run: (request: CallableRequest<T>) => R | Promise<R> };

/** Invokes a v2 callable as the given user (or signed out when uid is null). */
export function callAs<T, R>(
  fn: Callable<T, R>,
  uid: string | null,
  data: T,
  token: Record<string, unknown> = {}
): Promise<R> {
  const auth = uid
    ? {
        uid,
        token: {
          uid,
          auth_time: Math.floor(Date.now() / 1000),
          ...token,
        },
        rawToken: 'test-token',
      }
    : undefined;
  return Promise.resolve(
    fn.run({ data, auth, rawRequest: {} as never, acceptsStreaming: false } as CallableRequest<T>)
  );
}

export async function resetEmulators(): Promise<void> {
  await fetch(
    `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' }
  );
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    await fetch(
      `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/accounts`,
      { method: 'DELETE' }
    );
  }
}

export const db = () => getFirestore();

export async function createUser(uid: string, data: Record<string, unknown> = {}) {
  await getAuth().createUser({ uid, email: `${uid}@example.com`, password: 'password123' });
  await db()
    .collection('users')
    .doc(uid)
    .set({
      username: `${uid}name`,
      first: uid,
      last: 'Tester',
      phone: '5555555555',
      email: `${uid}@example.com`,
      dob: '1990-01-01',
      location: { address: '1 Main St', city: 'Town', state: 'IN', zip: '46201' },
      ...data,
    });
}

export async function createShop(id: string, userId: string, data: Record<string, unknown> = {}) {
  await db()
    .collection('shops')
    .doc(id)
    .set({ name: `${id} shop`, userId, marketId: '46201', allowPickup: true, ...data });
}

export async function createItem(
  id: string,
  shopId: string,
  userId: string,
  data: Record<string, unknown> = {}
) {
  await db()
    .collection('items')
    .doc(id)
    .set({ name: `${id} item`, shopId, userId, price: 5, quantity: 10, ...data });
}

export async function createOrder(docId: string, data: Record<string, unknown>) {
  await db().collection('orders').doc(docId).set(data);
}

export async function quantityOf(itemId: string): Promise<number> {
  return (await db().collection('items').doc(itemId).get()).data()?.quantity;
}

/** Asserts that a callable rejects with the given HttpsError code. */
export async function expectHttpsError(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toMatchObject({ code });
}
