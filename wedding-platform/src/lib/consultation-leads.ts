import { api } from "./api";

export const CONSULTATION_STATUSES = ["Baru", "Dihubungi", "Menjadi Klien", "Batal"] as const;
export type ConsultationStatus = (typeof CONSULTATION_STATUSES)[number];

export type ConsultationLead = {
  id: string;
  name: string;
  whatsapp: string;
  eventDate: string;
  eventType: string;
  template: string;
  package: "Basic" | "Premium" | "Signature";
  budget: string;
  notes: string;
  ownerNote: string;
  clientId?: string;
  eventId?: string;
  source: string;
  status: ConsultationStatus;
  createdAt: string;
  updatedAt: string;
};

export type ConsultationInput = Pick<ConsultationLead, "name" | "whatsapp" | "eventDate" | "eventType" | "template" | "package" | "budget" | "notes">;

// Pengiriman brief dari halaman /consultation (origin yang sama dengan API).
export async function submitConsultation(input: ConsultationInput): Promise<void> {
  const response = await fetch("/api/leads", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Brief belum terkirim. Coba lagi.");
}

export const getConsultationLeads = () => api<ConsultationLead[]>("leads");
export const updateConsultationLead = (id: string, patch: Partial<Pick<ConsultationLead, "status" | "ownerNote">>) =>
  api<ConsultationLead>("updateLead", [id, patch]);
export const deleteConsultationLead = (id: string) => api<void>("deleteLead", [id]);
export const convertConsultationLead = (id: string, email: string) =>
  api<{ lead: ConsultationLead; event: { id: string; slug: string }; client: { email: string }; temporaryPassword: string }>("convertLead", [id, { email }]);
