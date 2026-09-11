import { Hono } from 'hono';
import { getDb } from '../lib/firebase.js';
import { requireAuth } from '../middleware/auth.js';
import { ok } from '../utils/response.js';
export const leaderboardRoutes = new Hono<{ Variables: { user: { uid: string } } }>();
leaderboardRoutes.use('*', requireAuth);
leaderboardRoutes.get('/', async (c) => { const docs = await getDb().collection('users').orderBy('exp', 'desc').limit(100).get(); return ok(c, docs.docs.map((doc, index) => { const user = doc.data(); return { rank: index + 1, displayName: user.displayName ?? null, photoURL: user.photoURL ?? null, level: user.level ?? 1, exp: user.exp ?? 0 }; })); });
