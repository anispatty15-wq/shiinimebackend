import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { sendError } from '../middleware/error';
import { firebaseAdmin } from '../config/firebase';

const router = Router();

router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const snapshot = await firebaseAdmin.firestore().collection('users').doc(req.user!.uid).collection('favorites').get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, 500, 'FAVORITES_FETCH_ERROR', 'Unable to fetch favorites');
  }
});

router.post('/:animeId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const animeId = String(req.params.animeId);
    const ref = firebaseAdmin.firestore().collection('users').doc(req.user!.uid).collection('favorites').doc(animeId);
    await ref.set({ animeId, createdAt: new Date() }, { merge: true });
    res.status(201).json({ success: true, data: { animeId } });
  } catch (error) {
    sendError(res, 500, 'FAVORITES_CREATE_ERROR', 'Unable to add favorite');
  }
});

router.delete('/:animeId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const animeId = String(req.params.animeId);
    await firebaseAdmin.firestore().collection('users').doc(req.user!.uid).collection('favorites').doc(animeId).delete();
    res.json({ success: true, data: { animeId, deleted: true } });
  } catch (error) {
    sendError(res, 500, 'FAVORITES_DELETE_ERROR', 'Unable to remove favorite');
  }
});

export default router;
