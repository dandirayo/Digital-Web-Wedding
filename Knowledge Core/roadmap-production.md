# Occasio — Roadmap Development sampai Siap Operasional

Versi: baseline pelaksanaan 1.0 · 8 September 2026

Dokumen ini merevisi `roadmap-production.md` dari pemilik. Acuan komersial: [business-model-occasio.md](business-model-occasio.md). Seluruh pekerjaan di bawah merupakan rencana, kecuali temuan kondisi kode yang dinyatakan eksplisit.

**Batas kerja:** belum ada auto-deploy, pembelian infrastruktur, perubahan akun cloud, atau publikasi situs yang diizinkan melalui dokumen ini. Development dilaksanakan setelah scope disahkan. Deployment ke lingkungan online, termasuk staging, memerlukan persetujuan pemilik. CI boleh memeriksa kode tanpa melakukan deployment.

## 1. Sasaran dan definisi selesai

Sasaran: Occasio dapat menerima pesanan wedding digital, memproduksi undangan sesuai kontrak, melayani klien dan tamu, mencatat pembayaran, serta menyelesaikan layanan tanpa bergantung pada browser developer.

Fitur dianggap selesai apabila:

- Terhubung ke data persisten yang benar, memiliki validasi dan hak akses sesuai pengguna.
- Menangani data kosong, gagal simpan, koneksi terputus, dan pengiriman ulang sesuai risikonya.
- Telah diuji memakai skenario bisnis serta identitas pengguna yang berbeda.
- Hasil pengujian dan batas fitur dicatat, lalu dapat ditinjau pemilik.

Build, lint, TypeScript, dan HTTP 200 tetap berguna sebagai pemeriksaan dasar. Pemeriksaan tersebut tidak membuktikan pembayaran, privasi klien, chat lintas perangkat, atau publish berjalan benar.

## 2. Kondisi awal yang ditemukan

Temuan berikut berasal dari pembacaan kode pada 8 September 2026, bukan pengujian runtime lengkap. Kesehatan server, DNS cloud, dan Docker tidak diperiksa ulang untuk revisi dokumen ini.

| Bagian | Bukti/keadaan saat ini | Dampak pada kesiapan bisnis |
| --- | --- | --- |
| Alamat lokal | Publik 4174; management 3001; root management menuju login | Referensi 3000 pada roadmap lama perlu dikoreksi |
| Penyimpanan | Store memakai localStorage | Data hanya tersedia pada origin/browser terkait |
| Login | Fungsi login mengabaikan parameter password dan mencari email lokal | Login demo, belum autentikasi produksi |
| Chat | Thread dan identitas contoh mengarah ke `evt-1`; label Online statis | Belum chat privat multi-klien atau bukti kehadiran online |
| Review | Status berada di localStorage, ditulis approved sebelum callback publish selesai | Potensi disetujui meski penyimpanan publish gagal |
| Persetujuan | Belum ada persetujuan final klien atas versi tertentu | Perlu memisahkan pemeriksaan tim dan persetujuan klien |
| Undangan publik | `WeddingView` mengecek keberadaan data dan expiry, belum memeriksa `isPublished` | Draft yang memiliki data dapat dirender oleh jalur tersebut |
| Data tamu publik | View mengambil seluruh guests untuk mencocokkan nama | Perlu endpoint tamu terbatas dan token personal |
| Media | Pengunggah membuat object URL untuk file | Belum penyimpanan cloud permanen |
| Paket | Nama publik baru; ID lama; kuota/fasilitas seed berbeda dari dokumen | Perlu satu katalog paket berversi dan snapshot order |
| Order, task, invoice | Dashboard mencampur fungsi lokal dan data/tindakan contoh | Perlu audit aksi satu per satu, bukan dianggap sudah operasional |
| Konsultasi | Form intake lama masih ada; inbox pernah dihapus dari dashboard | Lead perlu dipetakan ke chat/CRM agar tidak kehilangan alur masuk |
| Backend | Integrasi cloud sebelumnya terhambat project URL/Docker | Verifikasi ulang saat tahap backend dimulai; jangan menyimpulkan masih rusak tanpa cek baru |

Referensi kode: [store](../wedding-platform/src/lib/store/index.ts), [chat](../wedding-platform/src/app/chat/page.tsx), [review](../wedding-platform/src/components/content-review.tsx), [undangan](../wedding-platform/src/app/wedding/[slug]/wedding-view.tsx), [media](../wedding-platform/src/components/media-uploader.tsx), [paket seed](../wedding-platform/src/lib/store/seed.ts).

## 3. Cara menjalankan roadmap

Urutan utama: **scope bisnis → audit → fondasi data dan akses → CRM/chat → order/pembayaran → produksi → approval/publish → tamu/RSVP → operasional paket → pengujian → izin online**.

Backend dikerjakan sejak awal agar fitur baru tidak dibangun berulang sebagai demo lokal. Memindahkan store bukan sekadar mengganti satu import: identitas, ID data, schema, relasi, akses server, media, error, query publik, dan transaksi perlu dipetakan serta diuji.

Setiap tahap menghasilkan artefak yang bisa diperiksa: daftar scope, rancangan layar, perubahan kode, hasil tes, atau SOP. Setelah disahkan, keputusan dicatat sebagai versi. Jika scope berubah, dampak biaya/waktu dan gerbang penerimaan diperbarui.

## 4. Tahap 0 — Pengesahan produk dan SOP

**Status: selesai — G0 lulus pada 8 September 2026.** Baseline yang disahkan: Occasio dengan paket Basic/Premium/Signature, rilis pertama Basic, chat sebagai kanal konsultasi, DP 50% dan lunas sebelum publish, serta deployment manual hanya setelah izin pemilik. Premium ditunda dari rilis pertama. Signature/venue tidak boleh dijual sampai biaya dan kapasitas operasionalnya disahkan. Harga saat ini merupakan baseline internal, bukan harga jual final.

**Masukan:** keputusan D01–D08 di dokumen model bisnis.

**Pekerjaan:** sahkan nama paket, kuota undangan/pax, revisi, masa aktif, biaya, add-on, persetujuan final, pembayaran, retensi, wilayah dan jam venue. Tentukan apakah rilis pertama Basic saja atau semua paket sekaligus.

**Hasil:** satu matriks produk, SOP dari konsultasi sampai selesai, daftar status bisnis, dan daftar keputusan terbuka.

**Gerbang G0:** tidak ada dua definisi berbeda untuk paket yang sama. Penawaran venue tidak disahkan sebelum biaya dan kapasitas personel jelas. Harga usulan belum menjadi harga final hanya karena sudah muncul di UI.

## 5. Tahap 1 — Audit aplikasi dan rancangan pengalaman pengguna

**Status: selesai — G1 lulus pada 8 September 2026.** Inventaris route, field/tindakan, data demo, matriks akses, wireflow Basic, koreksi label, dan hasil verifikasi dicatat di [audit-aplikasi-g1.md](audit-aplikasi-g1.md). Event baru kini draft/unpublished, route publik menolak draft, klaim lokal diberi label, dan paket di luar rilis Basic dikunci dari wizard. Kelulusan ini adalah persetujuan rancangan UI; fungsi persisten dan keamanan dikerjakan mulai G2.

**Pekerjaan:** inventaris seluruh route, tombol, field, dummy data, dan batas paket. Tandai: belum ada / demo lokal / terhubung / teruji. Susun dashboard sesuai pekerjaan, bukan promosi.

| Permukaan | Menu/alur sasaran |
| --- | --- |
| Website publik | Paket, katalog template nyata, contoh undangan, FAQ, mulai chat |
| Owner | Ringkasan aktual, inbox, lead/order, produksi, pembayaran, acara, laporan, pengaturan |
| Klien | Progres order, brief/konten, media, tamu, persetujuan, invoice, chat |
| Tamu | Undangan published, konfirmasi RSVP, ucapan, QR sesuai hak |
| Petugas | Pilih penugasan, check-in, cari tamu, tangani pengecualian |

**Hasil:** peta route, daftar tindakan yang harus disambungkan, serta prioritas perbaikan. Form konsultasi lama dipetakan sebagai brief dalam percakapan; migrasi data lama direncanakan sebelum alur diganti.

**Gerbang G1:** setiap menu memiliki tujuan dan kondisi akses; tidak ada Online, terkirim, lunas, atau published palsu. Dashboard tidak menjual paket melalui section company profile.

## 6. Tahap 2 — Database, identitas, dan akses

**Status: backend diganti pada 8 November 2026.** Gunakan Next.js + SQLite lokal. Login owner/client, session cookie server, event, konten, dan tamu memakai API lokal. Panduan aktif: [BACKEND.md](BACKEND.md). Bukti test provider lama tidak berlaku untuk backend baru. G2 belum lengkap sampai undangan akun/reset password, media persisten, dan seluruh pengujian lintas perangkat selesai.
