---
title: SOP operasional order Occasio
tags:
  - occasio
  - sop
status: draft untuk pilot
updated: 2026-11-27
---

# SOP operasional: satu order dari lead sampai selesai

Untuk owner Occasio. SOP ini menjalankan keputusan di [business-model-occasio.md](business-model-occasio.md) dan [PRD-occasio.md](PRD-occasio.md) §14. Langkah bertanda **(belum di aplikasi)** masih dikerjakan manual sampai fitur di [spek-teknis-p1.md](spek-teknis-p1.md) selesai.

Jam dukungan yang diusulkan model bisnis: Senin sampai Sabtu, 09.00 sampai 17.00 WIB, respons awal maksimal satu hari kerja. Jam ini **belum disahkan**; sampai disahkan, jangan dijanjikan di website.

## Ringkasan tahap

| # | Tahap | Hasil yang harus ada | Di aplikasi |
| --- | --- | --- | --- |
| 1 | Lead masuk | Lead tercatat, dibalas | Dashboard owner > Inbox konsultasi |
| 2 | Penawaran | Klien setuju paket, add-on, harga, tanggal target | Chat/WhatsApp (belum di aplikasi) |
| 3 | Jadikan klien | Akun klien + event draft + tagihan DP dan pelunasan | Tombol "Jadikan klien" |
| 4 | DP | DP terverifikasi | Event > Tagihan |
| 5 | Materi dan produksi | Konten dan media lengkap | Event > Detail dan Media |
| 6 | Persetujuan | Versi disetujui klien | Event > Persetujuan |
| 7 | Pelunasan | Semua tagihan lunas | Event > Tagihan |
| 8 | Publish | Undangan terbuka, masa aktif berjalan | Event > Persetujuan > Publikasikan |
| 9 | Distribusi | Link pribadi terkirim ke tamu | Klien: Bagikan massal |
| 10 | Menjelang dan hari acara | RSVP terpantau, klien terbantu | Dashboard event |
| 11 | Selesai dan retensi | Order ditutup, data dihapus sesuai jadwal | Status event; penghapusan manual dulu |

## 1. Lead masuk

1. Buka Dashboard owner, bagian Inbox konsultasi. Lead baru berstatus **Baru**.
2. Balas lewat WhatsApp dalam jam dukungan. Ubah status menjadi **Dihubungi** dan tulis catatan singkat (kebutuhan, tanggal, jumlah undangan).
3. Tanyakan: tanggal acara, kota, perkiraan jumlah undangan (keluarga/penerima, bukan jumlah orang), tema yang diminati, paket.
4. Bila calon klien tidak cocok atau batal, ubah status menjadi **Batal** dengan alasan di catatan.

## 2. Penawaran (manual sampai F-05 ada)

Kirim penawaran tertulis lewat WhatsApp yang memuat:

- Paket dan cakupannya: kuota rekaman undangan, galeri, putaran revisi, masa aktif (lihat Kelola > Paket).
- Add-on yang diminta (mis. tema unik untuk Basic) dan harganya.
- Total harga, DP 50%, pelunasan sebelum publish.
- Kebijakan refund dan pindah jadwal (K5): batal sebelum produksi, DP kembali penuh; setelah produksi dimulai, 50% DP kembali; pindah tanggal gratis satu kali bila minimal 14 hari sebelum acara.
- Retensi (K6): data tamu dan media disimpan 3 bulan setelah masa aktif habis, bisa diperpanjang.
- Musik (K4): klien boleh mengirim musik sendiri dan menjamin izinnya.
- Tanggal target publish, dihitung sejak materi lengkap.
- Masa berlaku penawaran. Usulan model bisnis: 7 hari kalender (belum disahkan).

## 3. Jadikan klien

1. Di Inbox konsultasi, pilih lead lalu **Jadikan klien**. Isi email klien.
2. Aplikasi membuat akun klien, event draft, dan tagihan DP 50% + pelunasan dari harga paket.
3. Akses akun: saat ini password sementara tampil sekali. Kirim ke klien lewat WhatsApp dan minta klien menggantinya. Setelah S3 selesai: kirim **link aktivasi** (berlaku 72 jam); password sementara hanya cadangan.
4. Bila klien memilih add-on, tambahkan tagihan **Biaya tambahan** dengan catatan add-on.
5. Periksa data event: nama pasangan, tanggal, venue, paket, template. Ubah slug bila perlu sebelum link dibagikan.

## 4. DP

1. Kirim instruksi transfer (rekening di Kelola > Situs publik, bagian instruksi pembayaran).
2. Klien melaporkan pembayaran di dashboardnya. Status tagihan menjadi **Bukti dilaporkan**.
3. **Cek mutasi rekening sendiri.** Laporan klien bukan bukti lunas.
4. Bila dana masuk: Tagihan > **Tandai lunas**, isi metode, tanggal, dan referensi transfer.
5. Produksi dimulai setelah DP lunas.

## 5. Materi dan produksi

1. Minta materi lewat chat event: nama lengkap mempelai dan orang tua, jadwal akad/resepsi, alamat, love story, foto, musik, rekening hadiah (opsional).
2. Catat jam kerja per order di catatan pribadi selama pilot (dibutuhkan untuk menetapkan harga final).
3. Isi konten di Event > Detail. Unggah foto, video, dan musik di bagian Media. Batas galeri per paket (10/30/50 foto) dijaga manual sampai S1 selesai.
4. Klien mengisi daftar tamu: tambah satu per satu atau impor Excel. Kuota tamu mengikuti paket dan dijaga aplikasi.
5. Pratinjau undangan (tombol Preview Undangan) di HP dan desktop sebelum diajukan.

## 6. Persetujuan dan revisi

1. Ajukan versi di Event > Persetujuan. Klien menerima versi untuk disetujui.
2. Bila klien minta revisi, kerjakan catatannya lalu ajukan versi baru. Hitung putaran revisi manual sampai S2 selesai: Basic 2, Premium 3, Signature 5. Perbaikan kesalahan tim tidak dihitung.
3. Bila revisi melebihi kuota, sepakati biaya tambahan dulu sebelum dikerjakan.
4. Persetujuan via WhatsApp (klien tidak sempat login): pakai "Setujui atas nama klien" dan tulis bukti persetujuan (tanggal dan isi pesan klien). Tercatat di audit.
5. Mengubah isi setelah disetujui membatalkan persetujuan; versi baru harus diajukan lagi.

## 7. Pelunasan

Sama dengan langkah DP: klien melapor, owner mencocokkan mutasi, lalu tandai lunas. Undangan tidak bisa dipublikasikan sebelum lunas.

## 8. Publish

Checklist sebelum menekan **Publikasikan**:

- [ ] Versi terakhir disetujui klien (atau atas nama klien dengan bukti).
- [ ] Semua tagihan lunas.
- [ ] Nama, tanggal, jam, dan alamat diperiksa dua kali.
- [ ] Link maps benar.
- [ ] Musik dan foto diputar/tampil di HP.
- [ ] Rekening hadiah benar (bila ada).

Setelah publish, masa aktif berjalan otomatis sesuai paket (Basic 3 bulan). Pengecualian gerbang publish hanya untuk kondisi darurat dan wajib alasan tertulis.

## 9. Distribusi

1. Klien membagikan link pribadi dari dashboard (Bagikan massal membuka WhatsApp; pesan dikirim sendiri oleh klien). Aplikasi tidak mengirim WhatsApp otomatis.
2. Ingatkan klien: link umum tanpa `?g=` tidak bisa dipakai untuk RSVP. Gunakan link pribadi per tamu.

## 10. Menjelang dan hari acara

- **H-7:** cek RSVP masuk, sarankan klien mengingatkan tamu yang belum menjawab.
- **H-1:** cek undangan masih terbuka dan data acara benar. Ekspor CSV tamu untuk klien.
- **Hari acara (Basic):** tidak ada layanan venue. Owner siaga di jam dukungan untuk pertanyaan klien.
- QR check-in hanya untuk Premium ke atas (belum dijual).

## 11. Selesai dan retensi

1. Setelah acara, ubah status event menjadi **Selesai**. Undangan tetap terbuka sampai masa aktif habis.
2. Minta testimoni dan izin memakai undangan sebagai portofolio. Tanpa izin tertulis, jangan dipakai.
3. Setelah masa aktif habis, tamu melihat "Undangan Berakhir". Data tamu dan media disimpan **3 bulan** (K6).
4. Dua minggu sebelum 3 bulan berakhir, kabari klien: ekspor data atau beli perpanjangan.
5. Setelah 3 bulan: hapus tamu, ucapan, dan media event itu (manual sampai S5 selesai). Tagihan dan riwayat audit tetap disimpan.

## Pengecualian

### Pembatalan dan refund (K5)

1. Catat permintaan batal di chat event (tanggal dan alasan).
2. Tentukan apakah produksi sudah dimulai: sudah ada versi yang diajukan, atau owner sudah mulai mengerjakan konten.
3. Sebelum produksi: kembalikan DP penuh. Setelah produksi: kembalikan 50% DP.
4. Transfer refund, lalu catat di tagihan (sampai S6 selesai: tulis di catatan tagihan dan ubah status event menjadi Selesai/arsip).
5. Unpublish bila undangan sudah terbuka.

### Pindah tanggal acara (K5)

1. Gratis satu kali bila diberi tahu minimal 14 hari sebelum tanggal lama.
2. Ubah tanggal di Event > Detail. Periksa masa aktif masih mencakup tanggal baru; perpanjang bila perlu.
3. Pindah kedua kali atau kurang dari 14 hari: sepakati biaya dulu.

### Salah informasi pada undangan yang sudah terbit

1. Perbaiki konten. Persetujuan lama otomatis gugur.
2. Untuk kesalahan kecil yang mendesak (salah jam, salah alamat): perbaiki, ajukan versi baru, minta persetujuan cepat via chat atau setujui atas nama klien dengan bukti.
3. Bila berbahaya dibiarkan (alamat salah total), batalkan publikasi sementara sampai versi benar disetujui.

### Akun klien bermasalah

- Klien lupa password: Kelola > Akun > Reset password (setelah S3: kirim link aktivasi baru).
- Klien tidak boleh lagi mengakses (sengketa, salah orang): **Nonaktifkan akun**. Data event tidak terhapus.
- Hapus akun hanya bila event klien sudah dihapus; aplikasi menolak bila masih ada event.

### Gangguan server

1. Cek `/api/health`. Bila 503, lihat [DEPLOY.md](DEPLOY.md) §7 (rollback dan pemulihan).
2. Kabari klien yang undangannya sedang aktif bila gangguan lebih dari satu jam.

## Rutin owner

| Kapan | Tugas |
| --- | --- |
| Setiap hari kerja | Cek inbox lead, laporan pembayaran, chat belum dibaca |
| Setiap minggu | Cek event yang akan berakhir dan yang mendekati batas retensi |
| Setiap bulan | Uji pemulihan cadangan, rekap jam kerja dan pendapatan per order |
| Sebelum setiap update aplikasi | Backup, lalu ikuti [DEPLOY.md](DEPLOY.md) §6 |
