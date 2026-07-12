# Occasio Project Status

Update: 12 Juli 2026

## Tahap Berjalan

Proyek sudah masuk **Tahap 4: Platform Next.js dashboard demo**.

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

## Login Demo Next.js

- Owner: `owner@occasio.app` / `OccasioOwner123!`
- Client: `client@occasio.app` / `OccasioClient123!`

## Hasil QA Terbaru

- Static `index.html` dan `gallery.html`: HTTP 200.
- Next.js `/`, `/wedding/sheila-yoga`, `/owner/dashboard`, `/client/dashboard`: HTTP 200.
- `pnpm.cmd lint`: sukses.
- `pnpm.cmd build`: sukses.

## Lanjutan Berikutnya

1. Hubungkan data demo localStorage ke Supabase.
2. Aktifkan login Supabase Auth lagi setelah schema dan user siap.
3. Buat database event, guests, wishes, rsvp, invoices, dan check-in logs.
4. Jadikan upload Excel masuk database.
5. Jadikan QR check-in demo sebagai QR produksi dengan scanner dan check-in logs.
6. Tambahkan owner tools untuk publish/unpublish, duplicate event, dan assign client.
