export const siteConfig = {
  brandName: "Occasio",
  legalName: "Occasio",
  baseUrl: "https://domain-anda.com/",
  whatsappNumber: "6280000000000",
  whatsappFallbackUrl: "https://wa.me/6280000000000",
  contactLabel: "WhatsApp belum diset",
  demoWeddingUrl: "http://localhost:3001/wedding/sheila-yoga",
  publishYear: "2026",
  consultationDraftKey: "occasio_consultation_draft_v1",
  priceDisclaimer:
    "Harga final mengikuti kebutuhan konten, domain, revisi, dan fitur tambahan yang dipilih.",
  packages: [
    {
      id: "basic",
      name: "Basic",
      price: "Rp799rb",
      description: "Website undangan siap pakai untuk pasangan yang membutuhkan fungsi inti.",
      features: ["Template pilihan", "Link per tamu", "RSVP online", "Ucapan tamu", "Masa aktif 3 bulan"],
      featured: false,
    },
    {
      id: "premium",
      name: "Premium",
      price: "Rp1,49jt",
      description: "Pengelolaan tamu dan konten yang lebih lengkap melalui dashboard klien.",
      features: ["Semua Basic", "Dashboard klien", "QR tamu & check-in", "Galeri foto/video", "Masa aktif 6 bulan"],
      featured: true,
    },
    {
      id: "signature",
      name: "Signature",
      price: "Rp2,99jt",
      description: "Pendampingan lengkap untuk undangan premium dan operasional hari acara.",
      features: ["Semua Premium", "Arah visual khusus", "Prioritas revisi", "Dukungan check-in hari H", "Masa aktif 12 bulan"],
      featured: false,
    },
  ],
  budgetOptions: [
    "< Rp1 juta",
    "Rp1 juta - Rp2 juta",
    "Rp2 juta - Rp5 juta",
    "> Rp5 juta",
  ],
  testimonials: [
    {
      quote: "Testimoni asli client dapat ditampilkan di sini setelah tersedia.",
      name: "Client Occasio",
      status: "Menunggu testimoni asli",
    },
    {
      quote: "Gunakan kutipan yang sudah disetujui agar tetap etis dan kredibel.",
      name: "Client Occasio",
      status: "Menunggu izin publikasi",
    },
    {
      quote: "Area ini mendukung social proof tanpa membuat klaim yang belum valid.",
      name: "Client Occasio",
      status: "Placeholder produksi",
    },
  ],
};

export function asset(path) {
  return new URL(path, window.location.href).href;
}

export function sanitizeText(value) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildWhatsappUrl(message) {
  const number = siteConfig.whatsappNumber || "";
  const encodedMessage = encodeURIComponent(message);
  if (/^62\d{8,15}$/.test(number)) {
    return `https://wa.me/${number}?text=${encodedMessage}`;
  }
  return `${siteConfig.whatsappFallbackUrl}?text=${encodedMessage}`;
}
