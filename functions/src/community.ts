import { getFirestore } from 'firebase-admin/firestore';
import { CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';

export const COMMUNITY_UNLOCK_THRESHOLD = 100;

/** Counts members whose ZIP code falls in the market (same prefix the Market screen uses). */
export async function countMarketMembers(zipPrefix: string): Promise<number> {
  const snapshot = await getFirestore()
    .collection('users')
    .where('location.zip', '>=', zipPrefix)
    .where('location.zip', '<=', zipPrefix + '\uf8ff')
    .count()
    .get();
  return snapshot.data().count;
}

export const getCommunityStats = onCall(async (request: CallableRequest<{ zipPrefix: string }>) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to perform this action');
  }
  const { zipPrefix } = request.data || {};
  if (typeof zipPrefix !== 'string' || !/^\d{2,5}$/.test(zipPrefix)) {
    throw new HttpsError('invalid-argument', 'A ZIP code prefix is required');
  }
  const members = await countMarketMembers(zipPrefix);
  return {
    zipPrefix,
    members,
    threshold: COMMUNITY_UNLOCK_THRESHOLD,
    unlocked: members >= COMMUNITY_UNLOCK_THRESHOLD,
  };
});
