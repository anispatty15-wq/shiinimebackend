import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { sendError } from '../middleware/error';
import { firebaseAdmin } from '../config/firebase';

const router = Router();

router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const snapshot = await firebaseAdmin.firestore().collection('users').doc(req.user!.uid).collection('history').get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, 500, 'HISTORY_FETCH_ERROR', 'Unable to fetch history');
  }
});

router.get('/continue', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const snapshot = await firebaseAdmin.firestore().collection('users').doc(req.user!.uid).collection('history').orderBy('lastWatchedAt', 'desc').limit(10).get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, 500, 'HISTORY_FETCH_ERROR', 'Unable to fetch continue watching');
  }
});

router.get('/:episodeId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const episodeId = String(req.params.episodeId);
    const doc = await firebaseAdmin.firestore().collection('users').doc(req.user!.uid).collection('history').doc(episodeId).get();
    if (!doc.exists) {
      return sendError(res, 404, 'HISTORY_NOT_FOUND', 'History entry not found');
    }
    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    sendError(res, 500, 'HISTORY_FETCH_ERROR', 'Unable to fetch history');
  }
});

export default router;
