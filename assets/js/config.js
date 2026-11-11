export const siteConfig = {
  brandName: "Occasio",
  legalName: "Occasio",
  baseUrl: "https://domain-anda.com/",
  managementBaseUrl: "http://localhost:3001/",
  whatsappNumber: "6280000000000",
  contactLabel: "WhatsApp belum diset",
  demoWeddingUrl: "http://localhost:3001/wedding/sheila-yoga",
  publishYear: "2026",
  showPublicPrices: false,
  consultationDraftKey: "occasio_consultation_draft_v1",
  priceDisclaimer:
    "Harga yang terlihat di data development masih baseline internal. Harga pilot akan dipublikasikan setelah validasi biaya.",
  packages: [
    {
      id: "basic",
      name: "Basic",
      price: "Rp799rb",
      description: "Website undangan siap pakai untuk pasangan yang membutuhkan fungsi inti.",
      features: ["Template pilihan", "Link per tamu", "RSVP online", "Ucapan tamu", "Masa aktif 3 bulan"],
      featured: false,
      availability: "Baseline rilis pertama",
      orderable: true,
    },
    {
      id: "premium",
      name: "Premium",
      price: "Rp1,49jt",
      description: "Pengelolaan tamu dan konten yang lebih lengkap melalui dashboard klien.",
      features: ["Semua Basic", "Dashboard klien", "QR tamu & check-in", "Galeri foto/video", "Masa aktif 6 bulan"],
      featured: true,
      availability: "Direncanakan setelah QR teruji",
      orderable: false,
    },
    {
      id: "signature",
      name: "Signature",
      price: "Rp2,99jt",
      description: "Rencana pendampingan undangan dan layanan venue dengan scope terukur.",
      features: ["Semua Premium", "Arah visual terbatas", "Prioritas revisi", "Rencana layanan venue", "Masa aktif 12 bulan"],
      featured: false,
      availability: "Belum tersedia untuk dipesan",
      orderable: false,
    },
  ],
  budgetOptions: [
    "Di bawah Rp1 juta",
    "Rp1 juta - Rp2 juta",
    "Rp2 juta - Rp5 juta",
    "Di atas Rp5 juta",
  ],
  testimonials: [],
  faqs: [
    { question: "Paket mana yang memiliki QR check-in?", answer: "QR tamu dan check-in tersedia mulai paket Premium. Paket Signature menambahkan dukungan operasional hari acara." },
    { question: "Apa yang terjadi setelah konsultasi?", answer: "Brief masuk ke inbox Occasio, tim mengonfirmasi kebutuhan dan pembayaran, lalu workspace klien dibuat untuk proses konten." },
    { question: "Apakah desain bisa disesuaikan?", answer: "Bisa. Penyesuaian warna dan konten mengikuti paket, sedangkan arah visual khusus tersedia sebagai bagian paket Signature." },
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
  if (isWhatsappConfigured()) {
    return `https://wa.me/${number}?text=${encodedMessage}`;
  }
  return "";
}

export function isWhatsappConfigured() {
  const number = siteConfig.whatsappNumber || "";
  return /^62\d{8,15}$/.test(number) && number !== "6280000000000";
}

export function isPublicUrlConfigured() {
  try {
    const url = new URL(siteConfig.baseUrl);
    return url.protocol === "https:" && url.hostname !== "domain-anda.com";
  } catch {
    return false;
  }
}

export function buildManagementUrl(path = "") {
  return new URL(path.replace(/^\//, ""), ensureTrailingSlash(siteConfig.managementBaseUrl)).href;
}

function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
