import { firebaseAdmin } from '../config/firebase';

export interface LevelThresholdConfig {
  startLevel: number;
  thresholds: number[];
}

const DEFAULT_THRESHOLDS = [0, 100, 250, 450, 700];

export const getLevelThresholds = (): number[] => DEFAULT_THRESHOLDS;

export const calculateLevel = (exp: number): number => {
  const thresholds = getLevelThresholds();
  let level = 1;
  for (let i = 1; i < thresholds.length; i += 1) {
    if (exp >= thresholds[i]) {
      level = i + 1;
    }
  }
  return level;
};

export const getExpRequiredForLevel = (level: number): number => {
  const thresholds = getLevelThresholds();
  if (level <= 1) return 0;
  return thresholds[Math.max(0, Math.min(level - 1, thresholds.length - 1))] ?? 0;
};

export const getExpProgress = (exp: number) => {
  const currentLevel = calculateLevel(exp);
  const currentThreshold = getExpRequiredForLevel(currentLevel);
  const nextThreshold = getExpRequiredForLevel(currentLevel + 1);
  const range = Math.max(nextThreshold - currentThreshold, 1);
  return {
    level: currentLevel,
    currentExp: exp,
    currentLevelStart: currentThreshold,
    currentLevelProgress: Math.max(exp - currentThreshold, 0),
    nextLevelRequired: nextThreshold,
    progressRatio: ((exp - currentThreshold) / range) * 100,
  };
};

export const addExp = async (uid: string, amount: number, reason: string) => {
  if (amount <= 0) return { user: null, amount: 0 };

  const userRef = firebaseAdmin.firestore().collection('users').doc(uid);
  const eventId = `${uid}:${reason}:${Date.now()}`;
  const eventRef = firebaseAdmin.firestore().collection('expEvents').doc(eventId);

  const result = await firebaseAdmin.firestore().runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new Error('USER_NOT_FOUND');
    }

    const current = userDoc.data() || {};
    const currentExp = Number(current.exp || 0);
    const updatedExp = currentExp + amount;
    const nextLevel = calculateLevel(updatedExp);

    transaction.update(userRef, {
      exp: updatedExp,
      level: nextLevel,
      updatedAt: new Date(),
      lastActiveAt: new Date(),
    });

    transaction.set(eventRef, {
      uid,
      sessionId: reason,
      episodeId: reason,
      amount,
      reason,
      createdAt: new Date(),
    });

    return {
      uid,
      exp: updatedExp,
      level: nextLevel,
    };
  });

  return { user: result, amount };
};

export const getUserLevel = async (uid: string) => {
  const doc = await firebaseAdmin.firestore().collection('users').doc(uid).get();
  if (!doc.exists) return { level: 1, exp: 0 };
  const data = doc.data() || {};
  return {
    level: Number(data.level || calculateLevel(Number(data.exp || 0))),
    exp: Number(data.exp || 0),
  };
};
