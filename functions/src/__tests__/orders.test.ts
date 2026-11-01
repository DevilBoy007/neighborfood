import { refundOrder, updateOrderStatus, updateItemQuantity } from '../index';
import {
  callAs,
  createItem,
  createOrder,
  createShop,
  createUser,
  db,
  expectHttpsError,
  quantityOf,
  resetEmulators,
} from './helpers';

beforeEach(async () => {
  await resetEmulators();
  await createUser('seller');
  await createUser('buyer');
  await createShop('shop1', 'seller');
  await createItem('apples', 'shop1', 'seller', { quantity: 10 });
  await createItem('eggs', 'shop1', 'seller', { quantity: 5 });
  await createItem('buyerJam', 'buyerShop', 'buyer', { quantity: 3 });
});

const pendingOrder = (overrides: Record<string, unknown> = {}) => ({
  id: 'order-1',
  userId: 'buyer',
  shopId: 'shop1',
  status: 'pending',
  items: [
    { itemId: 'apples', name: 'apples', price: 5, quantity: 3 },
    { itemId: 'eggs', name: 'eggs', price: 4, quantity: 2 },
  ],
  ...overrides,
});

const setStatus = (uid: string, status: string, orderId = 'order-1') =>
  callAs(updateOrderStatus, uid, { orderId, shopId: 'shop1', status });

describe('order stock management', () => {
  it('reserves stock when the seller accepts an order', async () => {
    await createOrder('o1', pendingOrder());

    await setStatus('seller', 'preparing');

    expect(await quantityOf('apples')).toBe(7);
    expect(await quantityOf('eggs')).toBe(3);
    const order = (await db().collection('orders').doc('o1').get()).data()!;
    expect(order.status).toBe('preparing');
    expect(order.inventoryReserved).toEqual([
      { itemId: 'apples', quantity: 3 },
      { itemId: 'eggs', quantity: 2 },
    ]);
  });

  it('returns items to inventory when an accepted order is cancelled', async () => {
    await createOrder('o1', pendingOrder());
    await setStatus('seller', 'preparing');

    await setStatus('seller', 'cancelled');

    expect(await quantityOf('apples')).toBe(10);
    expect(await quantityOf('eggs')).toBe(5);
    const order = (await db().collection('orders').doc('o1').get()).data()!;
    expect(order.status).toBe('cancelled');
    expect(order.inventoryRestocked).toBe(true);
  });

  it('does not change stock when a pending order is cancelled', async () => {
    await createOrder('o1', pendingOrder());

    await setStatus('buyer', 'cancelled');

    expect(await quantityOf('apples')).toBe(10);
    expect(await quantityOf('eggs')).toBe(5);
  });

  it('restocks orders accepted before reservations were recorded', async () => {
    await createOrder('o1', pendingOrder({ status: 'ready' }));

    await setStatus('seller', 'cancelled');

    expect(await quantityOf('apples')).toBe(13);
    expect(await quantityOf('eggs')).toBe(7);
  });

  it('restocks only once even if cancellation is retried', async () => {
    await createOrder('o1', pendingOrder());
    await setStatus('seller', 'preparing');
    await setStatus('seller', 'cancelled');

    await expectHttpsError(setStatus('seller', 'cancelled'), 'failed-precondition');

    expect(await quantityOf('apples')).toBe(10);
  });

  it('refuses to accept an order without enough stock', async () => {
    await createOrder('o1', pendingOrder());
    await db().collection('items').doc('eggs').update({ quantity: 1 });

    await expectHttpsError(setStatus('seller', 'preparing'), 'failed-precondition');

    expect(await quantityOf('apples')).toBe(10);
    expect((await db().collection('orders').doc('o1').get()).data()?.status).toBe('pending');
  });

  it('swaps both inventories when a trade is accepted and restores them on cancel', async () => {
    await createOrder(
      't1',
      pendingOrder({
        id: 'trade-1',
        status: 'trade',
        items: [{ itemId: 'apples', name: 'apples', price: 5, quantity: 2 }],
        tradeItems: [{ itemId: 'buyerJam', name: 'jam' }],
      })
    );

    await setStatus('seller', 'preparing', 'trade-1');
    expect(await quantityOf('apples')).toBe(8);
    expect(await quantityOf('buyerJam')).toBe(2);

    await setStatus('seller', 'cancelled', 'trade-1');
    expect(await quantityOf('apples')).toBe(10);
    expect(await quantityOf('buyerJam')).toBe(3);
  });
});

describe('order status transitions', () => {
  it('lets the buyer cancel only before the seller accepts', async () => {
    await createOrder('o1', pendingOrder());
    await setStatus('seller', 'preparing');

    await expectHttpsError(setStatus('buyer', 'cancelled'), 'failed-precondition');
    expect(await quantityOf('apples')).toBe(7);
  });

  it("doesn't let the buyer mark their own order as accepted", async () => {
    await createOrder('o1', pendingOrder());
    await expectHttpsError(setStatus('buyer', 'preparing'), 'failed-precondition');
  });

  it('lets the buyer confirm a ready order was received', async () => {
    await createOrder('o1', pendingOrder({ status: 'ready' }));
    await setStatus('buyer', 'completed');
    expect((await db().collection('orders').doc('o1').get()).data()?.status).toBe('completed');
  });

  it("doesn't allow cancelling a completed order", async () => {
    await createOrder('o1', pendingOrder({ status: 'completed' }));
    await expectHttpsError(setStatus('seller', 'cancelled'), 'failed-precondition');
  });

  it('rejects users who are not part of the order', async () => {
    await createUser('stranger');
    await createOrder('o1', pendingOrder());
    await expectHttpsError(setStatus('stranger', 'cancelled'), 'permission-denied');
  });

  it("doesn't let the buyer request a refund after the seller accepts", async () => {
    await createOrder('o1', pendingOrder({ sellerId: 'seller' }));
    await setStatus('seller', 'preparing');

    await expectHttpsError(
      callAs(refundOrder, 'buyer', { orderId: 'order-1', shopId: 'shop1' }),
      'failed-precondition'
    );
  });
});

describe('updateItemQuantity', () => {
  it("doesn't let buyers change a seller's stock", async () => {
    await expectHttpsError(
      callAs(updateItemQuantity, 'buyer', { itemId: 'apples', quantityChange: -10 }),
      'permission-denied'
    );
    expect(await quantityOf('apples')).toBe(10);
  });

  it('lets the owner adjust stock without going negative', async () => {
    await callAs(updateItemQuantity, 'seller', { itemId: 'apples', quantityChange: -50 });
    expect(await quantityOf('apples')).toBe(0);
  });
});
