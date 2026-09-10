import axios, { AxiosError } from 'axios';
import { env } from '../../config/env';

const client = axios.create({
  baseURL: env.sankaBaseUrl,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

export const sankaClient = {
  async get<T>(url: string, params?: Record<string, string | number>) {
    try {
      const response = await client.get<T>(url, { params });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        throw Object.assign(new Error('Sanka resource not found'), { statusCode: 404, code: 'PROVIDER_NOT_FOUND' });
      }
      if (axiosError.response?.status === 429) {
        throw Object.assign(new Error('Sanka rate limit reached'), { statusCode: 429, code: 'PROVIDER_RATE_LIMITED' });
      }
      if (axiosError.response?.status === 500) {
        throw Object.assign(new Error('Sanka provider temporarily unavailable'), { statusCode: 502, code: 'PROVIDER_ERROR' });
      }
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        throw Object.assign(new Error('Sanka provider request timeout'), { statusCode: 504, code: 'PROVIDER_TIMEOUT' });
      }
      throw Object.assign(new Error('Anime provider temporarily unavailable'), { statusCode: 502, code: 'PROVIDER_ERROR' });
    }
  },
};
