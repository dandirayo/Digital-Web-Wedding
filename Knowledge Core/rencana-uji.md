---
title: Rencana uji dan checklist rilis
tags:
  - occasio
  - qa
status: aktif
updated: 2026-11-27
---

# Rencana uji dan checklist rilis

Dokumen ini menjawab tiga pertanyaan: apa yang diuji, bagaimana mengujinya, dan kapan sebuah rilis boleh dianggap siap. Gerbang kualitas berasal dari [PRD-occasio.md](PRD-occasio.md) §3.

## 1. Lapisan uji

| Lapisan | Alat | Perintah (dari `wedding-platform`) | Kapan |
| --- | --- | --- | --- |
| Tipe dan gaya kode | TypeScript, ESLint | `pnpm exec tsc --noEmit` dan `pnpm lint` | Setiap perubahan |
| Aturan backend | `node:test` | `pnpm test:backend` | Setiap perubahan backend |
| API dengan peran berbeda | Skrip di `tests/api/` | `node tests/api/qa-order-flow.mjs` dan `node tests/api/qa-accounts-expiry.mjs` (server dev harus jalan) | Sebelum commit fitur bisnis |
| Smoke HTTP | `tests/http-smoke.mjs` | `node tests/http-smoke.mjs` | Sebelum rilis |
| Build production | Next.js | `pnpm build` | Sebelum rilis |
| Manual di browser | Daftar skenario §3 | Desktop dan lebar 375 px | Setiap perubahan UI |
| Perangkat fisik | Daftar skenario §4 | HP Android dan iPhone | Sebelum pilot dan sebelum online |

Skrip di `tests/api/` membuat data berawalan "QA" lalu menghapusnya. Jangan jalankan terhadap server production.

Hasil terakhir yang tercatat (26 sampai 27 November 2026): 17 tes backend lulus, 28 cek akun/kedaluwarsa lulus, 87 cek alur order lulus (cek 8.2 sudah diperbarui untuk perilaku "Undangan Berakhir"), build production lulus. Uji perangkat fisik belum pernah dilakukan.

## 2. Akun uji

Hanya untuk server dev. Akun demo dibuat otomatis oleh seed (lihat [BACKEND.md](BACKEND.md)); jangan dipakai di production. Production membuat akun owner dari environment saat pertama kali jalan.

## 3. Skenario fungsional (browser)

Tandai lulus/gagal dan tulis catatan. Uji dengan peran yang ditulis.

### Owner

- [ ] Login gagal menampilkan pesan; login berhasil masuk dashboard.
- [ ] Inbox: lead baru tampil, ubah status, tulis catatan, jadikan klien.
- [ ] Event: ubah semua field detail, unggah/urutkan/hapus media, tambah/hapus tamu (dialog konfirmasi muncul).
- [ ] Tagihan: tandai lunas, batalkan, buka kembali, tambah biaya tambahan.
- [ ] Persetujuan: ajukan versi, setujui atas nama klien dengan catatan, publish ditolak sebelum syarat terpenuhi, publish berhasil setelahnya.
- [ ] Kelola: ubah paket, template, situs publik; reset password; nonaktifkan dan aktifkan klien; hapus akun klien ditolak bila masih punya event.

### Klien

- [ ] Hanya melihat event miliknya.
- [ ] Tambah tamu, impor Excel, ekspor CSV; kuota paket menolak tamu berlebih.
- [ ] Bagikan link pribadi: link berisi `?g=`, WhatsApp terbuka dengan pesan.
- [ ] Laporkan pembayaran; status berubah menjadi "bukti dilaporkan", bukan lunas.
- [ ] Setujui atau minta revisi versi.
- [ ] Chat dengan owner; pesan baru muncul tanpa muat ulang.

### Tamu

- [ ] Link pribadi menampilkan nama tamu, RSVP dengan pilihan jumlah orang sesuai batas, di **keempat tema**.
- [ ] Kirim RSVP dua kali tidak menggandakan hitungan.
- [ ] Link tanpa `?g=` tidak bisa RSVP dan menampilkan petunjuk.
- [ ] Ucapan terkirim; ucapan yang sama ditolak dengan pesan.
- [ ] Undangan draft tidak bisa dibuka; undangan kedaluwarsa menampilkan "Undangan Berakhir".
- [ ] Galeri: buka, tutup dengan tombol dan Escape.

### Situs publik

- [ ] Dibuka dari localhost dengan server jalan: paket dan template dari admin tampil; form konsultasi masuk inbox.
- [ ] **Mode etalase** (dibuka dari host bukan localhost, mis. GitHub Pages): tombol Dashboard tersembunyi, tautan demo menuju galeri, form konsultasi membuka WhatsApp bila nomor diisi atau menampilkan "Konsultasi online belum dibuka" bila belum.
- [ ] Tidak ada tautan `localhost` yang terlihat di mode etalase.

### Gagal dan batas

- [ ] Server mati saat mengisi form: pesan galat jelas, data form tidak hilang.
- [ ] Unggah file bukan gambar/video/audio ditolak; file terlalu besar ditolak.
- [ ] Sesi habis: diarahkan ke login, bukan halaman kosong.

## 4. Matriks perangkat fisik

| Perangkat | Browser | Fokus uji |
| --- | --- | --- |
| HP Android kelas menengah | Chrome | Undangan keempat tema, RSVP, musik setelah sentuhan, video, galeri |
| iPhone | Safari | Sama dengan Android; perhatikan autoplay musik dan tinggi layar |
| Laptop | Chrome atau Edge | Dashboard owner dan klien, unggah media, impor Excel |
| Dua perangkat bersamaan | Apa saja | Owner dan klien membuka event yang sama: chat, persetujuan, tagihan saling terlihat setelah muat ulang |

Untuk setiap perangkat catat: model, versi OS, browser, hasil, dan tangkapan layar bila gagal. Uji juga koneksi lambat (mode data seluler atau pembatasan jaringan di DevTools).

## 5. Checklist rilis

### A. Setiap perubahan kode

- [ ] `tsc`, `lint` (0 error), `test:backend` lulus.
- [ ] Skenario manual yang terdampak diuji di desktop dan 375 px.
- [ ] `git diff` ditinjau; tidak ada file data, `.env`, atau log yang ikut.
- [ ] Dokumen diperbarui bila perilaku berubah (PRD §7, BACKEND.md).

### B. Siap pilot (gerbang P1)

- [ ] Butir S1 sampai S7 di [spek-teknis-p1.md](spek-teknis-p1.md) selesai, atau ada keputusan tertulis untuk menundanya.
- [ ] Semua skenario §3 lulus.
- [ ] Matriks perangkat §4 lulus minimal untuk satu Android dan satu iPhone.
- [ ] `intro.mp4` dikompres (target 5 sampai 8 MB).
- [ ] `terms.html` dan `privacy.html` memuat keputusan K4, K5, K6 dan disetujui pemilik.
- [ ] SOP [SOP-operasional.md](SOP-operasional.md) dicoba satu kali dengan order uji.
- [ ] Backup lalu restore dicoba dan berhasil.

### C. Siap online (gerbang P2)

- [ ] Checklist [DEPLOY.md](DEPLOY.md) §9 tercentang.
- [ ] Database production baru (bukan salinan dev); tidak ada akun demo.
- [ ] Semua placeholder `domain-anda.com` dan `localhost` diganti.
- [ ] `/api/health` dipantau; backup harian berjalan dan ada salinan di luar server.

### D. Setiap update di server

- [ ] Backup sebelum update; catat versi yang berjalan.
- [ ] Ikuti [DEPLOY.md](DEPLOY.md) §6; jangan update pada hari acara klien.
- [ ] Setelah update: `/api/health`, login, satu undangan, satu RSVP uji pada event uji.

## 6. Pelaporan bug

Tulis: langkah mengulang, hasil yang terjadi, hasil yang diharapkan, peran pengguna, perangkat dan browser, tangkapan layar. Prioritas: **kritis** (data bocor, uang salah, undangan klien tidak bisa dibuka), **sedang** (fitur gagal tetapi ada jalan lain), **kecil** (tampilan). Bug kritis diperbaiki sebelum pekerjaan lain.
