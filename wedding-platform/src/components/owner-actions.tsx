"use client";

import { useMemo, useState } from "react";
import { events } from "@/lib/demo-data";
import { DemoActionModal } from "./demo-action-modal";

export function CreateEventAction() {
  const [saved, setSaved] = useState(false);

  return (
    <DemoActionModal
      buttonLabel="Buat Event"
      title="Buat Event Baru"
      description="Form tampilan untuk membuat workspace client baru. Nanti akan membuat row event, client access, dan slug website."
      variant="light"
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(true);
        }}
      >
        <Field label="Nama pasangan" placeholder="Contoh: Andi & Rina" />
        <Field label="Email client" placeholder="client@email.com" type="email" />
        <Field label="Slug website" placeholder="andi-rina" />
        <Field label="Tanggal event" placeholder="2027-02-14" type="date" />
        {saved ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Draft event siap dibuat. Integrasi database akan menyimpan data ini ke table events.
          </div>
        ) : null}
        <button className="h-11 w-full rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white">
          Simpan Draft
        </button>
      </form>
    </DemoActionModal>
  );
}

export function ExportReportAction() {
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
  }, []);

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
        <Field label="Client" placeholder="Sheila & Yoga" />
        <Field label="Paket" placeholder="Premium" />
        <Field label="Nominal" placeholder="1490000" type="number" />
        <Field label="Jatuh tempo" placeholder="2027-01-01" type="date" />
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

function Field({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
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
