# SHIINIME-BACKEND

Backend REST API baru untuk aplikasi Android SHIINIME. APK hanya mengakses API ini melalui HTTPS; Firebase Admin credential dan Firestore tetap berada di VPS.

## Arsitektur

`APK -> HTTPS/JSON -> Fastify -> OploverzService/Normalizer -> Oploverz API`

Firebase Authentication memverifikasi `Authorization: Bearer <Firebase ID Token>`. Firestore menyimpan users, favorites, history, watch sessions, EXP, level, dan leaderboard.

## Requirements

- Node.js 20+
- npm
- Firebase project dengan Authentication dan Firestore
- Ubuntu VPS untuk production

## Installation

```bash
npm install
copy .env.example .env
```

Isi `.env` dengan Firebase service account values. Jangan commit `.env`.

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
PROVIDER_BASE_URL=https://www.sankavollerei.web.id
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
CORS_ORIGIN=*
```

## Development and Testing

```bash
npm run dev
npm test
npm run build
npm start
```

`GET /health` tidak membutuhkan Firebase. Endpoint user membutuhkan Firebase configuration dan token valid. Test menggunakan Fastify `inject`, tanpa mock data di production; provider test double hanya berada di test untuk menguji error envelope dan routing.

## API

Endpoint publik dan authenticated dijelaskan di [API_CONTRACT.md](API_CONTRACT.md). Detail response provider yang diinspeksi ada di [OPLOVERZ_API_ANALYSIS.md](OPLOVERZ_API_ANALYSIS.md).

## Firebase setup

1. Buat Firebase project.
2. Aktifkan Firebase Authentication provider yang dipakai APK.
3. Buat Firestore database.
4. Buat service account untuk server.
5. Simpan project ID, client email, dan private key hanya di `.env` VPS.
6. Deploy backend dan uji token Firebase ID dari APK.

## Ubuntu VPS deployment

Install Node.js dan tools:

```bash
sudo apt update
sudo apt install -y nginx ufw ca-certificates curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

Upload atau clone project ke VPS, lalu:

```bash
cd /var/www/shiinime-backend
npm ci
cp .env.example .env
nano .env
npm run build
pm2 start dist/src/server.js --name shiinime-backend
pm2 save
pm2 startup
```

Jalankan command `pm2 startup` yang dicetak oleh PM2, lalu cek:

```bash
pm2 status
pm2 logs shiinime-backend
pm2 restart shiinime-backend
```

## Nginx reverse proxy

Buat `/etc/nginx/sites-available/shiinime-api`:

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktifkan dan validasi:

```bash
sudo ln -s /etc/nginx/sites-available/shiinime-api /etc/nginx/sites-enabled/shiinime-api
sudo nginx -t
sudo systemctl reload nginx
```

HTTPS dengan Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.example.com
```

Firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Update deployment

```bash
cd /var/www/shiinime-backend
git pull
npm ci
npm run build
pm2 restart shiinime-backend
pm2 logs shiinime-backend --lines 100
```

## Troubleshooting

- `FIREBASE_NOT_CONFIGURED`: cek tiga Firebase environment variables.
- `INVALID_TOKEN`: APK harus mengirim Firebase ID token terbaru sebagai Bearer token.
- `PROVIDER_ERROR`: cek koneksi VPS, timeout, dan status provider.
- `VALIDATION_ERROR`: cocokkan body/path dengan API contract.
- `502/504` dari Nginx: cek `pm2 status`, `pm2 logs`, port `3000`, dan `sudo nginx -t`.
