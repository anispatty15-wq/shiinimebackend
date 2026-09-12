import { FastifyInstance } from 'fastify';
import { OploverzService } from '../services/OploverzService.js';
import { normalizeCollection, normalizeDetail, normalizeEpisodeResponse, normalizeGenres, normalizeProviderData, normalizeServerResponse } from '../utils/normalizer.js';
import { ok } from '../utils/response.js';
import { querySchema, searchParamsSchema, slugSchema } from '../schemas/common.js';

export function animeRoutes(service = new OploverzService()) {
  return async function registerAnimeRoutes(app: FastifyInstance) {
  const collection = (method: () => ReturnType<OploverzService['getHome']>) => async (request: any, reply: any) => ok(reply, normalizeCollection(await method()));
  app.get('/anime/home', collection(() => service.getHome()));
  app.get('/anime/schedule', collection(() => service.getSchedule()));
  app.get('/anime/ongoing-anime', async (request, reply) => {
    const query = querySchema.parse(request.query);
    return ok(reply, normalizeCollection(await service.getOngoing(query.page)));
  });
  app.get('/anime/complete-anime', async (request, reply) => {
    const query = querySchema.parse(request.query);
    return ok(reply, normalizeCollection(await service.getCompleted(query.page)));
  });
  app.get('/anime/unlimited', async (_request, reply) => ok(reply, normalizeCollection(await service.getList())));
  app.get('/anime/genre', async (_request, reply) => ok(reply, normalizeGenres(await service.getGenres())));
  app.get('/anime/genre/:slug', async (request, reply) => {
    const params = slugSchema.parse(request.params);
    const query = querySchema.parse(request.query);
    return ok(reply, normalizeCollection(await service.getGenre(params.slug, query.page)));
  });
  app.get('/anime/batch/:slug', async (request, reply) => {
    const params = slugSchema.parse(request.params);
    return ok(reply, normalizeProviderData(await service.getBatch(params.slug)));
  });
  app.get('/anime/server/:slug', async (request, reply) => {
    const params = slugSchema.parse(request.params);
    const response = await service.getServer(params.slug);
    const providerData = (response.data && typeof response.data === 'object' ? response.data : response) as Record<string, unknown>;
    const url = typeof providerData.url === 'string' ? providerData.url : null;
    const validation = url && typeof service.validateMediaUrl === 'function' ? await service.validateMediaUrl(url) : { playable: false, error: 'STREAM_URL_MISSING' };
    return ok(reply, normalizeServerResponse(response, params.slug, validation));
  });
  app.get('/anime/ongoing', async (request, reply) => {
    const query = querySchema.parse(request.query);
    return ok(reply, normalizeCollection(await service.getOngoing(query.page)));
  });
  app.get('/anime/completed', async (request, reply) => {
    const query = querySchema.parse(request.query);
    return ok(reply, normalizeCollection(await service.getCompleted(query.page)));
  });
  app.get('/anime/list', async (request, reply) => {
    const query = querySchema.parse(request.query);
    return ok(reply, normalizeCollection(await service.getList(query.page)));
  });
  app.get('/anime/search/:query', async (request, reply) => {
    const params = searchParamsSchema.parse(request.params);
    const query = querySchema.parse(request.query);
    return ok(reply, normalizeCollection(await service.searchAnime(params.query, query.page)));
  });
  app.get('/anime/:slug', async (request, reply) => {
    const params = slugSchema.parse(request.params);
    return ok(reply, normalizeDetail(await service.getAnimeDetail(params.slug)));
  });
  app.get('/anime/anime/:slug', async (request, reply) => {
    const params = slugSchema.parse(request.params);
    return ok(reply, normalizeDetail(await service.getAnimeDetail(params.slug)));
  });
  app.get('/anime/episode/:slug', async (request, reply) => {
    const params = slugSchema.parse(request.params);
    const validate = typeof service.validateMediaUrl === 'function' ? service.validateMediaUrl.bind(service) : undefined;
    return ok(reply, await normalizeEpisodeResponse(await service.getEpisode(params.slug), validate, params.slug));
  });
  app.get('/episode/:slug', async (request, reply) => {
    const params = slugSchema.parse(request.params);
    const validate = typeof service.validateMediaUrl === 'function' ? service.validateMediaUrl.bind(service) : undefined;
    return ok(reply, await normalizeEpisodeResponse(await service.getEpisode(params.slug), validate, params.slug));
  });
  };
}
