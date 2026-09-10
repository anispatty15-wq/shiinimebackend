import { firebaseAdmin } from '../config/firebase';

export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  level: number;
  exp: number;
  totalWatchSeconds: number;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

export const userCollection = () => firebaseAdmin.firestore().collection('users');

export const ensureUserProfile = async (uid: string, email?: string | null, displayName?: string | null, photoURL?: string | null) => {
  const ref = userCollection().doc(uid);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    const now = new Date();
    const profile: UserProfile = {
      uid,
      email: email || null,
      displayName: displayName || null,
      photoURL: photoURL || null,
      level: 1,
      exp: 0,
      totalWatchSeconds: 0,
      createdAt: now,
      updatedAt: now,
      lastActiveAt: now,
    };
    await ref.set(profile);
    return profile;
  }

  const existing = snapshot.data() as Partial<UserProfile>;
  const now = new Date();
  const updates: Partial<UserProfile> = {
    email: existing.email ?? email ?? null,
    displayName: existing.displayName ?? displayName ?? null,
    photoURL: existing.photoURL ?? photoURL ?? null,
    updatedAt: now,
    lastActiveAt: now,
  };

  if (Object.keys(updates).length > 0) {
    await ref.update(updates);
  }

  return { ...existing, ...updates, uid } as UserProfile;
};

export const getUserProfile = async (uid: string) => {
  const snapshot = await userCollection().doc(uid).get();
  if (!snapshot.exists) return null;
  return snapshot.data() as UserProfile;
};

export const updateUserProfile = async (uid: string, payload: Partial<Pick<UserProfile, 'displayName' | 'photoURL'>>) => {
  const ref = userCollection().doc(uid);
  const now = new Date();
  await ref.update({
    ...payload,
    updatedAt: now,
    lastActiveAt: now,
  });
  return getUserProfile(uid);
};
