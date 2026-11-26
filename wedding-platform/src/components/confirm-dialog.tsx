"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { WorkspaceDialog } from "./workspace-dialog";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" untuk tindakan yang menghapus atau tidak bisa dibatalkan. */
  tone?: "default" | "danger";
};

type Ask = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Ask | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [open, setOpen] = useState(false);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const ask = useCallback<Ask>((next) => new Promise<boolean>((resolve) => {
    resolver.current?.(false);
    resolver.current = resolve;
    setOptions(next);
    setOpen(true);
  }), []);

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpen(false);
  }, []);

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      <WorkspaceDialog open={open} onClose={() => settle(false)} title={options?.title ?? ""} description={options?.description}>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => settle(false)} className="inline-flex h-11 items-center justify-center rounded-md border border-[#e0d4c7] bg-white px-5 text-sm font-semibold text-[#241f1a] hover:bg-[#fffaf4]">
            {options?.cancelLabel ?? "Batal"}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => settle(true)}
            className={`inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-semibold text-white ${options?.tone === "danger" ? "bg-rose-700 hover:bg-rose-800" : "bg-[#241f1a] hover:bg-[#3a312a]"}`}
          >
            {options?.confirmLabel ?? "Ya, lanjutkan"}
          </button>
        </div>
      </WorkspaceDialog>
    </ConfirmContext.Provider>
  );
}

/** Pengganti window.confirm: `if (!(await confirm({ title: ... }))) return;`. Tanpa provider, jatuh ke window.confirm. */
export function useConfirm(): Ask {
  const ctx = useContext(ConfirmContext);
  return ctx ?? ((options) => Promise.resolve(typeof window !== "undefined" && window.confirm(options.description ? `${options.title}\n${options.description}` : options.title)));
}
