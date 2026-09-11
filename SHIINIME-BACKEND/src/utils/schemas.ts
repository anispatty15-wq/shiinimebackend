import { z } from 'zod';
export const updateMeSchema = z.object({ email: z.string().email().nullable().optional(), displayName: z.string().trim().max(100).nullable().optional(), photoURL: z.string().url().nullable().optional() }).strict();
export const startWatchSchema = z.object({ animeId: z.string().min(1).max(300), episodeId: z.string().min(1).max(300), duration: z.number().int().positive().max(86400) }).strict();
export const heartbeatSchema = z.object({ sessionId: z.string().min(1), position: z.number().int().nonnegative(), duration: z.number().int().positive().max(86400) }).strict();
export const completeSchema = z.object({ sessionId: z.string().min(1) }).strict();
