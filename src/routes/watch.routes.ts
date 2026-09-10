import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { sendError } from '../middleware/error';
import { createWatchSession, getWatchSession, updateWatchHeartBeat } from '../services/watch.service';

const router = Router();

const startWatchSchema = z.object({
  animeId: z.string().min(1),
  episodeId: z.string().min(1),
  duration: z.number().positive(),
});

const heartbeatSchema = z.object({
  sessionId: z.string().min(1),
  position: z.number().nonnegative(),
  duration: z.number().positive(),
});

router.post('/start', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const payload = startWatchSchema.parse(req.body);
    const started = await createWatchSession(req.user!.uid, payload.animeId, payload.episodeId, payload.duration);
    res.status(201).json({ success: true, data: started });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid watch payload');
    }
    return sendError(res, 500, 'WATCH_START_ERROR', 'Unable to start watch session');
  }
});

router.post('/heartbeat', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const payload = heartbeatSchema.parse(req.body);
    const result = await updateWatchHeartBeat(req.user!.uid, payload.sessionId, payload.position, payload.duration);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid heartbeat payload');
    }
    if ((error as any)?.code === 'NOT_FOUND') {
      return sendError(res, 404, 'WATCH_SESSION_NOT_FOUND', 'Watch session not found');
    }
    if ((error as any)?.code === 'FORBIDDEN') {
      return sendError(res, 403, 'WATCH_SESSION_FORBIDDEN', 'This session does not belong to the authenticated user');
    }
    if ((error as any)?.code === 'CONFLICT') {
      return sendError(res, 409, 'WATCH_SESSION_INACTIVE', 'This watch session is not active');
    }
    if ((error as any)?.code === 'BAD_REQUEST') {
      return sendError(res, 400, 'INVALID_POSITION', 'Watch position is invalid');
    }
    return sendError(res, 500, 'WATCH_HEARTBEAT_ERROR', 'Unable to process heartbeat');
  }
});

export default router;
