# Occasio

Occasio adalah website static untuk jasa undangan pernikahan digital. Versi ini memakai HTML, CSS, dan JavaScript vanilla tanpa backend.

## Struktur Folder

- `index.html`: homepage company profile Occasio.
- `gallery.html`: gallery template dengan search, filter, sort, preview modal, dan CTA WhatsApp.
- `privacy.html`, `terms.html`, `404.html`: halaman pendukung.
- `assets/css/`: CSS modular.
- `assets/js/config.js`: konfigurasi domain dan WhatsApp.
- `assets/js/data/templates.js`: data template terpusat.
- `assets/js/navigation.js`: mobile nav, Escape handler, scroll spy.
- `assets/js/gallery.js`: render kartu template, filter, search, sort, hash highlight.
- `assets/js/modal.js`: modal reusable dengan focus trap.
- `assets/js/forms.js`: form konsultasi, validasi, draft localStorage, WhatsApp message.
- `assets/images/`: aset foto/video template.

## Halaman

- Home: hero, fitur, template unggulan, cara kerja, paket, demo RSVP/QR, testimonial placeholder, FAQ, CTA, footer.
- Gallery: daftar template dinamis.
- Legal: kebijakan privasi dan ketentuan layanan sederhana.

## Fitur Tersedia

- Navigasi mobile dengan `aria-expanded`, `aria-controls`, label dinamis, dan Escape handler.
- Scroll spy pada homepage.
- Data template terpusat.
- Preview modal template dengan gambar, thumbnail, previous/next, fitur, harga mulai, dan CTA.
- Form konsultasi dengan validasi realtime, draft localStorage, hapus draft, loading state, success state, dan WhatsApp deep link.
- FAQ accordion.
- SEO dasar: title, description, canonical, Open Graph, Twitter Card, schema, robots, sitemap, favicon.

## Fitur Demo

- RSVP dan QR check-in masih demo frontend.
- Belum ada backend, database, login, dashboard, payment, atau penyimpanan server.
- Testimonial masih placeholder sampai ada kutipan asli dari client.

## Mengganti Nomor WhatsApp

Buka `assets/js/config.js`, lalu ganti:

```js
whatsappNumber: "6280000000000",
whatsappFallbackUrl: "https://wa.me/6280000000000",
```

Gunakan format Indonesia tanpa tanda plus, misalnya `62812xxxxxxxx`.

## Menambah Template

Tambahkan object baru di `assets/js/data/templates.js` dengan field:

- `id`
- `name`
- `category`
- `description`
- `thumbnail`
- `images`
- `colors`
- `features`
- `badge`
- `priceFrom`
- `packageLevel`
- `whatsappMessage`

Pastikan gambar tersedia di `assets/images/` atau `assets/images/templates/`.

## Konfigurasi Metadata dan Domain

Ganti `https://example.com/Digital-Web-Wedding/` pada:

- `assets/js/config.js`
- `index.html`
- `gallery.html`
- `privacy.html`
- `terms.html`
- `robots.txt`
- `sitemap.xml`

## Checklist Sebelum Deployment

- Ganti nomor WhatsApp placeholder.
- Ganti domain canonical dan sitemap.
- Konfirmasi harga paket final.
- Isi testimoni asli jika sudah ada izin.
- Optimasi gambar produksi.
- Uji responsive 320px, 375px, 768px, 1024px, dan desktop.
- Uji semua tombol CTA, modal, form, dan link WhatsApp.
