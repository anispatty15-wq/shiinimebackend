import { Router } from 'express';
import { sankaService } from '../providers/sanka/sanka.service';
import { sendError } from '../middleware/error';

const router = Router();

router.get('/:slug', async (req, res) => {
  try {
    const data = await sankaService.getEpisode(req.params.slug);
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, 502, 'PROVIDER_ERROR', 'Anime provider temporarily unavailable');
  }
});

export default router;
