import type { MiddlewareHandler } from 'hono';
import { getFirebaseAuth } from '../lib/firebase.js';
import { config } from '../utils/config.js';
import { AppError } from '../utils/errors.js';

type AuthUser = { uid: string; email?: string; name?: string; picture?: string };
export const requireAuth: MiddlewareHandler<{ Variables: { user: AuthUser } }> = async (c, next) => {
  const header = c.req.header('Authorization');
  if (config.mockAuth && process.env.NODE_ENV !== 'production') {
    c.set('user', { uid: header?.startsWith('Bearer ') ? header.slice(7) : 'local-dev-user', email: 'local@example.com', name: 'Local Developer' });
    await next(); return;
  }
  if (!header?.startsWith('Bearer ')) throw new AppError('UNAUTHORIZED', 'Authorization Bearer token is required', 401);
  try {
    const decoded = await getFirebaseAuth().verifyIdToken(header.slice(7));
    c.set('user', { uid: decoded.uid, email: decoded.email, name: decoded.name, picture: decoded.picture });
    await next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('UNAUTHORIZED', 'Firebase ID token is invalid or expired', 401);
  }
};
