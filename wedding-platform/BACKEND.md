# Occasio Backend Setup

Status project saat ini:

- Frontend dan dashboard demo berjalan lokal.
- Supabase Auth sudah disiapkan di kode login.
- Fallback demo lokal tetap aktif supaya app bisa dipakai walau Supabase belum reachable.
- Schema database ada di `src/lib/supabase/schema.sql`.
- Seed user dan seed data demo ada di folder `scripts`.

## 1. Cek environment

Pastikan `.env.local` berisi:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di script server lokal, jangan dipasang di browser atau file frontend.

## 2. Jalankan schema

Buka Supabase SQL Editor, lalu jalankan seluruh isi:

```text
src/lib/supabase/schema.sql
```

Schema ini membuat:

- `profiles`
- `events`
- `guests`
- `wishes`
- enum role/status
- RLS select, insert, dan update untuk owner/client

## 3. Cek koneksi backend

```bash
pnpm backend:check
```

Jika domain Supabase belum bisa diakses dari laptop, command ini akan gagal di bagian REST reachable.

## 4. Seed user demo

```bash
pnpm seed:users
```

Akun demo:

- `owner@occasio.app`
- `client@occasio.app`

Password tetap mengikuti file seed lokal.

## 5. Seed event demo

```bash
pnpm seed:demo
```

Command ini membuat atau memperbarui:

- profile owner/client
- event `sheila-yoga`
- data tamu contoh
- data ucapan contoh

## 6. Jalankan lokal

Karena Windows Application Control memblokir native SWC di laptop ini, gunakan Webpack:

```bash
pnpm exec next dev -p 3001 --webpack
```

Halaman utama:

- `http://localhost:3001`
- `http://localhost:3001/wedding/sheila-yoga`
- `http://localhost:3001/client/dashboard`
- `http://localhost:3001/owner/dashboard`
