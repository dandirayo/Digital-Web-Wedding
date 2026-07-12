# Production Data Checklist

Gunakan file ini sebelum static website Occasio dipublish.

## Wajib Diganti

- `assets/js/config.js`
  - `baseUrl`: ganti `https://domain-anda.com/` dengan domain asli.
  - `whatsappNumber`: ganti `6280000000000` dengan nomor WhatsApp bisnis.
  - `whatsappFallbackUrl`: samakan dengan nomor WhatsApp bisnis.
  - `contactLabel`: isi label kontak yang ingin tampil di footer.
  - `packages`: konfirmasi nama paket, harga, deskripsi, dan fitur final.
  - `budgetOptions`: sesuaikan opsi budget konsultasi.
  - `testimonials`: isi testimoni asli setelah ada izin publikasi.

- `index.html`, `gallery.html`, `privacy.html`, `terms.html`
  - Pastikan canonical sudah sesuai domain final.

- `robots.txt`
  - Pastikan URL sitemap memakai domain final.

- `sitemap.xml`
  - Pastikan semua URL memakai domain final.

## Opsional tapi Disarankan

- Ganti gambar OG di `index.html` dan `gallery.html` jika punya gambar brand resmi.
- Tambahkan alamat/legal bisnis di `privacy.html` dan `terms.html` jika sudah siap.
- Optimasi ukuran gambar sebelum deploy production.

## Status Saat Ini

- WhatsApp masih placeholder.
- Domain masih placeholder `https://domain-anda.com/`.
- Harga paket masih struktur awal.
- Testimoni masih placeholder etis, belum testimoni asli.
