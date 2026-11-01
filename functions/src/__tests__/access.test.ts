import {
  addDocument,
  getDocument,
  getUserById,
  isUsernameAvailable,
  sendMessageNotification,
  updateDocument,
} from '../index';
import { callAs, createShop, createUser, db, expectHttpsError, resetEmulators } from './helpers';

beforeEach(async () => {
  await resetEmulators();
  await createUser('alice', { stripeCustomerId: 'cus_alice' });
  await createUser('bob');
});

describe('getDocument', () => {
  it("returns the caller's own profile", async () => {
    const profile = await callAs(getDocument, 'alice', { collectionPath: 'users', docId: 'alice' });
    expect(profile).toMatchObject({ id: 'alice', username: 'alicename' });
  });

  it("refuses to read another user's profile", async () => {
    await expectHttpsError(
      callAs(getDocument, 'bob', { collectionPath: 'users', docId: 'alice' }),
      'permission-denied'
    );
  });

  it.each(['orders', 'checkoutPayments', 'threads', 'reports'])(
    'refuses to read the %s collection directly',
    async (collectionPath) => {
      await expectHttpsError(
        callAs(getDocument, 'alice', { collectionPath, docId: 'anything' }),
        'permission-denied'
      );
    }
  );

  it('serves public shop documents', async () => {
    await createShop('shop1', 'alice');
    const shop = await callAs(getDocument, 'bob', { collectionPath: 'shops', docId: 'shop1' });
    expect(shop).toMatchObject({ id: 'shop1', userId: 'alice' });
  });
});

describe('getUserById', () => {
  it('returns only public profile fields', async () => {
    const profile = await callAs(getUserById, 'bob', { userId: 'alice' });
    expect(profile).toEqual({ id: 'alice', username: 'alicename', first: 'alice', photoURL: null });
  });
});

describe('profile writes', () => {
  it('rejects writes to server-managed fields', async () => {
    await expectHttpsError(
      callAs(updateDocument, 'alice', {
        collectionPath: 'users',
        docId: 'alice',
        data: { stripeConnectedAccountId: 'acct_evil' },
      }),
      'permission-denied'
    );
    await expectHttpsError(
      callAs(updateDocument, 'alice', {
        collectionPath: 'users',
        docId: 'alice',
        data: { subscription: { entitlement: 'pro', active: true, expiresAt: null } },
      }),
      'permission-denied'
    );
  });

  it("rejects updates to another user's profile", async () => {
    await expectHttpsError(
      callAs(updateDocument, 'bob', {
        collectionPath: 'users',
        docId: 'alice',
        data: { first: 'Hacked' },
      }),
      'permission-denied'
    );
  });

  it('rejects writes to other collections', async () => {
    await expectHttpsError(
      callAs(addDocument, 'alice', {
        collectionPath: 'shops',
        data: { name: 'sneaky', userId: 'bob' },
        id: 'alice',
      }),
      'permission-denied'
    );
  });

  it('enforces unique usernames', async () => {
    await expectHttpsError(
      callAs(updateDocument, 'bob', {
        collectionPath: 'users',
        docId: 'bob',
        data: { username: 'alicename' },
      }),
      'already-exists'
    );
    expect(await callAs(isUsernameAvailable, null, { username: 'alicename' })).toBe(false);
    expect(await callAs(isUsernameAvailable, null, { username: 'freshname' })).toBe(true);
  });

  it('lets users update allowed profile fields', async () => {
    await callAs(updateDocument, 'alice', {
      collectionPath: 'users',
      docId: 'alice',
      data: { first: 'Alicia', phone: '5550001111' },
    });
    const user = (await db().collection('users').doc('alice').get()).data()!;
    expect(user).toMatchObject({ first: 'Alicia', phone: '5550001111' });
  });
});

describe('sendMessageNotification', () => {
  it('refuses to notify users who do not share a thread with the caller', async () => {
    await db()
      .collection('threads')
      .doc('t1')
      .set({ participantIds: ['alice', 'carol'] });
    await expectHttpsError(
      callAs(sendMessageNotification, 'bob', {
        threadId: 't1',
        recipientId: 'alice',
        senderName: 'bob',
        messagePreview: 'phishing link',
        messageType: 'text',
      }),
      'permission-denied'
    );
  });
});
