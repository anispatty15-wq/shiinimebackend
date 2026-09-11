# SHIINIME Backend

REST API TypeScript + Hono untuk Vercel Serverless, Firebase Admin/Firestore, dan Sanka API. Tidak memakai Express atau `app.listen()`.

## Requirements

Node.js 20+, npm, Firebase project, dan Vercel CLI untuk deployment.

## Installation

```bash
cd SHIINIME-BACKEND
npm install
copy .env.example .env
npm run build
npm run dev
```

`vercel dev` biasanya berjalan di `http://localhost:3000`.

## Environment variables

Salin `.env.example`. Isi `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, dan `FIREBASE_PRIVATE_KEY` dari service account Firebase. Simpan private key hanya di environment Vercel atau `.env` lokal yang di-ignore Git. `MOCK_AUTH` default `false`; hanya development lokal yang boleh mengaktifkannya.

## Firebase setup

Aktifkan Authentication provider yang dipakai APK dan Firestore. Firebase Admin memverifikasi `Authorization: Bearer <Firebase ID Token>`. Firestore rules tetap perlu disiapkan sesuai kebijakan proyek; akses server memakai Admin SDK.

## Deployment Vercel

```bash
npm install -g vercel
vercel
vercel env add FIREBASE_PROJECT_ID
vercel env add FIREBASE_CLIENT_EMAIL
vercel env add FIREBASE_PRIVATE_KEY
```

Set environment untuk Production dan Redeploy. URL utama berbentuk `https://<project>.vercel.app/api/health`.

## API endpoints

Public Sanka wrappers: `GET /api/anime/home`, `/schedule`, `/:slug`, `/complete`, `/ongoing`, `/genres`, `/genre/:slug`, `/search/:keyword`, `/all`, `/batch/:slug`; `GET /api/episode/:slug`; `GET /api/stream/:serverId`.

Authenticated: `GET/PATCH /api/me`, `POST /api/watch/start`, `/heartbeat`, `/complete`, `GET /api/history`, `/history/:episodeId`, `/history/continue`, `GET/POST/DELETE /api/favorites`, `GET /api/leaderboard`.

Health: `GET /api/health` requires no auth.

## Watch and EXP flow

APK starts a session, sends monotonic heartbeats, then completes at 80%. Every valid 60 seconds awards 5 EXP once; completion awards 20 EXP once. Session ownership, teleport, rewind, duplicate units, and completion idempotency are enforced with Firestore state/transactions. Stream access never awards EXP.

## Testing

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/anime/home
curl http://localhost:3000/api/anime/search/boruto
curl -H "Authorization: Bearer <Firebase_ID_TOKEN>" http://localhost:3000/api/me
```

For local-only mock testing set `NODE_ENV=development` and `MOCK_AUTH=true`, then use any bearer value. Never set it in Vercel production.

## Firestore structure

`users/{uid}`, `users/{uid}/history/{episodeId}`, `users/{uid}/favorites/{animeId}`, `watchSessions/{sessionId}`. Leaderboard reads only public fields from users ordered by EXP.

## Troubleshooting

Check Vercel build/function logs, environment scope, Firebase private-key newline escaping (`\\n`), Sanka availability, and Firestore indexes for ordered history/leaderboard queries. A Sanka failure returns structured `PROVIDER_ERROR`, timeout, or provider status errors without exposing stack traces.

See [docs/API_CONTRACT.md](docs/API_CONTRACT.md) for stable Android-facing request/response examples.
