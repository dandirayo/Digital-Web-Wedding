"use client";

import { FormEvent, useMemo, useState } from "react";
import type { WeddingEvent } from "@/lib/demo-data";
import { DemoActionModal } from "./demo-action-modal";

type CreateEventActionProps = {
  onCreate: (event: WeddingEvent) => void;
};

export function CreateEventAction({ onCreate }: CreateEventActionProps) {
  const [saved, setSaved] = useState(false);
  const [couple, setCouple] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [slug, setSlug] = useState("");
  const [date, setDate] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanCouple = couple.trim();
    const cleanSlug =
      slug.trim() ||
      cleanCouple
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    if (!cleanCouple || !cleanSlug) return;

    onCreate({
      id: `evt_${Date.now().toString(36)}`,
      slug: cleanSlug,
      couple: cleanCouple,
      clientName: clientEmail || "Client Baru",
      packageName: "Premium",
      date: date || "Belum ditentukan",
      venue: "Venue belum diisi",
      status: "draft",
      guests: 0,
      rsvpYes: 0,
      rsvpNo: 0,
      wishes: 0,
      checkIns: 0,
      lastActivity: "Baru dibuat",
    });

    setCouple("");
    setClientEmail("");
    setSlug("");
    setDate("");
    setSaved(true);
  }

  return (
    <DemoActionModal
      buttonLabel="Buat Event"
      title="Buat Event Baru"
      description="Form tampilan untuk membuat workspace client baru. Nanti akan membuat row event, client access, dan slug website."
      variant="light"
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <Field label="Nama pasangan" placeholder="Contoh: Andi & Rina" value={couple} onChange={setCouple} />
        <Field label="Email client" placeholder="client@email.com" type="email" value={clientEmail} onChange={setClientEmail} />
        <Field label="Slug website" placeholder="andi-rina" value={slug} onChange={setSlug} />
        <Field label="Tanggal event" placeholder="2027-02-14" type="date" value={date} onChange={setDate} />
        {saved ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Event tersimpan di demo dashboard.
          </div>
        ) : null}
        <button className="h-11 w-full rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white">
          Simpan Draft
        </button>
      </form>
    </DemoActionModal>
  );
}

export function ExportReportAction({ events }: { events: WeddingEvent[] }) {
  const csv = useMemo(() => {
    const rows = [
      ["couple", "status", "guests", "rsvp", "wishes", "check_ins"],
      ...events.map((event) => [
        event.couple,
        event.status,
        String(event.guests),
        String(event.rsvpYes + event.rsvpNo),
        String(event.wishes),
        String(event.checkIns),
      ]),
    ];

    return rows.map((row) => row.join(",")).join("\n");
  }, [events]);

  function downloadReport() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "occasio-event-report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <DemoActionModal
      buttonLabel="Export Report"
      title="Export Report"
      description="Preview laporan event aktif. Tombol download sudah menghasilkan file CSV dari data demo dashboard."
      variant="light"
    >
      <div className="rounded-md border border-[#eadfd2] bg-[#fffaf4] p-4">
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-xs text-[#5d5146]">{csv}</pre>
      </div>
      <button
        type="button"
        onClick={downloadReport}
        className="mt-4 h-11 w-full rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white"
      >
        Download CSV
      </button>
    </DemoActionModal>
  );
}

export function PipelineAction({ stage, description }: { stage: string; description: string }) {
  return (
    <DemoActionModal
      buttonLabel="Buka Board"
      title={stage}
      description={description}
      variant="light"
    >
      <div className="space-y-3">
        {["Follow-up client", "Lengkapi konten", "Cek pembayaran"].map((item, index) => (
          <div key={item} className="rounded-md border border-[#eadfd2] bg-[#fffaf4] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a6a3a]">
              Task 0{index + 1}
            </div>
            <div className="mt-1 font-semibold">{item}</div>
            <p className="mt-2 text-sm leading-6 text-[#6b6056]">
              Card demo ini nanti bisa menjadi kanban order dan progres setup event.
            </p>
          </div>
        ))}
      </div>
    </DemoActionModal>
  );
}

export function CreateInvoiceAction() {
  const [saved, setSaved] = useState(false);

  return (
    <DemoActionModal
      buttonLabel="Buat Invoice"
      title="Buat Invoice"
      description="Form tampilan untuk membuat invoice client. Nanti bisa disambungkan ke payment gateway atau manual payment tracking."
      variant="light"
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(true);
        }}
      >
        <LooseField label="Client" placeholder="Sheila & Yoga" />
        <LooseField label="Paket" placeholder="Premium" />
        <LooseField label="Nominal" placeholder="1490000" type="number" />
        <LooseField label="Jatuh tempo" placeholder="2027-01-01" type="date" />
        {saved ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Invoice preview siap dibuat.
          </div>
        ) : null}
        <button className="h-11 w-full rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white">
          Simpan Invoice
        </button>
      </form>
    </DemoActionModal>
  );
}

function LooseField({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#756a60]">{label}</span>
      <input
        className="mt-2 h-11 w-full rounded-md border border-[#e0d4c7] bg-[#fffaf4] px-3 text-sm outline-none transition focus:border-[#9a6a3a]"
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#756a60]">{label}</span>
      <input
        className="mt-2 h-11 w-full rounded-md border border-[#e0d4c7] bg-[#fffaf4] px-3 text-sm outline-none transition focus:border-[#9a6a3a]"
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
