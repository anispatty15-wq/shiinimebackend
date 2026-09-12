import { NormalizedAnime, NormalizedDownload, NormalizedEpisode, NormalizedServer, NormalizedServerResolution, NormalizedStream, ProviderRecord, ProviderResponse } from '../types/provider.js';
import type { MediaValidation } from './media.js';

const record = (value: unknown): ProviderRecord => value && typeof value === 'object' ? value as ProviderRecord : {};
const text = (value: unknown): string | null => typeof value === 'string' ? value : value == null ? null : String(value);
const synopsis = (value: unknown): string | null => typeof value === 'string' ? value : Array.isArray(record(value).paragraphs) ? (record(value).paragraphs as unknown[]).map(text).filter((item): item is string => item !== null).join('\n\n') : null;
const payload = (response: ProviderResponse): ProviderRecord => {
  const source = record(response);
  return record(source.data ?? response);
};

export function normalizeAnime(item: unknown): NormalizedAnime {
  const source = record(item);
  const providerUrl = text(source.oploverz_url ?? source.otakudesuUrl ?? source.url);
  const slug = text(source.slug ?? source.animeId ?? source.id) ?? (providerUrl ? providerUrl.split('/').filter(Boolean).at(-1) ?? null : null);
  return {
    title: text(source.title), slug, poster: text(source.poster), type: text(source.type), episode: text(source.episode ?? source.episodes),
    status: text(source.status), synopsis: synopsis(source.synopsis), info: source.info ? record(source.info) : null,
    genres: (Array.isArray(source.genres) ? source.genres : Array.isArray(source.genreList) ? source.genreList : []).map(record),
    episodes: (Array.isArray(source.episode_list) ? source.episode_list : Array.isArray(source.episodeList) ? source.episodeList : []).map(record),
    provider: { source: text(source.source), url: providerUrl }, providerData: source
  };
}

export function normalizeCollection(response: ProviderResponse) {
  const source = payload(response);
  const list = Array.isArray(source.anime_list) ? source.anime_list : Array.isArray(source.animeList) ? source.animeList : Array.isArray(source.list) ? source.list.flatMap((item) => Array.isArray(record(item).animeList) ? record(item).animeList : []) : [];
  return { items: list.map(normalizeAnime), schedule: source.schedule ?? (Array.isArray(source) ? source : null), pagination: source.pagination ?? null, providerData: record(response) };
}

export function normalizeGenres(response: ProviderResponse) {
  const source = payload(response);
  const genres = Array.isArray(source.genreList) ? source.genreList : [];
  return { items: genres.map(record), providerData: record(response) };
}

export function normalizeProviderData(response: ProviderResponse) {
  return { data: payload(response), providerData: record(response) };
}

export function normalizeDetail(response: ProviderResponse) {
  const source = payload(response);
  const detail = source.detail ? record(source.detail) : source;
  return { anime: normalizeAnime(detail), providerData: record(response) };
}

export function normalizeEpisode(item: unknown): NormalizedEpisode {
  const source = record(item);
  return { title: text(source.title), slug: text(source.slug ?? source.episodeId) ?? '', number: text(source.episode ?? source.eps), releaseDate: text(source.release_date ?? source.date), url: text(source.url ?? source.href), providerData: source };
}

export function normalizeStream(item: unknown, validation?: MediaValidation): NormalizedStream {
  const source = record(item);
  return {
    name: text(source.name), url: text(source.url), server: text(source.server), serverId: text(source.server_id ?? source.serverId),
    quality: text(source.quality), resolution: text(source.resolution), format: text(source.format), mimeType: text(source.mime_type ?? source.mimeType),
    subtitle: text(source.subtitle), audio: text(source.audio), type: validation?.type ?? text(source.type),
    ...(validation ? { playable: validation.playable, ...(validation.mimeType ? { mimeType: validation.mimeType } : {}), ...(validation.error ? { error: validation.error } : {}) } : {}),
    providerData: source
  };
}

export function normalizeDownload(item: unknown): NormalizedDownload {
  const source = record(item);
  return { name: text(source.name ?? source.title), url: text(source.url), resolution: text(source.resolution), format: text(source.format), providerData: source };
}

export async function normalizeEpisodeResponse(response: ProviderResponse, validate?: (url: string) => Promise<MediaValidation>, requestedSlug?: string) {
  const source = payload(response);
  const rawStreams = Array.isArray(source.streams) ? source.streams : [];
  const qualityGroups: unknown[] = Array.isArray(record(source.server).qualities) ? record(source.server).qualities as unknown[] : [];
  const discoveredStreams = qualityGroups.flatMap((quality) => Array.isArray(record(quality).serverList)
    ? (record(quality).serverList as unknown[]).map((server) => ({ ...record(server), quality: record(quality).title, server: record(server).title, serverId: record(server).serverId }))
    : []);
  const streamItems = [...rawStreams, ...discoveredStreams];
  const validationCache = new Map<string, Promise<MediaValidation>>();
  const validations = validate ? await Promise.all(rawStreams.map(async (item) => {
    const url = text(record(item).url);
    if (!url) return { playable: false, error: 'STREAM_URL_MISSING' };
    const existing = validationCache.get(url);
    if (existing) return existing;
    const validation = validate(url);
    validationCache.set(url, validation);
    return validation;
  })) : [];
  const streams = streamItems.map((item, index) => normalizeStream(item, validate && index < validations.length ? validations[index] : undefined));
  const servers: NormalizedServer[] = streams.map((stream, index) => ({ id: stream.serverId ?? `provider-${index + 1}`, name: stream.server ?? stream.name, streams: [stream] }));
  return {
    episode: normalizeEpisode({ slug: source.slug ?? requestedSlug, title: source.title ?? source.episode_title, episode: source.episode, url: source.url }),
    streams,
    servers,
    downloads: Array.isArray(source.downloads) ? source.downloads.map(normalizeDownload) : Array.isArray(record(source.downloadUrl).qualities) ? (record(source.downloadUrl).qualities as unknown[]).flatMap((quality) => Array.isArray(record(quality).urls) ? (record(quality).urls as unknown[]).map((url) => normalizeDownload({ ...record(url), resolution: record(quality).title, size: record(source.downloadUrl).size })) : []) : [],
    providerData: record(response)
  };
}

export function normalizeServerResponse(response: ProviderResponse, serverId: string, validation?: MediaValidation): NormalizedServerResolution {
  const source = payload(response);
  const url = text(source.url);
  return { serverId, url, playable: validation?.playable ?? false, type: validation?.type ?? null, mimeType: validation?.mimeType ?? null, ...(validation?.error ? { error: validation.error } : {}), providerData: record(response) };
}
