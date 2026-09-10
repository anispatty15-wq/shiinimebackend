import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { env } from './env';

const serviceAccount = env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey
  ? {
      projectId: env.firebaseProjectId,
      clientEmail: env.firebaseClientEmail,
      privateKey: env.firebasePrivateKey,
    }
  : null;

let firebaseReady = false;

if (!getApps().length) {
  try {
    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount as ServiceAccount),
      });
    } else {
      initializeApp({
        projectId: env.firebaseProjectId || 'demo-project',
      });
    }
    firebaseReady = true;
  } catch (error) {
    firebaseReady = false;
  }
} else {
  firebaseReady = true;
}

export const firebaseAdmin = firebaseReady
  ? {
      auth: () => getAuth(),
      firestore: () => getFirestore(),
    }
  : {
      auth: () => ({ verifyIdToken: async () => ({ uid: 'mock-uid', email: 'mock@example.com' }) }),
      firestore: () => ({
        collection: () => ({
          doc: () => ({
            get: async () => ({ exists: true, data: () => ({ uid: 'mock-uid', level: 1, exp: 0, totalWatchSeconds: 0, createdAt: new Date(), updatedAt: new Date(), lastActiveAt: new Date() }) }),
            set: async () => undefined,
            update: async () => undefined,
            delete: async () => undefined,
          }),
          get: async () => ({ docs: [] }),
          orderBy: () => ({ limit: () => ({ get: async () => ({ docs: [] }) }) }),
          where: () => ({ get: async () => ({ docs: [] }) }),
        }),
        runTransaction: async (fn: (tx: any) => Promise<any>) => fn({
          get: async () => ({ exists: true, data: () => ({ uid: 'mock-uid', level: 1, exp: 0, totalWatchSeconds: 0, createdAt: new Date(), updatedAt: new Date(), lastActiveAt: new Date() }) }),
          update: async () => undefined,
          set: async () => undefined,
        }),
      }),
    };
