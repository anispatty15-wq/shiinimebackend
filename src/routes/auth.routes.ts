import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { sendError } from '../middleware/error';
import { ensureUserProfile, getUserProfile } from '../services/user.service';

const router = Router();

const authSchema = z.object({
  displayName: z.string().min(1).optional().nullable(),
  photoURL: z.string().min(1).optional().nullable(),
}).strict();

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await ensureUserProfile(req.user!.uid, req.user?.email, undefined, undefined);
    res.json({ success: true, data: user });
  } catch (error) {
    sendError(res, 500, 'USER_PROFILE_ERROR', 'Unable to fetch profile');
  }
});

router.patch('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const payload = authSchema.partial().parse(req.body);
    const safePayload: { displayName?: string | null; photoURL?: string | null } = {};

    if (payload.displayName !== undefined) safePayload.displayName = payload.displayName;
    if (payload.photoURL !== undefined) safePayload.photoURL = payload.photoURL;

    const current = await getUserProfile(req.user!.uid);
    if (!current) {
      await ensureUserProfile(req.user!.uid, req.user?.email, undefined, undefined);
    }

    const updated = await require('../services/user.service').updateUserProfile(req.user!.uid, safePayload);
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request body');
    }
    return sendError(res, 500, 'USER_UPDATE_ERROR', 'Unable to update profile');
  }
});

export default router;
