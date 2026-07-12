"use client";

import { AuthGate } from "@/components/auth-gate";
import { AddGuestAction, type ClientGuest } from "@/components/client-actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { GuestExcelUpload } from "@/components/guest-excel-upload";
import { StatCard } from "@/components/stat-card";
import { clientEvent, recentGuests, recentWishes } from "@/lib/demo-data";
import Link from "next/link";
import { FormEvent, useState } from "react";

type WeddingContent = {
  couple: string;
  date: string;
  venue: string;
  packageName: string;
  greeting: string;
};

const GUESTS_KEY = "occasio_demo_guests_sheila-yoga";
const CONTENT_KEY = "occasio_demo_content_sheila-yoga";

const defaultContent: WeddingContent = {
  couple: clientEvent.couple,
  date: clientEvent.date,
  venue: clientEvent.venue,
  packageName: clientEvent.packageName,
  greeting: "Dengan penuh sukacita kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada hari bahagia kami.",
};

export default function ClientDashboardPage() {
  const [guests, setGuests] = useState<ClientGuest[]>(() => {
    if (typeof window === "undefined") return recentGuests;
    try {
      const storedGuests = localStorage.getItem(GUESTS_KEY);
      return storedGuests ? (JSON.parse(storedGuests) as ClientGuest[]) : recentGuests;
    } catch {
      return recentGuests;
    }
  });
  const [content, setContent] = useState<WeddingContent>(() => {
    if (typeof window === "undefined") return defaultContent;
    try {
      const storedContent = localStorage.getItem(CONTENT_KEY);
      return storedContent
        ? { ...defaultContent, ...(JSON.parse(storedContent) as Partial<WeddingContent>) }
        : defaultContent;
    } catch {
      return defaultContent;
    }
  });
  const [contentSaved, setContentSaved] = useState(false);
  const pending = Math.max(guests.length - clientEvent.rsvpYes - clientEvent.rsvpNo, 0);
  const setupItems = [
    { label: "Konten utama", done: Boolean(content.couple && content.date && content.venue && content.greeting) },
    { label: "Daftar tamu", done: guests.length > 0 },
    { label: "RSVP masuk", done: clientEvent.rsvpYes + clientEvent.rsvpNo > 0 },
    { label: "Ucapan tampil", done: clientEvent.wishes > 0 },
    { label: "Website preview", done: true },
  ];
  const setupScore = Math.round((setupItems.filter((item) => item.done).length / setupItems.length) * 100);

  function handleAddGuest(guest: ClientGuest) {
    setGuests((current) => {
      const next = [guest, ...current];
      localStorage.setItem(GUESTS_KEY, JSON.stringify(next));
      return next;
    });
  }

  function handleSaveContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    localStorage.setItem(CONTENT_KEY, JSON.stringify(content));
    setContentSaved(true);
  }

  return (
    <AuthGate role="client">
      <DashboardShell
        role="client"
        title={content.couple}
        description="Ruang kerja klien Occasio untuk mengelola undangan, daftar tamu, RSVP, QR, dan ucapan."
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Tamu" value={String(guests.length)} helper="Demo tersimpan lokal" />
          <StatCard label="Hadir" value={String(clientEvent.rsvpYes)} helper="RSVP sudah konfirmasi" />
          <StatCard label="Belum Jawab" value={String(pending)} helper="Perlu follow-up" />
          <StatCard label="Ucapan" value={String(clientEvent.wishes)} helper="Masuk dari web" />
        </section>

        <section className="mt-6 rounded-md border border-[#e0d4c7] bg-white p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a6a3a]">
                Setup progress
              </div>
              <h2 className="mt-2 text-2xl font-semibold">Kesiapan undangan {content.couple}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b6056]">
                Progress ini membantu client melihat bagian mana yang sudah siap sebelum website dibagikan.
              </p>
            </div>
            <div className="rounded-md border border-[#eadfd2] bg-[#fffaf4] p-4 text-center">
              <div className="text-4xl font-semibold">{setupScore}%</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#9a6a3a]">
                siap publish
              </div>
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#eadfd2]">
            <div className="h-full rounded-full bg-[#9a6a3a]" style={{ width: `${setupScore}%` }} />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {setupItems.map((item) => (
              <div key={item.label} className="rounded-md border border-[#eadfd2] bg-[#fffaf4] p-3">
                <div
                  className={`mb-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    item.done ? "bg-emerald-50 text-emerald-700" : "bg-white text-[#9a6a3a]"
                  }`}
                >
                  {item.done ? "OK" : "Pending"}
                </div>
                <div className="text-sm font-semibold">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <GuestExcelUpload />

          <div id="content" className="rounded-md border border-[#e0d4c7] bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Konten Undangan</h2>
                <p className="mt-1 text-sm leading-6 text-[#6b6056]">
                  Ringkasan konten utama yang akan muncul di website undangan client.
                </p>
              </div>
              <Link
                href={`/wedding/${clientEvent.slug}`}
                target="_blank"
                className="rounded-md bg-[#241f1a] px-4 py-2 text-sm font-semibold text-white"
              >
                View Website
              </Link>
            </div>
            <div className="mt-5 overflow-hidden rounded-md border border-[#eadfd2] bg-[#f7f3ed]">
              <div className="aspect-[16/10] bg-[linear-gradient(rgba(36,31,26,0.04),rgba(36,31,26,0.54)),url('/sample-wedding.svg')] bg-cover bg-center p-4 text-white">
                <div className="flex h-full flex-col justify-end">
                  <div className="text-xs uppercase tracking-[0.2em]">Website Preview</div>
                  <div className="mt-1 text-3xl font-semibold">{content.couple}</div>
                  <div className="mt-2 text-sm text-white/80">/wedding/{clientEvent.slug}</div>
                </div>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {[
                ["Slug Website", `/wedding/${clientEvent.slug}`],
                ["Tanggal", content.date],
                ["Venue", content.venue],
                ["Paket", content.packageName],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#eadfd2] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a6a3a]">{label}</div>
                  <div className="mt-1 font-medium">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-md border border-[#e0d4c7] bg-white p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Edit Konten Website</h2>
              <p className="mt-1 text-sm leading-6 text-[#6b6056]">
                Perubahan ini tersimpan lokal dan dibaca oleh halaman `/wedding/sheila-yoga`.
              </p>
            </div>
            {contentSaved ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                Tersimpan
              </span>
            ) : null}
          </div>

          <form onSubmit={handleSaveContent} className="mt-5 grid gap-4 md:grid-cols-2">
            <ContentField label="Nama pasangan" value={content.couple} onChange={(value) => setContent((current) => ({ ...current, couple: value }))} />
            <ContentField label="Tanggal" value={content.date} onChange={(value) => setContent((current) => ({ ...current, date: value }))} />
            <ContentField label="Venue" value={content.venue} onChange={(value) => setContent((current) => ({ ...current, venue: value }))} />
            <ContentField label="Paket" value={content.packageName} onChange={(value) => setContent((current) => ({ ...current, packageName: value }))} />
            <label className="block md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#756a60]">Kalimat pembuka</span>
              <textarea
                className="mt-2 min-h-28 w-full rounded-md border border-[#e0d4c7] bg-[#fffaf4] px-3 py-3 text-sm outline-none transition focus:border-[#9a6a3a]"
                value={content.greeting}
                onChange={(event) => setContent((current) => ({ ...current, greeting: event.target.value }))}
              />
            </label>
            <button className="h-11 rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white md:col-span-2">
              Simpan Konten
            </button>
          </form>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div id="guests" className="rounded-md border border-[#e0d4c7] bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Daftar Tamu Terbaru</h2>
              <p className="mt-1 text-sm text-[#6b6056]">Data ini nanti diambil dari table `guests` milik event client.</p>
            </div>
            <AddGuestAction onAdd={handleAddGuest} />
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
                {guests.map((guest) => (
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

function ContentField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#756a60]">{label}</span>
      <input
        className="mt-2 h-11 w-full rounded-md border border-[#e0d4c7] bg-[#fffaf4] px-3 text-sm outline-none transition focus:border-[#9a6a3a]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
