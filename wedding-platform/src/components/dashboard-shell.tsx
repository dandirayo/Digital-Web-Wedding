"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { CalendarDays, CheckSquare2, CreditCard, LayoutDashboard, ListChecks, MessageCircle, Settings, Sparkles, UsersRound } from "lucide-react";
import { LogoutButton } from "./logout-button";

type DashboardShellProps = { role: "client" | "owner"; title: string; description: string; children: ReactNode };
type NavItem = { href: string; label: string; icon: ComponentType<{ className?: string }> };

const nav: Record<DashboardShellProps["role"], NavItem[]> = {
  client: [
    { href: "/client/dashboard", label: "Ringkasan", icon: LayoutDashboard },
    { href: "/client/dashboard#brief", label: "Brief", icon: ListChecks },
    { href: "/chat", label: "Chat", icon: MessageCircle },
    { href: "/client/dashboard#guests", label: "Tamu", icon: UsersRound },
    { href: "/client/dashboard#content", label: "Konten", icon: Sparkles },
    { href: "/client/dashboard#approval", label: "Persetujuan", icon: CheckSquare2 },
    { href: "/client/dashboard#billing", label: "Tagihan", icon: CreditCard },
  ],
  owner: [
    { href: "/owner/dashboard", label: "Ringkasan", icon: LayoutDashboard },
    { href: "/owner/dashboard#monitoring", label: "Event", icon: CalendarDays },
    { href: "/chat", label: "Chat", icon: MessageCircle },
    { href: "/owner/dashboard#pipeline", label: "Pipeline", icon: ListChecks },
    { href: "/owner/dashboard#tasks", label: "Task", icon: CheckSquare2 },
    { href: "/owner/dashboard#billing", label: "Billing", icon: CreditCard },
    { href: "/owner/manage", label: "Kelola", icon: Settings },
  ],
};

export function DashboardShell({ role, title, description, children }: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="workspace min-h-screen bg-[#f5f1eb] text-[#241f1a]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-[#e4d9cd] bg-[#1f1b18] px-5 py-6 text-white lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-3 rounded-xl p-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#c99b66] text-sm font-bold text-[#211b16]">O</span>
          <span>
            <span className="block text-lg font-semibold tracking-tight">Occasio</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">{role === "client" ? "Client workspace" : "Business workspace"}</span>
          </span>
        </Link>

        <nav className="mt-9 space-y-1" aria-label="Menu workspace">
          {nav[role].map((item) => {
            const Icon = item.icon;
            const active = item.href.split("#")[0] === pathname && !item.href.includes("#");
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${active ? "bg-white text-[#241f1a] shadow-sm" : "text-white/68 hover:bg-white/8 hover:text-white"}`}>
                <Icon className="h-[18px] w-[18px]" />{item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#ddb98e]"><span className="h-2 w-2 rounded-full bg-emerald-400" />Local workspace</div>
          <p className="mt-2 text-xs leading-5 text-white/55">{role === "client" ? "Kelola brief, konten, tamu, dan kesiapan publish." : "Pantau order, produksi, event, dan pembayaran."}</p>
        </div>
      </aside>

      <main className="min-w-0 lg:pl-72">
        <header className="workspace-header relative top-0 z-20 border-b border-[#e4d9cd] bg-[#fbf8f4]/92 py-4 backdrop-blur-xl lg:sticky">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9a6a3a]">{role === "client" ? "Workspace klien" : "Workspace owner"}</div>
              <h1 className="mt-1 text-xl font-semibold leading-snug tracking-tight sm:text-2xl lg:text-3xl">{title}</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[#756a60]">{description}</p>
            </div>
            <LogoutButton />
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Menu workspace mobile">
            {nav[role].map((item) => { const Icon = item.icon; const active = item.href === pathname; return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-semibold ${active ? "border-[#241f1a] bg-[#241f1a] text-white" : "border-[#e0d4c7] bg-white text-[#5d5146]"}`}><Icon className="h-4 w-4" />{item.label}</Link>; })}
          </nav>
        </header>
        <div className="workspace-content min-w-0">{children}</div>
      </main>
    </div>
  );
}
