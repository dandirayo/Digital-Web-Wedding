---
title: Spesifikasi teknis P1 (siap pilot)
tags:
  - occasio
  - spesifikasi
status: rancangan, belum dikerjakan
updated: 2026-11-27
---

# Spesifikasi teknis P1: celah yang ditutup sebelum pilot

Dokumen ini merinci cara mengerjakan celah P1 dari [PRD-occasio.md](PRD-occasio.md) §11 dan keputusan §14. Semua butir **belum dikerjakan**. Setiap butir memakai pola yang sudah ada di kode: aksi baru di `src/app/api/workspace/route.ts`, logika di `src/lib/backend/*.mjs`, fungsi klien di `src/lib/store/index.ts`, dan tes di `tests/backend.test.mjs`. Tanpa dependensi baru.

Urutan pengerjaan yang disarankan: S3 (aktivasi akun) → S1 → S2 → S4 → S6 → S5 → S7 → S8. S3 dan S6 menyentuh uang dan akses, jadi dikerjakan dan diuji lebih dulu.

## S1. Kuota galeri per paket

**Keputusan acuan:** model bisnis §4 (Basic 10 foto, Premium 30, Signature 50).

- **Data:** tambah field `maxPhotos` pada record `packages` (seed: 10/30/50). Bisa diubah owner di Kelola > Paket (tambah field di `GroupForm` paket).
- **Aturan:** saat `addMedia` dengan `type: "photo"` dan `category: "gallery"`, hitung foto galeri event itu. Bila sudah sama dengan `maxPhotos`, tolak 409: "Kuota galeri paket {nama} adalah {n} foto." Foto sampul, mempelai, peta, dan video tidak dihitung.
- **Tampilan:** di Media Manager tampil "Galeri: x dari n foto". Tombol unggah galeri nonaktif saat penuh.
- **Kompatibilitas:** event lama yang sudah melebihi kuota tidak dihapus; hanya penambahan baru yang ditolak.
- **Tes:** tambah foto sampai batas lolos, foto berikutnya 409, foto kategori lain tetap boleh.

## S2. Hitungan putaran revisi

**Keputusan acuan:** model bisnis §4 (2/3/5 putaran; perbaikan kesalahan tim tidak dihitung).

- **Aturan:** satu putaran = satu versi dengan keputusan `changes_requested` dari klien. Hitung dari record `versions` per event.
- **Batas lunak:** melewati `maxRevisions` **tidak memblokir**. Panel persetujuan menampilkan peringatan "Revisi ke-{n}, di luar kuota paket ({max}). Tambahkan tagihan add-on bila disepakati." dan aksi tercatat di audit `revision_over_quota`.
- **Pengecualian kesalahan tim:** owner dapat menandai satu permintaan revisi sebagai "kesalahan tim" (field `teamError: true` pada versi), sehingga tidak dihitung.
- **Tampilan:** panel persetujuan owner dan klien menampilkan "Revisi terpakai: x dari n".
- **Tes:** hitungan naik per `changes_requested`, tidak naik untuk `teamError`, peringatan muncul saat melewati batas.

## S3. Link aktivasi akun klien (K8)

**Keputusan acuan:** K8, link aktivasi sebagai cara utama dan reset password sebagai cadangan.

- **Data:** record `activations` `{ id, userId, tokenHash, expiresAt, usedAt }`. Token acak 32 byte, yang disimpan hanya hash SHA-256 (pola sama dengan sesi). Masa berlaku 72 jam.
- **Alur owner:** `convertLead` dan `createClient` membuat akun dengan password acak yang tidak ditampilkan, lalu mengembalikan `activationUrl` = `{origin}/aktivasi?t={token}`. Owner menyalin link atau membuka pesan WhatsApp berisi link. Tombol "Buat link aktivasi baru" di Kelola > Akun membatalkan link lama.
- **Halaman `/aktivasi`:** publik, form password baru + ulangi password (min. 12 karakter). Kirim ke aksi `activateAccount(token, password)`.
- **Aturan server:** token harus ada, belum dipakai, belum kedaluwarsa, akun tidak nonaktif. Berhasil: set password, tandai `usedAt`, hapus sesi lama, langsung login (set cookie). Gagal: pesan umum "Link aktivasi tidak berlaku. Minta link baru ke Occasio." Batasi percobaan per IP/token memakai tabel `attempts` (pola `rsvp-bad`).
- **Cadangan:** tombol "Reset password" yang sudah ada tetap dipakai bila klien kesulitan.
- **Tes:** token valid sekali pakai, token kedua kali ditolak, kedaluwarsa ditolak, akun nonaktif ditolak, password pendek ditolak, token tidak pernah tersimpan mentah.

## S4. Tema standar untuk Basic dan add-on tema unik (K3)

**Keputusan acuan:** K3.

- **Data:**
  - `packages.templateCategories`: Basic `["standard"]`, Premium dan Signature `["standard", "unique"]`. Dapat diubah owner.
  - `events.addons`: daftar string, mis. `["unique_theme"]`. Diubah owner saja.
- **Aturan:** `createEvent`, `updateEvent` (ganti template), dan wizard hanya menerima template yang kategorinya ada di `templateCategories` paket, **atau** event punya add-on `unique_theme`. Pesan tolak: "Tema ini tersedia mulai Premium atau sebagai add-on."
- **Tagihan add-on:** saat owner mengaktifkan add-on, buat tagihan jenis `tambahan` dengan catatan "Add-on tema unik". Nominal diisi owner karena harga belum ditetapkan (keputusan terbuka).
- **Tampilan:** wizard dan pemilih template menandai tema unik dengan label "Add-on" untuk paket Basic.
- **Tes:** Basic + tema unik tanpa add-on ditolak, dengan add-on diterima, Premium diterima.

## S5. Retensi 3 bulan dan perpanjangan (K6)

**Keputusan acuan:** K6, data tamu dan media disimpan 3 bulan setelah masa aktif habis, bisa diperpanjang.

- **Data:** `events.retainUntil` dihitung `expiresAt + 3 bulan` saat publish (dan saat `expiresAt` diubah). Perpanjangan menggeser `retainUntil`.
- **Selama retensi:** tamu melihat "Undangan Berakhir"; owner dan klien tetap bisa membuka dashboard event dan mengekspor CSV tamu.
- **Penghapusan:** skrip `scripts/purge-expired.mjs` (dijalankan cron harian, pola `backup.mjs`) menghapus tamu, ucapan, media beserta filenya, dan galeri untuk event yang `retainUntil` sudah lewat. Event, tagihan, versi (tanpa isi media), dan audit tetap disimpan untuk pembukuan. Skrip punya mode `--dry-run` yang hanya menampilkan daftar.
- **Peringatan:** dashboard owner menampilkan event yang akan dihapus dalam 14 hari. Owner memberi tahu klien lewat chat/WhatsApp (belum ada email otomatis).
- **Perpanjangan:** aksi owner `extendRetention(eventId, months)` + tagihan `tambahan` "Perpanjangan penyimpanan". Harga belum ditetapkan.
- **Tes:** `retainUntil` terhitung saat publish, purge menghapus data yang benar dan tidak menyentuh event lain, dry-run tidak menghapus apa pun.

## S6. Refund sebagian (K5)

**Keputusan acuan:** K5.

- **Aturan bisnis:** batal sebelum produksi dimulai: DP kembali penuh. Setelah produksi dimulai: 50% DP kembali. Pindah tanggal gratis 1 kali bila diberi tahu minimal 14 hari sebelum acara.
- **Definisi "produksi dimulai":** ada versi konten pertama yang diajukan, atau owner menandai order "produksi dimulai" (tercatat di audit). Aplikasi menyarankan nominal refund dari aturan ini; owner tetap yang memutuskan.
- **Data tagihan:** operasi baru `updateInvoice(id, { op: "refund", amount, note })` pada tagihan berstatus lunas. Field `refundedAmount`, `refundedAt`, `refundNote`. Status `paid` tetap, ditambah penanda `refunded` (penuh) atau `partially_refunded`.
- **Ringkasan pembayaran:** `paymentSummary` menghitung `paid` dikurangi refund. Gerbang publish tidak boleh lolos dari tagihan yang sudah direfund penuh.
- **Pindah jadwal:** `updateEvent` tanggal acara oleh owner. Hitungan "sudah pindah jadwal" disimpan di `events.rescheduleCount`; pindah kedua memunculkan peringatan "di luar kebijakan, sepakati biaya".
- **Tes:** refund lebih besar dari jumlah dibayar ditolak, refund penuh membuat gerbang publish tertutup, saran nominal sesuai aturan.

## S7. Syarat layanan dan kebijakan privasi

- **`terms.html`:** tambahkan isi K5 (refund dan pindah jadwal), K4 (klien menjamin izin musik dan foto yang dikirim), kuota paket (rekaman undangan, galeri, revisi, masa aktif), dan bahwa pengiriman WhatsApp dilakukan sendiri oleh klien.
- **`privacy.html`:** data yang dikumpulkan (nama, WhatsApp, daftar tamu, ucapan, media), tujuan, siapa yang bisa melihat, retensi 3 bulan setelah masa aktif (K6), cara meminta hapus lebih cepat, dan kontak.
- **Syarat:** isi akhir disetujui pemilik. Ini dokumen hukum ringan; bila ragu, minta pendapat profesional.

## S8. Konfigurasi domain dan mode etalase

- **Sudah dikerjakan (27 November 2026):** mode etalase website publik untuk GitHub Pages (lihat [DEPLOY.md](DEPLOY.md) §0) dan `_config.yml` yang mencegah folder aplikasi dan dokumen internal ikut tersaji.
- **Saat domain dibeli:** ganti `domain-anda.com` di `robots.txt`, `sitemap.xml`, `index.html`, `privacy.html`, `terms.html`, dan `assets/js/config.js` (`baseUrl`). Isi `managementBaseUrl` dan `demoWeddingUrl` dengan alamat `app.` saat server online; mode etalase otomatis mati ketika server menjawab.
- **Nomor WhatsApp:** isi lewat Kelola > Situs publik (dibaca dari server) dan juga `whatsappNumber` di `assets/js/config.js` agar mode etalase di GitHub Pages dapat membuka WhatsApp.

## Definisi selesai untuk setiap butir

1. Kode mengikuti pola yang ada, tanpa dependensi baru.
2. Tes backend untuk aturan baru lulus, bersama tes lama.
3. `tsc`, `eslint` (0 error), dan build production lulus.
4. Skrip QA di `tests/api/` tetap lulus (diperbarui bila perilaku sengaja berubah).
5. Dicek di browser desktop dan lebar 375 px.
6. `BACKEND.md`, PRD §7 (kolom status), dan [roadmap-dan-keputusan.md](roadmap-dan-keputusan.md) diperbarui.
