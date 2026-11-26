"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type WorkspaceDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  closeDisabled?: boolean;
  children: ReactNode;
};

const CLOSE_MS = 170;

export function WorkspaceDialog({ open, onClose, title, description, closeDisabled = false, children }: WorkspaceDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  // Isi tetap tampil selama animasi tutup berjalan.
  const [closing, setClosing] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  // Pola React untuk menurunkan state dari prop: saat open berubah true -> false, isi ditahan dulu.
  if (open !== wasOpen) {
    setWasOpen(open);
    setClosing(!open);
  }

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open) {
      element.removeAttribute("data-closing");
      if (!element.open) element.showModal();
      return;
    }
    if (!element.open) return;
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      element.close();
      const done = setTimeout(() => setClosing(false), 0);
      return () => clearTimeout(done);
    }
    element.setAttribute("data-closing", "");
    const timer = setTimeout(() => {
      element.removeAttribute("data-closing");
      if (element.open) element.close();
      setClosing(false);
    }, CLOSE_MS);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="workspace workspace-dialog shadow-xl"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={() => {
        // Penutupan oleh browser (bukan lewat prop open) dilaporkan sekali ke induk.
        if (open) onClose();
      }}
      onCancel={(event) => {
        // Escape: tutup lewat state agar animasi keluar berjalan.
        event.preventDefault();
        if (!closeDisabled) onClose();
      }}
      onClick={(event) => {
        if (closeDisabled || event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id={titleId} className="text-xl font-semibold leading-snug sm:text-2xl">{title}</h2>
          {description ? <p id={descriptionId} className="mt-2 text-sm leading-6 text-[#6b6056]">{description}</p> : null}
        </div>
        <button type="button" onClick={onClose} disabled={closeDisabled} className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-[#e0d4c7] text-xl" aria-label="Tutup dialog">×</button>
      </div>
      {open || closing ? <div className="mt-5 min-w-0">{children}</div> : null}
    </dialog>
  );
}
