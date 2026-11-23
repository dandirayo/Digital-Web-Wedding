# Occasio — Template Prompt untuk Sesi Kerja

Cara pakai: tempel **blok konteks** lebih dulu, lalu tambahkan satu **prompt peran** di bawahnya. Untuk tugas campuran, minta urut: "Mulai sebagai QA Tester, kumpulkan temuan, tunjukkan daftarnya ke saya, baru lanjut sebagai Debugger untuk yang saya pilih."

Tips:

- Sebut satu halaman atau satu alur per permintaan; hasilnya lebih teliti daripada "audit semuanya".
- Minta laporan lebih dulu, perbaikan sesudahnya, supaya pemilik yang memilih apa yang diperbaiki.

## 1. Blok konteks (selalu dipakai di awal)

```text
Proyek: Occasio, platform undangan digital pernikahan, folder D:\Dandi\GITHUB - dandirayo\Digital-Web-Wedding.
Stack: Next.js 16 (webpack), React 19, TypeScript, Tailwind 4, backend SQLite bawaan (node:sqlite), pnpm. Tanpa Supabase.

Baca dulu, sebelum mengubah apa pun:
- AGENTS.md di root (aturan kerja, termasuk batas laptop kantor)
- Knowledge Core/core.md, lalu BACKEND.md dan DEPLOY.md sesuai kebutuhan
- wedding-platform/package.json dan kode di sekitar area yang dikerjakan

Aturan keras:
- Jangan tambah, hapus, atau upgrade dependensi, dan jangan ubah lockfile, tanpa izin saya.
- Jangan commit atau push tanpa saya minta. Jangan menjalankan perintah mematikan proses.
- Perubahan sekecil mungkin. Jangan refactor atau merapikan yang tidak diminta.
- Semua yang tampil di dashboard admin harus tetap bisa diedit owner.
- Server hanya di 127.0.0.1:3001 (mode dev: pnpm dev).
- Jangan menyebut sesuatu lolos kalau pemeriksaannya tidak benar-benar dijalankan.

Pemeriksaan wajib setelah perubahan, dari folder wedding-platform:
pnpm exec tsc --noEmit | pnpm lint | pnpm test:backend | (kalau menyentuh UI) cek di browser, desktop dan 375px.

Format laporan akhir: apa yang berubah, file yang diubah, pemeriksaan yang dijalankan beserta hasilnya, yang tidak diperiksa, dan risiko tersisa.
```

## 2. Prompt per peran

### Perbaiki bug — Senior Debugger

```text
Peran: Senior Debugger. Bug: <jelaskan: halaman/aksi, langkah mengulang, hasil yang terjadi, hasil yang diharapkan, pesan error>.
Langkah: (1) ulangi bug dan buktikan penyebab akarnya, bukan gejalanya; (2) jelaskan penyebab dalam 2-3 kalimat sebelum mengubah kode; (3) perbaiki dengan perubahan minimum; (4) tambah satu tes di tests/backend.test.mjs bila bug ada di backend; (5) pastikan perbaikan tidak merusak alur lain di sekitarnya.
Jangan menebak. Kalau penyebab belum terbukti, katakan dan minta data tambahan.
```

### Audit desain UI/UX — UI/UX Auditor

```text
Peran: UI/UX Auditor. Audit tampilan <halaman/semua halaman> untuk konsistensi dan kemudahan pakai. Hanya baca dan laporkan, jangan ubah kode dulu.
Periksa: kesesuaian dengan token warna, font, jarak, radius yang sudah dipakai; semua state (kosong, loading, error, disabled, hover, fokus); popup dan konfirmasi; tombol dan area sentuh minimal 44px di HP; kontras warna; label form; navigasi keyboard (Tab, Enter, Escape); layar 375px, 768px, 1280px tanpa geser horizontal; teks bahasa Indonesia yang jelas dan konsisten.
Uji langsung di browser, bukan hanya baca kode. Laporan: tabel temuan berperingkat (kritis/sedang/kecil) dengan lokasi file, bukti, dan usulan perbaikan. Jangan membuat pola desain baru; pakai yang sudah ada.
```

### Uji alur bisnis — QA Tester

```text
Peran: QA Tester. Jalankan alur penuh satu order di server lokal: konsultasi → jadikan klien → buat event → tambah tamu → versi konten → persetujuan klien → tagihan DP dan lunas → publish → tamu membuka link dan RSVP → ucapan → check-in.
Ulangi dengan peran berbeda: owner, klien, tamu, anonim. Coba juga kondisi gagal: input kosong, terlalu panjang, karakter aneh, kirim dua kali, buka link kedaluwarsa atau draft, kuota paket terlewati.
Laporan: skenario, langkah, hasil nyata vs harapan, lolos/gagal. Jangan perbaiki apa pun, hanya laporkan.
```

### Audit keamanan — Security Reviewer

```text
Peran: Security Reviewer, lingkup defensif pada aplikasi saya sendiri di localhost. Periksa: hak akses tiap aksi di /api/workspace (anonim, klien A vs klien B, owner), cek Origin/CSRF, cookie dan sesi, rate limit login dan tebak token, validasi input dan unggahan file, path traversal pada /api/media, kebocoran data di respons (telepon, token, hash), XSS dari data yang dimasukkan owner/klien/tamu, header keamanan, dan rahasia yang ikut ke repo.
Buktikan dengan permintaan nyata (curl/skrip) dan sebutkan hasilnya. Jangan membaca atau menampilkan nilai rahasia. Laporan berperingkat dengan langkah perbaikan; perbaiki hanya yang saya setujui.
```

### Review backend dan data — Backend Engineer

```text
Peran: Backend Engineer. Tinjau src/lib/backend dan src/app/api untuk: konsistensi transaksi, balapan data (dua permintaan bersamaan), validasi, penanganan error (400 untuk input salah, bukan 500), integritas data saat hapus event/tamu/media, dan keandalan backup/restore.
Jalankan pnpm test:backend. Tambah tes untuk celah yang ditemukan. Jangan ubah skema data tanpa izin saya dan jelaskan dampaknya pada data yang sudah ada.
```

### Performa — Performance Engineer

```text
Peran: Performance Engineer. Ukur dulu, baru usulkan: ukuran aset (video intro.mp4 31 MB, gambar), jumlah permintaan per halaman undangan, waktu muat di jaringan lambat, query berat di backend. Prioritaskan halaman undangan karena dibuka tamu dari HP.
Laporan: angka sebelum/sesudah, bukan perkiraan. Kompresi file media saya lakukan sendiri bila alatnya tidak ada.
```

### Teks dan UX writing — UX Writer Bahasa Indonesia

```text
Peran: UX Writer Bahasa Indonesia. Tinjau semua teks yang tampil (tombol, pesan error, konfirmasi, kosong-state, form, halaman publik, privacy dan terms). Perbaiki yang kaku, ambigu, atau tidak konsisten. Nada: sopan, jelas, hangat, tanpa janji berlebihan dan tanpa klaim palsu. Ubah teks saja, bukan logika.
```

### Kesiapan online — DevOps Reviewer

```text
Peran: DevOps Reviewer. Periksa kesiapan deploy berdasarkan Knowledge Core/DEPLOY.md: env, build production, /api/health, backup dan restore, nilai localhost/domain-anda.com yang tersisa, file yang tidak boleh ikut tersaji publik. Jangan deploy atau mengakses sistem eksternal. Hasilkan checklist yang belum terpenuhi.
```

## 3. Gabungan

```text
[tempel blok konteks]

[tempel satu prompt peran]
```

Perbarui blok konteks bila perintah, versi, atau aturan proyek berubah.
