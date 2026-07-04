import { AuthGate } from "@/components/auth-gate";
import { DashboardShell } from "@/components/dashboard-shell";
import { GuestExcelUpload } from "@/components/guest-excel-upload";
import { StatCard } from "@/components/stat-card";
import { clientEvent, recentGuests, recentWishes } from "@/lib/demo-data";

export default function ClientDashboardPage() {
  const pending = clientEvent.guests - clientEvent.rsvpYes - clientEvent.rsvpNo;

  return (
    <AuthGate role="client">
      <DashboardShell
        role="client"
        title={clientEvent.couple}
        description="Ruang kerja klien Occasio untuk mengelola undangan, daftar tamu, RSVP, QR, dan ucapan."
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Tamu" value={String(clientEvent.guests)} helper="Database undangan" />
          <StatCard label="Hadir" value={String(clientEvent.rsvpYes)} helper="RSVP sudah konfirmasi" />
          <StatCard label="Belum Jawab" value={String(pending)} helper="Perlu follow-up" />
          <StatCard label="Ucapan" value={String(clientEvent.wishes)} helper="Masuk dari web" />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <GuestExcelUpload />

          <div id="content" className="rounded-md border border-[#e0d4c7] bg-white p-5">
            <h2 className="text-xl font-semibold">Konten Undangan</h2>
            <p className="mt-1 text-sm leading-6 text-[#6b6056]">
              Ringkasan konten utama yang akan muncul di website undangan client.
            </p>
            <div className="mt-5 space-y-4">
              {[
                ["Slug Website", `/wedding/${clientEvent.slug}`],
                ["Tanggal", clientEvent.date],
                ["Venue", clientEvent.venue],
                ["Paket", clientEvent.packageName],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#eadfd2] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a6a3a]">{label}</div>
                  <div className="mt-1 font-medium">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div id="guests" className="rounded-md border border-[#e0d4c7] bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Daftar Tamu Terbaru</h2>
              <p className="mt-1 text-sm text-[#6b6056]">Data ini nanti diambil dari table `guests` milik event client.</p>
            </div>
            <button className="rounded-md bg-[#241f1a] px-4 py-2 text-sm font-semibold text-white">
              Tambah Tamu
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-md border border-[#eadfd2]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f7f3ed] text-[#756a60]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">PAX</th>
                  <th className="px-4 py-3 font-semibold">Kode</th>
                </tr>
              </thead>
              <tbody>
                {recentGuests.map((guest) => (
                  <tr key={guest.code} className="border-t border-[#eadfd2]">
                    <td className="px-4 py-3 font-medium">{guest.name}</td>
                    <td className="px-4 py-3 text-[#6b6056]">{guest.status}</td>
                    <td className="px-4 py-3 text-[#6b6056]">{guest.pax || "-"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#9a6a3a]">{guest.code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

          <div className="rounded-md border border-[#e0d4c7] bg-white p-5">
            <h2 className="text-xl font-semibold">Checklist Client</h2>
            <div className="mt-5 space-y-3">
              {[
                "Upload daftar tamu",
                "Cek RSVP masuk",
                "Review ucapan tamu",
                "Lengkapi konten undangan",
                "Download QR tamu",
              ].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-md border border-[#eadfd2] p-3">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-[#efe5d8] text-xs font-semibold text-[#9a6a3a]">
                    {index + 1}
                  </div>
                  <div className="text-sm font-medium">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="wishes" className="mt-6 rounded-md border border-[#e0d4c7] bg-white p-5">
        <h2 className="text-xl font-semibold">Ucapan Terbaru</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {recentWishes.map((wish) => (
            <article key={`${wish.name}-${wish.time}`} className="rounded-md border border-[#eadfd2] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">{wish.name}</div>
                <div className="text-xs text-[#9a6a3a]">{wish.time}</div>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#6b6056]">{wish.text}</p>
            </article>
          ))}
        </div>
      </section>
      </DashboardShell>
    </AuthGate>
  );
}
