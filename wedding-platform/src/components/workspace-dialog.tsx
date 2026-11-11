"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type WorkspaceDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  closeDisabled?: boolean;
  children: ReactNode;
};

export function WorkspaceDialog({ open, onClose, title, description, closeDisabled = false, children }: WorkspaceDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (open && !element?.open) element?.showModal();
    if (!open && element?.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="workspace workspace-dialog shadow-xl"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onCancel={(event) => {
        if (closeDisabled) event.preventDefault();
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
      {open ? <div className="mt-5 min-w-0">{children}</div> : null}
    </dialog>
  );
}
