import { Router } from 'express';
import { z } from 'zod';
import { sankaService } from '../providers/sanka/sanka.service';
import { sendError } from '../middleware/error';

const router = Router();

const pageSchema = z.object({ page: z.coerce.number().int().positive().optional() });

router.get('/home', async (_req, res) => {
  try {
    const data = await sankaService.getHome();
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, 502, 'PROVIDER_ERROR', 'Anime provider temporarily unavailable');
  }
});

router.get('/schedule', async (_req, res) => {
  try {
    const data = await sankaService.getSchedule();
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, 502, 'PROVIDER_ERROR', 'Anime provider temporarily unavailable');
  }
});

router.get('/complete', async (req, res) => {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const data = await sankaService.getComplete(page);
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, 502, 'PROVIDER_ERROR', 'Anime provider temporarily unavailable');
  }
});

router.get('/ongoing', async (req, res) => {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const data = await sankaService.getOngoing(page);
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, 502, 'PROVIDER_ERROR', 'Anime provider temporarily unavailable');
  }
});

router.get('/genres', async (_req, res) => {
  try {
    const data = await sankaService.getGenres();
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, 502, 'PROVIDER_ERROR', 'Anime provider temporarily unavailable');
  }
});

router.get('/search/:keyword', async (req, res) => {
  try {
    const data = await sankaService.search(req.params.keyword);
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, 502, 'PROVIDER_ERROR', 'Anime provider temporarily unavailable');
  }
});

router.get('/all', async (_req, res) => {
  try {
    const data = await sankaService.getAllAnime();
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, 502, 'PROVIDER_ERROR', 'Anime provider temporarily unavailable');
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const data = await sankaService.getAnime(req.params.slug);
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, 502, 'PROVIDER_ERROR', 'Anime provider temporarily unavailable');
  }
});

router.get('/genre/:slug', async (req, res) => {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const data = await sankaService.getGenre(req.params.slug, page);
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, 502, 'PROVIDER_ERROR', 'Anime provider temporarily unavailable');
  }
});

export default router;
