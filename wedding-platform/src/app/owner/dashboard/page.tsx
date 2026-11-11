"use client";

import { AuthGate } from "@/components/auth-gate";
import { DashboardShell } from "@/components/dashboard-shell";
import { EventReadiness } from "@/components/event-readiness";
import { ExportReportAction } from "@/components/owner-actions";
import { StatCard } from "@/components/stat-card";
import { getPackageLabel } from "@/lib/demo-data";
import { formatRupiah, getOverview, STAGE_STYLE, type Overview } from "@/lib/business";
import { getOwnerEvents, updateOwnerEventStatus } from "@/lib/workspace";
import { ConsultationInbox } from "@/components/consultation-inbox";
import type { WeddingEvent } from "@/lib/types";
import Link from "next/link";
import { AlertTriangle, CalendarPlus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

export default function OwnerDashboardPage() {
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [list, summary] = await Promise.all([getOwnerEvents(), getOverview()]);
        setEvents(list);
        setOverview(summary);
      } catch (error) {
        console.warn("Gagal memuat workspace owner lokal", error);
        setLoadError(error instanceof Error ? error.message : "Database lokal tidak dapat dijangkau.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const active = events.filter((event) => event.status === "active").length;
  const totalGuests = events.reduce((sum, event) => sum + event.guestCount, 0);
  const totalRsvp = events.reduce((sum, event) => sum + event.rsvpYes + event.rsvpNo, 0);
  const totalWishes = events.reduce((sum, event) => sum + event.wishCount, 0);
  const totalCheckIns = events.reduce((sum, event) => sum + event.checkInCount, 0);
  const draft = events.filter((event) => event.status === "draft").length;
  const stageById = new Map((overview?.events ?? []).map((item) => [item.id, item]));

  async function handleStatusChange(id: string, status: WeddingEvent["status"]) {
    await updateOwnerEventStatus(id, status);
    setEvents((current) => current.map((event) => (event.id === id ? { ...event, status } : event)));
  }

  return (
    <AuthGate role="owner">
      <DashboardShell
        role="owner"
        title="Monitoring Semua Event"
        description="Command center Occasio untuk melihat event berjalan, status klien, RSVP, dan aktivitas terbaru."
      >
        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard label="Event Aktif" value={String(active)} helper="Sedang berjalan" />
          <StatCard label="Total Tamu" value={String(totalGuests)} helper="Dari semua client" />
          <StatCard label="Total RSVP" value={String(totalRsvp)} helper="Konfirmasi masuk" />
          <StatCard label="Total Ucapan" value={String(totalWishes)} helper="Semua event" />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.72fr_0.28fr]">
          <div className="rounded-md border border-[#e0d4c7] bg-white p-5">
            <h2 className="text-xl font-semibold">Ringkasan Operasional</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <OwnerMiniCard label="Event aktif" value={String(active)} helper="Perlu dimonitor" />
              <OwnerMiniCard label="Draft setup" value={String(draft)} helper="Butuh publish" />
              <OwnerMiniCard label="Total check-in" value={String(totalCheckIns)} helper="Data event lokal" />
            </div>
          </div>

          <div className="rounded-md border border-[#e0d4c7] bg-[#241f1a] p-5 text-white">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d6c7a1]">
              Owner action
            </div>
            <h2 className="mt-3 text-2xl font-semibold">Buat event baru</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Buat workspace client baru menggunakan wizard setup Occasio.
            </p>
            <div className="mt-5">
              <Link
                href="/owner/events/new"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#d6c7a1] px-4 font-semibold text-[#241f1a] transition hover:bg-[#c9b78c]"
              >
                <CalendarPlus className="h-4 w-4" /> Buat Undangan Baru
              </Link>
            </div>
          </div>
        </section>

      <section id="monitoring" className="mt-6 rounded-md border border-[#e0d4c7] bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Event Yang Sedang Dikelola</h2>
            <p className="mt-1 text-sm text-[#6b6056]">Owner bisa membuka detail client, memantau progres, dan membantu edit konten.</p>
          </div>
          <ExportReportAction events={events} />
        </div>

        {loadError ? (
          <div className="mt-5 flex flex-col items-center rounded-xl border border-rose-200 bg-rose-50 px-5 py-10 text-center">
            <AlertTriangle className="h-7 w-7 text-rose-600" />
            <h3 className="mt-3 font-semibold text-rose-950">Backend lokal belum tersambung</h3>
            <p className="mt-2 max-w-lg text-sm leading-6 text-rose-800">{loadError}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-rose-900 px-4 text-sm font-semibold text-white">
              <RefreshCw className="h-4 w-4" /> Coba lagi
            </button>
          </div>
        ) : isLoading ? (
          <div className="p-10 text-center text-sm text-[#6b6056]">Memuat event...</div>
        ) : events.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-[#cdbba8] bg-[#fffaf4] px-5 py-10 text-center text-sm text-[#6b6056]">Belum ada event. Buat event pertama untuk memulai workspace.</div>
        ) : (
          <div className="mt-5 grid gap-4">
            {events.map((event) => (
              <article
                key={event.id}
                className="relative rounded-md border border-[#eadfd2] p-5 transition hover:border-[#cdbba8] hover:shadow-sm"
              >
                <Link href={`/owner/events/${event.id}`} className="absolute inset-0 z-0">
                  <span className="sr-only">View Event Details</span>
                </Link>

                <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold">{event.coupleName}</h3>
                      <StatusBadge status={event.status} />
                      {stageById.get(event.id) ? <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STAGE_STYLE[stageById.get(event.id)!.stage] ?? "bg-gray-100 text-gray-600"}`}>{stageById.get(event.id)!.stage}</span> : null}
                    </div>
                    <p className="mt-2 text-sm text-[#6b6056]">
                      {getPackageLabel(event.packageTier)} / {new Date(event.eventDate).toLocaleDateString("id-ID")}{stageById.get(event.id) ? ` / Terbayar ${formatRupiah(stageById.get(event.id)!.paid)} dari ${formatRupiah(stageById.get(event.id)!.total)}` : ""}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center text-sm sm:grid-cols-4 pointer-events-none">
                    <MiniStat label="Tamu" value={event.guestCount} />
                    <MiniStat label="RSVP" value={event.rsvpYes + event.rsvpNo} />
                    <MiniStat label="Ucapan" value={event.wishCount} />
                    <MiniStat label="Check-in" value={event.checkInCount} />
                  </div>
                </div>
                <div className="relative z-10 mt-4 flex flex-col gap-3 border-t border-[#eadfd2] pt-4 sm:flex-row sm:flex-wrap sm:items-center">
                  <Link
                    href={`/wedding/${event.slug}`}
                    target="_blank"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white transition hover:bg-[#3a332a]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Preview
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const url = `${window.location.origin}/wedding/${event.slug}`;
                      navigator.clipboard.writeText(url);
                      alert("Link disalin!");
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-[#cdbba8] bg-white px-4 text-sm font-semibold text-[#5a4028] transition hover:bg-[#f7f3ed]"
                  >
                    Copy Link
                  </button>
                  <label className="inline-flex items-center gap-2 text-sm text-[#6b6056]">
                    Status
                    <select
                      value={event.status}
                      onChange={(selectEvent) =>
                        handleStatusChange(event.id, selectEvent.target.value as WeddingEvent["status"])
                      }
                      className="h-10 rounded-md border border-[#cdbba8] bg-white px-3 text-sm font-semibold text-[#5a4028] outline-none cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="draft">draft</option>
                      <option value="active">active</option>
                      <option value="completed">completed</option>
                      <option value="archived">archived</option>
                    </select>
                  </label>
                  <span className="break-all text-sm text-[#6b6056] ml-auto">/wedding/{event.slug}</span>
                </div>
                <div className="relative z-10 mt-4 pointer-events-none">
                  <EventReadiness event={event} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <ConsultationInbox />

      <section id="pipeline" className="mt-6 rounded-md border border-[#e0d4c7] bg-white p-5">
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Pipeline Order</h2>
            <p className="mt-1 text-sm text-[#6b6056]">Posisi setiap event dihitung dari tagihan, versi yang disetujui klien, dan status publikasi.</p>
          </div>
          {overview ? <span className="text-sm font-semibold text-[#9a6a3a]">Lead: {overview.leads.baru} baru · {overview.leads.dihubungi} dihubungi</span> : null}
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-4">
          {PIPELINE.map((column) => {
            const items = (overview?.events ?? []).filter((item) => column.stages.includes(item.stage));
            return (
              <div key={column.title} className="rounded-md border border-[#eadfd2] bg-[#fffaf4] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{column.title}</h3>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#9a6a3a]">{items.length}</span>
                </div>
                <div className="mt-3 grid gap-3">
                  {!items.length ? <p className="text-sm italic text-[#887a6d]">Kosong.</p> : null}
                  {items.map((item) => (
                    <Link key={item.id} href={`/owner/events/${item.id}`} className="rounded-md border border-[#eadfd2] bg-white p-3 transition hover:border-[#cdbba8]">
                      <div className="font-semibold">{item.coupleName}</div>
                      <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${STAGE_STYLE[item.stage] ?? "bg-gray-100 text-gray-600"}`}>{item.stage}</span>
                      <div className="mt-2 text-xs text-[#6b6056]">{new Date(item.eventDate).toLocaleDateString("id-ID")} · sisa {formatRupiah(item.outstanding)}</div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="tasks" className="mt-6 rounded-md border border-[#e0d4c7] bg-white p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Perlu Tindakan</h2>
            <p className="mt-1 text-sm text-[#6b6056]">Dibuat otomatis dari pembayaran, persetujuan, pesan, lead, dan jadwal acara.</p>
          </div>
          <span className="text-sm font-semibold text-[#9a6a3a]">{overview?.tasks.filter((task) => task.priority === "high").length ?? 0} prioritas tinggi</span>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {!overview?.tasks.length ? <p className="text-sm italic text-[#6b6056]">Tidak ada yang menunggu. Semua beres.</p> : null}
          {overview?.tasks.map((task) => (
            <Link key={task.id} href={task.eventId ? `/owner/events/${task.eventId}` : "#consultations"} className="rounded-md border border-[#eadfd2] bg-[#fffaf4] p-4 transition hover:border-[#cdbba8]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold">{task.title}</h3>
                  <p className="mt-1 text-sm text-[#6b6056]">{task.detail}</p>
                </div>
                <span className={`inline-flex h-8 shrink-0 items-center rounded-full px-3 text-xs font-semibold uppercase tracking-[0.14em] ${task.priority === "high" ? "bg-rose-50 text-rose-700" : "bg-[#efe5d8] text-[#9a6a3a]"}`}>{task.priority === "high" ? "Segera" : "Biasa"}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="billing" className="mt-6 rounded-md border border-[#e0d4c7] bg-white p-5">
        <div>
          <h2 className="text-xl font-semibold">Pendapatan & Tagihan</h2>
          <p className="mt-1 text-sm text-[#6b6056]">Dihitung dari tagihan yang sudah diverifikasi. Buat dan verifikasi tagihan di tab Tagihan pada detail event.</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {overview ? [
            ["Pendapatan bulan ini", formatRupiah(overview.totals.revenueThisMonth), `Total terbayar ${formatRupiah(overview.totals.revenuePaid)}`],
            ["Belum dibayar", formatRupiah(overview.totals.outstanding), `${overview.totals.invoicesOpen} tagihan terbuka`],
            ["Menunggu verifikasi", String(overview.totals.awaitingVerification), "Klien sudah melapor bayar"],
            ["Paket terlaris", overview.packages[0]?.name ?? "-", overview.packages.map((p) => `${p.name} ${p.count}`).join(" · ") || "Belum ada event"],
          ].map(([label, value, helper]) => (
            <div key={label} className="rounded-md border border-[#eadfd2] bg-[#fffaf4] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a6a3a]">{label}</div>
              <div className="mt-2 text-2xl font-semibold">{value}</div>
              <div className="mt-1 text-sm text-[#6b6056]">{helper}</div>
            </div>
          )) : null}
        </div>
      </section>
      </DashboardShell>
    </AuthGate>
  );
}

const PIPELINE = [
  { title: "Penagihan", stages: ["Belum ada tagihan", "Menunggu DP", "Verifikasi DP"] },
  { title: "Produksi & persetujuan", stages: ["Produksi konten", "Menunggu persetujuan klien", "Perlu revisi"] },
  { title: "Pelunasan & publish", stages: ["Menunggu pelunasan", "Siap publish"] },
  { title: "Berjalan", stages: ["Aktif"] },
];

function StatusBadge({ status }: { status: WeddingEvent["status"] }) {
  const color =
    status === "active"
      ? "bg-emerald-50 text-emerald-700"
      : status === "completed"
        ? "bg-zinc-100 text-zinc-700"
        : "bg-[#efe5d8] text-[#9a6a3a]";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${color}`}>
      {status}
    </span>
  );
}

function OwnerMiniCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-md border border-[#eadfd2] bg-[#fffaf4] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a6a3a]">{label}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-[#6b6056]">{helper}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-[#f7f3ed] px-4 py-3">
      <div className="font-semibold">{value}</div>
      <div className="text-xs text-[#756a60]">{label}</div>
    </div>
  );
}
