# Occasio Wedding Platform

Aplikasi utama Occasio untuk owner, client, undangan publik, RSVP, dan QR
check-in. Project ini menggunakan Next.js dan dijalankan pada port `3001` selama
development agar tidak tertukar dengan website static lama.

## Jalankan aplikasi utama

```bash
pnpm exec next dev --webpack -p 3001
```

Alamat lokal:

- Homepage platform: `http://localhost:3001`
- Gallery template: `http://localhost:3001/gallery`
- Login: `http://localhost:3001/login`
- Owner dashboard: `http://localhost:3001/owner/dashboard`
- Client dashboard: `http://localhost:3001/client/dashboard`
- Demo wedding: `http://localhost:3001/wedding/sheila-yoga`
- Demo check-in: `http://localhost:3001/checkin/sheila-yoga`

Port `3000` tidak digunakan dalam setup project ini.

## Website static lama

Website static berada di root repository dan dipakai sebagai pembanding selama
migrasi. Jalankan static server dari root repository pada port `4174`.

## Verifikasi

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
pnpm backend:check
```

Panduan backend dan Supabase tersedia di `BACKEND.md`.
