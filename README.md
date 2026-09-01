# Occasio Digital Wedding Platform

Occasio adalah layanan pembuatan undangan pernikahan digital interaktif. Repositori ini berisi keseluruhan kode sumber Occasio, yang terbagi menjadi dua sistem utama:

1. **Company Profile & Gallery (Frontend Statis)**: Website landing page untuk menawarkan jasa, menampilkan galeri template, dan mengarahkan klien ke WhatsApp. Dibangun dengan HTML, CSS, dan JavaScript vanilla.
2. **Wedding Platform & Dashboard (Next.js)**: Aplikasi web utama yang berisi halaman undangan pernikahan interaktif (RSVP, QR Check-in, Ucapan), dashboard untuk Klien (melihat progres), dan dashboard untuk Owner (mengelola acara). Dibangun menggunakan Next.js (App Router), TypeScript, Tailwind CSS, dan Supabase (Auth & Database).

## Struktur Repositori

- **`/` (Root Direktori)**
  - `index.html`, `gallery.html`, `privacy.html`, `terms.html`: Halaman statis company profile.
  - `assets/`: Direktori aset CSS, JavaScript modular, dan gambar.
  - `PROJECT_STATUS.md`: Catatan progres proyek terkini.
  - `PRODUCTION_DATA_CHECKLIST.md`: Daftar periksa data yang harus disesuaikan sebelum rilis produksi.
  
- **`/wedding-platform/`**
  - Aplikasi Next.js yang menangani routing login, dashboard (`/client/dashboard`, `/owner/dashboard`), dan halaman template undangan dinamis (`/wedding/[slug]`).
  - `BACKEND.md`: Instruksi detail untuk setup database Supabase, schema SQL, dan seeding data.

## Menjalankan Proyek Secara Lokal

### 1. Static Company Profile
Anda dapat menggunakan HTTP server apa pun. Contoh menggunakan `npx serve`:

```bash
# Berada di root direktori
npx serve . -p 4174
```
Buka `http://localhost:4174` di browser.

### 2. Next.js Wedding Platform
Aplikasi ini menggunakan pnpm sebagai package manager.

```bash
cd wedding-platform
pnpm install
```

Pastikan Anda menyalin `.env.example` ke `.env.local` dan mengisi kredensial Supabase Anda (URL dan Anon Key).
```bash
cp .env.example .env.local
```

Untuk menjalankan development server (gunakan `--webpack` jika SWC native diblokir oleh sistem Windows lokal Anda):
```bash
pnpm exec next dev -p 3001 --webpack
```

Halaman utama platform dapat diakses di:
- **Platform Home**: `http://localhost:3001`
- **Demo Undangan**: `http://localhost:3001/wedding/sheila-yoga`
- **Login Demo**: `http://localhost:3001/login`

**Akun Demo:**
- Owner: `owner@occasio.app` / `OccasioOwner123!`
- Client: `client@occasio.app` / `OccasioClient123!`

*(Catatan: Jika Supabase belum terhubung ke cloud, aplikasi telah dikonfigurasi untuk menggunakan fallback data lokal demo agar tetap bisa diuji coba).*

## Panduan Backend & Database

Setup skema SQL Supabase, RLS (Row Level Security), pembuatan table, dan panduan seeding database tersedia selengkapnya di file [`wedding-platform/BACKEND.md`](./wedding-platform/BACKEND.md).

## Produksi & Deployment

- Pastikan Anda sudah mengikuti `PRODUCTION_DATA_CHECKLIST.md` untuk mengganti nomor WhatsApp, URL domain asli, serta data harga dan paket pada config lokal.
- Web statis company profile dapat di-deploy di Vercel, Netlify, atau web hosting biasa.
- Aplikasi Next.js (`/wedding-platform`) disarankan untuk di-deploy di [Vercel](https://vercel.com) dengan mengonfigurasi pengaturan environment variables yang sesuai untuk production database.

---
*Dokumentasi ini diperbarui sesuai dengan integrasi arsitektur Next.js platform terbaru.*
