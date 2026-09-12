import { describe, expect, it } from 'vitest';
import { normalizeEpisodeResponse } from '../src/utils/normalizer.js';

const providerEpisode = {
  episode_title: 'Episode',
  streams: [
    { name: 'MP4', url: 'https://provider.example/video.mp4' },
    { name: 'HLS', url: 'https://provider.example/video.m3u8' },
    { name: 'DASH', url: 'https://provider.example/video.mpd' }
  ],
  downloads: []
};

describe('normalized media response', () => {
  it('maps the provider data envelope and dynamic quality/server list', async () => {
    const result = await normalizeEpisodeResponse({
      data: {
        title: 'Episode 1',
        server: { qualities: [{ title: '720p', serverList: [{ title: 'Server A', serverId: 'server-a' }] }] },
        downloadUrl: { qualities: [{ title: '720p', urls: [{ title: 'Direct', url: 'https://files.example/video.mp4' }] }] }
      }
    });

    expect(result.streams[0]).toMatchObject({ quality: '720p', serverId: 'server-a', url: null });
    expect(result.downloads[0]).toMatchObject({ name: 'Direct', resolution: '720p', url: 'https://files.example/video.mp4' });
  });

  it('preserves playable media types and groups streams as servers', async () => {
    const result = await normalizeEpisodeResponse(providerEpisode, async (url) => ({
      playable: true,
      type: url.endsWith('.mp4') ? 'progressive' : url.endsWith('.m3u8') ? 'hls' : 'dash',
      mimeType: url.endsWith('.mp4') ? 'video/mp4' : null
    }));

    expect(result.servers).toHaveLength(3);
    expect(result.servers.map((server) => server.streams[0].type)).toEqual(['progressive', 'hls', 'dash']);
    expect(result.servers.every((server) => server.streams[0].playable)).toBe(true);
  });

  it.each(['HTML_PLAYER_PAGE', 'HTTP_403', 'VALIDATION_TIMEOUT'])('marks invalid provider media as unplayable: %s', async (error) => {
    const result = await normalizeEpisodeResponse({ ...providerEpisode, streams: [{ name: 'Provider', url: 'https://provider.example/player' }] }, async () => ({ playable: false, error }));
    expect(result.servers[0].streams[0]).toMatchObject({ playable: false, error });
  });
});