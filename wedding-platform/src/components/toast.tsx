"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Tone = "info" | "success" | "error";
type ToastItem = { id: number; message: string; tone: Tone; leaving?: boolean };
type Notify = (message: string, tone?: Tone) => void;

const ToastContext = createContext<Notify | null>(null);

const TONE_STYLE: Record<Tone, string> = {
  info: "border-[#e0d4c7] bg-white text-[#241f1a]",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach(clearTimeout);
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      fn();
    }, ms);
    timers.current.add(timer);
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    later(() => setItems((current) => current.filter((t) => t.id !== id)), 200);
  }, [later]);

  const notify = useCallback<Notify>((message, tone = "info") => {
    const id = next.current++;
    setItems((current) => [...current.slice(-3), { id, message, tone }]);
    later(() => dismiss(id), tone === "error" ? 6500 : 4000);
  }, [dismiss, later]);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-4 sm:w-96">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            data-leaving={t.leaving ? "" : undefined}
            className={`toast-item pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${TONE_STYLE[t.tone]}`}
          >
            <span className="min-w-0 flex-1 leading-6">{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Tutup pemberitahuan" className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-md text-lg leading-none opacity-60 hover:opacity-100">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Pemberitahuan singkat pengganti window.alert. Tanpa provider, jatuh ke alert agar pesan tidak hilang. */
export function useToast(): Notify {
  const ctx = useContext(ToastContext);
  return useMemo<Notify>(() => ctx ?? ((message) => { if (typeof window !== "undefined") window.alert(message); }), [ctx]);
}
