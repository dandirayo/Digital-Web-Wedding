"use client";

import { useState } from "react";
import { DemoActionModal } from "./demo-action-modal";

export function AddGuestAction() {
  const [saved, setSaved] = useState(false);

  return (
    <DemoActionModal
      buttonLabel="Tambah Tamu"
      title="Tambah Tamu Manual"
      description="Form tampilan untuk menambahkan tamu satu per satu. Penyimpanan database akan disambungkan setelah CRUD tamu dibuat."
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(true);
        }}
      >
        <Field label="Nama tamu" placeholder="Contoh: Reza Pramudita" />
        <Field label="Nomor WhatsApp" placeholder="Contoh: 08123456789" />
        <Field label="PAX" placeholder="Contoh: 2" type="number" />
        {saved ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Preview tersimpan. Nanti data ini akan masuk ke table guests.
          </div>
        ) : null}
        <button className="h-11 w-full rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white">
          Simpan Preview
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
