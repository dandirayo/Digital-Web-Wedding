export type ConsultationStatus = "Baru" | "Dihubungi" | "Menjadi Klien";

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
  source: string;
  submittedAt: string;
  status: ConsultationStatus;
};

const STORAGE_KEY = "occasio_consultation_leads_v1";

export const demoConsultationLead: ConsultationLead = {
  id: "lead-demo-ayu",
  name: "Ayu Wulandari",
  whatsapp: "6281234567890",
  eventDate: "2027-02-14",
  eventType: "Pernikahan",
  template: "Rose Editorial",
  package: "Premium",
  budget: "Rp1 juta - Rp2 juta",
  notes: "Membutuhkan undangan untuk sekitar 350 tamu dan QR check-in.",
  source: "Website Occasio",
  submittedAt: "2026-09-06T08:30:00.000Z",
  status: "Baru",
};

export function getConsultationLeads(): ConsultationLead[] {
  if (typeof window === "undefined") return [demoConsultationLead];
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as ConsultationLead[];
    return saved.some((lead) => lead.id === demoConsultationLead.id)
      ? saved
      : [demoConsultationLead, ...saved];
  } catch {
    return [demoConsultationLead];
  }
}

export function saveConsultationLead(
  data: Omit<ConsultationLead, "id" | "status">,
): ConsultationLead {
  const leads = getConsultationLeads();
  const duplicate = leads.find(
    (lead) => lead.whatsapp === data.whatsapp && lead.submittedAt === data.submittedAt,
  );
  if (duplicate) return duplicate;

  const lead: ConsultationLead = {
    ...data,
    id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status: "Baru",
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([lead, ...leads]));
  window.dispatchEvent(new CustomEvent("occasio:consultation-updated"));
  return lead;
}

export function updateConsultationStatus(id: string, status: ConsultationStatus) {
  const updated = getConsultationLeads().map((lead) =>
    lead.id === id ? { ...lead, status } : lead,
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("occasio:consultation-updated"));
  return updated;
}
