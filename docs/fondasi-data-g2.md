# Occasio — Fondasi Data, Identitas, dan Akses (G2)

Versi: implementasi lokal 1.1 · 8 September 2026

Status: **Tahap 2 sedang berjalan**. Belum ada migration yang didorong ke project cloud dan belum ada deployment.

## Progres implementasi lokal

- Baseline clean-install dibuat di `supabase/migrations/20260906010000_baseline_basic_schema.sql` dan ditempatkan sebelum migration hardening lama.
- Baseline mencakup profil, katalog, lead/chat, penawaran, order, invoice, pembayaran, event, versi konten, approval, penugasan, task, tamu, RSVP, check-in log, media, dan audit log.
- Seluruh tabel pada schema `public` mengaktifkan RLS. Grant Data API ditulis eksplisit karena tabel baru tidak lagi otomatis diekspos pada konfigurasi Supabase terbaru.
- Role berasal dari `raw_app_meta_data`; kolom role profil tidak dapat diperbarui oleh klien.
- Bucket `event-media` dan `payment-proofs` bersifat privat. Policy upload mencakup `select`, `insert`, dan `update` agar upsert dapat diuji tanpa membuka file ke publik.
- Seed lokal hanya mengisi katalog paket/template. Tidak ada user demo, password, event, pembayaran, atau tamu yang dimasukkan ke seed bersama.
- Test pgTAP `supabase/tests/baseline_access_test.sql` mencakup anon, Client A, Client B, owner, invoice, event, tamu, dan pencegahan promosi role.
- Vertical slice Auth awal ditambahkan: browser/server client memakai publishable key dengan fallback anon key, `src/proxy.ts` me-refresh cookie dan menahan route owner/client/chat, login memakai `signInWithPassword`, dan logout memakai Supabase Auth. Dashboard masih membaca event dari localStorage sampai slice data persisten berikutnya selesai.
- Verifikasi HTTP tanpa session: `/owner/dashboard`, `/client/dashboard`, dan `/chat` mengembalikan redirect `307` ke login; `/login` dan undangan publik tetap dapat dibuka.
- Verifikasi Auth cloud read-only: password benar diterima dan password salah ditolak; akun owner yang saat ini ada di cloud belum mengembalikan `app_metadata.role`, sehingga login aplikasi menolak akun tersebut sampai metadata server diperbaiki melalui proses admin/seed yang disetujui.
- Lint lulus tanpa error (9 warning optimasi `<img>` yang sudah ada). Build Next.js lulus dan mengenali Proxy.
- Baseline dan test belum dieksekusi karena Docker Desktop Linux engine belum aktif. Status G2 tetap belum lulus.

## Temuan awal

- Aplikasi telah memiliki `@supabase/supabase-js` dan `@supabase/ssr`, tetapi alur utama masih memakai localStorage.
- Konfigurasi browser/server masih memakai legacy anon key; dukungan publishable key akan ditambahkan tanpa mengekspos service-role key.
- Schema lama hanya mencakup profil, template, paket, event, konten, tamu, ucapan, media, dan live gallery; belum mencakup lead/chat, penawaran, order, invoice, pembayaran, versi konten, approval, penugasan, dan audit log.
- `schema.sql` bersifat monolitik dan memuat definisi/policy berulang. Ada policy anonim lama untuk membaca dan memperbarui seluruh tamu; file ini tidak aman untuk dijalankan langsung.
- Migration hardening yang ada belum membuktikan instalasi kosong dapat membentuk seluruh schema.
- Redirect Auth lokal masih memakai port 3000; aplikasi management memakai port 3001.
- Pemeriksaan 8 September 2026 menunjukkan REST project cloud dapat dijangkau dan tabel lama `profiles`, `events`, `guests`, serta `wishes` dapat dibaca menggunakan pemeriksaan server. Ini membuktikan koneksi, bukan keamanan atau kelengkapan schema.
- Supabase lokal belum dapat diperiksa karena Docker Desktop Linux engine tidak aktif. Cloud tidak digunakan sebagai tempat eksperimen pengganti.

## Keputusan fondasi

- Next.js menggunakan session cookie melalui `@supabase/ssr`.
- Registrasi publik dimatikan. Akun klien dibuat melalui undangan/order dan pengguna menetapkan password sendiri.
- Role otorisasi disimpan pada data server/app metadata, bukan `user_metadata` yang dapat diedit pengguna.
- Semua tabel pada schema yang diekspos mengaktifkan RLS serta grant minimum per operasi.
- Tabel publik tidak otomatis diekspos; grant Data API ditulis eksplisit bersama policy.
- Service-role key hanya boleh dipakai pada proses server tepercaya dan tidak pernah memakai prefix `NEXT_PUBLIC_`.
- Tamu publik menggunakan token terbatas; tidak ada policy anonim untuk membaca atau memperbarui seluruh daftar tamu.
- Preview draft bersifat privat dan terpisah dari undangan published.

## Urutan implementasi G2

1. Bekukan `schema.sql` lama sebagai referensi; jangan eksekusi langsung. **Selesai.**
2. Susun matriks entitas dan relasi untuk alur Basic lengkap. **Diterapkan pada baseline; review lanjutan tetap diperlukan setelah test database.**
3. Buat baseline migration baru melalui CLI, kemudian tambahkan enum/tabel/index/grant/RLS/policy secara bertahap. **Draft lokal selesai, belum dieksekusi.**
4. Buat test allow/deny untuk anon, client A, client B, owner, dan anggota tim. **Draft awal selesai untuk anon/client/owner; skenario staff dilanjutkan setelah baseline lolos reset.**
5. Jalankan reset database lokal dan database tests jika Docker tersedia.
6. Tambahkan middleware/proxy session refresh dan Auth server-side.
7. Migrasikan satu vertical slice: login → profil → event milik klien → logout.
8. Hapus fallback diam-diam ke data demo pada slice yang telah dimigrasikan.

## Konfigurasi lokal yang sudah diperbaiki

- Auth `site_url` dan redirect diarahkan ke port 3001.
- Registrasi email publik dimatikan.
- Password minimum menjadi 8 karakter dengan huruf kecil, huruf besar, dan angka.

## Hasil verifikasi awal

- `backend:check`: lulus; URL, key, REST, dan empat tabel lama terjangkau tanpa mencetak nilai secret.
- Build Next.js: lulus.
- `supabase status`: belum dapat berjalan karena Docker Desktop Linux engine tidak aktif.
- Tidak ada SQL, seed, migration, atau perubahan Auth yang dikirim ke project cloud.

## Syarat lulus G2

- Instalasi kosong dapat membentuk schema secara deterministik.
- Login/logout/reset/invitation bekerja menggunakan cookie dan identitas nyata.
- Owner/client/team tidak dapat memilih role sendiri.
- Client A tidak dapat membaca atau mengubah data Client B.
- Anon tidak dapat membaca daftar tamu, chat, invoice, atau draft.
- Undangan published hanya mengembalikan data publik minimum.
- Media draft privat; aturan Storage diuji termasuk upsert.
- Tidak ada service-role key di bundle browser.
- Test grant/RLS allow dan deny lulus.

G2 belum lulus sampai seluruh bukti tersebut tersedia.
