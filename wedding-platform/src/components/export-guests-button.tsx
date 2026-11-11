"use client";

import { useState } from "react";
import { exportGuestsCsv } from "@/lib/store";

export function ExportGuestsButton({ eventId, slug }: { eventId: string; slug: string }) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const csv = await exportGuestsCsv(eventId);
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `tamu-${slug}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Ekspor gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={download} disabled={busy} className="inline-flex h-10 items-center rounded-md border border-[#e0d4c7] bg-white px-4 text-sm font-semibold text-[#241f1a] hover:bg-[#fffaf4] disabled:opacity-50">
      {busy ? "Menyiapkan..." : "Ekspor CSV"}
    </button>
  );
}
