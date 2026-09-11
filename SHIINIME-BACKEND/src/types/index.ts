export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  level: number;
  exp: number;
  totalWatchSeconds: number;
  createdAt: unknown;
  updatedAt: unknown;
  lastActiveAt: unknown;
}

export interface WatchSession {
  sessionId: string;
  uid: string;
  animeId: string;
  episodeId: string;
  duration: number;
  position: number;
  active: boolean;
  expAwardedSeconds: number;
  completed: boolean;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface History {
  animeId: string;
  episodeId: string;
  lastPosition: number;
  duration: number;
  progress: number;
  completed: boolean;
  lastWatchedAt: unknown;
}

export interface Favorite {
  animeId: string;
  createdAt: unknown;
}

export interface LeaderboardEntry {
  rank: number;
  displayName: string | null;
  photoURL: string | null;
  level: number;
  exp: number;
}

export interface Anime { [key: string]: unknown }
export interface Episode { [key: string]: unknown }
export interface Stream { [key: string]: unknown }

export interface ApiSuccess<T> { success: true; data: T }
export interface ApiFailure { success: false; error: { code: string; message: string } }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
export type ApiError = ApiFailure['error'];
