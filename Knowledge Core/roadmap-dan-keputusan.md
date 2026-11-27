---
title: Roadmap dan log keputusan
tags:
  - occasio
  - roadmap
  - keputusan
status: aktif
updated: 2026-11-27
---

# Roadmap dan log keputusan Occasio

Dokumen ini menggantikan bagian rencana di [roadmap-production.md](roadmap-production.md) (September 2026), yang kini menjadi catatan historis. Kebutuhan fitur rinci ada di [PRD-occasio.md](PRD-occasio.md); cara mengerjakan celah P1 ada di [spek-teknis-p1.md](spek-teknis-p1.md).

## 1. Prinsip arah

1. Satu order Basic harus berjalan rapi dan menguntungkan berulang kali sebelum paket atau fitur baru dibuka.
2. **Kerangka, rencana, dan implementasi harus matang dulu**; baru setelah itu membeli server (keputusan pemilik 27 November 2026).
3. Tidak ada deployment, pembelian infrastruktur, atau perubahan akun cloud tanpa persetujuan pemilik.

## 2. Roadmap

| Tahap | Isi | Syarat lulus | Status |
| --- | --- | --- | --- |
| G0 | Pengesahan produk dan SOP awal | Keputusan D01 sampai D08 | Lulus 8 September 2026 |
| G1 | Audit aplikasi dan rancangan UX | [audit-aplikasi-g1.md](audit-aplikasi-g1.md) | Lulus 8 September 2026 |
| Fase 1 sampai 5 | Backend SQLite, lead, admin penuh, media, tema, order, tagihan, persetujuan, publish, tamu, RSVP, backup | Tes backend dan uji API | Selesai November 2026 |
| Fase 6a dan 6b | Health check, header keamanan, `.env.example`, panduan server dan rollback | Build production lulus | Selesai 20 November 2026 |
| Perbaikan audit | Bug dashboard, akun klien nonaktif/hapus, "Undangan Berakhir", RSVP jumlah orang di semua tema, toast dan konfirmasi, animasi | 17 tes backend, 28 + 87 cek API | Selesai 26 November 2026 |
| Dokumen dasar | PRD, breakdown model bisnis, SOP, rencana uji, spesifikasi P1, roadmap ini | Disetujui pemilik | Ditulis 27 November 2026, menunggu persetujuan |
| Etalase GitHub Pages | Website publik tayang di GitHub Pages dalam mode etalase | Tidak ada tautan `localhost` terlihat; folder internal tidak tersaji | Kode siap 27 November 2026; tayang dikelola pemilik |
| **P1. Siap pilot** | S1 sampai S8 di spesifikasi P1, kompres video, uji perangkat fisik, isi syarat dan privasi | Checklist B di [rencana-uji.md](rencana-uji.md) | Berikutnya |
| P2. Online | Pilih VPS atau mini PC, domain `.com`, HTTPS, backup terjadwal, deploy pertama | Checklist C di rencana uji dan [DEPLOY.md](DEPLOY.md) §9 | Setelah P1 matang |
| P3. Pilot berbayar | Order Basic nyata, catat jam kerja dan biaya | Order selesai, biaya tercatat, testimoni | Setelah P2 |
| P4. Harga final | Hitung kontribusi per order | Harga jual disahkan (D03) | Setelah P3 |
| P5. Premium | QR check-in, peran petugas | Check-in lolos uji perangkat dan koneksi lemah | Nanti |
| P6. Signature | Layanan venue | D02 disahkan, simulasi venue lolos | Nanti |

## 3. Log keputusan

Urut dari yang terbaru. Keputusan yang lebih baru mengalahkan yang lama untuk topik yang sama.

| Tanggal | ID | Keputusan | Sumber |
| --- | --- | --- | --- |
| 27 Nov 2026 | K1 (revisi) | Server dipilih nanti: **VPS atau mini PC di rumah**. Dokumen deploy menyiapkan kedua jalur. Server dibeli setelah kerangka, rencana, dan implementasi matang. Menggantikan K1 "VPS kecil" di hari yang sama. | Pemilik |
| 27 Nov 2026 | K9 | Sementara memakai **GitHub Pages**. Pages hanya untuk website publik (etalase); dashboard, undangan, RSVP, dan form ke inbox butuh server, jadi belum tersedia untuk publik sampai P2. | Pemilik, batas teknis dicatat di DEPLOY.md §0 |
| 27 Nov 2026 | K2 | Domain `.com`; nama belum dipilih. | Pemilik |
| 27 Nov 2026 | K3 | Basic memakai tema standar; tema unik add-on berbayar untuk Basic; Premium dan Signature dapat semua tema. | Pemilik |
| 27 Nov 2026 | K4 | Klien boleh memilih musik sendiri dan menjamin izinnya. | Pemilik |
| 27 Nov 2026 | K5 | Refund sebagian: sebelum produksi DP kembali penuh, setelah produksi 50% DP; pindah tanggal gratis 1 kali bila minimal 14 hari sebelumnya. | Pemilik |
| 27 Nov 2026 | K6 | Data tamu dan media disimpan 3 bulan setelah masa aktif habis, bisa diperpanjang. Menggantikan baseline "ekspor 30 hari" (D06). | Pemilik |
| 27 Nov 2026 | K7 | Order per bulan saat pilot tanpa batas; jam kerja dicatat sejak order pertama. | Pemilik |
| 27 Nov 2026 | K8 | Akses akun klien: link aktivasi sebagai cara utama, reset password sementara sebagai cadangan. | Pemilik |
| 26 Nov 2026 | - | Animasi hanya dengan CSS dan React yang ada; tanpa pustaka baru. Owner bisa menonaktifkan dan menghapus akun klien. | Pemilik |
| 8 Nov 2026 | - | Supabase dihentikan; backend Next.js + SQLite bawaan Node 24. Website publik dan aplikasi admin terpisah. Uji di localhost dulu. | [core.md](core.md) |
| 6 Nov 2026 | - | Model layanan per event; Basic untuk pilot pertama; Premium dan Signature ditunda. | core.md |
| 8 Sep 2026 | D01 | Merek Occasio; paket Basic, Premium, Signature. | [business-model-occasio.md](business-model-occasio.md) §12 |
| 8 Sep 2026 | D02 | Signature/venue ditunda dan tidak dijual sampai biaya dan kapasitas disahkan. | idem |
| 8 Sep 2026 | D03 | Harga baseline internal Rp799.000 / Rp1.490.000 / Rp2.990.000; harga jual final setelah pilot. | idem |
| 8 Sep 2026 | D04 | Kuota, revisi, masa aktif sesuai tabel model bisnis §4. | idem |
| 8 Sep 2026 | D05 | DP 50%, lunas sebelum publish. Rincian refund kini K5. | idem |
| 8 Sep 2026 | D06 | Akses sesuai masa paket. Durasi retensi kini K6. | idem |
| 8 Sep 2026 | D07 | Chat privat sebagai kanal konsultasi; WhatsApp opsional. | idem |
| 8 Sep 2026 | D08 | Rilis pertama Basic; Premium lalu Signature setelah gerbang masing-masing. | idem |
| 8 Sep 2026 | D09 | Infrastruktur diputuskan setelah uji; deployment manual dengan persetujuan; tanpa auto-deploy. | idem |

## 4. Keputusan yang masih terbuka

| Topik | Pertanyaan | Dibutuhkan sebelum |
| --- | --- | --- |
| Server | VPS atau mini PC di rumah, dan penyedianya | P2 |
| Domain | Nama domain `.com` | P2 |
| Harga add-on | Tema unik, perpanjangan penyimpanan, revisi tambahan | P1 (minimal angka sementara) |
| Jam dukungan | Usulan Senin sampai Sabtu 09.00 sampai 17.00 WIB | Pilot berbayar |
| Masa berlaku penawaran | Usulan 7 hari kalender | Pilot berbayar |
| Nomor WhatsApp bisnis | Nomor yang dipakai di website dan mode etalase | Etalase GitHub Pages bisa menerima konsultasi |
| Harga jual final | Dari data pilot | P4 |
