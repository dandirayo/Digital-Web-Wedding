# Occasio Project Status

Update: 6 September 2026

## Tahap Berjalan

Proyek sudah masuk **Tahap 5B: Backend & Security Foundation**.

Tahap 5A sudah selesai: error lint diperbaiki sampai 0 error, TypeScript dan
production build berhasil, serta route utama diuji HTTP 200. Dev server preview
tersedia di `http://localhost:3001`.

Konsolidasi Next.js sudah dimulai: homepage dan gallery template utama kini
tersedia di aplikasi Next.js, masing-masing pada `/` dan `/gallery`.

Tahap 5B sedang berjalan: migration hardening Supabase sudah disiapkan, tetapi
belum diterapkan ke remote karena hostname Supabase pada `.env.local` saat ini
tidak dapat di-resolve (`ENOTFOUND`).

## Tahap Selesai

1. **Tahap 1 - Static frontend audit dan redesign**
   - Homepage company profile Occasio.
   - Gallery template dynamic.
   - Modal reusable.
   - Form konsultasi WhatsApp.
   - SEO static dasar.

2. **Tahap 2 - Polish dan QA static frontend**
   - Struktur CSS/JS modular.
   - Link/aset static dicek.
   - Dokumentasi static ditambahkan.

3. **Tahap 3 - Data produksi dicatat**
   - Masih butuh input pemilik untuk nomor WhatsApp asli, domain, harga final, dan testimoni asli.

4. **Tahap 4 - Next.js platform demo**
   - Homepage platform Next.js diperjelas.
   - Flow owner, client, dan wedding preview ditambahkan.
   - Dashboard client memiliki setup progress.
   - Dashboard owner memiliki event readiness.
   - Dashboard mobile mendapat navigation row.
   - Wedding page demo sudah bisa menerima RSVP, menampilkan ucapan baru, dan generate QR check-in demo.

## Port Lokal

- Static company profile: `http://localhost:4174`
- Next.js platform demo: `http://localhost:3001`
- Next.js gallery template: `http://localhost:3001/gallery`

## Login Demo Next.js

- Owner: `owner@occasio.app` / `OccasioOwner123!`
- Client: `client@occasio.app` / `OccasioClient123!`

## Hasil QA Terbaru

- Static `index.html` dan `gallery.html`: HTTP 200.
- Next.js `/`, `/gallery`, `/wedding/sheila-yoga`, `/owner/dashboard`, `/client/dashboard`: HTTP 200.
- `pnpm.cmd lint`: sukses.
- `pnpm.cmd build`: sukses.

## Lanjutan Berikutnya

1. Pulihkan URL project Supabase dan jalankan migration hardening setelah review.
2. Hubungkan session Supabase Auth ke route owner/client.
3. Ganti akses data halaman dari localStorage ke repository Supabase.
4. Tambahkan entitas bisnis `leads`, `orders`, `workflow_tasks`, dan `invoices`.
5. Jadikan upload Excel, RSVP, dan QR check-in memakai database produksi.
6. Tambahkan approval/revision workflow client sebelum publish.
