"use client";

import { useState } from "react";
import { exportGuestsCsv } from "@/lib/store";
import { useToast } from "@/components/toast";
import { Spinner } from "@/components/skeleton";

export function ExportGuestsButton({ eventId, slug }: { eventId: string; slug: string }) {
  const [busy, setBusy] = useState(false);
  const notify = useToast();

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
      notify(e instanceof Error ? e.message : "Ekspor gagal.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={download} disabled={busy} className="inline-flex h-10 items-center rounded-md border border-[#e0d4c7] bg-white px-4 text-sm font-semibold text-[#241f1a] hover:bg-[#fffaf4] disabled:opacity-50">
      {busy ? <><Spinner className="mr-2 h-4 w-4" />Menyiapkan...</> : "Ekspor CSV"}
    </button>
  );
}
