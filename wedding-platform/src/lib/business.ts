import { api } from "./api";

// Pembungkus API untuk alur bisnis: tagihan, versi + persetujuan, publish, chat, riwayat, ringkasan.

export type InvoiceStatus = "unpaid" | "proof_submitted" | "paid" | "void";
export type Invoice = {
  id: string;
  number: string;
  eventId: string;
  type: "dp" | "pelunasan" | "tambahan";
  label: string;
  amount: number;
  note: string;
  status: InvoiceStatus;
  proofNote: string;
  method: string;
  reference: string;
  paidAt: string | null;
  verifiedBy: string;
  createdAt: string;
};
export type PaymentSummary = { total: number; paid: number; outstanding: number };
export type BillingData = { invoices: Invoice[]; summary: PaymentSummary; instructions: string };

export type VersionDecision = "pending" | "approved" | "changes_requested" | "superseded";
export type ContentVersion = {
  id: string;
  eventId: string;
  number: number;
  decision: VersionDecision;
  note: string;
  submittedByName: string;
  submittedAt: string;
  decidedAt: string | null;
  decidedByRole: string;
};
export type PublishGate = { ok: boolean; reasons: string[]; approvedVersion: number | null };
export type ApprovalState = { versions: ContentVersion[]; latest: ContentVersion | null; gate: PublishGate; published: boolean };

export type ChatMessage = { id: string; eventId: string; senderId: string; senderRole: "owner" | "client"; senderName: string; text: string; createdAt: string };
export type ChatThread = { eventId: string; coupleName: string; lastMessage: { text: string; at: string; senderRole: string } | null; unread: number };

export type AuditEntry = { id: string; at: string; actorName: string; actorRole: string; eventId: string; action: string; detail: string };

export type OverviewEvent = { id: string; coupleName: string; slug: string; eventDate: string; status: string; isPublished: boolean; stage: string; total: number; paid: number; outstanding: number };
export type OwnerTask = { id: string; eventId: string; title: string; detail: string; priority: "high" | "normal" };
export type Overview = {
  events: OverviewEvent[];
  totals: { revenuePaid: number; revenueThisMonth: number; outstanding: number; awaitingVerification: number; invoicesPaid: number; invoicesOpen: number };
  packages: Array<{ name: string; count: number }>;
  leads: { baru: number; dihubungi: number };
  tasks: OwnerTask[];
};

export const getBilling = (eventId: string) => api<BillingData>("billing", [eventId]);
export const addInvoice = (eventId: string, data: { type: Invoice["type"]; amount: number; note: string }) => api<Invoice>("addInvoice", [eventId, data]);
export const updateInvoice = (id: string, data: Record<string, unknown>) => api<Invoice>("updateInvoice", [id, data]);

export const getApproval = (eventId: string) => api<ApprovalState>("approval", [eventId]);
export const submitVersion = (eventId: string) => api<ContentVersion>("submitVersion", [eventId]);
export const decideVersion = (id: string, decision: "approved" | "changes_requested", note: string) => api<ContentVersion>("decideVersion", [id, { decision, note }]);
export const publishEvent = (eventId: string, overrideReason?: string) => api<unknown>("publishEvent", [eventId, { overrideReason }]);
export const unpublishEvent = (eventId: string) => api<unknown>("unpublishEvent", [eventId]);

export const getMessages = (eventId: string) => api<ChatMessage[]>("messages", [eventId]);
export const sendMessage = (eventId: string, text: string) => api<ChatMessage>("sendMessage", [eventId, { text }]);
export const markRead = (eventId: string) => api<void>("markRead", [eventId]);
export const getThreads = () => api<ChatThread[]>("threads");

export const getAudit = (eventId?: string) => api<AuditEntry[]>("audit", [eventId ?? ""]);
export const getOverview = () => api<Overview>("overview");

export const formatRupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export const STAGE_STYLE: Record<string, string> = {
  "Menunggu DP": "bg-amber-50 text-amber-700",
  "Verifikasi DP": "bg-amber-50 text-amber-700",
  "Produksi konten": "bg-[#efe5d8] text-[#8b5e31]",
  "Menunggu persetujuan klien": "bg-sky-50 text-sky-700",
  "Perlu revisi": "bg-rose-50 text-rose-700",
  "Menunggu pelunasan": "bg-amber-50 text-amber-700",
  "Siap publish": "bg-emerald-50 text-emerald-700",
  Aktif: "bg-emerald-100 text-emerald-800",
  Selesai: "bg-gray-100 text-gray-600",
  "Belum ada tagihan": "bg-gray-100 text-gray-600",
};
