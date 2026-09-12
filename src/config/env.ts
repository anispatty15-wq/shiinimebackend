import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  PROVIDER_BASE_URL: z.string().url().default(process.env.OPLOVERZ_BASE_URL ?? 'https://www.sankavollerei.web.id'),
  PROVIDER_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  CACHE_HOME_TTL_MS: z.coerce.number().int().nonnegative().default(3 * 60 * 1000),
  CACHE_SCHEDULE_TTL_MS: z.coerce.number().int().nonnegative().default(15 * 60 * 1000),
  CACHE_COLLECTION_TTL_MS: z.coerce.number().int().nonnegative().default(5 * 60 * 1000),
  CACHE_SEARCH_TTL_MS: z.coerce.number().int().nonnegative().default(5 * 60 * 1000),
  CACHE_DETAIL_TTL_MS: z.coerce.number().int().nonnegative().default(5 * 60 * 1000),
  CACHE_EPISODE_TTL_MS: z.coerce.number().int().nonnegative().default(60 * 1000),
  CACHE_MEDIA_VALIDATION_TTL_MS: z.coerce.number().int().nonnegative().default(60 * 1000),
  CACHE_MAX_ENTRIES: z.coerce.number().int().positive().default(500),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  EXP_SECONDS_INTERVAL: z.coerce.number().int().positive().default(60),
  EXP_PER_INTERVAL: z.coerce.number().int().nonnegative().default(5),
  COMPLETION_THRESHOLD: z.coerce.number().min(0.8).max(1).default(0.8),
  COMPLETION_EXP: z.coerce.number().int().nonnegative().default(20)
});

export const env = envSchema.parse(process.env);
