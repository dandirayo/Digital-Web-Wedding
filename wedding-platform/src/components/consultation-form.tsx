"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { saveConsultationLead, type ConsultationLead } from "@/lib/consultation-leads";

type IntakeForm = Omit<ConsultationLead, "id" | "status" | "submittedAt" | "source">;

const emptyForm: IntakeForm = {
  name: "",
  whatsapp: "",
  eventDate: "",
  eventType: "Pernikahan",
  template: "",
  package: "Premium",
  budget: "Rp1 juta - Rp2 juta",
  notes: "",
};

export function ConsultationForm({ initialTemplate = "" }: { initialTemplate?: string }) {
  const [form, setForm] = useState<IntakeForm>({ ...emptyForm, template: initialTemplate });
  const [savedLead, setSavedLead] = useState<ConsultationLead | null>(null);

  useEffect(() => {
    const encoded = window.location.hash.match(/intake=([^&]+)/)?.[1];
    if (!encoded) return;

    try {
      const decoded = JSON.parse(
        decodeURIComponent(escape(atob(decodeURIComponent(encoded)))),
      ) as Partial<ConsultationLead>;
      if (!decoded.name || !decoded.whatsapp || !decoded.eventDate || !decoded.package) return;

      const lead = saveConsultationLead({
        name: decoded.name,
        whatsapp: decoded.whatsapp,
        eventDate: decoded.eventDate,
        eventType: decoded.eventType || "Pernikahan",
        template: decoded.template || "Belum dipilih",
        package: normalizePackage(decoded.package),
        budget: decoded.budget || "Belum ditentukan",
        notes: decoded.notes || "",
        source: decoded.source || "Website Occasio",
        submittedAt: decoded.submittedAt || new Date().toISOString(),
      });
      queueMicrotask(() => setSavedLead(lead));
      window.history.replaceState(null, "", "/consultation?received=1");
    } catch {
      // Hash yang tidak valid diabaikan agar form tetap dapat digunakan manual.
    }
  }, []);

  function update<K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const lead = saveConsultationLead({
      ...form,
      source: "Management Occasio",
      submittedAt: new Date().toISOString(),
    });
    setSavedLead(lead);
  }

  if (savedLead) {
    return (
      <div className="rounded-md border border-[#d8c9b7] bg-white p-6 sm:p-8">
        <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
          Brief diterima
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Terima kasih, {savedLead.name}.</h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-[#6b6056]">
          Konsultasi untuk paket {savedLead.package} sudah masuk ke inbox management Occasio.
          Tim dapat melanjutkan follow-up, membuat order, lalu membuka workspace klien.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Summary label="Paket" value={savedLead.package} />
          <Summary label="Template" value={savedLead.template || "Belum dipilih"} />
          <Summary label="Tanggal" value={formatDate(savedLead.eventDate)} />
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-md bg-[#241f1a] px-5 text-sm font-semibold text-white">
            Masuk ke Workspace
          </Link>
          <button type="button" onClick={() => setSavedLead(null)} className="inline-flex h-11 items-center justify-center rounded-md border border-[#cdbba8] px-5 text-sm font-semibold text-[#5a4028]">
            Buat Brief Lain
          </button>
        </div>
        <p className="mt-5 text-xs leading-5 text-[#887a6d]">
          Mode pengembangan: brief tersimpan di perangkat ini sampai database produksi diaktifkan.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-[#d8c9b7] bg-white p-5 sm:p-7">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nama lengkap" required>
          <input required value={form.name} onChange={(event) => update("name", event.target.value)} className={inputClass} placeholder="Nama calon klien" />
        </Field>
        <Field label="Nomor WhatsApp" required>
          <input required value={form.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} className={inputClass} placeholder="62812..." />
        </Field>
        <Field label="Tanggal acara" required>
          <input required type="date" value={form.eventDate} onChange={(event) => update("eventDate", event.target.value)} className={inputClass} />
        </Field>
        <Field label="Jenis acara" required>
          <select value={form.eventType} onChange={(event) => update("eventType", event.target.value)} className={inputClass}>
            {['Pernikahan', 'Akad', 'Resepsi', 'Engagement'].map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Template pilihan">
          <input value={form.template} onChange={(event) => update("template", event.target.value)} className={inputClass} placeholder="Contoh: Rose Editorial" />
        </Field>
        <Field label="Paket" required>
          <select value={form.package} onChange={(event) => update("package", normalizePackage(event.target.value))} className={inputClass}>
            {['Basic', 'Premium', 'Signature'].map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Kisaran budget" required>
          <select value={form.budget} onChange={(event) => update("budget", event.target.value)} className={inputClass}>
            {['< Rp1 juta', 'Rp1 juta - Rp2 juta', 'Rp2 juta - Rp5 juta', '> Rp5 juta'].map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Catatan kebutuhan" wide>
          <textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} className={`${inputClass} min-h-28 py-3`} placeholder="Jumlah tamu, kebutuhan QR, domain, atau catatan lainnya" />
        </Field>
      </div>
      <button className="mt-5 h-12 w-full rounded-md bg-[#241f1a] px-5 text-sm font-semibold text-white transition hover:bg-[#3a3129]">
        Kirim Brief ke Management
      </button>
    </form>
  );
}

const inputClass = "h-11 w-full rounded-md border border-[#d8c9b7] bg-[#fffaf4] px-3 text-sm text-[#241f1a] outline-none transition focus:border-[#9a6a3a]";

function Field({ label, required, wide, children }: { label: string; required?: boolean; wide?: boolean; children: React.ReactNode }) {
  return <label className={wide ? "md:col-span-2" : ""}><span className="mb-2 block text-sm font-semibold">{label}{required ? " *" : ""}</span>{children}</label>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-[#f7f3ed] p-4"><div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a6a3a]">{label}</div><div className="mt-2 font-semibold">{value}</div></div>;
}

function normalizePackage(value: string): "Basic" | "Premium" | "Signature" {
  if (value === "Basic" || value === "Premium" || value === "Signature") return value;
  return value === "Custom" || value === "Full Service" ? "Signature" : "Premium";
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
