import { AppError } from '../../utils/errors.js';
import { config } from '../../utils/config.js';

export class SankaClient {
  async get(path: string): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.sankaTimeoutMs);
    try {
      const response = await fetch(`${config.sankaBaseUrl}${path}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) {
        const code = response.status === 404 ? 'NOT_FOUND' : response.status === 429 ? 'PROVIDER_RATE_LIMIT' : 'PROVIDER_ERROR';
        throw new AppError(code, `Sanka returned HTTP ${response.status}`, response.status === 404 ? 404 : 502);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') throw new AppError('PROVIDER_TIMEOUT', 'Sanka request timed out', 504);
      throw new AppError('PROVIDER_ERROR', 'Sanka request failed', 502);
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const sankaClient = new SankaClient();
