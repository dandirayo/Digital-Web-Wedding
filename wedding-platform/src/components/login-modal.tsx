"use client";

import { useEffect, useState } from "react";
import { LoginForm } from "@/app/login/login-form";

type LoginModalProps = {
  label?: string;
  variant?: "primary" | "secondary";
};

export function LoginModal({ label = "Login", variant = "primary" }: LoginModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const className =
    variant === "primary"
      ? "inline-flex h-12 items-center justify-center rounded-md bg-[#241f1a] px-5 text-sm font-semibold text-white transition hover:bg-[#3a3129]"
      : "inline-flex h-10 items-center justify-center rounded-md border border-[#cdbba8] px-4 text-sm font-semibold text-[#5a4028] transition hover:bg-[#efe5d8]";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <button
            type="button"
            className="absolute inset-0 bg-[#241f1a]/58 backdrop-blur-sm"
            aria-label="Tutup login"
            onClick={() => setOpen(false)}
          />

          <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-md bg-[#f7f3ed] p-3 shadow-[0_28px_100px_rgba(20,14,10,0.38)]">
            <div className="mb-3 flex items-center justify-between px-2 pt-1">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a6a3a]">
                  Occasio
                </div>
                <div className="mt-1 text-lg font-semibold text-[#241f1a]">Login demo workspace</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-md border border-[#d9caba] bg-white text-xl leading-none text-[#5a4028] transition hover:bg-[#efe5d8]"
                aria-label="Tutup"
              >
                x
              </button>
            </div>
            <LoginForm />
          </div>
        </div>
      ) : null}
    </>
  );
}
