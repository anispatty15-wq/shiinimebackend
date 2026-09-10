process.env.USE_MOCK_AUTH = 'true';

vi.mock('./providers/sanka/sanka.service', () => ({
  sankaService: {
    getHome: vi.fn().mockResolvedValue({ ok: true }),
    getSchedule: vi.fn().mockResolvedValue({ ok: true }),
    getAnime: vi.fn().mockResolvedValue({ ok: true }),
    getComplete: vi.fn().mockResolvedValue({ ok: true }),
    getOngoing: vi.fn().mockResolvedValue({ ok: true }),
    getGenres: vi.fn().mockResolvedValue({ ok: true }),
    getGenre: vi.fn().mockResolvedValue({ ok: true }),
    getEpisode: vi.fn().mockResolvedValue({ ok: true }),
    search: vi.fn().mockResolvedValue({ ok: true }),
    getBatch: vi.fn().mockResolvedValue({ ok: true }),
    getStream: vi.fn().mockResolvedValue({ url: 'https://example.com/stream.m3u8' }),
    getAllAnime: vi.fn().mockResolvedValue({ ok: true }),
  },
}));

import request from 'supertest';
import app from './app';
import { calculateLevel, getExpRequiredForLevel } from './services/level.service';

describe('SHIINIME backend', () => {
  it('returns health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('requires Firebase auth for the profile endpoint', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('accepts mock auth and returns an auto-created user profile', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', 'Bearer mock-token')
      .set('x-user-uid', 'user-123');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.uid).toBe('user-123');
  });

  it('calculates level and required EXP correctly', () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(100)).toBe(2);
    expect(calculateLevel(250)).toBe(3);
    expect(calculateLevel(700)).toBe(5);
    expect(getExpRequiredForLevel(4)).toBe(450);
  });

  it('proxies a stream request without requiring protected auth', async () => {
    const res = await request(app).get('/api/stream/server-1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.url).toBe('https://example.com/stream.m3u8');
  });
});
