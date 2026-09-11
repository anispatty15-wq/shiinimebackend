# SHIINIME API Contract

All responses use `{ "success": true, "data": ... }` or `{ "success": false, "error": { "code": "...", "message": "..." } }`.

## Public

| Method | Endpoint | Auth | Upstream |
|---|---|---|---|
| GET | `/api/health` | No | local status |
| GET | `/api/anime/home` | No | `/anime/home` |
| GET | `/api/anime/schedule` | No | `/anime/schedule` |
| GET | `/api/anime/:slug` | No | `/anime/anime/:slug` |
| GET | `/api/anime/complete` | No | `/anime/complete-anime` |
| GET | `/api/anime/ongoing` | No | `/anime/ongoing-anime` |
| GET | `/api/anime/genres` | No | `/anime/genre` |
| GET | `/api/anime/genre/:slug` | No | `/anime/genre/:slug` |
| GET | `/api/anime/search/:keyword` | No | `/anime/search/:keyword` |
| GET | `/api/anime/all` | No | `/anime/unlimited` |
| GET | `/api/anime/batch/:slug` | No | `/anime/batch/:slug` |
| GET | `/api/episode/:slug` | No | `/anime/episode/:slug` |
| GET | `/api/stream/:serverId` | No | `/anime/server/:serverId` |

Sanka payload is returned under `data` without forcing a universal anime schema. Stream access does not change Firestore or EXP.

## Authenticated user

All following endpoints require `Authorization: Bearer <Firebase_ID_TOKEN>`.

| Method | Endpoint | Request | Response |
|---|---|---|---|
| GET | `/api/me` | none | user profile |
| PATCH | `/api/me` | `{displayName?, email?, photoURL?}` | user profile |
| GET | `/api/history` | none | history array |
| GET | `/api/history/:episodeId` | none | history item |
| GET | `/api/history/continue` | none | incomplete history array |
| GET | `/api/favorites` | none | favorite array |
| POST | `/api/favorites/:animeId` | none | `{animeId}` |
| DELETE | `/api/favorites/:animeId` | none | `{deleted:true}` |
| GET | `/api/leaderboard` | none | rank/displayName/photoURL/level/exp |

## Watch

`POST /api/watch/start`: `{ "animeId": "naruto", "episodeId": "naruto-1", "duration": 1440 }` returns `{ "sessionId": "..." }`.

`POST /api/watch/heartbeat`: `{ "sessionId": "...", "position": 120, "duration": 1440 }`. Position must be monotonic, cannot teleport more than 300 seconds per request, and must be within duration. Duplicate heartbeats do not award EXP twice.

`POST /api/watch/complete`: `{ "sessionId": "..." }`. Requires at least 80% position and awards the completion bonus once.

## Errors

Invalid input returns HTTP 400 `VALIDATION_ERROR`. Missing/invalid Firebase token returns 401 `UNAUTHORIZED`. Ownership failures return 403 `FORBIDDEN`. Missing records return 404 `NOT_FOUND`. Sanka failures use provider codes/status, Firebase/database failures use `FIREBASE_ERROR` or `DATABASE_ERROR`, and unexpected failures use `INTERNAL_ERROR`. No stack traces or credentials are returned.
