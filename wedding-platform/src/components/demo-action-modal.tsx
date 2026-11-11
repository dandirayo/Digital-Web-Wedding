"use client";

import { ReactNode, useState } from "react";
import { WorkspaceDialog } from "./workspace-dialog";

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

      <WorkspaceDialog open={open} onClose={() => setOpen(false)} title={title} description={description}>
        {children}
      </WorkspaceDialog>
    </>
  );
}
