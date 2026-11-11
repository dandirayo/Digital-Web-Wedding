"use client";

import { useEffect, useState } from "react";
import { getAudit, type AuditEntry } from "@/lib/business";

const LABEL: Record<string, string> = {
  order_created: "Order dibuat", event_created: "Event dibuat", event_updated: "Data event diubah", event_deleted: "Event dihapus", lead_converted: "Lead dijadikan klien",
  invoice_created: "Tagihan dibuat", invoice_report: "Pembayaran dilaporkan", invoice_pay: "Pembayaran diverifikasi", invoice_edit: "Tagihan diubah", invoice_void: "Tagihan dibatalkan", invoice_reopen: "Tagihan dibuka kembali",
  version_submitted: "Versi diajukan", version_approved: "Versi disetujui", version_changes_requested: "Perubahan diminta", version_approved_on_behalf: "Versi disetujui (atas nama klien)", version_changes_requested_on_behalf: "Perubahan diminta (atas nama klien)",
  published: "Dipublikasikan", publish_override: "Dipublikasikan dengan pengecualian", unpublished: "Publikasi dibatalkan",
};

export function AuditLog({ eventId }: { eventId: string }) {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAudit(eventId).then(setEntries).catch((e) => setError(e instanceof Error ? e.message : "Riwayat tidak dapat dimuat."));
  }, [eventId]);

  if (error) return <p role="alert" className="text-sm font-medium text-rose-700">{error}</p>;
  if (!entries) return <p className="text-sm text-[#6b6056]">Memuat riwayat...</p>;
  if (!entries.length) return <p className="text-sm italic text-[#6b6056]">Belum ada catatan.</p>;
  return (
    <ul className="divide-y divide-[#eadfd2] rounded-md border border-[#eadfd2] bg-white">
      {entries.map((entry) => (
        <li key={entry.id} className="p-3 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <span className="font-semibold">{LABEL[entry.action] ?? entry.action}</span>
            <span className="text-xs text-[#887a6d]">{new Date(entry.at).toLocaleString("id-ID")}</span>
          </div>
          <div className="text-xs text-[#6b6056]">{entry.actorName} ({entry.actorRole}){entry.detail ? ` · ${entry.detail}` : ""}</div>
        </li>
      ))}
    </ul>
  );
}
