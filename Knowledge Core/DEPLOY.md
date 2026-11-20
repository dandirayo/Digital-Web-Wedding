# Occasio — Panduan Server, Update, Rollback, dan Pemulihan

Status: **template belum diuji di server nyata.** Semua perintah di bawah belum dijalankan pada VPS atau mini server karena hosting belum dipilih. Uji setiap langkah pada server percobaan sebelum dipakai untuk klien, lalu perbaiki dokumen ini bila ada yang berbeda. Deployment hanya dilakukan setelah pemilik menyetujui (lihat batas kerja di [roadmap-production.md](roadmap-production.md)).

Panduan teknis backend, environment, dan batas upload ada di [BACKEND.md](BACKEND.md). Dokumen ini hanya mengatur operasional server.

## 1. Arsitektur yang disarankan

Satu server Linux dengan disk permanen (VPS atau mini server). SQLite dan folder unggahan berada di disk lokal, jadi **jangan** pakai hosting serverless dan jangan jalankan lebih dari satu proses/replika.

```
Internet ──HTTPS──> Caddy (80/443) ─┬─> domain-anda.com      : file statis (website publik, folder repo)
                                    └─> app.domain-anda.com  : reverse proxy ke 127.0.0.1:3001 (Next.js)
```

- Dua nama host: `domain-anda.com` untuk website publik statis, `app.domain-anda.com` untuk dashboard, undangan, dan API.
- Aplikasi Next.js tetap mendengarkan `127.0.0.1:3001` (sudah begitu di `package.json`). Hanya Caddy yang terbuka ke internet.
- Caddy mengurus sertifikat HTTPS otomatis dan meneruskan header `Host` apa adanya. Itu wajib: pengecekan origin di API membandingkan `Origin` dengan `Host`, dan cookie login production hanya dikirim lewat HTTPS.
- Undangan tamu dibuka di `https://app.domain-anda.com/wedding/<slug>?g=<token>`.

## 2. Yang disiapkan pemilik sebelum server (butuh keputusan dan biaya)

| Item | Catatan |
| --- | --- |
| Server | VPS Linux (mis. Ubuntu LTS) atau mini server sendiri. Minimal 1 vCPU, 1–2 GB RAM, disk sesuai kuota unggahan (500 MB per event) ditambah ruang cadangan. |
| Domain | Satu domain; buat dua catatan DNS (`@` dan `app`) ke IP server. |
| Tempat cadangan di luar server | Disk/akun lain (bukan server yang sama) untuk salinan `backups/`. |
| Nomor WhatsApp | Untuk `whatsappNumber` di `assets/js/config.js`. |
| Kebijakan privasi dan syarat | Baca ulang `privacy.html` dan `terms.html` karena data tamu dan klien nyata akan masuk. |

## 3. Setup server (sekali)

Lakukan sebagai pengguna biasa dengan sudo, bukan root langsung.

1. **Pengguna khusus dan firewall.** Buat pengguna `occasio` tanpa hak sudo. Buka hanya port SSH, 80, dan 443.
2. **Node.js.** Pasang Node.js 24 sesuai `engines` di `package.json` (`>=24.17.0 <25`). Aplikasi memakai modul bawaan `node:sqlite`, jadi versi lebih rendah tidak akan jalan.
3. **pnpm.** Pakai versi yang sama dengan pengembangan agar `pnpm-lock.yaml` terbaca sama:
   ```bash
   corepack enable
   corepack prepare pnpm@12.21.0 --activate
   ```
4. **Ambil kode** ke `/srv/occasio` (milik pengguna `occasio`) dari repositori GitHub, lalu masuk ke `wedding-platform`.
5. **Pasang dependensi dari lockfile:**
   ```bash
   pnpm install --frozen-lockfile
   ```
6. **Environment.** Buat `/etc/occasio.env` (hanya bisa dibaca pengguna `occasio`, mode 600) dengan isi seperti `wedding-platform/.env.example`:
   ```
   OCCASIO_OWNER_EMAIL=email-owner@contoh.com
   OCCASIO_OWNER_PASSWORD=<minimal 12 karakter, acak>
   OCCASIO_PUBLIC_ORIGINS=https://domain-anda.com
   ```
   Akun owner dibuat **sekali** saat database masih kosong. Setelah login pertama, ganti password dari menu Kelola. Jangan commit file ini.
7. **Database baru khusus production.** Jangan menyalin `data/` dari laptop (berisi akun dan event demo). Production pertama tidak membuat akun demo.
8. **Build:**
   ```bash
   pnpm build
   ```
9. **Service systemd** `/etc/systemd/system/occasio.service`:
   ```ini
   [Unit]
   Description=Occasio
   After=network.target

   [Service]
   User=occasio
   WorkingDirectory=/srv/occasio/wedding-platform
   EnvironmentFile=/etc/occasio.env
   Environment=NODE_ENV=production
   ExecStart=/usr/bin/env pnpm start
   Restart=on-failure
   RestartSec=3

   [Install]
   WantedBy=multi-user.target
   ```
   Lalu `sudo systemctl enable --now occasio`. Jalur `pnpm`/`node` di `ExecStart` bisa berbeda tergantung cara Node dipasang; sesuaikan.
10. **Caddy** `/etc/caddy/Caddyfile`:
    ```
    domain-anda.com {
        root * /srv/occasio
        file_server
        header Strict-Transport-Security "max-age=31536000"
    }

    app.domain-anda.com {
        reverse_proxy 127.0.0.1:3001
        header Strict-Transport-Security "max-age=31536000"
    }
    ```
    HSTS baru ditambahkan **setelah** HTTPS terbukti jalan di kedua nama host. Karena folder repo disajikan sebagai file statis, pastikan hanya file website publik yang terjangkau (jangan sajikan `wedding-platform/data`, `.git`, atau `Knowledge Core`). Cara aman: salin hanya `index.html`, `gallery.html`, `privacy.html`, `terms.html`, `404.html`, `robots.txt`, `sitemap.xml`, dan folder `assets/` ke folder terpisah (mis. `/srv/occasio-public`) dan arahkan `root` ke sana.
11. **Website publik.** Sebelum disalin, ganti semua nilai lokal (lihat bagian 4).
12. **Cek:** `curl https://app.domain-anda.com/api/health` harus menjawab `{"ok":true,...}`; buka `/login` dan masuk sebagai owner.

## 4. Nilai lokal yang harus diganti di website publik

| File | Yang diganti |
| --- | --- |
| `assets/js/config.js` | `baseUrl` → `https://domain-anda.com/`; `managementBaseUrl` → `https://app.domain-anda.com/`; `demoWeddingUrl` → alamat undangan demo di `app.`; `whatsappNumber` dan `contactLabel` |
| `index.html`, `gallery.html` | Ada 11 tautan tetap `http://localhost:3001/...` di atribut `href` (bertanda `data-demo-wedding-link` dan `data-management-link`). `assets/js/production-data.js` menimpanya dari `config.js` saat halaman dimuat, jadi pengunjung dengan JavaScript aktif akan melihat nilai dari `config.js`. Tetap ganti nilai HTML-nya agar pengunjung tanpa JavaScript dan mesin pencari tidak melihat `localhost`. |
| `robots.txt`, `sitemap.xml`, `privacy.html`, `terms.html`, `index.html` | Semua `domain-anda.com` → domain asli |

Setelah diganti, cari sisa nilai lama: `localhost`, `127.0.0.1`, dan `domain-anda.com` tidak boleh tersisa di file yang disalin ke server.

## 5. Cadangan

Perintah dijalankan dari folder `wedding-platform` (skrip membaca `data/` relatif terhadap folder kerja):

```bash
node scripts/backup.mjs        # hasil: backups/<waktu>/ (database + unggahan + MANIFEST.json)
```

**Jadwal** (cron milik pengguna `occasio`; contoh harian pukul 02:00 dan hapus salinan lebih dari 14 hari):

```cron
0 2 * * * cd /srv/occasio/wedding-platform && node scripts/backup.mjs >> /var/log/occasio-backup.log 2>&1
30 2 * * * find /srv/occasio/wedding-platform/backups -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +
```

Tambahkan penyalinan keluar server (mis. `rsync` atau `rclone` ke disk/akun lain) setelah backup selesai. Cadangan yang hanya ada di server yang sama tidak melindungi dari disk rusak.

Tambahan wajib: jalankan backup manual **sebelum setiap update** dan **sebelum dan sesudah hari acara klien**.

**Uji pemulihan** minimal sekali sebelum klien pertama, lalu tiap bulan, pada salinan sementara (bukan data hidup), dan catat tanggalnya.

## 6. Update aplikasi

Urutan, dilakukan di server dari folder `wedding-platform`:

1. `node scripts/backup.mjs`
2. Catat versi yang sedang jalan: `git rev-parse --short HEAD`
3. `git fetch` lalu `git pull --ff-only` (berhenti bila ada konflik; jangan paksa)
4. `pnpm install --frozen-lockfile`
5. `sudo systemctl stop occasio`, lalu `pnpm build`, lalu `sudo systemctl start occasio` (henti singkat lebih aman daripada membangun saat proses jalan)
6. Cek: `curl https://app.domain-anda.com/api/health`, buka `/login`, buka satu undangan, kirim satu RSVP uji pada event uji.
7. Lihat log: `journalctl -u occasio -n 50`.

Update dilakukan di luar jam ramai dan jangan pada hari acara klien.

## 7. Rollback

**Kode bermasalah, data aman** (halaman error, fitur rusak setelah update):

```bash
sudo systemctl stop occasio
git checkout <commit-lama>     # dari langkah 2 di bagian 6
pnpm install --frozen-lockfile
pnpm build
sudo systemctl start occasio
```

Cek `/api/health` dan satu undangan. Setelah stabil, cari penyebabnya di cabang terpisah; jangan langsung update ulang.

**Data rusak atau terhapus** (tamu hilang, database tidak terbaca):

```bash
sudo systemctl stop occasio
node scripts/restore.mjs backups/<folder-pilihan> --yes
sudo systemctl start occasio
```

Pemulihan menyimpan kondisi saat ini lebih dulu ke `backups/pre-restore-<waktu>/` dan membatalkan diri bila salinan pengaman gagal. Data yang masuk setelah waktu cadangan (RSVP, ucapan) ikut hilang pada pemulihan; informasikan kepada klien yang terdampak.

Skema database belum punya sistem migrasi versi. Bila suatu update mengubah isi atau bentuk data, catat di pesan commit dan uji pada salinan database sebelum dipakai di production.

## 8. Pemantauan

- Pantau `https://app.domain-anda.com/api/health` dengan layanan uptime (gratis tersedia) yang mengirim pemberitahuan bila 503 atau tidak menjawab.
- Periksa ruang disk berkala (unggahan dan cadangan terus bertambah).
- Periksa `journalctl -u occasio` bila ada laporan masalah.
- Pantau sertifikat: Caddy memperbarui otomatis; periksa bila situs menampilkan peringatan.

## 9. Checklist sebelum klien pertama (pilot)

- [ ] Server, domain, DNS, HTTPS (kedua nama host) berjalan; HSTS ditambahkan.
- [ ] `/api/health` 200; pemantau uptime aktif dan memberi notifikasi ke owner.
- [ ] Akun owner production dibuat; password sudah diganti dari yang di environment; tidak ada akun demo.
- [ ] Katalog paket dan harga di menu Kelola sudah sesuai keputusan, bukan data seed.
- [ ] Website publik sudah bersih dari `localhost` dan `domain-anda.com`; nomor WhatsApp benar; form konsultasi mengirim brief ke inbox owner.
- [ ] `privacy.html` dan `terms.html` sudah dibaca dan disetujui owner.
- [ ] Cadangan terjadwal berjalan, ada salinan di luar server, uji pemulihan pernah berhasil.
- [ ] Satu alur penuh diuji di server (konsultasi → client → event → tamu → RSVP → publish) memakai SOP di BACKEND.md, dari HP dan dari dua perangkat berbeda.
- [ ] Video `intro.mp4` sudah dikompres; musik berasal dari file unggahan sendiri, bukan hotlink situs lain.
- [ ] Jalur rollback pernah dicoba satu kali pada server percobaan.
