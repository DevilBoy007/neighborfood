import { getAuth } from 'firebase-admin/auth';
import { deleteAccount } from '../index';
import { assertAccountDeletable, deleteUserData } from '../accountDeletion';
import {
  callAs,
  createItem,
  createOrder,
  createShop,
  createUser,
  db,
  expectHttpsError,
  resetEmulators,
} from './helpers';

beforeEach(resetEmulators);

async function seedSellerWithData() {
  await createUser('seller');
  await createUser('buyer');
  await createShop('shop1', 'seller');
  await createShop('shop2', 'seller');
  await createItem('item1', 'shop1', 'seller');
  await createItem('item2', 'shop2', 'seller');
  await createItem('buyerItem', 'buyerShop', 'buyer');
  const thread = db().collection('threads').doc('thread1');
  await thread.set({ participantIds: ['buyer', 'seller'] });
  await thread.collection('messages').add({ senderId: 'buyer', content: 'hi' });
  await db().collection('users').doc('seller').collection('blocked').doc('troll').set({});
}

describe('deleteUserData', () => {
  it('leaves nothing behind when Firebase is queried for the deleted user', async () => {
    await seedSellerWithData();

    const summary = await deleteUserData('seller', null);

    expect(summary).toMatchObject({ shops: 2, items: 2, threads: 1 });
    expect((await db().collection('users').doc('seller').get()).exists).toBe(false);
    expect((await db().collection('users').doc('seller').collection('blocked').get()).empty).toBe(
      true
    );
    expect((await db().collection('shops').where('userId', '==', 'seller').get()).empty).toBe(true);
    expect((await db().collection('items').where('userId', '==', 'seller').get()).empty).toBe(true);
    expect(
      (await db().collection('threads').where('participantIds', 'array-contains', 'seller').get())
        .empty
    ).toBe(true);
    expect(
      (await db().collection('threads').doc('thread1').collection('messages').get()).empty
    ).toBe(true);
    await expect(getAuth().getUser('seller')).rejects.toMatchObject({
      code: 'auth/user-not-found',
    });
  });

  it("doesn't touch other users' data", async () => {
    await seedSellerWithData();

    await deleteUserData('seller', null);

    expect((await db().collection('users').doc('buyer').get()).exists).toBe(true);
    expect((await db().collection('items').doc('buyerItem').get()).exists).toBe(true);
    expect((await getAuth().getUser('buyer')).uid).toBe('buyer');
  });

  it('keeps order records but strips the buyer contact details', async () => {
    await createUser('buyer');
    await createUser('seller');
    await createShop('shop1', 'seller');
    await createOrder('o1', {
      id: 'order-1',
      userId: 'buyer',
      shopId: 'shop1',
      status: 'completed',
      escrowStatus: 'released',
      deliveryOption: 'delivery',
      deliveryAddress: '1 Secret Ln',
      contactPhone: '5555555555',
      specialInstructions: 'gate code 1234',
      total: 12.5,
    });

    await deleteUserData('buyer', null);

    const order = (await db().collection('orders').doc('o1').get()).data()!;
    expect(order).toMatchObject({
      buyerDeleted: true,
      contactPhone: '',
      deliveryAddress: '[deleted]',
      specialInstructions: '',
      total: 12.5,
      status: 'completed',
    });
  });

  it('withdraws open trade offers', async () => {
    await createUser('buyer');
    await createUser('seller');
    await createShop('shop1', 'seller');
    await createOrder('t1', { id: 'trade-1', userId: 'buyer', shopId: 'shop1', status: 'trade' });

    const summary = await deleteUserData('buyer', null);

    expect(summary.cancelledTrades).toBe(1);
    expect((await db().collection('orders').doc('t1').get()).data()?.status).toBe('cancelled');
  });
});

describe('assertAccountDeletable', () => {
  it.each([
    ['pending', 'held'],
    ['preparing', undefined],
    ['completed', 'held'],
  ])('blocks deletion while an order is %s with escrow %s', async (status, escrowStatus) => {
    await createUser('buyer');
    await createOrder('o1', {
      id: 'order-1',
      userId: 'buyer',
      shopId: 'shop1',
      status,
      ...(escrowStatus ? { escrowStatus } : {}),
    });

    await expectHttpsError(assertAccountDeletable('buyer'), 'failed-precondition');
  });

  it('blocks a seller with open orders on their shop', async () => {
    await createUser('seller');
    await createShop('shop1', 'seller');
    await createOrder('o1', { id: 'order-1', userId: 'buyer', shopId: 'shop1', status: 'ready' });

    await expectHttpsError(assertAccountDeletable('seller'), 'failed-precondition');
  });

  it('allows deletion once orders are settled', async () => {
    await createUser('buyer');
    await createOrder('o1', {
      id: 'order-1',
      userId: 'buyer',
      shopId: 'shop1',
      status: 'completed',
      escrowStatus: 'released',
    });
    await createOrder('o2', { id: 'order-2', userId: 'buyer', shopId: 'shop1', status: 'trade' });

    await expect(assertAccountDeletable('buyer')).resolves.toBeUndefined();
  });
});

describe('deleteAccount callable', () => {
  it('requires explicit confirmation', async () => {
    await createUser('u1');
    await expectHttpsError(callAs(deleteAccount, 'u1', { confirm: false }), 'invalid-argument');
  });

  it('requires a recent sign-in', async () => {
    await createUser('u1');
    const staleAuthTime = Math.floor(Date.now() / 1000) - 60 * 60;
    await expectHttpsError(
      callAs(deleteAccount, 'u1', { confirm: true }, { auth_time: staleAuthTime }),
      'unauthenticated'
    );
    expect((await db().collection('users').doc('u1').get()).exists).toBe(true);
  });

  it('deletes the caller and returns a fetch that is truly empty', async () => {
    await createUser('u1');
    await createShop('s1', 'u1');
    await createItem('i1', 's1', 'u1');

    await expect(callAs(deleteAccount, 'u1', { confirm: true })).resolves.toEqual({
      deleted: true,
    });

    expect((await db().collection('users').doc('u1').get()).data()).toBeUndefined();
    expect((await db().collection('shops').where('userId', '==', 'u1').get()).size).toBe(0);
    expect((await db().collection('items').where('userId', '==', 'u1').get()).size).toBe(0);
  });
});
