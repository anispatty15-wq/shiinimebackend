import { Hono } from 'hono';
import type { Context } from 'hono';
import { sankaClient } from './sanka.client.js';
import { ok } from '../../utils/response.js';

const encoded = (value: string) => encodeURIComponent(value);
export const sankaRoutes = new Hono();

const proxy = (path: string) => async (c: Context) => ok(c, await sankaClient.get(path));

sankaRoutes.get('/home', proxy('/anime/home'));
sankaRoutes.get('/schedule', proxy('/anime/schedule'));
sankaRoutes.get('/complete', proxy('/anime/complete-anime'));
sankaRoutes.get('/ongoing', proxy('/anime/ongoing-anime'));
sankaRoutes.get('/genres', proxy('/anime/genre'));
sankaRoutes.get('/all', proxy('/anime/unlimited'));
sankaRoutes.get('/anime/:slug', async (c) => ok(c, await sankaClient.get(`/anime/anime/${encoded(c.req.param('slug'))}`)));
sankaRoutes.get('/genre/:slug', async (c) => ok(c, await sankaClient.get(`/anime/genre/${encoded(c.req.param('slug'))}`)));
sankaRoutes.get('/search/:keyword', async (c) => ok(c, await sankaClient.get(`/anime/search/${encoded(c.req.param('keyword'))}`)));
sankaRoutes.get('/batch/:slug', async (c) => ok(c, await sankaClient.get(`/anime/batch/${encoded(c.req.param('slug'))}`)));
sankaRoutes.get('/episode/:slug', async (c) => ok(c, await sankaClient.get(`/anime/episode/${encoded(c.req.param('slug'))}`)));
