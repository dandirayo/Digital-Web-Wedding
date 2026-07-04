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
    packageName: "Premium Digital",
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
    packageName: "Classic",
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
    packageName: "Full Service",
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
    name: "Classic",
    price: "Rp799rb",
    description: "Undangan digital elegan untuk event sederhana.",
    features: ["Template premium", "RSVP", "Ucapan tamu", "Custom domain opsional"],
  },
  {
    name: "Premium",
    price: "Rp1,49jt",
    description: "Untuk pasangan yang ingin dashboard dan QR check-in.",
    features: ["Semua Classic", "Dashboard client", "QR tamu", "Gallery foto/video"],
  },
  {
    name: "Full Service",
    price: "Rp2,99jt",
    description: "Paket lengkap dengan monitoring event dan support hari H.",
    features: ["Semua Premium", "Dashboard owner", "Check-in live", "Support event"],
  },
];
