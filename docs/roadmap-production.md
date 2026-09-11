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

**Status: sedang berjalan sejak 8 September 2026.** Audit awal, draft baseline migration, seed katalog aman, test akses pgTAP, dan vertical slice Auth awal dicatat di [fondasi-data-g2.md](fondasi-data-g2.md). Proxy route/auth sudah diverifikasi melalui HTTP; eksekusi reset/test database masih menunggu Docker Desktop Linux engine aktif. Belum ada push migration atau perubahan cloud.

**Dependensi:** G0 dan G1. Ketersediaan project development atau runtime lokal diverifikasi pada awal tahap ini.

**Pekerjaan:**

- Inventaris schema dan migrasi yang ada. Pastikan instalasi kosong bisa membentuk schema lengkap; migrasi hardening saja belum tentu cukup. Periksa kesesuaian relasi/kolom dengan kode sebelum menjalankan perubahan.
- Pisahkan development, data uji, dan production. Jangan mengaktifkan akun/password demo pada production atau mengunggah seed yang menimpa data nyata.
- Rancang entitas: profil/peran, lead, percakapan/anggota/pesan, katalog paket/versi, penawaran, order/snapshot, invoice, pembayaran, event, penugasan tim, draft/versi konten, approval, tamu/RSVP/check-in, media, task, dan audit aktivitas.
- Definisikan pemetaan camelCase aplikasi ke kolom database, ID lama ke ID baru, serta validasi input dan error. Semua modul harus menggunakan sumber data yang sama.
- Login asli, set/reset password, undangan akun, logout dan kedaluwarsa session. Wewenang owner dikelola server; bukan input yang dapat diubah klien.
- Akses tiap tabel, file, dan kanal realtime mengikuti kepemilikan atau penugasan. Tamu hanya menerima data yang diperlukan; daftar tamu, chat, dan invoice tetap privat.
- Preview privat harus memiliki akses terotorisasi; media draft tidak boleh bocor melalui URL publik. Materi published disajikan menurut aturan publikasi yang terpisah.
- Pastikan error backend tidak diam-diam kembali ke data demo. Service-role/secret key hanya di server; tidak menjadi variabel publik frontend.

RLS perlu membatasi baris sesuai kepemilikan, bukan sekadar memeriksa bahwa pengguna sudah login. Rancangan akses wajib diuji menggunakan identitas klien yang berbeda. [Dokumentasi RLS Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)

**Gerbang G2:** password salah ditolak; logout dan session berakhir bekerja; klien A tidak dapat membaca/mengubah order, chat, tamu, atau file klien B meski ID/URL diketahui. Data dan media tetap benar dari browser lain. Instalasi migrasi pada database uji kosong berhasil.

## 7. Tahap 3 — Chat privat dan CRM calon klien

**Dependensi:** G2. Chat dipilih sebagai kanal utama konsultasi sesuai permintaan pemilik.

**Pekerjaan:** calon klien dapat memulai percakapan lewat akses tamu terbatas; owner melihat antrean inbox. Percakapan dapat berisi brief terstruktur, penawaran, dan tautan order tanpa membuat event contoh terlebih dahulu. Setelah akun klien dibuat, perpindahan kepemilikan percakapan harus diverifikasi, bukan hanya mencocokkan nama.

Pesan menyimpan identitas pengirim nyata, timestamp server, dan ID pengiriman untuk mencegah duplikasi saat retry. Tambahkan riwayat, pencarian percakapan, unread, status kirim/gagal, pemulihan koneksi, dan batas pengiriman. Status online/typing/baca hanya tampil jika datanya benar. Owner dapat menangani beberapa klien; klien hanya mengakses percakapan yang diikuti.

**Gerbang G3:** dua akun pada dua browser/perangkat dapat bertukar pesan; refresh memuat riwayat; retry tidak menggandakan pesan; pengguna lain tidak dapat membaca/berlangganan kanal privat. Lead dari chat dapat ditautkan ke order tanpa kehilangan konteks.

## 8. Tahap 4 — Penawaran, order, invoice, pembayaran

**Dependensi:** G2–G3 dan kebijakan D05.

**Pekerjaan:** owner membuat penawaran berversi berisi harga, scope dan deadline. Persetujuan klien dicatat. Terbitkan invoice bernomor unik; klien unggah bukti transfer dan owner memverifikasi jumlah, tanggal, serta referensi. Pembayaran manual adalah scope awal; gateway otomatis menjadi tahap terpisah bila diperlukan.

Order menyimpan snapshot paket dan add-on. Buat penugasan tim dan jadwal dari order yang telah dikonfirmasi. Catat DP, pelunasan, pembayaran parsial, penolakan bukti, pembatalan, dan pengembalian dengan riwayat; jangan hanya mengganti angka total dashboard. Verifikasi yang diklik ulang tidak membuat dua pembayaran atau dua event.

**Gerbang G4:** satu contoh transaksi lengkap dari penawaran sampai DP dan pelunasan konsisten di invoice, order, dan dashboard. Bukti transfer belum diverifikasi tidak dihitung lunas. Penggantian harga katalog tidak mengubah order yang sudah disepakati.

## 9. Tahap 5 — Onboarding dan produksi konten

**Dependensi:** G4 dan katalog template yang disahkan.

**Pekerjaan:** workspace menampilkan checklist data pasangan, orang tua, detail acara, lokasi, foto, musik, rekening opsional, dan target publish. Tanggal tersimpan sebagai nilai terstruktur dengan zona waktu, bukan hanya teks tampilan. Simpan draft, validasi data wajib, kelola task/deadline, dan preview tiap template yang dijual.

Media diunggah ke penyimpanan persisten dengan batas ukuran/jenis/kuota, progres dan error yang jelas. Pisahkan galeri biasa dari live gallery. Seluruh input editor dipetakan ke output template; kontrol paket diberlakukan pada server, bukan sekadar menyembunyikan tombol.

**Gerbang G5:** sebuah order kosong bisa diisi, disimpan, dibuka dari perangkat lain, dan dirender benar dalam template pilihannya. Percobaan memakai fitur paket lebih tinggi ditolak secara konsisten. Tidak ada field terlihat tersimpan tetapi tidak mengubah data.

## 10. Tahap 6 — Review, persetujuan klien, dan publish

**Dependensi:** G5 serta kebijakan pembayaran dan masa aktif.

**Pekerjaan:** kirim draft ke review internal; permintaan revisi wajib berisi catatan dan versi yang dimaksud. Setelah tim siap, klien menyetujui versi final. Owner melakukan publish melalui validasi server: identitas/peran, versi disetujui, data wajib, scope paket, dan pembayaran yang diperlukan.

Persetujuan versi dan perubahan publikasi disimpan secara konsisten. Kegagalan publish tidak menampilkan sukses palsu. Edit setelah publish menghasilkan versi draft baru; konten publik tetap versi sebelumnya sampai disetujui ulang. Tetapkan penarikan publikasi, masa aktif, perpanjangan, dan audit siapa melakukan apa.

**Gerbang G6:**

- Draft tidak terbuka dari URL tamu maupun URL media tanpa izin.
- Owner tidak dapat publish versi yang belum disetujui, termasuk bila UI dilewati.
- Konten disetujui dan versi yang ditampilkan publik sama.
- Uji gagal simpan/retry tidak menghasilkan status setengah jadi atau tanggal aktif berulang.
- Klien tidak dapat mengubah harga, pembayaran, atau status publish sendiri.

## 11. Tahap 7 — Tamu, distribusi, RSVP, dan laporan

**Dependensi:** G6.

**Pekerjaan:** impor dengan preview, laporan baris invalid/duplikat, koreksi, serta aturan kuota. Gunakan token personal yang tidak bergantung pada nama untuk identitas undangan; nama sama tidak boleh tertukar. Pisahkan jumlah rekaman undangan, pax diundang, pax konfirmasi, dan jumlah check-in.

RSVP dapat diperbarui sesuai aturan event; batasi pax, tangani submit ulang dan expiry. Ucapan melalui moderasi bila diaktifkan. Distribusi awal menyediakan copy link dan pembukaan WhatsApp manual. Bedakan status link disiapkan, WA dibuka, dan pengiriman yang dikonfirmasi; membuka WA bukan bukti delivery.

**Gerbang G7:** token invalid/expired ditangani; penerima bernama sama tetap terpisah; RSVP tidak menggandakan hitungan; publik tidak dapat mengambil seluruh daftar tamu; laporan cocok dengan data sumber. Basic baru layak mengikuti uji penerimaan setelah G0–G7 dan pengujian lintas modul.

## 12. Tahap 8 — QR dan layanan hari H

**Dependensi:** G7 untuk fitur Premium; keputusan D02 dan kesiapan venue untuk Signature.

**Pekerjaan:** QR unik, validasi event dan pax, pemeriksaan scan ganda secara atomik, pencarian manual, audit override, dan hak akses petugas yang dibatasi tanggal/event. Siapkan daftar perangkat, jadwal kru, test koneksi, daya cadangan, kontak PIC, transportasi, serta prosedur gangguan.

Fallback awal saat offline dapat berupa daftar cadangan terkontrol dan pencatatan manual yang direkonsiliasi. Jangan menyebut check-in offline otomatis sebelum penyimpanan lokal, antrean sinkronisasi, dan konflik lintas perangkat benar-benar diimplementasikan.

**Gerbang G8:** QR yang sama dipindai bersamaan dari dua perangkat hanya mencatat satu penerimaan yang sah; QR event lain ditolak; perangkat putus koneksi punya prosedur operasional yang diuji. Kapasitas antrean diuji terhadap kebutuhan venue, bukan hanya jumlah total tamu.

Premium memerlukan uji fitur check-in; Signature juga memerlukan simulasi petugas/perangkat/venue dan biaya yang disahkan. Kelulusan Basic tidak otomatis meluluskan keduanya.

## 13. Tahap 9 — Add-on media dan venue lanjutan

**Dependensi:** G8, permintaan bisnis, scope dan biaya add-on yang disahkan.

**Pekerjaan:** live gallery dengan penugasan pengunggah, upload ulang yang aman, moderasi, kuota, akses tamu, kompresi, serta penghapusan. Tambahkan photo booth digital dengan izin kamera dan perangkat kompatibel, frame, serta slideshow bila dibutuhkan. Tentukan pemilik perangkat layar, kamera, printer, dan sumber foto secara eksplisit.

Kiosk berarti penguncian perangkat sesuai kemampuan OS/perangkat yang dipilih; tampilan fullscreen aplikasi saja tidak membuktikan tablet terkunci. Lakukan pengujian fisik sebelum menjanjikan fasilitas tersebut.

**Gerbang G9:** seluruh add-on yang dijual diuji pada perangkat sasaran dan kondisi koneksi buruk. Upload besar, foto ganda, media ditolak, dan kuota penuh ditangani. Tahap ini dapat ditunda bila add-on tidak termasuk scope rilis pertama.

## 14. Tahap 10 — Penutupan, arsip, dan retensi

**Dependensi:** G4–G7 dan keputusan D06; G8–G9 untuk layanan yang menggunakannya.

**Pekerjaan:** laporan akhir, ekspor, rekonsiliasi pembayaran/add-on, penutupan task, status order selesai, expiry undangan, pemberitahuan perpanjangan, periode ekspor, penghapusan sesuai kebijakan, serta izin testimoni/portofolio.

**Gerbang G10:** order selesai tidak langsung mematikan undangan yang masih berhak aktif; undangan expired tidak tetap publik selamanya. Ekspor dapat dipakai klien, akses arsip sesuai kebijakan, dan penghapusan tidak merusak catatan yang masih wajib dipertahankan menurut kebijakan final.

## 15. Tahap 11 — Pengujian menyeluruh sebelum online

**Dependensi:** semua tahap yang termasuk paket rilis sudah lulus; G10 termasuk dalam semua rilis.

| Skenario | Bukti penerimaan yang diperlukan |
| --- | --- |
| Basic lengkap | Chat → penawaran → DP → onboarding → produksi → persetujuan → pelunasan → publish → RSVP → laporan → expiry |
| Multi-klien | Klien A/B dipisah pada order, chat, media, tamu, dan realtime |
| Hak tim | Petugas venue tidak dapat melihat invoice; tim hanya event yang ditugaskan |
| Publish gagal | Tidak ada sukses palsu atau konten versi salah |
| Retry/transaksi | Pembayaran, pesan, RSVP, dan check-in tidak terduplikasi |
| Gangguan koneksi | Pengguna tahu data yang belum tersimpan; pemulihan tidak menghilangkan perubahan diam-diam |
| Media | Refresh/perangkat lain tetap bisa memuat file; file privat tetap privat |
| Perangkat/browser | Alur penting di HP, tablet, desktop dan browser sasaran |
| Beban | Uji kapasitas berdasarkan jumlah undangan dan puncak kunjungan/check-in paket yang dijual |
| Backup/pemulihan | Cadangan database dan media tersedia; restore diuji pada lingkungan uji |
| Operasional | Owner menjalankan satu order lengkap dengan panduan tanpa bantuan developer |

Tidak perlu membuat test yang hanya meniru implementasi. Prioritaskan transaksi, akses lintas klien, publish, dan konflik data. Catat perangkat, tanggal, versi kode, hasil, serta masalah yang belum selesai. Audit performa membantu, tetapi skor Lighthouse tunggal bukan bukti siap melayani bisnis.

**Gerbang G11:** tidak ada bug yang menghalangi transaksi utama, membocorkan data klien, menghilangkan data, atau merusak publikasi. Masalah nonkritis memiliki batas dan rencana perbaikan yang disetujui.

## 16. Tahap 12 — Izin online, pilot, dan peluncuran manual

**Dependensi:** G11 dan keputusan infrastruktur D09. Tidak dijalankan otomatis.

Sebelum meminta izin deployment, siapkan hasil yang konkret: versi rilis, paket yang aktif, laporan tes, daftar keterbatasan, konfigurasi yang diperlukan, estimasi biaya dari harga penyedia saat itu, rencana migrasi/cadangan, serta langkah rollback.

Usulan susunan: domain utama untuk penjualan dan undangan `/wedding/[slug]`, subdomain `app` untuk management langsung login. Subdomain pasangan dan wildcard bukan prasyarat rilis pertama. Penyedia hosting, kapasitas VPS, domain, runtime yang masih didukung, dan budget dipilih berdasarkan aplikasi yang diuji, bukan asumsi satu CPU/1 GB pasti cukup.

Jika wildcard HTTPS dipilih, diperlukan metode validasi yang mendukung wildcard seperti DNS-01; perintah `certbot --nginx` dengan validasi HTTP biasa tidak cukup untuk wildcard. [Dokumentasi challenge Let's Encrypt](https://letsencrypt.org/docs/challenge-types/)

Urutan setelah izin pemilik:

1. Jalankan deployment manual ke lingkungan online terbatas sesuai scope izin, dengan data uji dan akses terkontrol.
2. Verifikasi konfigurasi, HTTPS, login, data, media, dan pemulihan. Pastikan seed serta akses demo tidak aktif di production.
3. Pilot beberapa event terbatas sesuai paket yang lulus. Gunakan SOP, catat waktu kerja nyata, biaya, revisi, dan kendala; aktivitas dengan klien nyata menunggu izin dan kesiapan pemilik.
4. Setelah evaluasi pilot dan persetujuan pemilik, buka penjualan publik untuk paket yang siap.

CI: lint, tipe, build, dan tes boleh otomatis. CD/auto-deploy tetap nonaktif. Push GitHub tidak memicu perubahan situs online. Perubahan ini hanya boleh dilakukan jika pemilik memberi instruksi baru yang jelas.

**Gerbang G12:** pemilik menyetujui rilis dan biayanya; pilot menunjukkan SOP dapat dijalankan; rollback tersedia. Online bukan akhir development—monitoring dan pemeliharaan menjadi tugas operasional.

## 17. Prioritas backlog dan urutan review

| Prioritas | Pekerjaan | Alasan |
| --- | --- | --- |
| P0 | Login asli, isolasi klien, sumber data persisten, media privat | Dasar seluruh fungsi bisnis |
| P0 | Katalog paket konsisten, snapshot order, pembayaran manual terverifikasi | Mencegah scope/harga pesanan berubah dan status uang salah |
| P0 | Chat per percakapan, lead ke order, edit konten nyata | Menyambungkan alur pelanggan dan produksi |
| P0 | Versi konten, approval klien, publish server, draft tidak publik | Mencegah undangan salah versi atau belum disetujui tersebar |
| P0 | Tamu, RSVP, ekspor, expiry, backup/restore | Menyelesaikan layanan digital inti |
| P1 | QR serentak, penugasan petugas, SOP venue | Wajib sebelum Premium/Signature dijual sesuai scope |
| P2 | Live gallery, photo booth, slideshow, wildcard, gateway | Dibuka setelah scope dan kebutuhan terkonfirmasi |
| Ditunda | White-label, AI, event nonwedding | Di luar fokus validasi layanan awal |

P1 menjadi penghalang rilis jika paket yang diluncurkan menjanjikannya. P2 juga menjadi penghalang jika dimasukkan ke kontrak paket/add-on; label prioritas bukan izin menjual fitur yang belum selesai.

## 18. Jadwal dan cara mengukur progres

Estimasi tiga minggu dan rincian setengah/satu hari pada dokumen asal dihapus sebagai janji. Kode masih memerlukan pekerjaan lintas auth, data, transaksi, media, dan akses; kapasitas pengembang serta kesiapan materi belum diketahui.

Setelah G0–G1, pecah setiap tahap menjadi pekerjaan kecil dengan penanggung jawab, dependensi, estimasi rentang, dan bukti selesai. Kalibrasi estimasi setelah satu alur inti selesai. Tanggal rilis ditentukan dari hasil dan kesiapan operasional, bukan dipasang sebelum hambatan teratasi.

| Titik review pemilik | Yang diperiksa |
| --- | --- |
| Sesudah G0 | Produk, harga, batas, SOP, cakupan rilis |
| Sesudah G1 | Peta dashboard dan prioritas |
| Sesudah G2–G4 | Login/data, chat, order, pembayaran dengan contoh transaksi |
| Sesudah G5–G7 | Pengalaman klien sampai undangan published dan RSVP |
| Sesudah tahap venue yang dipilih | Alat, petugas, biaya, dan simulasi |
| Sesudah G10–G11 | Penutupan layanan, bukti tes, keterbatasan dan kesiapan rilis |
| Sebelum G12 | Izin deployment, lingkungan sasaran, biaya, dan rollback |

## 19. Koreksi utama terhadap roadmap asal

- Database dan akses dipindah sebelum penyelesaian fitur bisnis, bukan saat mendekati go-live.
- Klaim cukup mengganti satu import diganti dengan rencana pemetaan data, identitas, transaksi, dan akses.
- Prioritas live gallery/photo booth diturunkan bila tidak termasuk paket rilis; order, pembayaran, chat, dan approval didahulukan.
- Mengirim password tetap lewat WhatsApp diganti undangan menetapkan password sendiri.
- Auto-deploy dihapus dari syarat selesai; setiap deployment menunggu izin pemilik.
- Referensi port 3000 dan janji spesifikasi/harga hosting tetap diganti dengan kondisi lokal dan keputusan infrastruktur nanti.
- Klaim pure profit dihapus; evaluasi biaya mengacu model bisnis revisi.
- Status active dibedakan dari persetujuan versi, pembayaran, publikasi, dan expiry.
- Kelayakan tiga paket tidak diasumsikan hanya dari demo atau build berhasil.

Langkah pertama setelah review dua dokumen: sahkan G0. Tidak ada perubahan aplikasi atau aktivitas online yang dilakukan hanya karena roadmap ini telah ditulis.
