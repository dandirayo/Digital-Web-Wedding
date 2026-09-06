"use client";

import { AuthGate } from "@/components/auth-gate";
import { AddGuestAction } from "@/components/client-actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { GuestExcelUpload, type ImportedGuest } from "@/components/guest-excel-upload";
import { StatCard } from "@/components/stat-card";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { BulkShare } from "@/components/bulk-share";
import {
  initStore,
  getCurrentSession,
  getEvents,
  getGuests,
  getWishes,
  getEventContent,
  updateEventContent,
  updateEvent,
  addGuest,
  importGuests
} from "@/lib/store";
import type { WeddingEvent, Guest, Wish } from "@/lib/types";
import { getPackageLabel } from "@/lib/demo-data";
import { ContentReview } from "@/components/content-review";

const MESSAGE_TEMPLATE = `Kepada Yth. \${guest.name},

Dengan hormat, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami:

\${event.coupleName}
📅 \${formattedDate}
📍 \${event.venue}

Silakan buka undangan digital kami di:
\${invitationLink}

Mohon konfirmasi kehadiran melalui link di atas.

Terima kasih 🙏`;

type WeddingContent = {
  couple: string;
  date: string;
  venue: string;
  packageName: string;
  greeting: string;
};

export default function ClientDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<WeddingEvent | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [content, setContent] = useState<WeddingContent>({
    couple: "",
    date: "",
    venue: "",
    packageName: "",
    greeting: "",
  });
  
  const [contentSaved, setContentSaved] = useState(false);
  const [sharedGuestIds, setSharedGuestIds] = useState<string[]>([]);
  const [previewGuestId, setPreviewGuestId] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      await initStore();
      const session = await getCurrentSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const events = await getEvents({ clientId: session.userId });
      if (events.length > 0) {
        const ev = events[0];
        setEvent(ev);

        const storedShared = localStorage.getItem(`occasio_shared_${ev.id}`);
        if (storedShared) {
          setSharedGuestIds(JSON.parse(storedShared));
        }

        const [loadedGuests, loadedWishes, loadedContent] = await Promise.all([
          getGuests(ev.id),
          getWishes(ev.id),
          getEventContent(ev.id)
        ]);

        setGuests(loadedGuests);
        setWishes(loadedWishes);
        
        setContent({
          couple: ev.coupleName,
          date: ev.eventDate ? new Date(ev.eventDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "",
          venue: ev.venue,
          packageName: getPackageLabel(ev.packageTier),
          greeting: loadedContent?.greeting || "Dengan penuh sukacita kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada hari bahagia kami.",
        });
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <AuthGate role="client">
        <DashboardShell
          role="client"
          title="Loading..."
          description="Ruang kerja klien Occasio untuk mengelola undangan, daftar tamu, RSVP, QR, dan ucapan."
        >
          <div className="flex h-64 items-center justify-center">
            <div className="text-[#9a6a3a]">Memuat data...</div>
          </div>
        </DashboardShell>
      </AuthGate>
    );
  }

  if (!event) {
    return (
      <AuthGate role="client">
        <DashboardShell
          role="client"
          title="Workspace Klien"
          description="Ruang kerja klien Occasio untuk mengelola undangan, daftar tamu, RSVP, QR, dan ucapan."
        >
          <div className="flex h-64 items-center justify-center rounded-md border border-[#e0d4c7] bg-white p-5 text-center">
            <div className="text-lg font-semibold text-[#6b6056]">Belum ada undangan yang di-assign. Hubungi Owner.</div>
          </div>
        </DashboardShell>
      </AuthGate>
    );
  }

  const pending = Math.max(guests.length - event.rsvpYes - event.rsvpNo, 0);
  const setupItems = [
    { label: "Konten utama", done: Boolean(content.couple && content.date && content.venue && content.greeting) },
    { label: "Daftar tamu", done: guests.length > 0 },
    { label: "RSVP masuk", done: event.rsvpYes + event.rsvpNo > 0 },
    { label: "Ucapan tampil", done: event.wishCount > 0 },
    { label: "Website preview", done: true },
  ];
  const setupScore = Math.round((setupItems.filter((item) => item.done).length / setupItems.length) * 100);

  async function handleAddGuest(guestData: Omit<Guest, "id" | "createdAt" | "qrCode" | "checkedInAt" | "eventId">) {
    if (!event) return;
    const newGuest = await addGuest(event.id, guestData);
    setGuests((current) => [newGuest, ...current]);
  }

  async function handleImportGuests(importedGuests: ImportedGuest[]) {
    if (!event) return;
    const newGuests = await importGuests(event.id, importedGuests);
    setGuests((current) => [...newGuests, ...current]);
  }

  async function handleSaveContent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!event) return;

    await updateEventContent(event.id, { greeting: content.greeting });
    await updateEvent(event.id, { 
      coupleName: content.couple,
      venue: content.venue,
    });
    
    setContentSaved(true);
    setTimeout(() => setContentSaved(false), 3000);
  }

  const getGuestLink = (guest: Guest) => {
    if (!event) return "";
    return `${window.location.origin}/wedding/${event.slug}?to=${encodeURIComponent(guest.name)}`;
  };

  const getWhatsappLink = (guest: Guest) => {
    if (!event) return "";
    const formattedDate = event.eventDate
      ? new Date(event.eventDate).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";
    const message = MESSAGE_TEMPLATE
      .replace(/\$\{guest\.name\}/g, guest.name)
      .replace(/\$\{event\.coupleName\}/g, event.coupleName)
      .replace(/\$\{formattedDate\}/g, formattedDate)
      .replace(/\$\{event\.venue\}/g, event.venue)
      .replace(/\$\{invitationLink\}/g, getGuestLink(guest));

    return `https://wa.me/${guest.phone}?text=${encodeURIComponent(message)}`;
  };

  const copyLink = async (guest: Guest) => {
    try {
      await navigator.clipboard.writeText(getGuestLink(guest));
      // Optional: add a toast library here for success notification
      alert(`Link untuk ${guest.name} tersalin!`);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const markAsShared = (guestIds: string[]) => {
    if (!event) return;
    const newShared = Array.from(new Set([...sharedGuestIds, ...guestIds]));
    setSharedGuestIds(newShared);
    localStorage.setItem(`occasio_shared_${event.id}`, JSON.stringify(newShared));
  };

  const shareWhatsApp = (guest: Guest) => {
    window.open(getWhatsappLink(guest), "_blank");
    markAsShared([guest.id]);
  };

  return (
    <AuthGate role="client">
      <DashboardShell
        role="client"
        title={content.couple}
        description="Kelola brief, konten, tamu, RSVP, dan kesiapan publish undangan Anda."
      >
        <section id="brief" className="mb-6 rounded-md border border-[#e0d4c7] bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a6a3a]">Brief pesanan</div>
              <h2 className="mt-2 text-2xl font-semibold">{content.couple}</h2>
              <p className="mt-2 text-sm leading-6 text-[#6b6056]">Brief yang sudah dikonfirmasi owner menjadi acuan pengerjaan konten dan publish.</p>
            </div>
            <span className="inline-flex rounded-full bg-[#efe5d8] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7b552f]">Produksi berjalan</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <BriefItem label="Paket" value={content.packageName} />
            <BriefItem label="Tanggal acara" value={content.date} />
            <BriefItem label="Lokasi" value={content.venue} />
            <BriefItem label="Alamat website" value={`/wedding/${event.slug}`} />
          </div>
        </section>

        <section className="mb-6 flex flex-col items-start gap-4 rounded-md border border-[#e0d4c7] bg-white p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Preview Undangan</h2>
            <p className="mt-1 text-sm text-[#6b6056]">Lihat tampilan website undangan Anda.</p>
          </div>
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
            <select
              className="h-10 rounded-md border border-[#e0d4c7] bg-[#fffaf4] px-3 text-sm outline-none"
              value={previewGuestId}
              onChange={(e) => setPreviewGuestId(e.target.value)}
            >
              <option value="">-- Preview sebagai tamu --</option>
              {guests.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                const guest = guests.find((g) => g.id === previewGuestId);
                const url = guest ? getGuestLink(guest) : `/wedding/${event.slug}`;
                window.open(url, "_blank");
              }}
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#9a6a3a] px-4 text-sm font-semibold text-white hover:bg-[#865a30]"
            >
              👁️ Buka Preview
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Tamu" value={String(guests.length)} helper="Tersimpan di workspace" />
          <StatCard label="Hadir" value={String(event.rsvpYes)} helper="RSVP sudah konfirmasi" />
          <StatCard label="Belum Jawab" value={String(pending)} helper="Perlu follow-up" />
          <StatCard label="Ucapan" value={String(event.wishCount)} helper="Masuk dari web" />
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

        <div className="mt-6">
          <ContentReview eventId={event.id} role="client" />
        </div>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <GuestExcelUpload onImport={handleImportGuests} />

          <div id="content" className="rounded-md border border-[#e0d4c7] bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Konten Undangan</h2>
                <p className="mt-1 text-sm leading-6 text-[#6b6056]">
                  Ringkasan konten utama yang akan muncul di website undangan Anda.
                </p>
              </div>
              <Link
                href={`/wedding/${event.slug}`}
                target="_blank"
                className="inline-flex h-10 items-center justify-center rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white"
              >
                View Website
              </Link>
            </div>
            <div className="mt-5 overflow-hidden rounded-md border border-[#eadfd2] bg-[#f7f3ed]">
              <div className="aspect-[16/10] bg-[linear-gradient(rgba(36,31,26,0.04),rgba(36,31,26,0.54)),url('/sample-wedding.svg')] bg-cover bg-center p-4 text-white">
                <div className="flex h-full flex-col justify-end">
                  <div className="text-xs uppercase tracking-[0.2em]">Website Preview</div>
                  <div className="mt-1 text-3xl font-semibold">{content.couple}</div>
                  <div className="mt-2 text-sm text-white/80">/wedding/{event.slug}</div>
                </div>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {[
                ["Slug Website", `/wedding/${event.slug}`],
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
                Perubahan disimpan ke workspace dan dapat direview sebelum publish.
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
            <label className="block md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#756a60]">Kalimat pembuka</span>
              <textarea
                className="mt-2 min-h-28 w-full rounded-md border border-[#e0d4c7] bg-[#fffaf4] px-3 py-3 text-sm outline-none transition focus:border-[#9a6a3a]"
                value={content.greeting}
                onChange={(e) => setContent((current) => ({ ...current, greeting: e.target.value }))}
              />
            </label>
            <button className="h-11 rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white md:col-span-2">
              Simpan Konten
            </button>
          </form>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div id="guests" className="min-w-0 rounded-md border border-[#e0d4c7] bg-white p-5 xl:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Daftar Tamu Terbaru</h2>
              <p className="mt-1 text-sm text-[#6b6056]">Tambah, impor, dan kirim link personal kepada tamu.</p>
            </div>
            <div className="flex items-center gap-3">
              <BulkShare
                event={event}
                guests={guests}
                messageTemplate={MESSAGE_TEMPLATE}
                onShared={markAsShared}
              />
              <AddGuestAction onAdd={handleAddGuest} />
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-md border border-[#eadfd2]">
            <table className="min-w-[800px] w-full text-left text-sm">
              <thead className="bg-[#f7f3ed] text-[#756a60]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama & Link</th>
                  <th className="px-4 py-3 font-semibold">Status RSVP</th>
                  <th className="px-4 py-3 font-semibold">Status Kirim</th>
                  <th className="px-4 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => {
                  const isShared = sharedGuestIds.includes(guest.id);
                  return (
                    <tr key={guest.id} className="border-t border-[#eadfd2]">
                      <td className="px-4 py-3">
                        <div className="font-medium">{guest.name}</div>
                        <div className="mt-1 text-[11px] text-[#9a6a3a] truncate max-w-[250px]" title={getGuestLink(guest)}>
                          {getGuestLink(guest)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#6b6056] capitalize">{guest.rsvpStatus}</td>
                      <td className="px-4 py-3">
                        {isShared ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                            Sudah dikirim
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
                            Belum dikirim
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyLink(guest)}
                            className="inline-flex h-8 items-center justify-center rounded-md border border-[#e0d4c7] bg-white px-3 text-xs font-medium text-[#241f1a] hover:bg-[#fffaf4]"
                          >
                            📋 Copy
                          </button>
                          <button
                            onClick={() => shareWhatsApp(guest)}
                            disabled={!guest.phone}
                            className="inline-flex h-8 items-center justify-center rounded-md bg-[#25D366] px-3 text-xs font-medium text-white hover:bg-[#128C7E] disabled:opacity-50"
                            title={!guest.phone ? "Nomor WhatsApp belum diisi" : ""}
                          >
                            📱 {isShared ? "Kirim Ulang" : "Kirim WA"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

          <div className="rounded-md border border-[#e0d4c7] bg-white p-5 xl:col-span-2">
            <h2 className="text-xl font-semibold">Checklist Client</h2>
            <div className="mt-5 space-y-3">
              {[
                ["Upload daftar tamu", "#guests"],
                ["Cek RSVP masuk", `/wedding/${event.slug}`],
                ["Review ucapan tamu", "#wishes"],
                ["Lengkapi konten undangan", "#content"],
                ["Download QR tamu", `/wedding/${event.slug}`],
              ].map(([item, href], index) => (
                <Link key={item} href={href} className="flex items-center gap-3 rounded-md border border-[#eadfd2] p-3 transition hover:bg-[#fffaf4]">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-[#efe5d8] text-xs font-semibold text-[#9a6a3a]">
                    {index + 1}
                  </div>
                  <div className="text-sm font-medium">{item}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="wishes" className="mt-6 rounded-md border border-[#e0d4c7] bg-white p-5">
        <h2 className="text-xl font-semibold">Ucapan Terbaru</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {wishes.map((wish) => (
            <article key={wish.id} className="rounded-md border border-[#eadfd2] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">{wish.guestName}</div>
                <div className="text-xs text-[#9a6a3a]">{new Date(wish.createdAt).toLocaleDateString("id-ID")}</div>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#6b6056]">{wish.message}</p>
            </article>
          ))}
          {wishes.length === 0 && (
            <div className="col-span-3 text-center text-sm text-[#6b6056] py-4">
              Belum ada ucapan
            </div>
          )}
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

function BriefItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#eadfd2] bg-[#fffaf4] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a6a3a]">{label}</div>
      <div className="mt-2 text-sm font-semibold">{value}</div>
    </div>
  );
}
