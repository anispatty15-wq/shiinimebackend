import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { AppError } from '../utils/errors.js';

let firebaseApp: App | undefined;

export const getFirebaseApp = (): App => {
  if (firebaseApp) return firebaseApp;
  const existing = getApps()[0];
  if (existing) { firebaseApp = existing; return existing; }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) throw new AppError('FIREBASE_ERROR', 'Firebase environment variables are not configured', 503);
  firebaseApp = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return firebaseApp;
};

export const getFirebaseAuth = (): Auth => getAuth(getFirebaseApp());
export const getDb = (): Firestore => getFirestore(getFirebaseApp());
