import { FieldValue } from 'firebase-admin/firestore';
import { getDb } from '../lib/firebase.js';
import { levelForExp } from './level.service.js';
import type { User } from '../types/index.js';

export const userRef = (uid: string) => getDb().collection('users').doc(uid);
export const ensureUser = async (claims: { uid: string; email?: string; name?: string; picture?: string }): Promise<User> => {
  const ref = userRef(claims.uid);
  const snapshot = await ref.get();
  if (snapshot.exists) return snapshot.data() as User;
  const now = FieldValue.serverTimestamp();
  const user = { uid: claims.uid, email: claims.email ?? null, displayName: claims.name ?? null, photoURL: claims.picture ?? null, level: 1, exp: 0, totalWatchSeconds: 0, createdAt: now, updatedAt: now, lastActiveAt: now };
  await ref.set(user);
  return user as unknown as User;
};

export const addExp = async (uid: string, amount: number, watchSeconds = 0): Promise<void> => {
  const ref = userRef(uid);
  await getDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const current = snapshot.exists ? snapshot.data() as Partial<User> : { exp: 0, totalWatchSeconds: 0 };
    const exp = (current.exp ?? 0) + amount;
    transaction.set(ref, { exp, level: levelForExp(exp), totalWatchSeconds: (current.totalWatchSeconds ?? 0) + watchSeconds, updatedAt: FieldValue.serverTimestamp(), lastActiveAt: FieldValue.serverTimestamp() }, { merge: true });
  });
};
