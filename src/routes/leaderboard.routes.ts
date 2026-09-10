import { Router } from 'express';
import { firebaseAdmin } from '../config/firebase';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  try {
    const snapshot = await firebaseAdmin.firestore().collection('users').orderBy('exp', 'desc').limit(20).get();
    const data = snapshot.docs.map((doc, index) => {
      const user = doc.data();
      return {
        rank: index + 1,
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL || null,
        level: user.level || 1,
        exp: user.exp || 0,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'LEADERBOARD_ERROR', message: 'Unable to load leaderboard' } });
  }
});

export default router;
