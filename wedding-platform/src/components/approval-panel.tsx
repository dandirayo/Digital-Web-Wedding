"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { decideVersion, getApproval, publishEvent, submitVersion, unpublishEvent, type ApprovalState, type ContentVersion } from "@/lib/business";

const DECISION: Record<ContentVersion["decision"], { label: string; style: string }> = {
  pending: { label: "Menunggu keputusan klien", style: "bg-sky-50 text-sky-700" },
  approved: { label: "Disetujui", style: "bg-emerald-50 text-emerald-700" },
  changes_requested: { label: "Perlu perubahan", style: "bg-rose-50 text-rose-700" },
  superseded: { label: "Digantikan", style: "bg-gray-100 text-gray-500" },
};
const textarea = "mt-1 block min-h-20 w-full rounded-md border border-[#cdbba8] bg-white px-3 py-2 text-base outline-none focus:border-[#9a6a3a] sm:text-sm";

export function ApprovalPanel({ eventId, slug, role, onChanged }: { eventId: string; slug: string; role: "owner" | "client"; onChanged?: () => void }) {
  const [state, setState] = useState<ApprovalState | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setState(await getApproval(eventId));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status persetujuan tidak dapat dimuat.");
    }
  }, [eventId]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function run(task: () => Promise<unknown>, after?: () => void) {
    setBusy(true);
    setError("");
    try {
      await task();
      setNote("");
      setReason("");
      after?.();
      await load();
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal.");
    } finally {
      setBusy(false);
    }
  }

  if (!state) return <p className="text-sm text-[#6b6056]">{error || "Memuat..."}</p>;
  const pending = state.latest?.decision === "pending" ? state.latest : null;
  // Isi saat ini sama dengan versi yang sudah disetujui: tidak ada yang perlu diajukan.
  const upToDate = state.gate.approvedVersion !== null && !state.gate.reasons.some((r) => r.startsWith("Isi undangan berubah"));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/wedding/${slug}`} target="_blank" className="inline-flex h-11 items-center rounded-md border border-[#cdbba8] px-4 text-sm font-semibold text-[#5a4028]">Buka pratinjau undangan</Link>
        <span className="text-xs text-[#6b6056]">Pratinjau menampilkan isi terbaru, termasuk yang belum dipublikasikan.</span>
      </div>

      <section className="rounded-md border border-[#eadfd2] bg-white p-4">
        <h3 className="text-base font-semibold">Syarat publikasi</h3>
        {state.published ? <p className="mt-2 text-sm font-medium text-emerald-700">Undangan sudah dipublikasikan.</p> : state.gate.ok ? <p className="mt-2 text-sm font-medium text-emerald-700">✓ Disetujui klien (versi {state.gate.approvedVersion}) dan pembayaran lunas.</p> : (
          <ul className="mt-2 space-y-1 text-sm text-[#5d5146]">{state.gate.reasons.map((r) => <li key={r}>✗ {r}</li>)}</ul>
        )}
      </section>

      {error ? <p role="alert" className="text-sm font-medium text-rose-700">{error}</p> : null}

      {pending && role === "client" ? (
        <section className="rounded-md border border-sky-200 bg-sky-50/50 p-4">
          <h3 className="text-base font-semibold">Versi {pending.number} menunggu keputusan Anda</h3>
          <p className="mt-1 text-sm text-[#5d5146]">Periksa pratinjau undangan. Setelah disetujui, tim Occasio dapat mempublikasikan undangan begitu pembayaran lunas.</p>
          <label className="mt-3 block text-xs font-semibold uppercase tracking-wider text-[#9a6a3a]">Catatan (wajib bila meminta perubahan)
            <textarea value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} className={textarea} />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => run(() => decideVersion(pending.id, "approved", note))} className="h-11 rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white disabled:opacity-50">Setujui versi {pending.number}</button>
            <button disabled={busy} onClick={() => run(() => decideVersion(pending.id, "changes_requested", note))} className="h-11 rounded-md border border-rose-200 px-5 text-sm font-semibold text-rose-700 disabled:opacity-50">Minta perubahan</button>
          </div>
        </section>
      ) : null}

      {pending && role === "owner" ? (
        <section className="rounded-md border border-[#eadfd2] bg-[#fffaf4] p-4">
          <h3 className="text-base font-semibold">Versi {pending.number} menunggu klien</h3>
          <p className="mt-1 text-sm text-[#5d5146]">Bila klien menyetujui di luar aplikasi (mis. WhatsApp), catat buktinya. Tindakan ini tercatat di riwayat sebagai persetujuan atas nama klien.</p>
          <label className="mt-3 block text-xs font-semibold uppercase tracking-wider text-[#9a6a3a]">Bukti persetujuan (min. 10 karakter)
            <textarea value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} className={textarea} placeholder="Contoh: Klien setuju via WhatsApp 11 Nov 2026 pukul 14.20" />
          </label>
          <button disabled={busy || note.trim().length < 10} onClick={() => run(() => decideVersion(pending.id, "approved", note))} className="mt-3 h-11 rounded-md border border-[#cdbba8] px-5 text-sm font-semibold text-[#5a4028] disabled:opacity-50">Catat persetujuan atas nama klien</button>
        </section>
      ) : null}

      {!state.published && !upToDate ? (
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} onClick={() => run(() => submitVersion(eventId))} className="h-11 rounded-md bg-[#241f1a] px-5 text-sm font-semibold text-white disabled:opacity-50">{role === "owner" ? "Ajukan versi ke klien" : "Ajukan versi untuk disetujui"}</button>
        </div>
      ) : null}

      {role === "owner" ? (
        <section className="rounded-md border border-[#eadfd2] bg-white p-4">
          <h3 className="text-base font-semibold">Publikasi</h3>
          {state.published ? (
            <button disabled={busy} onClick={() => window.confirm("Batalkan publikasi? Link undangan tidak akan dapat dibuka tamu.") && run(() => unpublishEvent(eventId))} className="mt-3 h-11 rounded-md border border-rose-200 px-5 text-sm font-semibold text-rose-700 disabled:opacity-50">Batalkan publikasi</button>
          ) : state.gate.ok ? (
            <button disabled={busy} onClick={() => run(() => publishEvent(eventId))} className="mt-3 h-11 rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white disabled:opacity-50">Publikasikan undangan</button>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-[#5d5146]">Syarat belum terpenuhi. Anda dapat mempublikasikan dengan pengecualian; alasan dicatat permanen di riwayat.</p>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#9a6a3a]">Alasan pengecualian (min. 10 karakter)
                <textarea value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} className={textarea} />
              </label>
              <button disabled={busy || reason.trim().length < 10} onClick={() => run(() => publishEvent(eventId, reason))} className="h-11 rounded-md bg-[#241f1a] px-5 text-sm font-semibold text-white disabled:opacity-50">Publikasikan dengan pengecualian</button>
            </div>
          )}
        </section>
      ) : null}

      <section>
        <h3 className="mb-2 text-base font-semibold">Riwayat versi</h3>
        {!state.versions.length ? <p className="text-sm italic text-[#6b6056]">Belum ada versi yang diajukan.</p> : null}
        <ul className="space-y-2">
          {state.versions.map((v) => (
            <li key={v.id} className="rounded-md border border-[#eadfd2] bg-white p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">Versi {v.number}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${DECISION[v.decision].style}`}>{DECISION[v.decision].label}</span>
              </div>
              <div className="mt-1 text-xs text-[#6b6056]">Diajukan {v.submittedByName} · {new Date(v.submittedAt).toLocaleString("id-ID")}</div>
              {v.decidedAt ? <div className="text-xs text-[#6b6056]">Diputuskan {new Date(v.decidedAt).toLocaleString("id-ID")}{v.decidedByRole.endsWith("_on_behalf") ? " (dicatat owner atas nama klien)" : ""}</div> : null}
              {v.note ? <div className="mt-1 text-xs text-[#5d5146]">Catatan: {v.note}</div> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
