import { firebaseAdmin } from '../config/firebase';

export interface WatchSession {
  sessionId: string;
  uid: string;
  animeId: string;
  episodeId: string;
  startedAt: Date;
  lastHeartbeatAt: Date | null;
  lastPosition: number;
  duration: number;
  watchedSeconds: number;
  status: 'active' | 'completed' | 'cancelled';
  expGranted: number;
}

const EXP_PER_MINUTE = 5;
const EXP_PER_SECOND = 5 / 60;
const COMPLETION_BONUS = 20;

export const createWatchSession = async (uid: string, animeId: string, episodeId: string, duration: number) => {
  const sessionId = `${uid}:${episodeId}:${Date.now()}`;
  const session: WatchSession = {
    sessionId,
    uid,
    animeId,
    episodeId,
    startedAt: new Date(),
    lastHeartbeatAt: new Date(),
    lastPosition: 0,
    duration: Number(duration || 0),
    watchedSeconds: 0,
    status: 'active',
    expGranted: 0,
  };

  await firebaseAdmin.firestore().collection('watchSessions').doc(sessionId).set(session);
  return { sessionId };
};

export const getWatchSession = async (sessionId: string) => {
  const snapshot = await firebaseAdmin.firestore().collection('watchSessions').doc(sessionId).get();
  if (!snapshot.exists) return null;
  return snapshot.data() as WatchSession;
};

export const updateWatchHeartBeat = async (uid: string, sessionId: string, position: number, duration: number) => {
  const sessionRef = firebaseAdmin.firestore().collection('watchSessions').doc(sessionId);
  const historyRef = firebaseAdmin.firestore().collection('users').doc(uid).collection('history').doc(sessionId);

  const result = await firebaseAdmin.firestore().runTransaction(async (transaction) => {
    const sessionDoc = await transaction.get(sessionRef);
    if (!sessionDoc.exists) {
      throw Object.assign(new Error('Session not found'), { code: 'NOT_FOUND' });
    }

    const session = sessionDoc.data() as WatchSession;
    if (session.uid !== uid) {
      throw Object.assign(new Error('Session does not belong to this user'), { code: 'FORBIDDEN' });
    }
    if (session.status !== 'active') {
      throw Object.assign(new Error('Session is not active'), { code: 'CONFLICT' });
    }

    const safePosition = Number(position || 0);
    const safeDuration = Number(duration || session.duration || 0);
    const maxDuration = safeDuration > 0 ? safeDuration : session.duration;
    if (safePosition < 0 || safePosition > maxDuration * 1.25) {
      throw Object.assign(new Error('Invalid watch position'), { code: 'BAD_REQUEST' });
    }

    const deltaSeconds = Math.max(0, safePosition - session.lastPosition);
    const validSeconds = Math.min(deltaSeconds, 60);
    const nextWatchedSeconds = session.watchedSeconds + validSeconds;
    const expEarned = Math.floor(nextWatchedSeconds / 60) * EXP_PER_MINUTE;

    const nextSession = {
      ...session,
      lastHeartbeatAt: new Date(),
      lastPosition: safePosition,
      duration: maxDuration,
      watchedSeconds: nextWatchedSeconds,
    };

    transaction.update(sessionRef, nextSession);
    transaction.set(historyRef, {
      animeId: session.animeId,
      episodeId: session.episodeId,
      lastPosition: safePosition,
      duration: maxDuration,
      progress: safeDuration > 0 ? Math.min((safePosition / safeDuration) * 100, 100) : 0,
      completed: safeDuration > 0 && safePosition >= safeDuration * 0.8,
      lastWatchedAt: new Date(),
    }, { merge: true });

    return {
      sessionId,
      validSeconds,
      expEarned,
      watchedSeconds: nextWatchedSeconds,
    };
  });

  return result;
};

export const grantCompletionBonus = async (uid: string, sessionId: string) => {
  const sessionRef = firebaseAdmin.firestore().collection('watchSessions').doc(sessionId);
  const session = await getWatchSession(sessionId);
  if (!session || session.uid !== uid) return null;

  if (session.status === 'completed') return null;

  await sessionRef.update({
    status: 'completed',
    expGranted: (session.expGranted || 0) + COMPLETION_BONUS,
  });

  const userRef = firebaseAdmin.firestore().collection('users').doc(uid);
  const userDoc = await userRef.get();
  if (!userDoc.exists) return null;

  const currentExp = Number(userDoc.data()?.exp || 0);
  const nextExp = currentExp + COMPLETION_BONUS;
  await userRef.update({
    exp: nextExp,
    level: Math.max(1, Math.round(Math.sqrt(nextExp / 50)) + 1),
    lastActiveAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    award: COMPLETION_BONUS,
    sessionId,
  };
};

export const getWatchHistory = async (uid: string, episodeId?: string) => {
  const historyCollection = firebaseAdmin.firestore().collection('users').doc(uid).collection('history');
  const query = episodeId ? historyCollection.where('episodeId', '==', episodeId) : historyCollection;
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getFavoriteAnime = async (uid: string) => {
  const snapshot = await firebaseAdmin.firestore().collection('users').doc(uid).collection('favorites').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getLeaderboard = async () => {
  const snapshot = await firebaseAdmin.firestore().collection('users').orderBy('exp', 'desc').limit(10).get();
  return snapshot.docs.map((doc) => ({
    uid: doc.id,
    ...(doc.data() as any),
  }));
};

export const getExpPerMinute = () => EXP_PER_MINUTE;
