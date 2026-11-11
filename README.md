# Occasio Digital Wedding Platform

Occasio adalah layanan undangan digital per acara. Baca [Knowledge Core/core.md](Knowledge%20Core/core.md) pada awal setiap sesi, lalu dokumentasi terkait sebelum mengubah kode. Folder `Knowledge Core` dapat dibuka sebagai Obsidian vault.

## Aplikasi lokal

| Bagian | Alamat | Keterangan |
| --- | --- | --- |
| Website publik | http://127.0.0.1:4174 | HTML statis; server terpisah |
| Login/admin | http://127.0.0.1:3001/login | Next.js + backend SQLite |
| Undangan contoh | http://127.0.0.1:3001/wedding/sheila-yoga | Data yang sama dengan dashboard |

Jalankan aplikasi dari `wedding-platform` menggunakan `pnpm.cmd dev`.
Panduan instalasi, akun demo, penyimpanan, dan persiapan VPS/mini server ada di [Knowledge Core/BACKEND.md](Knowledge%20Core/BACKEND.md).
Alamat localhost hanya dapat dibuka pada komputer yang menjalankan server.

## Status

Mode development lokal. Login owner/client dan penyimpanan inti memakai backend sendiri.
Chat, review, task, billing, media upload, dan gerbang publish bisnis masih perlu diselesaikan sebelum melayani klien nyata.
Rilis awal tetap Basic; Premium dan Signature belum dijual. Harga belum final.
