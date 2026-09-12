import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env.js';
import { ProviderResponse } from '../types/provider.js';
import { providerError } from '../utils/errors.js';
import type { MediaValidation } from '../utils/media.js';

export class OploverzService {
  private readonly client: AxiosInstance;
  private readonly cache = new Map<string, { expiresAt: number; value: ProviderResponse }>();
  private readonly pending = new Map<string, Promise<ProviderResponse>>();
  private readonly mediaValidationCache = new Map<string, { expiresAt: number; value: MediaValidation }>();
  private readonly pendingMediaValidation = new Map<string, Promise<MediaValidation>>();

  constructor(client?: AxiosInstance) {
    this.client = client ?? axios.create({
      baseURL: env.PROVIDER_BASE_URL.replace(/\/$/, ''),
      timeout: env.PROVIDER_TIMEOUT_MS,
      validateStatus: () => true
    });
  }

  private ttlFor(path: string) {
    if (path === '/home') return env.CACHE_HOME_TTL_MS;
    if (path === '/schedule') return env.CACHE_SCHEDULE_TTL_MS;
    if (path.includes('ongoing-anime') || path.includes('complete-anime') || path === '/anime/unlimited') return env.CACHE_COLLECTION_TTL_MS;
    if (path.startsWith('/anime/search/')) return env.CACHE_SEARCH_TTL_MS;
    if (path.startsWith('/anime/anime/')) return env.CACHE_DETAIL_TTL_MS;
    if (path.startsWith('/anime/episode/')) return env.CACHE_EPISODE_TTL_MS;
    return 0;
  }

  private cacheKey(path: string, params?: Record<string, string | number | undefined>) {
    const query = Object.entries(params ?? {}).filter(([, value]) => value !== undefined).sort(([a], [b]) => a.localeCompare(b));
    return query.length === 0 ? path : `${path}?${new URLSearchParams(query.map(([key, value]) => [key, String(value)]))}`;
  }

  private setCache(key: string, value: ProviderResponse, ttl: number) {
    const now = Date.now();
    for (const [entryKey, entry] of this.cache) {
      if (entry.expiresAt <= now) this.cache.delete(entryKey);
    }
    while (this.cache.size >= env.CACHE_MAX_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey === undefined) break;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, { value, expiresAt: now + ttl });
  }

  private async fetch(path: string, params?: Record<string, string | number | undefined>): Promise<ProviderResponse> {
    try {
      const response = await this.client.get<ProviderResponse>(path, { params });
      if (response.status >= 400) throw providerError(`Provider returned HTTP ${response.status}`);
      if (!response.data || typeof response.data !== 'object') throw providerError('Provider returned invalid JSON');
      return response.data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AppError') throw error;
      if (axios.isAxiosError(error) && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')) {
        throw providerError('Provider request timed out', 504);
      }
      throw providerError(error instanceof Error ? error.message : 'Provider request failed');
    }
  }

  private async get(path: string, params?: Record<string, string | number | undefined>): Promise<ProviderResponse> {
    const key = this.cacheKey(path, params);
    const ttl = this.ttlFor(path);
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    if (cached) this.cache.delete(key);

    const running = this.pending.get(key);
    if (running) return running;

    const request = this.fetch(path, params).then((value) => {
      if (ttl > 0) this.setCache(key, value, ttl);
      return value;
    }).finally(() => this.pending.delete(key));
    this.pending.set(key, request);
    return request;
  }

  getHome() { return this.get('/home'); }
  getSchedule() { return this.get('/schedule'); }
  getOngoing(page?: number) { return this.get('/anime/ongoing-anime', { page }); }
  getCompleted(page?: number) { return this.get('/anime/complete-anime', { page }); }
  getList(page?: number) { return this.get('/anime/unlimited', { page }); }
  getGenres() { return this.get('/anime/genre'); }
  getGenre(slug: string, page?: number) { return this.get(`/anime/genre/${encodeURIComponent(slug)}`, { page }); }
  searchAnime(query: string, page?: number) { return this.get(`/anime/search/${encodeURIComponent(query)}`, { page }); }
  getAnimeDetail(slug: string) { return this.get(`/anime/anime/${encodeURIComponent(slug)}`); }
  getEpisode(slug: string) { return this.get(`/anime/episode/${encodeURIComponent(slug)}`); }
  getBatch(slug: string) { return this.get(`/anime/batch/${encodeURIComponent(slug)}`); }
  getServer(serverId: string) { return this.get(`/anime/server/${encodeURIComponent(serverId)}`); }

  async validateMediaUrl(url: string): Promise<MediaValidation> {
    const cached = this.mediaValidationCache.get(url);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    this.mediaValidationCache.delete(url);
    const running = this.pendingMediaValidation.get(url);
    if (running) return running;
    const validation = this.validateMediaUrlUncached(url).then((value) => {
      if (env.CACHE_MEDIA_VALIDATION_TTL_MS > 0) this.mediaValidationCache.set(url, { value, expiresAt: Date.now() + env.CACHE_MEDIA_VALIDATION_TTL_MS });
      return value;
    }).finally(() => this.pendingMediaValidation.delete(url));
    this.pendingMediaValidation.set(url, validation);
    return validation;
  }

  private async validateMediaUrlUncached(url: string): Promise<MediaValidation> {
    try {
      const response = await this.client.head(url, { maxRedirects: 5, timeout: env.PROVIDER_TIMEOUT_MS });
      const contentType = typeof response.headers['content-type'] === 'string' ? response.headers['content-type'].toLowerCase() : null;
      const finalUrl = response.request?.res?.responseUrl ?? url;
      const path = finalUrl.split('?')[0].toLowerCase();
      const type = contentType?.includes('mpegurl') || path.endsWith('.m3u8') ? 'hls'
        : contentType?.includes('dash+xml') || path.endsWith('.mpd') ? 'dash'
          : contentType?.startsWith('video/') || path.endsWith('.mp4') ? 'progressive' : null;
      if (response.status === 401 || response.status === 403) return { playable: false, error: `HTTP_${response.status}` };
      if (response.status >= 400) return { playable: false, error: `HTTP_${response.status}` };
      if (type) return { playable: true, type, mimeType: contentType };
      if (contentType?.includes('text/html')) return { playable: false, error: 'HTML_PLAYER_PAGE', mimeType: contentType };
      if (contentType?.includes('application/json')) return { playable: false, error: 'JSON_RESPONSE', mimeType: contentType };
      return { playable: false, error: 'MEDIA_TYPE_UNKNOWN', mimeType: contentType };
    } catch (error) {
      if (axios.isAxiosError(error) && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')) return { playable: false, error: 'VALIDATION_TIMEOUT' };
      return { playable: false, error: 'MEDIA_VALIDATION_FAILED' };
    }
  }
}
