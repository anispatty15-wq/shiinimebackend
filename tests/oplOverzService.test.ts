import { describe, expect, it } from 'vitest';
import type { AxiosInstance } from 'axios';
import { OploverzService } from '../src/services/OploverzService.js';

function clientFor(counter: { calls: number; paths?: string[] }, delayMs = 0): AxiosInstance {
  return {
    get: async (path: string) => {
      counter.calls += 1;
      counter.paths?.push(path);
      if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
      return { status: 200, data: { status: 'success', anime_list: [] } };
    }
  } as unknown as AxiosInstance;
}

describe('OploverzService cache and request deduplication', () => {
  it('caches repeated home requests within the TTL', async () => {
    const counter = { calls: 0 };
    const service = new OploverzService(clientFor(counter));

    await service.getHome();
    await service.getHome();

    expect(counter.calls).toBe(1);
  });

  it('shares one in-flight request between concurrent callers', async () => {
    const counter = { calls: 0 };
    const service = new OploverzService(clientFor(counter, 20));

    await Promise.all([service.getHome(), service.getHome(), service.getHome()]);

    expect(counter.calls).toBe(1);
  });

  it('uses the provider endpoint paths without the removed oploverz prefix', async () => {
    const counter = { calls: 0, paths: [] as string[] };
    const service = new OploverzService(clientFor(counter));

    await service.getAnimeDetail('demo-anime');
    await service.getEpisode('demo-episode');
    await service.getServer('server-1');

    expect(counter.paths).toEqual(['/anime/anime/demo-anime', '/anime/episode/demo-episode', '/anime/server/server-1']);
  });
});
