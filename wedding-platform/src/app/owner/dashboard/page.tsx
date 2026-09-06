"use client";

import { AuthGate } from "@/components/auth-gate";
import { DashboardShell } from "@/components/dashboard-shell";
import { EventReadiness } from "@/components/event-readiness";
import {
  CreateInvoiceAction,
  ExportReportAction,
  PipelineAction,
} from "@/components/owner-actions";
import { StatCard } from "@/components/stat-card";
import { billingSummary, businessOrders, formatRupiah, getPackageLabel, workflowTasks } from "@/lib/demo-data";
import { getEvents, updateEvent, initStore } from "@/lib/store";
import { ContentReview } from "@/components/content-review";
import type { WeddingEvent } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function OwnerDashboardPage() {
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      await initStore();
      const loaded = await getEvents();
      setEvents(loaded);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const active = events.filter((event) => event.status === "active").length;
  const totalGuests = events.reduce((sum, event) => sum + event.guestCount, 0);
  const totalRsvp = events.reduce((sum, event) => sum + event.rsvpYes + event.rsvpNo, 0);
  const totalWishes = events.reduce((sum, event) => sum + event.wishCount, 0);
  const draft = events.filter((event) => event.status === "draft").length;
  const pipelineStages = ["Lead Baru", "Proses Setup", "Siap Publish"] as const;

  async function handleStatusChange(id: string, status: WeddingEvent["status"]) {
    const updated = await updateEvent(id, { status });
    setEvents((current) => current.map((e) => (e.id === id ? updated : e)));
  }

  async function handlePublish(id: string) {
    const updated = await updateEvent(id, {
      status: "active",
      isPublished: true,
      publishedAt: new Date().toISOString(),
    });
    setEvents((current) => current.map((event) => (event.id === id ? updated : event)));
  }

  return (
    <AuthGate role="owner">
      <DashboardShell
        role="owner"
        title="Monitoring Semua Event"
        description="Command center Occasio untuk melihat event berjalan, status klien, RSVP, dan aktivitas terbaru."
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              <OwnerMiniCard label="Check-in hari ini" value="27" helper="Live dari semua event" />
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
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[#d6c7a1] px-4 font-semibold text-[#241f1a] transition hover:bg-[#c9b78c]"
              >
                + Buat Undangan Baru
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

        {isLoading ? (
          <div className="p-10 text-center text-sm text-[#6b6056]">Memuat event...</div>
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
                    </div>
                    <p className="mt-2 text-sm text-[#6b6056]">
                      {event.clientId || "Klien Baru"} / {getPackageLabel(event.packageTier)} / {new Date(event.eventDate).toLocaleDateString("id-ID")}
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
                <div className="relative z-10 mt-4" onClick={(e) => e.stopPropagation()}>
                  <ContentReview eventId={event.id} role="owner" onApproved={() => handlePublish(event.id)} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="pipeline" className="mt-6 grid gap-6 xl:grid-cols-3">
        {pipelineStages.map((stage) => (
          <div key={stage} className="rounded-md border border-[#e0d4c7] bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-semibold">{stage}</h2>
              <span className="rounded-full bg-[#f7f3ed] px-3 py-1 text-xs font-semibold text-[#9a6a3a]">
                {businessOrders.filter((order) => order.stage === stage).length}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#6b6056]">
              {getStageDescription(stage)}
            </p>
            <div className="mt-5 grid gap-3">
              {businessOrders
                .filter((order) => order.stage === stage)
                .map((order) => (
                  <article key={order.id} className="rounded-md border border-[#eadfd2] bg-[#fffaf4] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{order.couple}</h3>
                        <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-[#9a6a3a]">
                          {order.packageName} / {order.clientName}
                        </p>
                      </div>
                      <div className="text-right text-sm font-semibold text-[#5a4028]">
                        {formatRupiah(order.value)}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#6b6056]">{order.nextAction}</p>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#756a60]">
                      <span>{order.dueDate}</span>
                      <PipelineAction stage={stage} description={order.nextAction} />
                    </div>
                  </article>
                ))}
            </div>
          </div>
        ))}
      </section>

      <section id="tasks" className="mt-6 rounded-md border border-[#e0d4c7] bg-white p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Task Produksi</h2>
            <p className="mt-1 text-sm text-[#6b6056]">
              Daftar kerja internal untuk menjaga order tidak berhenti di tengah proses.
            </p>
          </div>
          <span className="text-sm font-semibold text-[#9a6a3a]">
            {workflowTasks.filter((task) => task.status === "today").length} prioritas hari ini
          </span>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {workflowTasks.map((task) => (
            <article key={task.id} className="rounded-md border border-[#eadfd2] bg-[#fffaf4] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold">{task.title}</h3>
                  <p className="mt-1 text-sm text-[#6b6056]">{task.event} / {task.owner}</p>
                </div>
                <TaskStatusBadge status={task.status} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="billing" className="mt-6 rounded-md border border-[#e0d4c7] bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Billing & Paket</h2>
            <p className="mt-1 text-sm text-[#6b6056]">
              Section ini membuat menu Billing di sidebar aktif. Nanti bisa dihubungkan ke invoice dan payment status.
            </p>
          </div>
          <CreateInvoiceAction />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            ["Pendapatan Bulan Ini", formatRupiah(billingSummary.revenueThisMonth), `Dari ${billingSummary.paidInvoices} invoice paid`],
            ["Invoice Pending", String(billingSummary.pendingInvoices), "Menunggu pembayaran"],
            ["Paket Terlaris", billingSummary.bestPackage, "2 event aktif"],
          ].map(([label, value, helper]) => (
            <div key={label} className="rounded-md border border-[#eadfd2] bg-[#fffaf4] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a6a3a]">{label}</div>
              <div className="mt-2 text-2xl font-semibold">{value}</div>
              <div className="mt-1 text-sm text-[#6b6056]">{helper}</div>
            </div>
          ))}
        </div>
      </section>
      </DashboardShell>
    </AuthGate>
  );
}

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

function getStageDescription(stage: "Lead Baru" | "Proses Setup" | "Siap Publish") {
  const descriptions = {
    "Lead Baru": "Calon client yang perlu follow-up sebelum dibuatkan event.",
    "Proses Setup": "Order aktif yang sedang dikerjakan konten, tamu, dan medianya.",
    "Siap Publish": "Event yang sudah siap dikirim ke client atau dipasang domain.",
  };

  return descriptions[stage];
}

function TaskStatusBadge({ status }: { status: "blocked" | "today" | "next" }) {
  const label = {
    blocked: "Butuh input",
    today: "Hari ini",
    next: "Berikutnya",
  }[status];
  const color =
    status === "blocked"
      ? "bg-rose-50 text-rose-700"
      : status === "today"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-[#efe5d8] text-[#9a6a3a]";

  return (
    <span className={`inline-flex h-8 shrink-0 items-center rounded-full px-3 text-xs font-semibold uppercase tracking-[0.14em] ${color}`}>
      {label}
    </span>
  );
}
