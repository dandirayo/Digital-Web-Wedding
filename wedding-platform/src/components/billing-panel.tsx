"use client";

import { useCallback, useEffect, useState } from "react";
import { addInvoice, formatRupiah, getBilling, updateInvoice, type BillingData, type Invoice } from "@/lib/business";

const STATUS: Record<Invoice["status"], { label: string; style: string }> = {
  unpaid: { label: "Belum dibayar", style: "bg-amber-50 text-amber-700" },
  proof_submitted: { label: "Menunggu verifikasi", style: "bg-sky-50 text-sky-700" },
  paid: { label: "Lunas", style: "bg-emerald-50 text-emerald-700" },
  void: { label: "Dibatalkan", style: "bg-gray-100 text-gray-500" },
};
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
const input = "mt-1 block w-full rounded-md border border-[#cdbba8] bg-white px-3 text-base outline-none focus:border-[#9a6a3a] sm:text-sm";
const label = "text-xs font-semibold uppercase tracking-wider text-[#9a6a3a]";

type Form = { id: string; op: "report" | "pay" | "edit" } | { id: "new"; op: "add" } | null;

export function BillingPanel({ eventId, role }: { eventId: string; role: "owner" | "client" }) {
  const [data, setData] = useState<BillingData | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Form>(null);
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      setData(await getBilling(eventId));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tagihan tidak dapat dimuat.");
    }
  }, [eventId]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const set = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const open = (next: Form, preset: Record<string, string> = {}) => {
    setForm(next);
    setValues(preset);
    setError("");
  };

  async function run(task: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await task();
      setForm(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  }

  async function simple(invoice: Invoice, op: "void" | "reopen") {
    const question = op === "void" ? `Batalkan tagihan ${invoice.number}?` : `Buka kembali tagihan ${invoice.number}? Status lunas akan dicabut.`;
    if (!window.confirm(question)) return;
    await run(() => updateInvoice(invoice.id, { op }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    if (form.op === "add") return run(() => addInvoice(eventId, { type: (values.type || "tambahan") as Invoice["type"], amount: Number(values.amount), note: values.note ?? "" }));
    if (form.op === "report") return run(() => updateInvoice(form.id, { op: "report", note: values.note ?? "" }));
    if (form.op === "pay") return run(() => updateInvoice(form.id, { op: "pay", method: values.method || "transfer", reference: values.reference ?? "", paidAt: values.paidAt }));
    return run(() => updateInvoice(form.id, { op: "edit", amount: Number(values.amount), note: values.note ?? "" }));
  }

  if (!data) return <p className="text-sm text-[#6b6056]">{error || "Memuat tagihan..."}</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[["Total tagihan", data.summary.total], ["Terbayar", data.summary.paid], ["Sisa", data.summary.outstanding]].map(([name, value]) => (
          <div key={name as string} className="rounded-md border border-[#eadfd2] bg-white p-3 text-center">
            <div className="text-base font-bold sm:text-xl">{formatRupiah(value as number)}</div>
            <div className="mt-1 text-[11px] font-semibold uppercase text-[#6b6056]">{name}</div>
          </div>
        ))}
      </div>

      {data.instructions ? (
        <div className="rounded-md border border-[#eadfd2] bg-[#fffaf4] p-4 text-sm">
          <div className={label}>Cara pembayaran</div>
          <p className="mt-1 whitespace-pre-line text-[#5d5146]">{data.instructions}</p>
        </div>
      ) : role === "owner" ? (
        <p className="text-xs text-[#887a6d]">Isi petunjuk pembayaran (rekening tujuan) di Kelola → Situs publik agar tampil di sini untuk klien.</p>
      ) : null}

      {error ? <p role="alert" className="text-sm font-medium text-rose-700">{error}</p> : null}

      {!data.invoices.length ? <p className="text-sm italic text-[#6b6056]">Belum ada tagihan.</p> : null}
      <ul className="space-y-3">
        {data.invoices.map((invoice) => (
          <li key={invoice.id} className="rounded-md border border-[#eadfd2] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{invoice.label} <span className="text-xs font-normal text-[#887a6d]">{invoice.number}</span></div>
                <div className="text-lg font-bold">{formatRupiah(invoice.amount)}</div>
                {invoice.note ? <div className="text-xs text-[#6b6056]">{invoice.note}</div> : null}
              </div>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS[invoice.status].style}`}>{STATUS[invoice.status].label}</span>
            </div>
            {invoice.proofNote ? <p className="mt-2 text-xs text-[#5d5146]">Laporan klien: {invoice.proofNote}</p> : null}
            {invoice.status === "paid" ? <p className="mt-2 text-xs text-emerald-700">Dikonfirmasi {invoice.verifiedBy} · {invoice.method}{invoice.reference ? ` · ${invoice.reference}` : ""} · {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString("id-ID") : ""}</p> : null}

            <div className="mt-3 flex flex-wrap gap-2">
              {role === "client" && (invoice.status === "unpaid" || invoice.status === "proof_submitted") ? (
                <button type="button" onClick={() => open({ id: invoice.id, op: "report" })} className="h-10 rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white">{invoice.status === "proof_submitted" ? "Ubah laporan" : "Saya sudah bayar"}</button>
              ) : null}
              {role === "owner" && invoice.status !== "paid" && invoice.status !== "void" ? (
                <>
                  <button type="button" onClick={() => open({ id: invoice.id, op: "pay" }, { method: "transfer", paidAt: today(), reference: "" })} className="h-10 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white">Tandai lunas</button>
                  <button type="button" onClick={() => open({ id: invoice.id, op: "edit" }, { amount: String(invoice.amount), note: invoice.note })} className="h-10 rounded-md border border-[#cdbba8] px-4 text-sm font-semibold text-[#5a4028]">Ubah</button>
                  <button type="button" onClick={() => simple(invoice, "void")} className="h-10 rounded-md border border-rose-200 px-4 text-sm font-semibold text-rose-700">Batalkan</button>
                </>
              ) : null}
              {role === "owner" && (invoice.status === "paid" || invoice.status === "void") ? (
                <button type="button" onClick={() => simple(invoice, "reopen")} className="h-10 rounded-md border border-[#cdbba8] px-4 text-sm font-semibold text-[#5a4028]">Buka kembali</button>
              ) : null}
            </div>

            {form && form.id === invoice.id ? (
              <form onSubmit={submit} className="mt-3 space-y-3 rounded-md bg-[#fffaf4] p-3">
                {form.op === "report" ? (
                  <label className={label}>Keterangan pembayaran (bank, tanggal, nama pengirim)
                    <textarea required maxLength={500} value={values.note ?? ""} onChange={(e) => set("note", e.target.value)} className={`${input} min-h-20 py-2`} />
                  </label>
                ) : null}
                {form.op === "pay" ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className={label}>Metode
                      <select value={values.method} onChange={(e) => set("method", e.target.value)} className={`${input} h-11`}><option value="transfer">Transfer</option><option value="tunai">Tunai</option><option value="lainnya">Lainnya</option></select>
                    </label>
                    <label className={label}>Tanggal diterima
                      <input type="date" required value={values.paidAt} onChange={(e) => set("paidAt", e.target.value)} className={`${input} h-11`} />
                    </label>
                    <label className={label}>Referensi / catatan
                      <input value={values.reference} maxLength={200} onChange={(e) => set("reference", e.target.value)} className={`${input} h-11`} placeholder="No. referensi bank" />
                    </label>
                  </div>
                ) : null}
                {form.op === "edit" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className={label}>Jumlah (Rp)
                      <input type="number" required min={1} value={values.amount} onChange={(e) => set("amount", e.target.value)} className={`${input} h-11`} />
                    </label>
                    <label className={label}>Catatan
                      <input value={values.note} maxLength={300} onChange={(e) => set("note", e.target.value)} className={`${input} h-11`} />
                    </label>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <button disabled={busy} className="h-10 rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Menyimpan..." : "Simpan"}</button>
                  <button type="button" onClick={() => setForm(null)} className="h-10 rounded-md border border-[#cdbba8] px-4 text-sm font-semibold text-[#5a4028]">Batal</button>
                </div>
              </form>
            ) : null}
          </li>
        ))}
      </ul>

      {role === "owner" ? (
        form?.id === "new" ? (
          <form onSubmit={submit} className="space-y-3 rounded-md border border-[#eadfd2] bg-[#fffaf4] p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className={label}>Jenis
                <select value={values.type} onChange={(e) => set("type", e.target.value)} className={`${input} h-11`}><option value="tambahan">Biaya tambahan</option><option value="dp">DP</option><option value="pelunasan">Pelunasan</option></select>
              </label>
              <label className={label}>Jumlah (Rp)
                <input type="number" required min={1} value={values.amount} onChange={(e) => set("amount", e.target.value)} className={`${input} h-11`} />
              </label>
              <label className={label}>Catatan
                <input value={values.note} maxLength={300} onChange={(e) => set("note", e.target.value)} className={`${input} h-11`} />
              </label>
            </div>
            <div className="flex gap-2">
              <button disabled={busy} className="h-10 rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white disabled:opacity-50">Buat tagihan</button>
              <button type="button" onClick={() => setForm(null)} className="h-10 rounded-md border border-[#cdbba8] px-4 text-sm font-semibold text-[#5a4028]">Batal</button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => open({ id: "new", op: "add" }, { type: "tambahan", amount: "", note: "" })} className="h-11 rounded-md border border-[#cdbba8] px-4 text-sm font-semibold text-[#5a4028]">+ Tambah tagihan</button>
        )
      ) : null}
    </div>
  );
}
