"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CONSULTATION_STATUSES,
  deleteConsultationLead,
  getConsultationLeads,
  updateConsultationLead,
  type ConsultationLead,
  type ConsultationStatus,
  convertConsultationLead,
} from "@/lib/consultation-leads";
import Link from "next/link";
import { WorkspaceDialog } from "@/components/workspace-dialog";

export function ConsultationInbox() {
  const [leads, setLeads] = useState<ConsultationLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"Semua" | ConsultationStatus>("Semua");

  useEffect(() => {
    getConsultationLeads()
      .then((data) => setLeads(data))
      .catch((e) => setError(e instanceof Error ? e.message : "Inbox tidak dapat dimuat."))
      .finally(() => setLoading(false));
  }, []);

  async function patch(id: string, data: Partial<Pick<ConsultationLead, "status" | "ownerNote">>) {
    try {
      const saved = await updateConsultationLead(id, data);
      setLeads((current) => current.map((lead) => (lead.id === id ? saved : lead)));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Perubahan gagal disimpan.");
    }
  }

  const [converting, setConverting] = useState<ConsultationLead | null>(null);
  const [email, setEmail] = useState("");
  const [convertError, setConvertError] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string; eventId: string } | null>(null);

  function openConvert(lead: ConsultationLead) {
    setConverting(lead);
    setEmail("");
    setConvertError("");
    setCreated(null);
  }

  async function convert(event: React.FormEvent) {
    event.preventDefault();
    if (!converting) return;
    setBusy(true);
    setConvertError("");
    try {
      const result = await convertConsultationLead(converting.id, email);
      setLeads((current) => current.map((lead) => (lead.id === result.lead.id ? result.lead : lead)));
      setCreated({ email: result.client.email, password: result.temporaryPassword, eventId: result.event.id });
    } catch (e) {
      setConvertError(e instanceof Error ? e.message : "Gagal membuat akun klien.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(lead: ConsultationLead) {
    if (!window.confirm(`Hapus brief dari ${lead.name}? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await deleteConsultationLead(lead.id);
      setLeads((current) => current.filter((item) => item.id !== lead.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Brief gagal dihapus.");
    }
  }

  const summary = useMemo(() => {
    const count = (pick: (lead: ConsultationLead) => string) => {
      const map = new Map<string, number>();
      for (const lead of leads) {
        const key = pick(lead) || "Belum dipilih";
        map.set(key, (map.get(key) || 0) + 1);
      }
      return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    };
    const converted = leads.filter((lead) => lead.status === "Menjadi Klien").length;
    return {
      templates: count((lead) => lead.template),
      budgets: count((lead) => lead.budget),
      packages: count((lead) => lead.package),
      rate: leads.length ? Math.round((converted / leads.length) * 100) : 0,
    };
  }, [leads]);

  const visible = filter === "Semua" ? leads : leads.filter((lead) => lead.status === filter);

  return (
    <section id="consultations" className="mt-6 rounded-md border border-[#e0d4c7] bg-white p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a6a3a]">Lead intake</div>
          <h2 className="mt-2 text-xl font-semibold">Inbox Konsultasi</h2>
          <p className="mt-1 text-sm text-[#6b6056]">Brief dari website masuk ke sini sebelum dibuat menjadi workspace klien.</p>
        </div>
        <div className="flex items-center gap-2">
          <select aria-label="Filter status" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="h-11 rounded-md border border-[#cdbba8] bg-white px-3 text-sm font-semibold text-[#5a4028]">
            {["Semua", ...CONSULTATION_STATUSES].map((status) => <option key={status}>{status}</option>)}
          </select>
          <div className="rounded-full bg-[#efe5d8] px-3 py-1 text-xs font-semibold text-[#7b552f]">{leads.length} brief</div>
        </div>
      </div>

      {leads.length ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Insight title="Template diminati" rows={summary.templates} />
          <Insight title="Kisaran budget" rows={summary.budgets} />
          <Insight title="Paket diminati" rows={summary.packages} />
          <div className="rounded-md bg-[#f7f3ed] p-3">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a6a3a]">Jadi klien</div>
            <div className="mt-2 text-2xl font-semibold">{summary.rate}%</div>
          </div>
        </div>
      ) : null}

      {error ? <p role="alert" className="mt-4 text-sm font-medium text-rose-700">{error}</p> : null}
      {loading ? <p className="mt-5 text-sm text-[#6b6056]">Memuat brief...</p> : null}
      {!loading && !visible.length ? <p className="mt-5 text-sm text-[#6b6056]">Belum ada brief{filter === "Semua" ? "" : ` berstatus ${filter}`}.</p> : null}

      <div className="mt-5 grid gap-4">
        {visible.map((lead) => (
          <article key={lead.id} className="rounded-md border border-[#eadfd2] p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{lead.name}</h3>
                  <span className="rounded-full bg-[#f7f3ed] px-2 py-1 text-xs font-semibold text-[#9a6a3a]">{lead.package}</span>
                </div>
                <p className="mt-2 text-sm text-[#6b6056]">{lead.eventType} · {formatDate(lead.eventDate)} · {lead.template || "Template belum dipilih"}</p>
                {lead.notes ? <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5d5146]">{lead.notes}</p> : null}
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <a href={`https://wa.me/${lead.whatsapp}?text=${encodeURIComponent(`Halo ${lead.name}, kami dari Occasio ingin menindaklanjuti konsultasi paket ${lead.package}.`)}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white">Hubungi WA</a>
                <select aria-label={`Status ${lead.name}`} value={lead.status} onChange={(event) => patch(lead.id, { status: event.target.value as ConsultationStatus })} className="h-11 rounded-md border border-[#cdbba8] bg-white px-3 text-sm font-semibold text-[#5a4028]">
                  {CONSULTATION_STATUSES.map((status) => <option key={status}>{status}</option>)}
                </select>
                {lead.eventId ? (
                  <Link href={`/owner/events/${lead.eventId}`} className="inline-flex h-11 items-center justify-center rounded-md border border-emerald-200 px-4 text-sm font-semibold text-emerald-700">Buka event</Link>
                ) : (
                  <button type="button" onClick={() => openConvert(lead)} className="inline-flex h-11 items-center justify-center rounded-md border border-[#cdbba8] px-4 text-sm font-semibold text-[#5a4028]">Jadikan klien</button>
                )}
                <button type="button" onClick={() => remove(lead)} className="inline-flex h-11 items-center justify-center rounded-md border border-rose-200 px-4 text-sm font-semibold text-rose-700">Hapus</button>
              </div>
            </div>
            <NoteField key={lead.updatedAt} lead={lead} onSave={(ownerNote) => patch(lead.id, { ownerNote })} />
            <div className="mt-4 grid gap-2 border-t border-[#eadfd2] pt-4 text-xs text-[#756a60] sm:grid-cols-4">
              <span>WA: {lead.whatsapp}</span><span>Budget: {lead.budget}</span><span>Sumber: {lead.source}</span><span>Masuk: {new Date(lead.createdAt).toLocaleString("id-ID")}</span>
            </div>
          </article>
        ))}
      </div>

      <WorkspaceDialog open={Boolean(converting)} onClose={() => setConverting(null)} closeDisabled={busy} title={created ? "Akun klien dibuat" : "Jadikan klien"} description={created ? undefined : `Membuat akun klien dan event draft Basic untuk ${converting?.name ?? ""}.`}>
        {created ? (
          <div className="space-y-4 text-sm">
            <p className="text-[#6b6056]">Catat password sementara ini sekarang. Password tidak akan ditampilkan lagi; kirim ke klien lewat WhatsApp dan minta segera menggantinya.</p>
            <dl className="rounded-md bg-[#f7f3ed] p-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-[#9a6a3a]">Email</dt>
              <dd className="mb-3 font-semibold break-all">{created.email}</dd>
              <dt className="text-xs font-semibold uppercase tracking-wider text-[#9a6a3a]">Password sementara</dt>
              <dd className="font-mono font-semibold break-all select-all">{created.password}</dd>
            </dl>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href={`/owner/events/${created.eventId}`} className="inline-flex h-11 items-center justify-center rounded-md bg-[#241f1a] px-4 font-semibold text-white">Buka event</Link>
              <button type="button" onClick={() => setConverting(null)} className="inline-flex h-11 items-center justify-center rounded-md border border-[#cdbba8] px-4 font-semibold text-[#5a4028]">Selesai</button>
            </div>
          </div>
        ) : (
          <form onSubmit={convert} className="space-y-4">
            <label className="block text-sm font-semibold">Email klien
              <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[#d8c9b7] bg-[#fffaf4] px-3 text-base outline-none focus:border-[#9a6a3a] sm:text-sm" placeholder="klien@contoh.com" />
            </label>
            <p className="text-xs leading-5 text-[#6b6056]">Template dicocokkan dengan nama pilihan klien; bila tidak ada di aplikasi, dipakai template aktif pertama dan bisa diganti di detail event. Nama pasangan, slug, dan venue dapat diedit setelahnya.</p>
            {convertError ? <p role="alert" className="text-sm font-medium text-rose-700">{convertError}</p> : null}
            <button disabled={busy} className="h-11 w-full rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Membuat..." : "Buat akun dan event"}</button>
          </form>
        )}
      </WorkspaceDialog>
    </section>
  );
}

function NoteField({ lead, onSave }: { lead: ConsultationLead; onSave: (note: string) => void }) {
  const [value, setValue] = useState(lead.ownerNote);
  return (
    <div className="mt-4">
      <label className="text-xs font-semibold uppercase tracking-wider text-[#9a6a3a]" htmlFor={`note-${lead.id}`}>Catatan owner</label>
      <textarea id={`note-${lead.id}`} value={value} onChange={(event) => setValue(event.target.value)} onBlur={() => value !== lead.ownerNote && onSave(value)} maxLength={2000} placeholder="Hasil follow-up, penawaran, atau jadwal" className="mt-1 min-h-16 w-full rounded-md border border-[#d8c9b7] bg-[#fffaf4] px-3 py-2 text-base outline-none focus:border-[#9a6a3a] sm:text-sm" />
    </div>
  );
}

function Insight({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div className="rounded-md bg-[#f7f3ed] p-3">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a6a3a]">{title}</div>
      <ul className="mt-2 space-y-1 text-sm">
        {rows.map(([label, total]) => <li key={label} className="flex justify-between gap-2"><span className="truncate">{label}</span><span className="font-semibold">{total}</span></li>)}
      </ul>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
