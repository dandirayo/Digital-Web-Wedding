import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/stat-card";
import { events } from "@/lib/demo-data";

export default function OwnerDashboardPage() {
  const active = events.filter((event) => event.status === "active").length;
  const totalGuests = events.reduce((sum, event) => sum + event.guests, 0);
  const totalRsvp = events.reduce((sum, event) => sum + event.rsvpYes + event.rsvpNo, 0);
  const totalWishes = events.reduce((sum, event) => sum + event.wishes, 0);

  return (
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

      <section id="monitoring" className="mt-6 rounded-md border border-[#e0d4c7] bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Event Yang Sedang Dikelola</h2>
            <p className="mt-1 text-sm text-[#6b6056]">Owner bisa membuka detail client, memantau progres, dan membantu edit konten.</p>
          </div>
          <button className="rounded-md bg-[#241f1a] px-4 py-2 text-sm font-semibold text-white">
            Buat Event
          </button>
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
            </article>
          ))}
        </div>
      </section>

      <section id="pipeline" className="mt-6 grid gap-6 xl:grid-cols-3">
        {["Lead Baru", "Proses Setup", "Siap Publish"].map((stage) => (
          <div key={stage} className="rounded-md border border-[#e0d4c7] bg-white p-5">
            <h2 className="font-semibold">{stage}</h2>
            <p className="mt-2 text-sm leading-6 text-[#6b6056]">
              Board ini nanti bisa diisi order masuk, invoice, dan progress pengerjaan template.
            </p>
          </div>
        ))}
      </section>
    </DashboardShell>
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
