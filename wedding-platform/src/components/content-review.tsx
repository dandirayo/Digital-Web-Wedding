"use client";

import { useEffect, useState } from "react";
import { getReviewStatus, setReviewStatus, type ReviewStatus } from "@/lib/review-workflow";

export function ContentReview({ eventId, role, onApproved }: { eventId: string; role: "owner" | "client"; onApproved?: () => void | Promise<void> }) {
  const [status, setStatus] = useState<ReviewStatus>("draft");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const refresh = () => setStatus(getReviewStatus(eventId));
    refresh();
    window.addEventListener("occasio:review-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("occasio:review-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [eventId]);

  const copy = {
    draft: { label: "Draft", description: "Konten masih dikerjakan dan belum dikirim ke owner.", color: "bg-[#efe5d8] text-[#8b5e31]" },
    review_requested: { label: "Menunggu Review", description: "Owner perlu memeriksa konten sebelum publish.", color: "bg-amber-50 text-amber-700" },
    changes_requested: { label: "Perlu Perubahan", description: "Ada catatan owner yang perlu diperbaiki.", color: "bg-rose-50 text-rose-700" },
    approved: { label: "Disetujui", description: "Konten sudah disetujui untuk dipublish.", color: "bg-emerald-50 text-emerald-700" },
  }[status];

  return (
    <section className="rounded-md border border-[#e0d4c7] bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a6a3a]">Approval konten</div>
          <h2 className="mt-2 text-xl font-semibold">Review sebelum publish</h2>
          <p className="mt-1 text-sm leading-6 text-[#6b6056]">{copy.description}</p>
        </div>
        <span className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold uppercase tracking-[0.12em] ${copy.color}`}>{copy.label}</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {role === "client" && status !== "approved" ? (
          <button type="button" onClick={() => setStatus(setReviewStatus(eventId, "review_requested"))} disabled={status === "review_requested"} className="inline-flex h-10 items-center rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{status === "review_requested" ? "Review demo diminta" : "Minta Review (Demo Lokal)"}</button>
        ) : null}
        {role === "owner" && status === "review_requested" ? (
          <>
            <button
              type="button"
              disabled={isPublishing}
              onClick={async () => {
                setActionError(null);
                setIsPublishing(true);
                try {
                  await onApproved?.();
                  setStatus(setReviewStatus(eventId, "approved"));
                } catch {
                  setActionError("Simulasi publish gagal. Status persetujuan tidak diubah.");
                } finally {
                  setIsPublishing(false);
                }
              }}
              className="inline-flex h-10 items-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPublishing ? "Memproses..." : "Setujui & Publish (Demo Lokal)"}
            </button>
            <button type="button" onClick={() => setStatus(setReviewStatus(eventId, "changes_requested"))} className="inline-flex h-10 items-center rounded-md border border-rose-200 px-4 text-sm font-semibold text-rose-700">Minta Perubahan</button>
          </>
        ) : null}
        {role === "owner" && status === "approved" ? <span className="text-sm font-semibold text-emerald-700">Siap dipublish ke tamu.</span> : null}
      </div>
      {actionError ? <p className="mt-3 text-sm font-medium text-rose-700">{actionError}</p> : null}
      <p className="mt-3 text-xs leading-5 text-[#887a6d]">Status review pada tahap ini hanya tersimpan di browser dan belum menjadi persetujuan bisnis yang sah.</p>
    </section>
  );
}
