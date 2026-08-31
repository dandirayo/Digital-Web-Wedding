"use client";

import { FormEvent, useState } from "react";
import { DemoActionModal } from "./demo-action-modal";
import type { Guest } from "@/lib/types";

type AddGuestActionProps = {
  onAdd: (guest: Omit<Guest, "id" | "createdAt" | "qrCode" | "checkedInAt" | "eventId">) => void;
};

export function AddGuestAction({ onAdd }: AddGuestActionProps) {
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pax, setPax] = useState("1");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    onAdd({
      name: cleanName,
      phone,
      paxLimit: Number(pax) || 1,
      rsvpStatus: "pending",
      paxConfirmed: 0,
    });

    setName("");
    setPhone("");
    setPax("1");
    setSaved(true);
  }

  return (
    <DemoActionModal
      buttonLabel="Tambah Tamu"
      title="Tambah Tamu Manual"
      description="Form tampilan untuk menambahkan tamu satu per satu. Penyimpanan database akan disambungkan setelah CRUD tamu dibuat."
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <Field label="Nama tamu" placeholder="Contoh: Reza Pramudita" value={name} onChange={setName} />
        <Field label="Nomor WhatsApp" placeholder="Contoh: 08123456789" value={phone} onChange={setPhone} />
        <Field label="PAX" placeholder="Contoh: 2" type="number" value={pax} onChange={setPax} />
        {saved ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Tamu tersimpan di demo dashboard.
          </div>
        ) : null}
        <button className="h-11 w-full rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white">
          Simpan Tamu
        </button>
      </form>
    </DemoActionModal>
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
