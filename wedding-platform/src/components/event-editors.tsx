"use client";

import { useState } from "react";

// Editor bersama untuk dashboard owner: setiap grup memiliki tombol Simpan sendiri,
// hanya mengirim field yang berubah, dan menampilkan pesan gagal/berhasil.

export type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "datetime" | "date" | "select";
  options?: { value: string; label: string }[];
  hint?: string;
  placeholder?: string;
  maxLength?: number;
};

const inputClass =
  "mt-1 block w-full rounded-md border border-[#cdbba8] bg-white px-3 text-base outline-none focus:border-[#9a6a3a] sm:text-sm";

function useSave() {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  async function run(task: () => Promise<void>) {
    setSaving(true);
    setMessage(null);
    try {
      await task();
      setMessage({ ok: true, text: "Tersimpan." });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Gagal menyimpan." });
    } finally {
      setSaving(false);
    }
  }
  return { saving, message, run };
}

function Status({ message }: { message: { ok: boolean; text: string } | null }) {
  if (!message) return null;
  return (
    <span role={message.ok ? "status" : "alert"} className={`text-sm font-medium ${message.ok ? "text-emerald-700" : "text-rose-700"}`}>
      {message.text}
    </span>
  );
}

function Control({ field, value, onChange }: { field: FieldDef; value: string; onChange: (value: string) => void }) {
  const id = `f-${field.key}`;
  if (field.type === "textarea")
    return <textarea id={id} value={value} maxLength={field.maxLength} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} className={`${inputClass} min-h-28 py-2`} />;
  if (field.type === "select")
    return (
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} h-11`}>
        {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    );
  const type = field.type === "datetime" ? "datetime-local" : field.type === "date" ? "date" : "text";
  return <input id={id} type={type} value={value} maxLength={field.maxLength} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} className={`${inputClass} h-11`} />;
}

export function GroupForm({
  title,
  fields,
  values,
  onSave,
}: {
  title: string;
  fields: FieldDef[];
  values: Record<string, string>;
  onSave: (patch: Record<string, string>) => Promise<void>;
}) {
  const [draft, setDraft] = useState(values);
  const { saving, message, run } = useSave();
  const changed = fields.filter((f) => draft[f.key] !== values[f.key]);

  return (
    <form
      className="rounded-md border border-[#eadfd2] bg-[#fffaf4] p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!changed.length) return;
        run(() => onSave(Object.fromEntries(changed.map((f) => [f.key, draft[f.key]]))));
      }}
    >
      <h3 className="mb-3 text-base font-semibold">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
            <label htmlFor={`f-${field.key}`} className="text-xs font-semibold uppercase tracking-wider text-[#9a6a3a]">{field.label}</label>
            <Control field={field} value={draft[field.key] ?? ""} onChange={(value) => setDraft((current) => ({ ...current, [field.key]: value }))} />
            {field.hint ? <p className="mt-1 text-xs text-[#6b6056]">{field.hint}</p> : null}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button disabled={saving || !changed.length} className="h-11 rounded-md bg-[#241f1a] px-5 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
        {changed.length ? <button type="button" onClick={() => setDraft(values)} className="h-11 rounded-md border border-[#cdbba8] px-4 text-sm font-semibold text-[#5a4028]">Batalkan perubahan</button> : null}
        <Status message={message} />
      </div>
    </form>
  );
}

export function ListEditor<T extends Record<string, string>>({
  title,
  items,
  fields,
  empty,
  addLabel,
  onSave,
}: {
  title: string;
  items: T[];
  fields: FieldDef[];
  empty: T;
  addLabel: string;
  onSave: (items: T[]) => Promise<void>;
}) {
  const [draft, setDraft] = useState<T[]>(items);
  const { saving, message, run } = useSave();
  const dirty = JSON.stringify(draft) !== JSON.stringify(items);

  return (
    <form
      className="rounded-md border border-[#eadfd2] bg-[#fffaf4] p-4"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => onSave(draft));
      }}
    >
      <h3 className="mb-3 text-base font-semibold">{title}</h3>
      {!draft.length ? <p className="mb-3 text-sm italic text-[#6b6056]">Belum ada data.</p> : null}
      <div className="space-y-3">
        {draft.map((item, index) => (
          <div key={index} className="rounded-md border border-[#eadfd2] bg-white p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <label htmlFor={`l-${index}-${field.key}`} className="text-xs font-semibold uppercase tracking-wider text-[#9a6a3a]">{field.label}</label>
                  {field.type === "textarea" ? (
                    <textarea id={`l-${index}-${field.key}`} value={item[field.key] ?? ""} maxLength={field.maxLength} onChange={(e) => setDraft((list) => list.map((row, i) => (i === index ? { ...row, [field.key]: e.target.value } : row)))} className={`${inputClass} min-h-20 py-2`} />
                  ) : (
                    <input id={`l-${index}-${field.key}`} value={item[field.key] ?? ""} maxLength={field.maxLength} onChange={(e) => setDraft((list) => list.map((row, i) => (i === index ? { ...row, [field.key]: e.target.value } : row)))} className={`${inputClass} h-11`} />
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setDraft((list) => list.filter((_, i) => i !== index))} className="mt-3 h-9 rounded-md border border-rose-200 px-3 text-xs font-semibold text-rose-700">Hapus baris</button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setDraft((list) => [...list, { ...empty }])} className="h-11 rounded-md border border-[#cdbba8] px-4 text-sm font-semibold text-[#5a4028]">{addLabel}</button>
        <button disabled={saving || !dirty} className="h-11 rounded-md bg-[#241f1a] px-5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan"}</button>
        <Status message={message} />
      </div>
    </form>
  );
}

// Konversi tanggal: nilai disimpan sebagai ISO dengan zona WIB (+07:00), formulir memakai input lokal.
const parts = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const map = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(date).map((p) => [p.type, p.value]),
  );
  return map as Record<string, string>;
};
export function isoToDateTimeInput(iso: string | null | undefined) {
  const p = iso ? parts(iso) : null;
  return p ? `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}` : "";
}
export function isoToDateInput(iso: string | null | undefined) {
  const p = iso ? parts(iso) : null;
  return p ? `${p.year}-${p.month}-${p.day}` : "";
}
export const dateTimeInputToIso = (value: string) => `${value}:00+07:00`;
export const dateInputToIso = (value: string) => (value ? `${value}T00:00:00+07:00` : null);
