# SHIINIME API Contract

Base URL production: `https://shiinime.duckdns.org/`. Semua response memakai JSON.

## Envelope

Success: `{ "success": true, "data": {} }`

Error: `{ "success": false, "error": { "code": "ERROR_CODE", "message": "..." } }`

## Public Endpoints

| Method | URL | Auth | Query/body |
| --- | --- | --- |
| GET | `/health` | No | none |
| GET | `/anime/home` | No | none |
| GET | `/anime/schedule` | No | none |
| GET | `/anime/ongoing-anime` | No | optional `page` |
| GET | `/anime/complete-anime` | No | optional `page` |
| GET | `/anime/unlimited` | No | none |
| GET | `/anime/genre` | No | none |
| GET | `/anime/genre/:slug` | No | optional `page` |
| GET | `/anime/search/:query` | No | optional `page` |
| GET | `/anime/anime/:slug` | No | slug is URL-safe |
| GET | `/anime/episode/:slug` | No | slug is URL-safe |
| GET | `/anime/batch/:slug` | No | slug is URL-safe |
| GET | `/anime/server/:serverId` | No | server ID from episode response |

Legacy aliases `/anime/ongoing`, `/anime/completed`, `/anime/list`, `/anime/:slug`, and `/episode/:slug` remain available for existing clients.

Collection data contains normalized `items`, `schedule`, `pagination`, and `providerData`. Anime detail contains `anime` and `providerData`.

### Episode

`GET /anime/episode/:slug` returns:

```json
{
  "success": true,
  "data": {
    "episode": { "title": "...", "slug": "...", "number": "...", "releaseDate": "...", "url": "..." },
    "streams": [{
      "name": "Main Stream",
      "url": "provider URL",
      "server": null,
      "serverId": null,
      "quality": null,
      "resolution": null,
      "format": null,
      "mimeType": null,
      "subtitle": null,
      "audio": null,
      "type": null
    }],
    "downloads": [{ "name": "...", "url": "...", "resolution": "DL", "format": null }]
  }
}
```

The provider response is read from its `data` envelope. Quality and server IDs are copied from `data.server.qualities[].serverList[]`; download entries are copied from `data.downloadUrl.qualities[].urls[]`. The `providerData` property preserves the original object for forward compatibility.

`GET /anime/server/:serverId` resolves the provider URL and validates its content type. The currently verified provider returns embed/page URLs for the sampled server IDs, so these responses are returned as `playable: false` with an error such as `HTML_PLAYER_PAGE`. The backend never upgrades an embed URL into a direct video URL.

The episode response also includes `servers`. Each provider stream is represented as one server-compatible entry so the Android client can use one stable shape without knowing provider internals:

```json
{
  "servers": [{
    "id": "provider-1",
    "name": "Main Stream",
    "streams": [{
      "url": "https://upbolt.to/e/example",
      "type": null,
      "mimeType": null,
      "playable": false,
      "error": "HTTP_403"
    }]
  }]
}
```

`playable` is determined by a backend `HEAD` validation when possible. The backend only sets `type` to `hls`, `dash`, or `progressive` when the provider response or URL/content type supports that classification. `mimeType` is omitted when the provider does not return a usable content type. HTML player pages, JSON responses, HTTP errors, and validation timeouts are never reported as direct media. Existing `streams` and `downloads` fields remain for APK compatibility.

## Authenticated Endpoints

Send `Authorization: Bearer <Firebase ID Token>`.

| Method | URL | Body |
| --- | --- | --- |
| GET | `/profile` | none |
| GET | `/favorites` | none |
| POST | `/favorites` | `{ animeSlug, anime? }` |
| DELETE | `/favorites/:animeSlug` | none |
| GET | `/history` | none |
| GET | `/leaderboard` | none |
| POST | `/watch/start` | `{ episodeSlug, durationSeconds }` |
| POST | `/watch/heartbeat` | `{ sessionId, positionSeconds, durationSeconds }` |
| POST | `/watch/complete` | `{ sessionId, positionSeconds, durationSeconds }` |

The backend obtains UID only from the verified Firebase token. Watch rewards are transaction-based and duplicate completion rewards are rejected. Heartbeats clamp position, delta, and duration server-side.

Common errors: `VALIDATION_ERROR`, `UNAUTHORIZED`, `INVALID_TOKEN`, `FIREBASE_NOT_CONFIGURED`, `PROVIDER_ERROR`, `WATCH_SESSION_NOT_FOUND`, `COMPLETION_THRESHOLD_NOT_MET`, `INTERNAL_ERROR`.
