"use client";

import { useEffect, useState } from "react";
import { getConsultationLeads, updateConsultationStatus, type ConsultationLead, type ConsultationStatus } from "@/lib/consultation-leads";

export function ConsultationInbox() {
  const [leads, setLeads] = useState<ConsultationLead[]>([]);

  useEffect(() => {
    const load = () => setLeads(getConsultationLeads());
    load();
    window.addEventListener("occasio:consultation-updated", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("occasio:consultation-updated", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  function changeStatus(id: string, status: ConsultationStatus) {
    setLeads(updateConsultationStatus(id, status));
  }

  return (
    <section id="consultations" className="mt-6 rounded-md border border-[#e0d4c7] bg-white p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a6a3a]">Lead intake</div>
          <h2 className="mt-2 text-xl font-semibold">Inbox Konsultasi</h2>
          <p className="mt-1 text-sm text-[#6b6056]">Brief dari website masuk ke sini sebelum dibuat menjadi workspace klien.</p>
        </div>
        <div className="rounded-full bg-[#efe5d8] px-3 py-1 text-xs font-semibold text-[#7b552f]">{leads.length} brief</div>
      </div>
      <div className="mt-5 grid gap-4">
        {leads.map((lead) => (
          <article key={lead.id} className="rounded-md border border-[#eadfd2] p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{lead.name}</h3>
                  <span className="rounded-full bg-[#f7f3ed] px-2 py-1 text-xs font-semibold text-[#9a6a3a]">{lead.package}</span>
                </div>
                <p className="mt-2 text-sm text-[#6b6056]">{lead.eventType} · {formatDate(lead.eventDate)} · {lead.template || 'Template belum dipilih'}</p>
                {lead.notes ? <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5d5146]">{lead.notes}</p> : null}
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <a href={`https://wa.me/${normalizePhone(lead.whatsapp)}?text=${encodeURIComponent(`Halo ${lead.name}, kami dari Occasio ingin menindaklanjuti konsultasi paket ${lead.package}.`)}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white">Hubungi WA</a>
                <select value={lead.status} onChange={(event) => changeStatus(lead.id, event.target.value as ConsultationStatus)} className="h-10 rounded-md border border-[#cdbba8] bg-white px-3 text-sm font-semibold text-[#5a4028]">
                  {['Baru', 'Dihubungi', 'Menjadi Klien'].map((status) => <option key={status}>{status}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4 grid gap-2 border-t border-[#eadfd2] pt-4 text-xs text-[#756a60] sm:grid-cols-3">
              <span>WA: {lead.whatsapp}</span><span>Budget: {lead.budget}</span><span>Sumber: {lead.source}</span>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs text-[#887a6d]">Mode pengembangan: inbox tersimpan di browser ini sampai database produksi diaktifkan.</p>
    </section>
  );
}

function normalizePhone(value: string) { return value.replace(/\D/g, '').replace(/^0/, '62'); }
function formatDate(value: string) { const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); }
