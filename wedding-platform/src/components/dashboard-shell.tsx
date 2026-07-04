import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "./logout-button";

type DashboardShellProps = {
  role: "client" | "owner";
  title: string;
  description: string;
  children: ReactNode;
};

const nav = {
  client: [
    { href: "/client/dashboard", label: "Overview" },
    { href: "/client/dashboard#guests", label: "Tamu" },
    { href: "/client/dashboard#wishes", label: "Ucapan" },
    { href: "/client/dashboard#content", label: "Konten" },
  ],
  owner: [
    { href: "/owner/dashboard", label: "Semua Event" },
    { href: "/owner/dashboard#pipeline", label: "Pipeline" },
    { href: "/owner/dashboard#monitoring", label: "Monitoring" },
    { href: "/owner/dashboard#billing", label: "Billing" },
  ],
};

export function DashboardShell({ role, title, description, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[#f7f3ed] text-[#241f1a]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-[#e0d4c7] bg-[#fffaf4] px-5 py-6 lg:block">
        <Link href="/" className="block">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a6a3a]">
            Occasio
          </div>
          <div className="mt-1 text-2xl font-semibold">Control Room</div>
        </Link>

        <nav className="mt-10 space-y-2">
          {nav[role].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-[#5d5146] transition hover:bg-[#efe5d8] hover:text-[#241f1a]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-6 left-5 right-5 rounded-md border border-[#e0d4c7] bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a6a3a]">
            Login Demo
          </div>
          <p className="mt-2 text-sm text-[#6b6056]">
            Role ini nanti memakai Supabase Auth, session, dan Row Level Security.
          </p>
        </div>
      </aside>

      <main className="lg:pl-72">
        <header className="border-b border-[#e0d4c7] bg-[#fffaf4]/90 px-5 py-5 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a6a3a]">
                {role === "client" ? "Client Dashboard" : "Owner Dashboard"}
              </div>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b6056]">{description}</p>
            </div>
            <LogoutButton />
          </div>
        </header>
        <div className="px-5 py-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
