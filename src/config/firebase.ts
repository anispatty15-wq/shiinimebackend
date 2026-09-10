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

type MockSnapshot = {
  exists: boolean;
  id?: string;
  data: () => Record<string, unknown>;
};

type MockDocument = {
  collection: (name: string) => MockCollection;
  get: () => Promise<MockSnapshot>;
  set: (...args: unknown[]) => Promise<void>;
  update: (...args: unknown[]) => Promise<void>;
  delete: () => Promise<void>;
};

type MockCollection = {
  doc: (id?: string) => MockDocument;
  get: () => Promise<{ docs: MockSnapshot[] }>;
  orderBy: (...args: unknown[]) => { limit: (count: number) => { get: () => Promise<{ docs: MockSnapshot[] }> } };
  where: (...args: unknown[]) => { get: () => Promise<{ docs: MockSnapshot[] }> };
};

const mockUserData = () => ({
  uid: 'mock-uid',
  level: 1,
  exp: 0,
  totalWatchSeconds: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastActiveAt: new Date(),
});

const createMockDocument = (): MockDocument => ({
  collection: () => createMockCollection(),
  get: async () => ({ exists: true, data: () => mockUserData() }),
  set: async () => undefined,
  update: async () => undefined,
  delete: async () => undefined,
});

const createMockCollection = (): MockCollection => ({
  doc: () => createMockDocument(),
  get: async () => ({ docs: [] }),
  orderBy: () => ({ limit: () => ({ get: async () => ({ docs: [] }) }) }),
  where: () => ({ get: async () => ({ docs: [] }) }),
});

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
        collection: (_name: string) => createMockCollection(),
        runTransaction: async (fn: (tx: any) => Promise<any>) => fn({
          get: async () => ({ exists: true, data: mockUserData() }),
          update: async () => undefined,
          set: async () => undefined,
        }),
      }),
    };
