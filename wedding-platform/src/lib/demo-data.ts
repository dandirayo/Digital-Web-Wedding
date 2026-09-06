export type EventStatus = "active" | "draft" | "completed";

export type WeddingEvent = {
  id: string;
  slug: string;
  couple: string;
  clientName: string;
  packageName: string;
  date: string;
  venue: string;
  status: EventStatus;
  guests: number;
  rsvpYes: number;
  rsvpNo: number;
  wishes: number;
  checkIns: number;
  lastActivity: string;
};

export const events: WeddingEvent[] = [
  {
    id: "evt_001",
    slug: "sheila-yoga",
    couple: "Sheila & Yoga",
    clientName: "Sheila Prameswari",
    packageName: "Premium",
    date: "27 Desember 2026",
    venue: "Grand Ballroom Jakarta",
    status: "active",
    guests: 320,
    rsvpYes: 184,
    rsvpNo: 22,
    wishes: 76,
    checkIns: 0,
    lastActivity: "12 menit lalu",
  },
  {
    id: "evt_002",
    slug: "andi-rina",
    couple: "Andi & Rina",
    clientName: "Andi Saputra",
    packageName: "Basic",
    date: "14 Februari 2027",
    venue: "Gedung Serbaguna Bandung",
    status: "draft",
    guests: 180,
    rsvpYes: 42,
    rsvpNo: 5,
    wishes: 18,
    checkIns: 0,
    lastActivity: "1 jam lalu",
  },
  {
    id: "evt_003",
    slug: "nadia-fajar",
    couple: "Nadia & Fajar",
    clientName: "Nadia Kirana",
    packageName: "Signature",
    date: "7 Maret 2027",
    venue: "Hotel Merdeka Surabaya",
    status: "active",
    guests: 450,
    rsvpYes: 301,
    rsvpNo: 31,
    wishes: 142,
    checkIns: 27,
    lastActivity: "4 menit lalu",
  },
];

export const clientEvent = events[0];

export const recentGuests = [
  { name: "Reza Pramudita", status: "Hadir", pax: 2, code: "SA-REZA-8K2", time: "10:42" },
  { name: "Dewi Lestari", status: "Belum", pax: 0, code: "SA-DEWI-9LA", time: "10:21" },
  { name: "Bagas Putra", status: "Tidak Hadir", pax: 0, code: "SA-BAGAS-1QP", time: "09:58" },
  { name: "Maya Santoso", status: "Hadir", pax: 1, code: "SA-MAYA-7VB", time: "09:37" },
];

export const recentWishes = [
  { name: "Reza", text: "Semoga lancar sampai hari H dan menjadi keluarga sakinah.", time: "Baru saja" },
  { name: "Maya", text: "Happy wedding Sheila & Yoga. Bahagia selalu!", time: "15 menit lalu" },
  { name: "Dewi", text: "Doa terbaik untuk kalian berdua.", time: "38 menit lalu" },
];

export const packages = [
  {
    name: "Basic",
    price: "Rp799rb",
    description: "Website undangan siap pakai dengan fungsi inti untuk acara intimate.",
    features: ["Template pilihan", "Link per tamu", "RSVP & ucapan", "Masa aktif 3 bulan"],
  },
  {
    name: "Premium",
    price: "Rp1,49jt",
    description: "Untuk pasangan yang ingin dashboard dan QR check-in.",
    features: ["Semua Basic", "Dashboard klien", "QR tamu & check-in", "Galeri foto/video", "Masa aktif 6 bulan"],
  },
  {
    name: "Signature",
    price: "Rp2,99jt",
    description: "Pendampingan lengkap untuk undangan premium dan operasional hari acara.",
    features: ["Semua Premium", "Arah visual khusus", "Prioritas revisi", "Support check-in hari H", "Masa aktif 12 bulan"],
  },
];

export type TemplateCategory = "modern" | "classic" | "luxury" | "minimal";

export type TemplateShowcase = {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  thumbnail: string;
  colors: string[];
  features: string[];
  badge: string;
  priceFrom: number;
  packageLevel: string;
  demoHref?: string;
};

export const templateCategories: { id: "all" | TemplateCategory; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "modern", label: "Modern" },
  { id: "classic", label: "Classic" },
  { id: "luxury", label: "Luxury" },
  { id: "minimal", label: "Minimal" },
];

export const templateShowcase: TemplateShowcase[] = [
  {
    id: "sheila-yoga",
    name: "Champagne Editorial",
    category: "modern",
    description: "Template editorial dengan cover foto besar, galeri, RSVP, dan aksen champagne.",
    thumbnail: "/templates/sheila-yoga/assets/images/cover.jpg",
    colors: ["#171717", "#d7bd8a", "#fbf7f0"],
    features: ["Cover premium", "Galeri foto", "RSVP", "QR check-in"],
    badge: "Best Preview",
    priceFrom: 1490000,
    packageLevel: "Premium",
    demoHref: "/wedding/sheila-yoga",
  },
  {
    id: "rose-editorial",
    name: "Rose Editorial",
    category: "classic",
    description: "Layout lembut dengan aksen dusty rose untuk acara intimate dan elegan.",
    thumbnail: "/templates/sheila-yoga/assets/images/prewed-1.jpg",
    colors: ["#c98988", "#fbf7f0", "#24201d"],
    features: ["Section story", "Gift card", "Ucapan tamu", "Animasi halus"],
    badge: "Soft Look",
    priceFrom: 799000,
    packageLevel: "Basic",
  },
  {
    id: "midnight-gala",
    name: "Midnight Gala",
    category: "luxury",
    description: "Visual premium untuk wedding malam, ballroom, dan acara formal.",
    thumbnail: "/templates/sheila-yoga/assets/images/prewed-3.jpg",
    colors: ["#20222a", "#d7bd8a", "#ffffff"],
    features: ["Hero cinematic", "Countdown", "Rundown", "Maps"],
    badge: "Luxury",
    priceFrom: 1490000,
    packageLevel: "Premium",
  },
  {
    id: "ivory-minimal",
    name: "Ivory Minimal",
    category: "minimal",
    description: "Template clean mobile-first untuk pasangan yang ingin tampilan ringan dan rapi.",
    thumbnail: "/templates/sheila-yoga/assets/images/prewed-5.jpg",
    colors: ["#fbf7f0", "#b98f4d", "#24201d"],
    features: ["Cepat dibuka", "Mobile-first", "CTA jelas", "SEO basic"],
    badge: "Clean",
    priceFrom: 799000,
    packageLevel: "Basic",
  },
  {
    id: "garden-soiree",
    name: "Garden Soiree",
    category: "luxury",
    description: "Nuansa garden elegan untuk resepsi hangat dengan galeri foto yang kaya.",
    thumbnail: "/templates/sheila-yoga/assets/images/g6.jpg",
    colors: ["#171717", "#c98988", "#d7bd8a"],
    features: ["Galeri premium", "Rundown acara", "Digital gift", "Animasi lembut"],
    badge: "Signature",
    priceFrom: 2990000,
    packageLevel: "Signature",
  },
];

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getPackageLabel(tier: "silver" | "gold" | "platinum") {
  return {
    silver: "Basic",
    gold: "Premium",
    platinum: "Signature",
  }[tier];
}

export type PipelineStage = "Lead Baru" | "Proses Setup" | "Siap Publish";

export type BusinessOrder = {
  id: string;
  couple: string;
  clientName: string;
  packageName: string;
  stage: PipelineStage;
  dueDate: string;
  value: number;
  nextAction: string;
};

export const businessOrders: BusinessOrder[] = [
  {
    id: "ord_001",
    couple: "Dimas & Ayu",
    clientName: "Ayu Wulandari",
    packageName: "Premium",
    stage: "Lead Baru",
    dueDate: "Hari ini",
    value: 1490000,
    nextAction: "Follow-up kebutuhan template dan tanggal acara.",
  },
  {
    id: "ord_002",
    couple: "Sheila & Yoga",
    clientName: "Sheila Prameswari",
    packageName: "Premium",
    stage: "Proses Setup",
    dueDate: "2 hari lagi",
    value: 1490000,
    nextAction: "Validasi data tamu dan finalisasi konten akad.",
  },
  {
    id: "ord_003",
    couple: "Nadia & Fajar",
    clientName: "Nadia Kirana",
    packageName: "Signature",
    stage: "Siap Publish",
    dueDate: "Besok",
    value: 2990000,
    nextAction: "Kirim link final dan siapkan check-in hari H.",
  },
  {
    id: "ord_004",
    couple: "Andi & Rina",
    clientName: "Andi Saputra",
    packageName: "Basic",
    stage: "Proses Setup",
    dueDate: "5 hari lagi",
    value: 799000,
    nextAction: "Tunggu foto prewedding dan data rekening gift.",
  },
];

export type WorkflowTask = {
  id: string;
  title: string;
  owner: string;
  status: "blocked" | "today" | "next";
  event: string;
};

export const workflowTasks: WorkflowTask[] = [
  {
    id: "task_001",
    title: "Review final copy undangan Sheila & Yoga",
    owner: "Content",
    status: "today",
    event: "Sheila & Yoga",
  },
  {
    id: "task_002",
    title: "Minta nomor WhatsApp bisnis final",
    owner: "Owner",
    status: "blocked",
    event: "Occasio",
  },
  {
    id: "task_003",
    title: "Siapkan publish checklist Nadia & Fajar",
    owner: "Production",
    status: "today",
    event: "Nadia & Fajar",
  },
  {
    id: "task_004",
    title: "Buat invoice DP untuk Dimas & Ayu",
    owner: "Finance",
    status: "next",
    event: "Dimas & Ayu",
  },
];

export const billingSummary = {
  revenueThisMonth: 8769000,
  paidInvoices: 4,
  pendingInvoices: 3,
  bestPackage: "Premium",
};
