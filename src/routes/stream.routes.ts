import { Router } from 'express';
import { sankaService } from '../providers/sanka/sanka.service';
import { sendError } from '../middleware/error';

const router = Router();

router.get('/:serverId', async (req, res) => {
  try {
    const data = await sankaService.getStream(req.params.serverId);
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, 502, 'PROVIDER_ERROR', 'Anime provider temporarily unavailable');
  }
});

export default router;
