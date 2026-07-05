import { AuthGate } from "@/components/auth-gate";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  CreateEventAction,
  CreateInvoiceAction,
  ExportReportAction,
  PipelineAction,
} from "@/components/owner-actions";
import { StatCard } from "@/components/stat-card";
import { events } from "@/lib/demo-data";
import Link from "next/link";

export default function OwnerDashboardPage() {
  const active = events.filter((event) => event.status === "active").length;
  const totalGuests = events.reduce((sum, event) => sum + event.guests, 0);
  const totalRsvp = events.reduce((sum, event) => sum + event.rsvpYes + event.rsvpNo, 0);
  const totalWishes = events.reduce((sum, event) => sum + event.wishes, 0);
  const draft = events.filter((event) => event.status === "draft").length;

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
              Setelah form event aktif, owner bisa membuat workspace client dari sini.
            </p>
            <div className="mt-5">
              <CreateEventAction />
            </div>
          </div>
        </section>

      <section id="monitoring" className="mt-6 rounded-md border border-[#e0d4c7] bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Event Yang Sedang Dikelola</h2>
            <p className="mt-1 text-sm text-[#6b6056]">Owner bisa membuka detail client, memantau progres, dan membantu edit konten.</p>
          </div>
          <ExportReportAction />
        </div>

        <div className="mt-5 grid gap-4">
          {events.map((event) => (
            <article key={event.id} className="rounded-md border border-[#eadfd2] p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold">{event.couple}</h3>
                    <span className="rounded-full bg-[#efe5d8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#9a6a3a]">
                      {event.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#6b6056]">
                    {event.clientName} / {event.packageName} / {event.date}
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center text-sm">
                  <MiniStat label="Tamu" value={event.guests} />
                  <MiniStat label="RSVP" value={event.rsvpYes + event.rsvpNo} />
                  <MiniStat label="Ucapan" value={event.wishes} />
                  <MiniStat label="Check-in" value={event.checkIns} />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#eadfd2] pt-4">
                <Link
                  href={`/wedding/${event.slug}`}
                  target="_blank"
                  className="rounded-md bg-[#241f1a] px-4 py-2 text-sm font-semibold text-white"
                >
                  View Website
                </Link>
                <span className="text-sm text-[#6b6056]">/wedding/{event.slug}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="pipeline" className="mt-6 grid gap-6 xl:grid-cols-3">
        {[
          ["Lead Baru", "Order dari calon client yang perlu follow-up."],
          ["Proses Setup", "Event yang sedang dibuat konten dan datanya."],
          ["Siap Publish", "Event siap dikirim ke client atau dipasang domain."],
        ].map(([stage, description]) => (
          <div key={stage} className="rounded-md border border-[#e0d4c7] bg-white p-5">
            <h2 className="font-semibold">{stage}</h2>
            <p className="mt-2 text-sm leading-6 text-[#6b6056]">{description}</p>
            <div className="mt-5 rounded-md border border-dashed border-[#d9caba] bg-[#fffaf4] p-4 text-sm text-[#756a60]">
              <p className="mb-4">Kanban card demo untuk tahap {stage.toLowerCase()}.</p>
              <PipelineAction stage={stage} description={description} />
            </div>
          </div>
        ))}
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
            ["Pendapatan Bulan Ini", "Rp8,7jt", "Dari 4 invoice paid"],
            ["Invoice Pending", "3", "Menunggu pembayaran"],
            ["Paket Terlaris", "Premium", "2 event aktif"],
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
