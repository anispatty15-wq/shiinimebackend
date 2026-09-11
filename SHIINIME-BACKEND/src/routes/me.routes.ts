import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '../middleware/auth.js';
import { ensureUser, userRef } from '../services/user.service.js';
import { getDb } from '../lib/firebase.js';
import { updateMeSchema } from '../utils/schemas.js';
import { AppError } from '../utils/errors.js';
import { ok } from '../utils/response.js';

export const meRoutes = new Hono<{ Variables: { user: { uid: string; email?: string; name?: string; picture?: string } } }>();
meRoutes.use('*', requireAuth);
meRoutes.get('/', async (c) => ok(c, await ensureUser(c.get('user'))));
meRoutes.patch('/', async (c) => {
  const parsed = updateMeSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid request body', 400);
  const uid = c.get('user').uid;
  await userRef(uid).set({ ...parsed.data, updatedAt: FieldValue.serverTimestamp(), lastActiveAt: FieldValue.serverTimestamp() }, { merge: true });
  return ok(c, await ensureUser({ ...c.get('user'), uid }));
});

export const userRoutes = new Hono<{ Variables: { user: { uid: string } } }>();
userRoutes.get('/history', async (c) => ok(c, (await getDb().collection('users').doc(c.get('user').uid).collection('history').orderBy('lastWatchedAt', 'desc').limit(100).get()).docs.map((doc) => doc.data())));
userRoutes.get('/history/continue', async (c) => ok(c, (await getDb().collection('users').doc(c.get('user').uid).collection('history').where('completed', '==', false).orderBy('lastWatchedAt', 'desc').limit(20).get()).docs.map((doc) => doc.data())));
userRoutes.get('/history/:episodeId', async (c) => { const doc = await getDb().collection('users').doc(c.get('user').uid).collection('history').doc(c.req.param('episodeId')).get(); if (!doc.exists) throw new AppError('NOT_FOUND', 'History not found', 404); return ok(c, doc.data()); });
userRoutes.get('/favorites', async (c) => ok(c, (await getDb().collection('users').doc(c.get('user').uid).collection('favorites').get()).docs.map((doc) => doc.data())));
userRoutes.post('/favorites/:animeId', async (c) => { const animeId = c.req.param('animeId'); await getDb().collection('users').doc(c.get('user').uid).collection('favorites').doc(animeId).set({ animeId, createdAt: FieldValue.serverTimestamp() }); return ok(c, { animeId }, 201); });
userRoutes.delete('/favorites/:animeId', async (c) => { await getDb().collection('users').doc(c.get('user').uid).collection('favorites').doc(c.req.param('animeId')).delete(); return ok(c, { deleted: true }); });
