# Occasio Backend Lokal

Keputusan pemilik, 8 November 2026: backend dijalankan sendiri memakai Next.js dan SQLite. Tidak memerlukan layanan database eksternal, Docker, atau API key.

## Menjalankan

Gunakan Node.js 24.17.x atau versi 24 yang lebih baru. Node.js 24 menyediakan driver SQLite bawaan.

Dari folder `wedding-platform`:

```powershell
pnpm.cmd install --frozen-lockfile --ignore-scripts
pnpm.cmd dev
```

Alamat aplikasi: http://127.0.0.1:3001/login.
Website publik tetap terpisah pada port 4174.

Development pertama membuat database `data/occasio.sqlite` dan dua akun contoh:

| Peran | Email | Password development |
| --- | --- | --- |
| Owner | owner@occasio.local | OccasioOwner123! |
| Client | client@occasio.local | OccasioClient123! |

Tombol Pakai Owner / Pakai Client mengisi akun contoh. Tekan Masuk ke workspace sesudahnya.
Akun ini hanya untuk development lokal. Data contoh Sheila & Yoga dibuat sekali; refresh tidak menghapus perubahan.

## Penyimpanan dan akses

- Password disimpan sebagai hash scrypt dengan salt acak.
- Session berupa token acak; hanya hash token tersimpan di database. Cookie HttpOnly, SameSite=Lax, berlaku delapan jam; logout mencabut session.
- Percobaan password salah dibatasi per email.
- Route owner/client dan API memverifikasi session server. Klien hanya dapat mengelola event miliknya.
- API mutation memeriksa Origin terhadap Host.
- Event, konten, tamu, RSVP, ucapan, katalog, dan akun klien disimpan di SQLite. localStorage lama tidak dimigrasikan otomatis.
- Undangan hanya membaca event published yang belum expired. Tamu publik tidak menerima daftar tamu.
- Link tamu bersifat pribadi: `/wedding/<slug>?g=<token>`. Token (qrCode tamu) dicari di server; tamu publik hanya menerima nama, batas pax, dan status RSVP miliknya (tanpa telepon). `?to=Nama` hanya sapaan, bukan identitas. Tamu anonim tidak bisa menambah tamu; RSVP lewat aksi `rsvp` (idempoten, maksimal sesuai pax undangan, pengiriman ulang identik tidak mengubah data). Tebakan token salah dibatasi 30 per 15 menit per event.
- Kuota tamu mengikuti `maxGuests` paket event (tambah/impor di atasnya ditolak). Ucapan publik dibatasi 1000 per event dan ucapan identik ditolak. `customCss` ditolak bila memuat `@import`, `url()`, `expression()`, skrip/style, atau lebih dari 5000 karakter. Ekspor tamu: aksi `exportGuests` (CSV dengan link personal, aman dari formula injection).
- Tagihan, versi/persetujuan, publish, chat, dan audit sudah tersimpan di server (lihat bagian alur bisnis di core.md). Unggahan media di `data/uploads`.

## Cadangan dan pemulihan

```powershell
node scripts/backup.mjs              # snapshot database + unggahan ke backups/<waktu>/
node scripts/restore.mjs <folder> --yes   # hentikan server dulu; kondisi sekarang disimpan ke backups/pre-restore-<waktu>/
```

Folder `backups/` tidak di-commit. Simpan salinannya di perangkat lain secara berkala. Pemulihan sudah diuji pada salinan sementara (database dan unggahan kembali, salinan pengaman dibuat).

## SOP satu order

1. Lead masuk dari form → Kelola/Konsultasi: hubungi, ubah status, **Jadikan klien** (membuat akun + event draft + tagihan DP/pelunasan).
2. Kirim kredensial sementara ke klien; isi petunjuk pembayaran di Kelola → Situs publik.
3. Klien bayar DP → klien menekan "Saya sudah bayar" → owner **Tandai lunas**.
4. Owner mengisi konten, foto, dan musik → **Ajukan versi ke klien** → klien setujui (atau minta perubahan).
5. Tambah/impor tamu (kuota paket berlaku) → **Ekspor CSV** atau **Bagikan Banyak** untuk link pribadi.
6. Pelunasan terverifikasi → **Publikasikan undangan**. Masa berlaku terisi otomatis.
7. Pantau RSVP/ucapan/check-in; jalankan `backup` sebelum dan sesudah hari acara.

## Pemeriksaan

```powershell
pnpm.cmd test:backend
pnpm.cmd lint
pnpm.cmd exec tsc --noEmit --incremental false
pnpm.cmd build
```

Test backend menggunakan SQLite in-memory dan tidak mengubah data demo.
Test persistensi memakai file sementara terpisah dan menghapus file test setelah selesai.
Saat dev server aktif, jalankan `node tests/http-smoke.mjs` untuk smoke test API memakai akun contoh; greeting uji dikembalikan ke nilai semula.

## Persiapan VPS / mini server

Gunakan satu proses aplikasi Node.js 24 pada tahap awal dan penyimpanan disk lokal persisten.
SQLite ini ditujukan untuk satu server; jangan berbagi file database melalui network filesystem atau menjalankan beberapa replika dengan disk terpisah.

Saat instalasi production baru, tentukan `OCCASIO_OWNER_EMAIL` dan `OCCASIO_OWNER_PASSWORD` melalui environment server. Password minimal 12 karakter. Jangan commit nilai tersebut. Production pertama tidak membuat akun/password demo dan tidak memasukkan contoh event otomatis.
Gunakan database baru khusus production; jangan menyalin database development berisi akun contoh.

Jalankan `pnpm.cmd build` lalu `pnpm.cmd start`. Cookie production membutuhkan HTTPS. Reverse proxy harus mempertahankan Host publik; proses aplikasi tetap mendengarkan localhost. Konfigurasi domain/HTTPS dilakukan setelah target hosting dipilih.

Backup database dengan SQLite online backup atau hentikan aplikasi secara terencana sebelum menyalin file; pada WAL mode jangan menyalin file utama saja saat aplikasi menulis. Simpan backup di lokasi berbeda dan uji restore.
Upload media tersimpan di `data/uploads/<eventId>/` (atau folder `OCCASIO_UPLOAD_DIR`) dan harus dibackup bersama database; database hanya menyimpan alamat `/api/media/...`. Batas: foto 8 MB, video 60 MB, audio 15 MB, kuota 500 MB per event; jenis file ditentukan dari isi file (JPG, PNG, WebP, MP4, M4A, MP3). Menghapus media atau event ikut menghapus filenya.

Deployment dan pemakaian klien nyata menunggu penyelesaian approval/pembayaran/publish serta uji operasional.
