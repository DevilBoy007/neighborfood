import {
  blockUser,
  createOrGetThread,
  getBlockedUsers,
  getCommunityStats,
  getShopsWithItems,
  submitReport,
  unblockUser,
} from '../index';
import {
  callAs,
  createItem,
  createShop,
  createUser,
  db,
  expectHttpsError,
  resetEmulators,
} from './helpers';

beforeEach(async () => {
  await resetEmulators();
  await createUser('reporter');
  await createUser('seller');
  await createShop('shop1', 'seller', { marketId: '46201' });
  await createItem('item1', 'shop1', 'seller');
});

describe('submitReport', () => {
  it('records the report, resolves the responsible user and emails the admin', async () => {
    const { reportId } = await callAs(submitReport, 'reporter', {
      targetType: 'item',
      targetId: 'item1',
      reason: 'prohibited_item',
      details: 'This is raw milk',
    });

    const report = (await db().collection('reports').doc(reportId).get()).data()!;
    expect(report).toMatchObject({
      reporterId: 'reporter',
      reportedUserId: 'seller',
      targetType: 'item',
      reason: 'prohibited_item',
      status: 'open',
    });
    const mail = await db().collection('mail').get();
    expect(mail.size).toBe(1);
    expect(mail.docs[0].data().message.text).toContain(reportId);
  });

  it('can block the reported user in the same step', async () => {
    await callAs(submitReport, 'reporter', {
      targetType: 'shop',
      targetId: 'shop1',
      reason: 'scam',
      alsoBlock: true,
    });
    const blocked = await callAs(getBlockedUsers, 'reporter', {});
    expect(blocked.map((u: { id: string }) => u.id)).toEqual(['seller']);
  });

  it('accepts general problem reports without a target', async () => {
    await expect(
      callAs(submitReport, 'reporter', { targetType: 'other', reason: 'other', details: 'bug' })
    ).resolves.toHaveProperty('reportId');
  });

  it('rejects unknown reasons and missing content', async () => {
    await expectHttpsError(
      callAs(submitReport, 'reporter', { targetType: 'item', targetId: 'item1', reason: 'meh' }),
      'invalid-argument'
    );
    await expectHttpsError(
      callAs(submitReport, 'reporter', { targetType: 'item', targetId: 'gone', reason: 'spam' }),
      'not-found'
    );
  });

  it('requires sign-in', async () => {
    await expectHttpsError(
      callAs(submitReport, null, { targetType: 'other', reason: 'other' }),
      'unauthenticated'
    );
  });
});

describe('blocking', () => {
  it("hides a blocked seller's shops from the market", async () => {
    const before = await callAs(getShopsWithItems, 'reporter', {
      zipPrefix: '46',
      userId: 'reporter',
    });
    expect(before).toHaveLength(1);

    await callAs(blockUser, 'reporter', { userId: 'seller' });

    const after = await callAs(getShopsWithItems, 'reporter', {
      zipPrefix: '46',
      userId: 'reporter',
    });
    expect(after).toHaveLength(0);
  });

  it('prevents either user from starting a conversation', async () => {
    await callAs(blockUser, 'reporter', { userId: 'seller' });

    await expectHttpsError(
      callAs(createOrGetThread, 'seller', { participantIds: ['seller', 'reporter'] }),
      'permission-denied'
    );
  });

  it('restores visibility after unblocking', async () => {
    await callAs(blockUser, 'reporter', { userId: 'seller' });
    await callAs(unblockUser, 'reporter', { userId: 'seller' });

    expect(await callAs(getBlockedUsers, 'reporter', {})).toEqual([]);
    await expect(
      callAs(createOrGetThread, 'seller', { participantIds: ['seller', 'reporter'] })
    ).resolves.toHaveProperty('id');
  });
});

describe('getCommunityStats', () => {
  it('counts members in the same market', async () => {
    await createUser('farAway', {
      location: { address: '', city: '', state: 'CA', zip: '90210' },
    });
    const stats = await callAs(getCommunityStats, 'reporter', { zipPrefix: '46' });
    expect(stats).toEqual({ zipPrefix: '46', members: 2, threshold: 100, unlocked: false });
  });
});
