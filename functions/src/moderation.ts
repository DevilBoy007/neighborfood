import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { defineString } from 'firebase-functions/params';
import { CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';

// Reports are emailed here via the Firebase "Trigger Email" extension (mail collection).
const adminEmail = defineString('ADMIN_EMAIL', { default: 'dylan@bakr.dev' });

export const REPORT_TARGET_TYPES = ['shop', 'item', 'user', 'order', 'message', 'other'] as const;
export const REPORT_REASONS = [
  'spam',
  'scam',
  'offensive',
  'harassment',
  'prohibited_item',
  'safety',
  'other',
] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

const MAX_REPORTS_PER_DAY = 20;
const MAX_DETAILS_LENGTH = 1000;

function requireUid(request: CallableRequest): string {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to perform this action');
  }
  return request.auth.uid;
}

function blockedRef(uid: string, otherUid: string) {
  return getFirestore().collection('users').doc(uid).collection('blocked').doc(otherUid);
}

/** True if either user has blocked the other. */
export async function isBlockedBetween(a: string, b: string): Promise<boolean> {
  const [ab, ba] = await Promise.all([blockedRef(a, b).get(), blockedRef(b, a).get()]);
  return ab.exists || ba.exists;
}

/** Users the given user has blocked. */
export async function getBlockedUserIds(uid: string): Promise<Set<string>> {
  const snapshot = await getFirestore().collection('users').doc(uid).collection('blocked').get();
  return new Set(snapshot.docs.map((doc) => doc.id));
}

/** Returns the user responsible for the reported content, or null if it can't be resolved. */
export async function resolveReportedUserId(
  targetType: ReportTargetType,
  targetId: string | undefined
): Promise<string | null> {
  if (!targetId || targetType === 'other') return null;
  const db = getFirestore();
  switch (targetType) {
    case 'user':
      return (await db.collection('users').doc(targetId).get()).exists ? targetId : null;
    case 'shop':
    case 'item': {
      const doc = await db.collection(`${targetType}s`).doc(targetId).get();
      return doc.data()?.userId ?? null;
    }
    case 'order': {
      const orders = await db.collection('orders').where('id', '==', targetId).limit(1).get();
      const shopId = orders.docs[0]?.data().shopId;
      if (!shopId) return null;
      return (await db.collection('shops').doc(shopId).get()).data()?.userId ?? null;
    }
    case 'message': {
      const [threadId, messageId] = targetId.split('/');
      if (!threadId || !messageId) return null;
      const message = await db
        .collection('threads')
        .doc(threadId)
        .collection('messages')
        .doc(messageId)
        .get();
      return message.data()?.senderId ?? null;
    }
  }
}

export const submitReport = onCall(
  async (
    request: CallableRequest<{
      targetType: ReportTargetType;
      targetId?: string;
      reason: string;
      details?: string;
      alsoBlock?: boolean;
    }>
  ) => {
    const uid = requireUid(request);
    const { targetType, targetId, reason, details, alsoBlock } = request.data || {};
    if (!REPORT_TARGET_TYPES.includes(targetType)) {
      throw new HttpsError('invalid-argument', 'Unknown report type');
    }
    if (!(REPORT_REASONS as readonly string[]).includes(reason)) {
      throw new HttpsError('invalid-argument', 'Please choose a reason');
    }
    if (targetType !== 'other' && (typeof targetId !== 'string' || !targetId)) {
      throw new HttpsError('invalid-argument', 'Missing the reported content');
    }
    if (details !== undefined && typeof details !== 'string') {
      throw new HttpsError('invalid-argument', 'Details must be text');
    }

    const db = getFirestore();
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recent = await db
      .collection('reports')
      .where('reporterId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(MAX_REPORTS_PER_DAY)
      .get();
    const reportsToday = recent.docs.filter(
      (doc) => (doc.data().createdAt?.toMillis?.() ?? 0) > dayAgo
    ).length;
    if (reportsToday >= MAX_REPORTS_PER_DAY) {
      throw new HttpsError('resource-exhausted', 'Too many reports today. Please try tomorrow.');
    }

    const reportedUserId = await resolveReportedUserId(targetType, targetId);
    if (targetType !== 'other' && !reportedUserId) {
      throw new HttpsError('not-found', 'The reported content no longer exists');
    }
    if (reportedUserId === uid) {
      throw new HttpsError('invalid-argument', 'You cannot report yourself');
    }

    const reportRef = await db.collection('reports').add({
      reporterId: uid,
      targetType,
      targetId: targetId ?? null,
      reportedUserId,
      reason,
      details: (details ?? '').trim().slice(0, MAX_DETAILS_LENGTH),
      status: 'open',
      createdAt: FieldValue.serverTimestamp(),
    });

    if (alsoBlock && reportedUserId) {
      await blockedRef(uid, reportedUserId).set({
        blockedUserId: reportedUserId,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    await db.collection('mail').add({
      to: adminEmail.value(),
      message: {
        subject: `[Neighborfood] New ${targetType} report: ${reason}`,
        text: [
          `Report ID: ${reportRef.id}`,
          `Type: ${targetType}`,
          `Target ID: ${targetId ?? '(none)'}`,
          `Reported user: ${reportedUserId ?? '(none)'}`,
          `Reporter: ${uid}`,
          `Reason: ${reason}`,
          '',
          (details ?? '').slice(0, MAX_DETAILS_LENGTH),
          '',
          'Review within 24 hours per App Store guideline 1.2.',
        ].join('\n'),
      },
    });

    return { reportId: reportRef.id };
  }
);

export const blockUser = onCall(async (request: CallableRequest<{ userId: string }>) => {
  const uid = requireUid(request);
  const { userId } = request.data || {};
  if (typeof userId !== 'string' || !userId || userId === uid) {
    throw new HttpsError('invalid-argument', 'A different user is required');
  }
  await blockedRef(uid, userId).set({
    blockedUserId: userId,
    createdAt: FieldValue.serverTimestamp(),
  });
  return true;
});

export const unblockUser = onCall(async (request: CallableRequest<{ userId: string }>) => {
  const uid = requireUid(request);
  const { userId } = request.data || {};
  if (typeof userId !== 'string' || !userId) {
    throw new HttpsError('invalid-argument', 'User ID is required');
  }
  await blockedRef(uid, userId).delete();
  return true;
});

export const getBlockedUsers = onCall(async (request: CallableRequest) => {
  const uid = requireUid(request);
  const blockedIds = Array.from(await getBlockedUserIds(uid));
  const db = getFirestore();
  const users = await Promise.all(blockedIds.map((id) => db.collection('users').doc(id).get()));
  return users.map((doc, index) => ({
    id: blockedIds[index],
    username: doc.data()?.username ?? 'Deleted user',
    photoURL: doc.data()?.photoURL ?? null,
  }));
});
