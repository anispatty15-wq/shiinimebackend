# Provider API Analysis

Inspection dilakukan pada 11 September 2026 terhadap `https://www.sankavollerei.web.id` menggunakan HTTP request nyata. Tidak ada mock response yang dipakai.

## Current provider contract

The current API is `https://www.sankavollerei.web.id/` with endpoint paths under `/anime`. The older `/anime/oploverz` prefix and the old response fields (`anime_list`, `episode_title`, `streams`) are no longer used as the primary contract.

The verified response envelope is `{ status, creator, data, pagination }`. Collection fields use `data.animeList`; detail uses `data.episodeList`; episode uses `data.server.qualities` and `data.downloadUrl.qualities`.

## Base URL

`https://www.sankavollerei.web.id/`

## Endpoint

| Provider endpoint | Observed response |
| --- | --- |
| `GET /anime/home` | `{ status, creator, data: { ongoing, completed, ... } }` |
| `GET /anime/schedule` | `{ status, creator, data: [{ day, animeList[] }] }` |
| `GET /anime/ongoing-anime?page=1` | `{ status, creator, data: { animeList[], pagination } }` |
| `GET /anime/complete-anime?page=1` | `{ status, creator, data: { animeList[], pagination } }` |
| `GET /anime/genre` | `{ status, creator, data: { genreList[] } }` |
| `GET /anime/genre/:slug?page=1` | Collection response with `data.animeList[]` and `data.pagination` |
| `GET /anime/unlimited` | `{ status, creator, data: { list[] } }` |
| `GET /anime/search/:query` | Collection response with `data.animeList[]` and `data.pagination` |
| `GET /anime/anime/:slug` | `{ status, creator, data: { episodeList[], ... } }` |
| `GET /anime/episode/:slug` | `{ status, creator, data: { server, downloadUrl, ... } }` |
| `GET /anime/server/:serverId` | `{ status, creator, data: { url } }`; sampled URLs are embed pages |

## Collection Structure

Item `data.animeList` yang teramati memakai `title`, `poster`, `animeId`, `href`, dan `otakudesuUrl`. Normalizer memetakan `animeId` menjadi `slug`.

`pagination` yang teramati memiliki `hasNext`, `hasPrev`, dan `currentPage`. Parameter `page=2` terobservasi mengubah `currentPage` menjadi `2`. Limit tidak diberikan oleh inspection.

`/schedule` mengembalikan array hari dengan item `title`, `slug`, `url`, dan `poster`.

## Anime Detail

`data` pada detail memiliki:

- `title`
- `poster`
- `synopsis`
- `status`, `studios`, `duration`, `season`, `type`, `score`, `aired`
- `genreList[]`: `title`, `genreId`, `href`
- `episodeList[]`: `episodeId`, `title`, `eps`, `date`, `href`

## Episode, Stream, Server, dan Resolution

Response nyata yang diambil:

`data.server.qualities[]` contains the dynamic quality title and `serverList[]` contains the server title and `serverId`. `data.downloadUrl.qualities[]` contains the download quality, size, and provider URLs.

Alur normalisasi:

```text
Provider response
       ↓
streams[] / downloads[]
       ↓
Stream / Download
       ↓
name dan URL provider
       ↓
resolution hanya dari field provider
```

Provider response menyediakan server ID dan quality, tetapi tidak menjamin direct media URL, MIME type, format, subtitle, atau audio. API internal memvalidasi URL server dan mengembalikan `playable: false` untuk embed/HTML.

Download dipisahkan dari stream dan quality diambil dari `downloadUrl.qualities[]`; URL download tetap tidak dianggap stream URL.

## Field Mapping

| Provider | SHIINIME |
| --- | --- |
| `title` | `title` |
| `animeId` | `slug` |
| `poster` | `poster` |
| `episode` | `episode` / `number` |
| `episodeList[]` | `episodes` |
| `episodeId` | `episode.slug` |
| `server.qualities[].serverList[]` | `streams[]` |
| `downloadUrl.qualities[].urls[]` | `downloads[]` |

Provider tidak mengirim query parameter selain pagination `page` yang terobservasi. Tidak ada field tambahan yang dikarang.
