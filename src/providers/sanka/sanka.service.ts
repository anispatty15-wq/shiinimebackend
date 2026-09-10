import { sankaClient } from './sanka.client';

export const sankaService = {
  async getHome() {
    return sankaClient.get('/anime/home');
  },
  async getSchedule() {
    return sankaClient.get('/anime/schedule');
  },
  async getAnime(slug: string) {
    return sankaClient.get(`/anime/anime/${slug}`);
  },
  async getComplete(page?: number) {
    return sankaClient.get('/anime/complete-anime', page ? { page } : undefined);
  },
  async getOngoing(page?: number) {
    return sankaClient.get('/anime/ongoing-anime', page ? { page } : undefined);
  },
  async getGenres() {
    return sankaClient.get('/anime/genre');
  },
  async getGenre(slug: string, page?: number) {
    return sankaClient.get(`/anime/genre/${slug}`, page ? { page } : undefined);
  },
  async getEpisode(slug: string) {
    return sankaClient.get(`/anime/episode/${slug}`);
  },
  async search(keyword: string) {
    return sankaClient.get(`/anime/search/${encodeURIComponent(keyword)}`);
  },
  async getBatch(slug: string) {
    return sankaClient.get(`/anime/batch/${slug}`);
  },
  async getStream(serverId: string) {
    return sankaClient.get(`/anime/server/${serverId}`);
  },
  async getAllAnime() {
    return sankaClient.get('/anime/unlimited');
  },
};
