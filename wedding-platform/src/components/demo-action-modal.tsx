"use client";

import { ReactNode, useState } from "react";

type DemoActionModalProps = {
  buttonLabel: string;
  title: string;
  description: string;
  children: ReactNode;
  variant?: "dark" | "light";
};

export function DemoActionModal({
  buttonLabel,
  title,
  description,
  children,
  variant = "dark",
}: DemoActionModalProps) {
  const [open, setOpen] = useState(false);

  const buttonClass =
    variant === "dark"
      ? "rounded-md bg-[#241f1a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3a3129]"
      : "rounded-md border border-[#cdbba8] px-4 py-2 text-sm font-semibold text-[#5a4028] transition hover:bg-[#efe5d8]";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass}>
        {buttonLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <button
            type="button"
            className="absolute inset-0 bg-[#241f1a]/58 backdrop-blur-sm"
            aria-label="Tutup modal"
            onClick={() => setOpen(false)}
          />
          <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-md bg-[#f7f3ed] p-4 shadow-[0_28px_100px_rgba(20,14,10,0.38)]">
            <div className="rounded-md border border-[#e0d4c7] bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a6a3a]">
                    Occasio
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#6b6056]">{description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[#d9caba] bg-white text-xl leading-none text-[#5a4028] transition hover:bg-[#efe5d8]"
                  aria-label="Tutup"
                >
                  x
                </button>
              </div>

              <div className="mt-5">{children}</div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
