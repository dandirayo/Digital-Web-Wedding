"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  initStore,
  getEventById,
  getEventContent,
  getGuests,
  getWishes,
  getMedia,
  updateEvent,
  updateEventContent,
  deleteGuest,
  addGuest,
  updateWish,
  deleteEvent
} from "@/lib/store";
import { WeddingEvent, EventContent, Guest, Wish, EventMedia } from "@/lib/types";

function EditableField({
  label,
  value,
  onSave
}: {
  label: string;
  value: string;
  onSave: (val: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(tempValue);
    setSaving(false);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-[#eadfd2] bg-white p-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#9a6a3a]">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="h-9 flex-1 rounded-md border border-[#cdbba8] px-3 text-sm outline-none focus:border-[#9a6a3a]"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 rounded-md bg-[#241f1a] px-3 text-sm font-semibold text-white transition hover:bg-[#3a332a] disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setTempValue(value);
            }}
            className="h-9 rounded-md border border-[#cdbba8] px-3 text-sm font-semibold text-[#5a4028] transition hover:bg-[#f7f3ed]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 rounded-md border border-transparent p-3 hover:border-[#eadfd2] hover:bg-[#fffaf4] group transition">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#9a6a3a]">{label}</label>
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs font-semibold text-[#6b6056] opacity-0 group-hover:opacity-100 transition hover:text-[#241f1a]"
        >
          ✎ Edit
        </button>
      </div>
      <div className="text-sm font-medium text-[#241f1a]">{value || <span className="text-[#6b6056] italic">Kosong</span>}</div>
    </div>
  );
}

export default function OwnerEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<WeddingEvent | null>(null);
  const [content, setContent] = useState<EventContent | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [media, setMedia] = useState<EventMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'detail' | 'tamu' | 'ucapan' | 'pengaturan'>('detail');

  // New guest form state
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestPhone, setNewGuestPhone] = useState("");

  const [searchGuest, setSearchGuest] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      await initStore();
      const loadedEvent = await getEventById(id);
      if (loadedEvent) {
        setEvent(loadedEvent);
        setContent(await getEventContent(id));
        setGuests(await getGuests(id));
        setWishes(await getWishes(id));
        setMedia(await getMedia(id));
      }
      setIsLoading(false);
    }
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <DashboardShell role="owner" title="Memuat..." description="Mohon tunggu.">
        <div className="p-10 text-center text-sm text-[#6b6056]">Memuat data event...</div>
      </DashboardShell>
    );
  }

  if (!event) {
    return (
      <DashboardShell role="owner" title="Event Tidak Ditemukan" description="Event ini mungkin sudah dihapus.">
        <div className="mt-6">
          <Link href="/owner/dashboard" className="text-[#9a6a3a] hover:underline">← Kembali ke Dashboard</Link>
        </div>
      </DashboardShell>
    );
  }

  const handleCopyLink = (path?: string) => {
    const url = `${window.location.origin}/wedding/${event.slug}${path || ""}`;
    navigator.clipboard.writeText(url);
    alert("Link berhasil disalin!");
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim()) return;
    const newGuest = await addGuest(event.id, {
      name: newGuestName,
      phone: newGuestPhone,
      paxLimit: 1,
      rsvpStatus: "pending",
      paxConfirmed: 0,
    });
    setGuests([...guests, newGuest]);
    setEvent({ ...event, guestCount: event.guestCount + 1 });
    setNewGuestName("");
    setNewGuestPhone("");
    alert("Tamu berhasil ditambahkan!");
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (confirm("Hapus tamu ini?")) {
      await deleteGuest(guestId);
      setGuests(guests.filter(g => g.id !== guestId));
    }
  };

  const handleToggleWishVisibility = async (wish: Wish) => {
    const updated = await updateWish(wish.id, { isVisible: !wish.isVisible });
    setWishes(wishes.map(w => w.id === wish.id ? updated : w));
  };

  const handleDeleteEvent = async () => {
    if (confirm("PERINGATAN: Anda yakin ingin menghapus event ini secara permanen? Semua data (tamu, ucapan, media) akan hilang!")) {
      await deleteEvent(event.id);
      router.push("/owner/dashboard");
    }
  };

  const filteredGuests = guests.filter(g => g.name.toLowerCase().includes(searchGuest.toLowerCase()));

  return (
    <DashboardShell
      role="owner"
      title={event.coupleName}
      description={`Manajemen detail event, tamu, dan pengaturan. (Status: ${event.status})`}
    >
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link href="/owner/dashboard" className="text-sm font-semibold text-[#9a6a3a] hover:underline">
          ← Kembali ke Dashboard
        </Link>
        <div className="flex-1"></div>
        <button
          onClick={() => handleCopyLink()}
          className="inline-flex h-9 items-center justify-center rounded-md border border-[#cdbba8] bg-white px-4 text-sm font-semibold text-[#5a4028] transition hover:bg-[#f7f3ed]"
        >
          Copy Link Publik
        </button>
        <Link
          href={`/wedding/${event.slug}`}
          target="_blank"
          className="inline-flex h-9 items-center justify-center rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white transition hover:bg-[#3a332a]"
        >
          Preview Undangan
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-6">
        {[
          { label: "Total Tamu", value: event.guestCount },
          { label: "RSVP Hadir", value: event.rsvpYes },
          { label: "RSVP Tolak", value: event.rsvpNo },
          { label: "Belum Respon", value: event.guestCount - (event.rsvpYes + event.rsvpNo) },
          { label: "Ucapan", value: event.wishCount },
          { label: "Check-in", value: event.checkInCount },
        ].map(stat => (
          <div key={stat.label} className="rounded-md border border-[#eadfd2] bg-white p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-[#241f1a]">{stat.value}</div>
            <div className="mt-1 text-xs font-semibold uppercase text-[#6b6056]">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 flex gap-2 border-b border-[#eadfd2] overflow-x-auto">
        {(['detail', 'tamu', 'ucapan', 'pengaturan'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
              activeTab === tab
                ? "border-[#9a6a3a] text-[#9a6a3a]"
                : "border-transparent text-[#6b6056] hover:text-[#241f1a]"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="rounded-md border border-[#e0d4c7] bg-white p-6 min-h-[400px]">
        {activeTab === 'detail' && content && (
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-4 text-lg font-semibold border-b border-[#eadfd2] pb-2">Informasi Mempelai</h3>
              <div className="space-y-2">
                <EditableField
                  label="Nama Mempelai Pria"
                  value={content.groomName}
                  onSave={async (val) => {
                    const c = await updateEventContent(event.id, { groomName: val });
                    setContent(c);
                  }}
                />
                <EditableField
                  label="Nama Mempelai Wanita"
                  value={content.brideName}
                  onSave={async (val) => {
                    const c = await updateEventContent(event.id, { brideName: val });
                    setContent(c);
                  }}
                />
                <EditableField
                  label="Greeting (Salam)"
                  value={content.greeting}
                  onSave={async (val) => {
                    const c = await updateEventContent(event.id, { greeting: val });
                    setContent(c);
                  }}
                />
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold border-b border-[#eadfd2] pb-2">Waktu & Tempat</h3>
              <div className="space-y-2">
                <EditableField
                  label="Waktu Akad"
                  value={content.akadTime}
                  onSave={async (val) => {
                    const c = await updateEventContent(event.id, { akadTime: val });
                    setContent(c);
                  }}
                />
                <EditableField
                  label="Tempat Akad"
                  value={content.akadVenue}
                  onSave={async (val) => {
                    const c = await updateEventContent(event.id, { akadVenue: val });
                    setContent(c);
                  }}
                />
                <EditableField
                  label="Waktu Resepsi"
                  value={content.resepsiTime}
                  onSave={async (val) => {
                    const c = await updateEventContent(event.id, { resepsiTime: val });
                    setContent(c);
                  }}
                />
                <EditableField
                  label="Tempat Resepsi"
                  value={content.resepsiVenue}
                  onSave={async (val) => {
                    const c = await updateEventContent(event.id, { resepsiVenue: val });
                    setContent(c);
                  }}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <h3 className="mb-4 text-lg font-semibold border-b border-[#eadfd2] pb-2">Media Gallery</h3>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {media.length > 0 ? media.map(m => (
                  <div key={m.id} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border border-[#eadfd2] bg-[#f7f3ed]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.altText} className="h-full w-full object-cover" />
                  </div>
                )) : (
                  <p className="text-sm text-[#6b6056] italic">Belum ada media diunggah.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tamu' && (
          <div>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <input
                type="text"
                placeholder="Cari tamu..."
                value={searchGuest}
                onChange={(e) => setSearchGuest(e.target.value)}
                className="h-10 w-full sm:w-64 rounded-md border border-[#cdbba8] px-3 text-sm outline-none focus:border-[#9a6a3a]"
              />
              <form onSubmit={handleAddGuest} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nama Tamu"
                  required
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  className="h-10 flex-1 sm:w-48 rounded-md border border-[#cdbba8] px-3 text-sm outline-none focus:border-[#9a6a3a]"
                />
                <button type="submit" className="h-10 rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white hover:bg-[#3a332a]">
                  + Tambah
                </button>
              </form>
            </div>
            
            <div className="overflow-x-auto rounded-md border border-[#eadfd2]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#fffaf4] text-[#9a6a3a]">
                  <tr>
                    <th className="p-3 font-semibold">Nama</th>
                    <th className="p-3 font-semibold">RSVP</th>
                    <th className="p-3 font-semibold">Pax</th>
                    <th className="p-3 font-semibold">Check-in</th>
                    <th className="p-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eadfd2]">
                  {filteredGuests.length > 0 ? filteredGuests.map(g => (
                    <tr key={g.id} className="hover:bg-[#f7f3ed]/50">
                      <td className="p-3">{g.name}</td>
                      <td className="p-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          g.rsvpStatus === 'attending' ? 'bg-emerald-50 text-emerald-700' :
                          g.rsvpStatus === 'declined' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {g.rsvpStatus}
                        </span>
                      </td>
                      <td className="p-3">{g.paxConfirmed} / {g.paxLimit}</td>
                      <td className="p-3">{g.checkedInAt ? new Date(g.checkedInAt).toLocaleString() : '-'}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleCopyLink(`?to=${encodeURIComponent(g.name)}`)}
                          className="mr-3 text-xs font-semibold text-[#6b6056] hover:text-[#241f1a]"
                          title="Copy Link Undangan Spesifik Tamu"
                        >
                          Copy Link
                        </button>
                        <button
                          onClick={() => handleDeleteGuest(g.id)}
                          className="text-xs font-semibold text-red-600 hover:text-red-800"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-[#6b6056] italic">
                        Tidak ada tamu ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ucapan' && (
          <div className="grid gap-4 md:grid-cols-2">
            {wishes.length > 0 ? wishes.map(w => (
              <div key={w.id} className="rounded-md border border-[#eadfd2] p-4 bg-[#fffaf4]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-[#241f1a]">{w.guestName}</span>
                  <span className="text-xs text-[#9a6a3a]">{new Date(w.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-[#6b6056] mb-4">{w.message}</p>
                <div className="flex items-center justify-between border-t border-[#eadfd2] pt-3">
                  <span className={`text-xs font-semibold ${w.isVisible ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {w.isVisible ? "✓ Tampil di Web" : "✗ Disembunyikan"}
                  </span>
                  <button
                    onClick={() => handleToggleWishVisibility(w)}
                    className="text-xs font-semibold text-[#241f1a] hover:underline"
                  >
                    {w.isVisible ? "Sembunyikan" : "Tampilkan"}
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-2 p-10 text-center text-sm text-[#6b6056] italic">
                Belum ada ucapan masuk.
              </div>
            )}
          </div>
        )}

        {activeTab === 'pengaturan' && (
          <div className="max-w-2xl">
            <h3 className="mb-4 text-lg font-semibold border-b border-[#eadfd2] pb-2">Pengaturan Event</h3>
            
            <div className="space-y-6">
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#241f1a]">Slug URL</label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-[#cdbba8] bg-[#f7f3ed] px-3 text-sm text-[#6b6056]">
                    /wedding/
                  </span>
                  <input
                    type="text"
                    value={event.slug}
                    onChange={async (e) => {
                      const val = e.target.value;
                      setEvent({ ...event, slug: val });
                      await updateEvent(event.id, { slug: val });
                    }}
                    className="h-10 flex-1 rounded-r-md border border-[#cdbba8] px-3 text-sm outline-none focus:border-[#9a6a3a]"
                  />
                </div>
                <p className="mt-1 text-xs text-[#6b6056]">Mengubah slug akan membuat link lama menjadi tidak valid.</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#241f1a]">Status Event</label>
                <select
                  value={event.status}
                  onChange={async (e) => {
                    const val = e.target.value as WeddingEvent['status'];
                    setEvent({ ...event, status: val });
                    await updateEvent(event.id, { status: val });
                  }}
                  className="h-10 w-full rounded-md border border-[#cdbba8] bg-white px-3 text-sm outline-none focus:border-[#9a6a3a]"
                >
                  <option value="draft">Draft (Belum disebar)</option>
                  <option value="active">Active (Sedang berjalan)</option>
                  <option value="completed">Completed (Selesai)</option>
                  <option value="archived">Archived (Diarsipkan)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#241f1a]">Paket</label>
                <select
                  value={event.packageTier}
                  onChange={async (e) => {
                    const val = e.target.value as WeddingEvent['packageTier'];
                    setEvent({ ...event, packageTier: val });
                    await updateEvent(event.id, { packageTier: val });
                  }}
                  className="h-10 w-full rounded-md border border-[#cdbba8] bg-white px-3 text-sm outline-none focus:border-[#9a6a3a]"
                >
                  <option value="silver">Basic</option>
                  <option value="gold">Premium</option>
                  <option value="platinum">Signature</option>
                </select>
              </div>
            </div>

            <div className="mt-10 border-t border-[#eadfd2] pt-6">
              <h3 className="mb-4 text-lg font-semibold text-red-600">Danger Zone</h3>
              <p className="mb-4 text-sm text-[#6b6056]">
                Menghapus event akan menghilangkan seluruh data secara permanen, termasuk daftar tamu, ucapan, dan galeri media.
              </p>
              <button
                onClick={handleDeleteEvent}
                className="h-10 rounded-md bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 transition"
              >
                Hapus Event Ini
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
