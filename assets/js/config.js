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
      price: "Mulai Rp499rb",
      description: "Untuk undangan digital sederhana yang tetap rapi dan mobile-first.",
      features: ["Template responsive", "Gallery dasar", "CTA WhatsApp"],
      featured: false,
    },
    {
      id: "premium",
      name: "Premium",
      price: "Mulai Rp799rb",
      description: "Untuk presentasi fitur lebih lengkap dengan RSVP dan QR demo.",
      features: ["Semua Basic", "RSVP demo", "QR check-in demo"],
      featured: true,
    },
    {
      id: "custom",
      name: "Custom",
      price: "By request",
      description: "Untuk kebutuhan desain, struktur, dan flow khusus.",
      features: ["Struktur custom", "Copywriting tambahan", "Roadmap backend"],
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
