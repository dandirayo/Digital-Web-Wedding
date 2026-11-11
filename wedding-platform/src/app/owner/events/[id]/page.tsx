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
  deleteEvent,
  updateGuest,
  deleteWish,
  getTemplates,
  getPackages,
  getProfiles
} from "@/lib/store";
import { ExportGuestsButton } from "@/components/export-guests-button";
import { WeddingEvent, EventContent, Guest, Wish, EventMedia, Template, Package, UserProfile } from "@/lib/types";
import { MediaManager } from "@/components/media-manager";
import { BillingPanel } from "@/components/billing-panel";
import { ApprovalPanel } from "@/components/approval-panel";
import { AuditLog } from "@/components/audit-log";
import { GroupForm, ListEditor, isoToDateTimeInput, isoToDateInput, dateTimeInputToIso, dateInputToIso } from "@/components/event-editors";

function GuestEditRow({ guest, onCancel, onSaved }: { guest: Guest; onCancel: () => void; onSaved: (guest: Guest) => void }) {
  const [name, setName] = useState(guest.name);
  const [phone, setPhone] = useState(guest.phone);
  const [pax, setPax] = useState(String(guest.paxLimit));
  const [rsvp, setRsvp] = useState(guest.rsvpStatus);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const field = "h-10 w-full rounded-md border border-[#cdbba8] bg-white px-2 text-base outline-none focus:border-[#9a6a3a] sm:text-sm";

  async function save() {
    setSaving(true);
    setError("");
    try {
      const paxLimit = Number(pax);
      const patch: Partial<Guest> = { name: name.trim(), phone: phone.trim(), paxLimit, rsvpStatus: rsvp };
      if (rsvp === "pending") patch.paxConfirmed = 0;
      else if (guest.paxConfirmed > paxLimit) patch.paxConfirmed = paxLimit;
      onSaved(await updateGuest(guest.id, patch));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tamu gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="bg-[#fffaf4]">
      <td className="p-3">
        <input aria-label="Nama tamu" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} className={field} />
        <input aria-label="Nomor telepon" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} placeholder="Nomor telepon" className={`${field} mt-2`} />
      </td>
      <td className="p-3">
        <select aria-label="Status RSVP" value={rsvp} onChange={(e) => setRsvp(e.target.value as Guest["rsvpStatus"])} className={field}>
          <option value="pending">pending</option>
          <option value="attending">attending</option>
          <option value="declined">declined</option>
        </select>
      </td>
      <td className="p-3"><input aria-label="Batas pax" type="number" min={1} max={100} value={pax} onChange={(e) => setPax(e.target.value)} className={field} /></td>
      <td className="p-3 text-xs text-rose-700" role={error ? "alert" : undefined}>{error}</td>
      <td className="p-3 text-right whitespace-nowrap">
        <button onClick={save} disabled={saving || !name.trim()} className="mr-2 h-9 rounded-md bg-[#241f1a] px-3 text-xs font-semibold text-white disabled:opacity-50">{saving ? "..." : "Simpan"}</button>
        <button onClick={onCancel} className="h-9 rounded-md border border-[#cdbba8] px-3 text-xs font-semibold text-[#5a4028]">Batal</button>
      </td>
    </tr>
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
  const [templates, setTemplates] = useState<Template[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [editingGuest, setEditingGuest] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'detail' | 'tamu' | 'ucapan' | 'persetujuan' | 'tagihan' | 'riwayat' | 'pengaturan'>('detail');

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
        setTemplates(await getTemplates());
        setPackages(await getPackages());
        setClients((await getProfiles()).filter((p) => p.role === "client"));
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
    let newGuest: Guest;
    try {
      newGuest = await addGuest(event.id, {
        name: newGuestName,
        phone: newGuestPhone,
        paxLimit: 1,
        rsvpStatus: "pending",
        paxConfirmed: 0,
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Tamu gagal ditambahkan.");
      return;
    }
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

  const handleDeleteWish = async (wishId: string) => {
    if (!confirm("Hapus ucapan ini secara permanen?")) return;
    try {
      await deleteWish(wishId);
      setWishes(wishes.filter(w => w.id !== wishId));
      setEvent({ ...event, wishCount: Math.max(0, event.wishCount - 1) });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Ucapan gagal dihapus.");
    }
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

      {actionError ? <p role="alert" className="mb-4 text-sm font-medium text-rose-700">{actionError}</p> : null}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
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

      <div className="mb-6 flex gap-2 border-b border-[#eadfd2] overflow-x-auto" role="tablist">
        {(['detail', 'tamu', 'ucapan', 'persetujuan', 'tagihan', 'riwayat', 'pengaturan'] as const).map(tab => (
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
          <div className="space-y-4">
            <p className="text-sm text-[#6b6056]">Semua isi undangan dapat diubah di sini dan langsung dipakai semua tema. Foto dan musik dapat diunggah di bagian Media di bawah; kolom alamat berikut untuk tautan https:// atau file yang sudah ada di server.</p>
            <GroupForm
              title="Mempelai & salam"
              fields={[
                { key: "brideName", label: "Nama mempelai wanita", maxLength: 120 },
                { key: "brideParent", label: "Orang tua mempelai wanita", maxLength: 200 },
                { key: "bridePhotoUrl", label: "Foto mempelai wanita", hint: "Contoh: /templates/sheila-yoga/assets/images/bride.jpg" },
                { key: "groomName", label: "Nama mempelai pria", maxLength: 120 },
                { key: "groomParent", label: "Orang tua mempelai pria", maxLength: 200 },
                { key: "groomPhotoUrl", label: "Foto mempelai pria" },
                { key: "greeting", label: "Salam pembuka", type: "textarea", maxLength: 2000 },
              ]}
              values={{ brideName: content.brideName, brideParent: content.brideParent, bridePhotoUrl: content.bridePhotoUrl, groomName: content.groomName, groomParent: content.groomParent, groomPhotoUrl: content.groomPhotoUrl, greeting: content.greeting }}
              onSave={async (patch) => setContent(await updateEventContent(event.id, patch))}
            />
            <GroupForm
              title="Waktu & tempat acara"
              fields={[
                { key: "akadTime", label: "Waktu akad", placeholder: "08.00 - 10.00 WIB" },
                { key: "akadVenue", label: "Tempat akad" },
                { key: "resepsiTime", label: "Waktu resepsi", placeholder: "11.00 - 14.00 WIB" },
                { key: "resepsiVenue", label: "Tempat resepsi" },
              ]}
              values={{ akadTime: content.akadTime, akadVenue: content.akadVenue, resepsiTime: content.resepsiTime, resepsiVenue: content.resepsiVenue }}
              onSave={async (patch) => setContent(await updateEventContent(event.id, patch))}
            />
            <ListEditor
              title="Love story"
              items={(content.loveStory || []).map((i) => ({ title: i.title, description: i.description }))}
              fields={[{ key: "title", label: "Judul", maxLength: 200 }, { key: "description", label: "Cerita", type: "textarea", maxLength: 2000 }]}
              empty={{ title: "", description: "" }}
              addLabel="+ Tambah cerita"
              onSave={async (items) => setContent(await updateEventContent(event.id, { loveStory: items }))}
            />
            <ListEditor
              title="Rekening hadiah digital"
              items={(content.bankAccounts || []).map((i) => ({ bank: i.bank, accountNumber: i.accountNumber, accountName: i.accountName }))}
              fields={[{ key: "bank", label: "Bank / e-wallet", maxLength: 100 }, { key: "accountNumber", label: "Nomor rekening", maxLength: 100 }, { key: "accountName", label: "Atas nama", maxLength: 100 }]}
              empty={{ bank: "", accountNumber: "", accountName: "" }}
              addLabel="+ Tambah rekening"
              onSave={async (items) => setContent(await updateEventContent(event.id, { bankAccounts: items }))}
            />
            <GroupForm
              title="Musik & tampilan"
              fields={[
                { key: "musicUrl", label: "Musik latar", hint: "Kosongkan untuk memakai musik bawaan tema." },
                { key: "customCss", label: "CSS khusus (lanjutan)", type: "textarea", maxLength: 20000 },
              ]}
              values={{ musicUrl: content.musicUrl, customCss: content.customCss }}
              onSave={async (patch) => setContent(await updateEventContent(event.id, patch))}
            />
            <div>
              <h3 className="mb-3 text-base font-semibold">Media</h3>
              <MediaManager eventId={event.id} media={media} content={content} onMedia={setMedia} onContent={setContent} />
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
              <ExportGuestsButton eventId={event.id} slug={event.slug} />
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
                  {filteredGuests.length > 0 ? filteredGuests.map(g => editingGuest === g.id ? (
                    <GuestEditRow key={g.id} guest={g} onCancel={() => setEditingGuest(null)} onSaved={(saved) => { setGuests(guests.map(x => x.id === saved.id ? saved : x)); setEditingGuest(null); }} />
                  ) : (
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
                          onClick={() => handleCopyLink(`?g=${g.qrCode}`)}
                          className="mr-3 text-xs font-semibold text-[#6b6056] hover:text-[#241f1a]"
                          title="Copy Link Undangan Spesifik Tamu"
                        >
                          Copy Link
                        </button>
                        <button
                          onClick={() => setEditingGuest(g.id)}
                          className="mr-3 text-xs font-semibold text-[#5a4028] hover:text-[#241f1a]"
                        >
                          Edit
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
                    onClick={() => handleDeleteWish(w.id)}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Hapus
                  </button>
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

        {activeTab === 'persetujuan' && (
          <ApprovalPanel
            eventId={event.id}
            slug={event.slug}
            role="owner"
            onChanged={async () => { const fresh = await getEventById(event.id); if (fresh) setEvent(fresh); }}
          />
        )}

        {activeTab === 'tagihan' && <BillingPanel eventId={event.id} role="owner" />}

        {activeTab === 'riwayat' && <AuditLog eventId={event.id} />}

        {activeTab === 'pengaturan' && (
          <div className="max-w-3xl space-y-4">
            <h3 className="text-lg font-semibold border-b border-[#eadfd2] pb-2">Pengaturan Event</h3>
            <GroupForm
              title="Data event"
              fields={[
                { key: "coupleName", label: "Nama pasangan", maxLength: 200 },
                { key: "venue", label: "Venue utama", maxLength: 300 },
                { key: "eventDate", label: "Tanggal & jam acara (WIB)", type: "datetime" },
                { key: "expiresAt", label: "Berlaku sampai", type: "date", hint: "Kosongkan agar tidak kedaluwarsa. Setelah lewat, undangan tidak terbuka untuk tamu." },
                { key: "slug", label: "Slug URL", hint: "Huruf kecil, angka, dan tanda hubung. Mengubah slug membuat link lama tidak valid." },
                { key: "status", label: "Status", type: "select", options: [{ value: "draft", label: "Draft (belum disebar)" }, { value: "active", label: "Active (berjalan)" }, { value: "completed", label: "Completed (selesai)" }, { value: "archived", label: "Archived (diarsipkan)" }] },
                { key: "templateId", label: "Template", type: "select", options: templates.filter((t) => t.isActive || t.id === event.templateId).map((t) => ({ value: t.id, label: t.name })) },
                { key: "packageId", label: "Paket", type: "select", options: packages.filter((p) => p.isActive || p.id === event.packageId).map((p) => ({ value: p.id, label: p.name })) },
                { key: "clientId", label: "Klien pemilik", type: "select", options: [{ value: "", label: "(Belum ada klien)" }, ...clients.map((c) => ({ value: c.id, label: `${c.fullName} — ${c.email}` }))] },
              ]}
              values={{ coupleName: event.coupleName, venue: event.venue, eventDate: isoToDateTimeInput(event.eventDate), expiresAt: isoToDateInput(event.expiresAt), slug: event.slug, status: event.status, templateId: event.templateId, packageId: event.packageId, clientId: event.clientId || "" }}
              onSave={async (patch) => {
                const data: Record<string, unknown> = { ...patch };
                if ("eventDate" in patch) data.eventDate = dateTimeInputToIso(patch.eventDate);
                if ("expiresAt" in patch) data.expiresAt = dateInputToIso(patch.expiresAt);
                if ("clientId" in patch) data.clientId = patch.clientId || null;
                const updated = await updateEvent(event.id, data as Partial<WeddingEvent>);
                setEvent({ ...event, ...updated });
              }}
            />

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
