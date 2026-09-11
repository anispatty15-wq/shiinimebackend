import { Context } from 'hono';
import type { ApiResponse } from '../types/index.js';

export const ok = <T>(c: Context, data: T, status = 200) => c.json({ success: true, data } satisfies ApiResponse<T>, status as 200);
export const fail = (c: Context, code: string, message: string, status = 500) => c.json({ success: false, error: { code, message } }, status as 500);
