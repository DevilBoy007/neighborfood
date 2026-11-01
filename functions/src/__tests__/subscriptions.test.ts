import { createItemForShop, createShopForUser, getSellerPlanStatus } from '../index';
import { isSubscriptionActive, revenueCatWebhook } from '../subscriptions';
import {
  callAs,
  createItem,
  createShop,
  createUser,
  expectHttpsError,
  resetEmulators,
} from './helpers';

const proSubscription = (expiresAt: number | null) => ({
  entitlement: 'pro',
  active: true,
  expiresAt,
  productId: 'pro_monthly',
  store: 'app_store',
});

describe('isSubscriptionActive', () => {
  it('treats future or non-expiring Pro entitlements as active', () => {
    expect(isSubscriptionActive(proSubscription(Date.now() + 60_000))).toBe(true);
    expect(isSubscriptionActive(proSubscription(null))).toBe(true);
  });

  it('treats missing, expired or inactive entitlements as free', () => {
    expect(isSubscriptionActive(undefined)).toBe(false);
    expect(isSubscriptionActive(proSubscription(Date.now() - 1))).toBe(false);
    expect(isSubscriptionActive({ ...proSubscription(null), active: false })).toBe(false);
  });
});

describe('seller plan limits', () => {
  beforeEach(async () => {
    await resetEmulators();
  });

  it('limits free sellers to one shop', async () => {
    await createUser('seller');
    await createShop('shop1', 'seller');

    await expect(
      callAs(createShopForUser, 'seller', { userId: 'seller', shopData: { name: 'Second' } })
    ).rejects.toMatchObject({ code: 'resource-exhausted', details: { reason: 'plan-limit' } });
  });

  it('lets Pro sellers open more shops', async () => {
    await createUser('seller', { subscription: proSubscription(Date.now() + 86_400_000) });
    await createShop('shop1', 'seller');

    await expect(
      callAs(createShopForUser, 'seller', { userId: 'seller', shopData: { name: 'Second' } })
    ).resolves.toEqual(expect.any(String));
  });

  it('limits free sellers to 25 items', async () => {
    await createUser('seller');
    await createShop('shop1', 'seller');
    await Promise.all(
      Array.from({ length: 25 }, (_, i) => createItem(`item${i}`, 'shop1', 'seller'))
    );

    await expectHttpsError(
      callAs(createItemForShop, 'seller', { shopId: 'shop1', itemData: { name: 'one more' } }),
      'resource-exhausted'
    );
  });

  it('reports plan usage', async () => {
    await createUser('seller');
    await createShop('shop1', 'seller');
    await createItem('item1', 'shop1', 'seller');

    await expect(callAs(getSellerPlanStatus, 'seller', {})).resolves.toEqual({
      plan: 'free',
      limits: { maxShops: 1, maxItems: 25, platformFeeWaived: false },
      shopCount: 1,
      itemCount: 1,
      expiresAt: null,
    });
  });
});

describe('revenueCatWebhook', () => {
  function invoke(headers: Record<string, string>, method = 'POST') {
    const res = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      send: jest.fn(),
      json: jest.fn(),
    };
    const req = { method, headers, body: { event: { app_user_id: 'nobody' } } };
    const handler = revenueCatWebhook as unknown as (req: unknown, res: unknown) => unknown;
    return Promise.resolve(handler(req, res)).then(() => res);
  }

  it('rejects requests without the shared secret', async () => {
    expect((await invoke({})).statusCode).toBe(401);
    expect((await invoke({ authorization: 'Bearer wrong' })).statusCode).toBe(401);
  });

  it('only accepts POST', async () => {
    expect((await invoke({}, 'GET')).statusCode).toBe(405);
  });
});
