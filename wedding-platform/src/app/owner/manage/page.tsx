"use client";

import { useEffect, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { DashboardShell } from "@/components/dashboard-shell";
import { GroupForm, ListEditor } from "@/components/event-editors";
import {
  changeOwnPassword,
  getPackages,
  getProfiles,
  getSiteSettings,
  getTemplates,
  resetClientPassword,
  updatePackage,
  updateProfile,
  updateSiteSettings,
  updateTemplate,
  type SiteSettings,
} from "@/lib/store";
import type { Package, Template, UserProfile } from "@/lib/types";

type Tab = "paket" | "template" | "situs" | "akun";

const activeOptions = [{ value: "true", label: "Aktif (tampil dan bisa dipilih)" }, { value: "false", label: "Nonaktif" }];

export default function OwnerManagePage() {
  const [tab, setTab] = useState<Tab>("paket");
  const [packages, setPackages] = useState<Package[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [site, setSite] = useState<SiteSettings | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPackages(), getTemplates(), getProfiles(), getSiteSettings()])
      .then(([p, t, u, st]) => {
        setSite(st);
        setPackages([...p].sort((a, b) => a.sortOrder - b.sortOrder));
        setTemplates(t);
        setProfiles(u);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Data tidak dapat dimuat."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthGate role="owner">
      <DashboardShell role="owner" title="Kelola Katalog & Akun" description="Ubah paket, template, dan akun. Perubahan langsung berlaku di dashboard dan pembuatan event baru.">
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-[#eadfd2]" role="tablist">
          {([["paket", "Paket"], ["template", "Template"], ["situs", "Situs publik"], ["akun", "Akun"]] as const).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`min-h-11 whitespace-nowrap border-b-2 px-4 text-sm font-semibold transition ${tab === id ? "border-[#9a6a3a] text-[#9a6a3a]" : "border-transparent text-[#6b6056] hover:text-[#241f1a]"}`}>{label}</button>
          ))}
        </div>
        {error ? <p role="alert" className="mb-4 text-sm font-medium text-rose-700">{error}</p> : null}
        {loading ? <p className="text-sm text-[#6b6056]">Memuat...</p> : null}

        {tab === "paket" && (
          <div className="space-y-4">
            <p className="text-sm text-[#6b6056]">Harga dan kuota masih baseline internal. Paket nonaktif tidak bisa dipilih untuk event baru.</p>
            {packages.map((pkg) => (
              <GroupForm
                key={pkg.id}
                title={`${pkg.name} (${pkg.slug})`}
                fields={[
                  { key: "name", label: "Nama paket", maxLength: 100 },
                  { key: "price", label: "Harga (tampilan)", maxLength: 40, placeholder: "Rp 799.000" },
                  { key: "priceNumeric", label: "Harga (angka rupiah)" },
                  { key: "maxGuests", label: "Kuota rekaman undangan" },
                  { key: "maxRevisions", label: "Jumlah revisi" },
                  { key: "durationMonths", label: "Masa aktif (bulan)" },
                  { key: "isActive", label: "Status", type: "select", options: activeOptions },
                  { key: "availability", label: "Keterangan ketersediaan (situs publik)", maxLength: 100, placeholder: "Baseline rilis pertama" },
                  { key: "featured", label: "Sorotan di situs publik", type: "select", options: [{ value: "false", label: "Biasa" }, { value: "true", label: "Disorot (Paling populer)" }] },
                  { key: "description", label: "Deskripsi", type: "textarea", maxLength: 1000 },
                  { key: "features", label: "Fitur (satu per baris)", type: "textarea" },
                ]}
                values={{
                  name: pkg.name, price: pkg.price, priceNumeric: String(pkg.priceNumeric), maxGuests: String(pkg.maxGuests),
                  maxRevisions: String(pkg.maxRevisions), durationMonths: String(pkg.durationMonths), isActive: String(pkg.isActive), availability: pkg.availability ?? "", featured: String(Boolean(pkg.featured)),
                  description: pkg.description, features: pkg.features.join("\n"),
                }}
                onSave={async (patch) => {
                  const data: Partial<Package> = {};
                  for (const key of ["name", "price", "description"] as const) if (key in patch) data[key] = patch[key];
                  for (const key of ["priceNumeric", "maxGuests", "maxRevisions", "durationMonths"] as const) if (key in patch) data[key] = Number(patch[key]);
                  if ("isActive" in patch) data.isActive = patch.isActive === "true";
                  if ("featured" in patch) data.featured = patch.featured === "true";
                  if ("availability" in patch) data.availability = patch.availability;
                  if ("features" in patch) data.features = patch.features.split("\n").map((f) => f.trim()).filter(Boolean);
                  const saved = await updatePackage(pkg.id, data);
                  setPackages((list) => list.map((p) => (p.id === saved.id ? saved : p)));
                }}
              />
            ))}
          </div>
        )}

        {tab === "template" && (
          <div className="space-y-4">
            <p className="text-sm text-[#6b6056]">Tampilan tema ditentukan kode; di sini Anda mengatur nama, deskripsi, thumbnail, paket minimum, dan apakah template bisa dipilih.</p>
            {templates.map((tpl) => (
              <GroupForm
                key={tpl.id}
                title={`${tpl.name} (${tpl.slug})`}
                fields={[
                  { key: "name", label: "Nama template", maxLength: 100 },
                  { key: "minPackage", label: "Paket minimum", type: "select", options: [{ value: "silver", label: "Basic" }, { value: "gold", label: "Premium" }, { value: "platinum", label: "Signature" }] },
                  { key: "isActive", label: "Status", type: "select", options: activeOptions },
                  { key: "galleryCategory", label: "Kategori di galeri publik", type: "select", options: [{ value: "modern", label: "Modern" }, { value: "classic", label: "Classic" }, { value: "luxury", label: "Luxury" }, { value: "minimal", label: "Minimal" }] },
                  { key: "badge", label: "Label kartu (maks. 30 huruf)", maxLength: 30 },
                  { key: "thumbnailUrl", label: "Thumbnail", hint: "Diawali / atau https://" },
                  { key: "description", label: "Deskripsi", type: "textarea", maxLength: 1000 },
                ]}
                values={{ name: tpl.name, galleryCategory: tpl.galleryCategory ?? "modern", badge: tpl.badge ?? "", minPackage: tpl.minPackage, isActive: String(tpl.isActive), thumbnailUrl: tpl.thumbnailUrl, description: tpl.description }}
                onSave={async (patch) => {
                  const data: Partial<Template> = {};
                  for (const key of ["name", "thumbnailUrl", "description"] as const) if (key in patch) data[key] = patch[key];
                  if ("galleryCategory" in patch) data.galleryCategory = patch.galleryCategory as Template["galleryCategory"];
                  if ("badge" in patch) data.badge = patch.badge;
                  if ("minPackage" in patch) data.minPackage = patch.minPackage as Template["minPackage"];
                  if ("isActive" in patch) data.isActive = patch.isActive === "true";
                  const saved = await updateTemplate(tpl.id, data);
                  setTemplates((list) => list.map((t) => (t.id === saved.id ? saved : t)));
                }}
              />
            ))}
          </div>
        )}

        {tab === "situs" && site && (
          <div className="space-y-4">
            <p className="text-sm text-[#6b6056]">Isi website publik (port 4174) diambil dari sini. Bila server tidak terjangkau, website memakai isi bawaan.</p>
            <GroupForm
              title="Kontak & harga"
              fields={[
                { key: "whatsappNumber", label: "Nomor WhatsApp bisnis", placeholder: "62812xxxxxxx", hint: "Kosongkan bila belum ada; tombol WhatsApp tidak akan dibuka." },
                { key: "contactLabel", label: "Teks kontak di footer", maxLength: 100 },
                { key: "showPublicPrices", label: "Tampilkan harga di situs publik", type: "select", options: [{ value: "false", label: "Sembunyikan harga" }, { value: "true", label: "Tampilkan harga" }] },
                { key: "priceDisclaimer", label: "Catatan harga", type: "textarea", maxLength: 500 },
                { key: "paymentInstructions", label: "Petunjuk pembayaran (hanya tampil untuk klien yang login)", type: "textarea", maxLength: 1000, hint: "Contoh: Transfer ke BCA 1234567890 a.n. Nama Pemilik. Sertakan nama pasangan pada berita transfer." },
              ]}
              values={{ whatsappNumber: site.whatsappNumber, contactLabel: site.contactLabel, showPublicPrices: String(site.showPublicPrices), priceDisclaimer: site.priceDisclaimer, paymentInstructions: site.paymentInstructions ?? "" }}
              onSave={async (patch) => {
                const data: Partial<SiteSettings> = {};
                if ("whatsappNumber" in patch) data.whatsappNumber = patch.whatsappNumber;
                if ("contactLabel" in patch) data.contactLabel = patch.contactLabel;
                if ("priceDisclaimer" in patch) data.priceDisclaimer = patch.priceDisclaimer;
                if ("paymentInstructions" in patch) data.paymentInstructions = patch.paymentInstructions;
                if ("showPublicPrices" in patch) data.showPublicPrices = patch.showPublicPrices === "true";
                setSite(await updateSiteSettings(data));
              }}
            />
            <ListEditor
              title="FAQ"
              items={site.faqs}
              fields={[{ key: "question", label: "Pertanyaan", maxLength: 200 }, { key: "answer", label: "Jawaban", type: "textarea", maxLength: 1500 }]}
              empty={{ question: "", answer: "" }}
              addLabel="+ Tambah FAQ"
              onSave={async (faqs) => setSite(await updateSiteSettings({ faqs }))}
            />
            <ListEditor
              title="Testimoni (hanya dengan izin klien)"
              items={site.testimonials}
              fields={[{ key: "name", label: "Nama", maxLength: 100 }, { key: "status", label: "Keterangan (mis. Klien Basic, 2026)", maxLength: 100 }, { key: "quote", label: "Kutipan", type: "textarea", maxLength: 500 }]}
              empty={{ name: "", status: "", quote: "" }}
              addLabel="+ Tambah testimoni"
              onSave={async (testimonials) => setSite(await updateSiteSettings({ testimonials }))}
            />
          </div>
        )}

        {tab === "akun" && (
          <div className="space-y-4">
            <OwnPassword />
            {profiles.map((profile) => (
              <ProfileEditor key={profile.id} profile={profile} onSaved={(saved) => setProfiles((list) => list.map((p) => (p.id === saved.id ? saved : p)))} />
            ))}
          </div>
        )}
      </DashboardShell>
    </AuthGate>
  );
}

function ProfileEditor({ profile, onSaved }: { profile: UserProfile; onSaved: (profile: UserProfile) => void }) {
  const [temporary, setTemporary] = useState("");
  const [error, setError] = useState("");

  async function reset() {
    if (!window.confirm(`Reset password ${profile.email}? Semua sesi login akun ini akan berakhir.`)) return;
    setError("");
    try {
      setTemporary((await resetClientPassword(profile.id)).temporaryPassword);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset gagal.");
    }
  }

  return (
    <div>
      <GroupForm
        title={`${profile.role === "owner" ? "Owner" : "Klien"} — ${profile.fullName}`}
        fields={[{ key: "fullName", label: "Nama lengkap", maxLength: 120 }, { key: "email", label: "Email" }]}
        values={{ fullName: profile.fullName, email: profile.email }}
        onSave={async (patch) => onSaved(await updateProfile(profile.id, patch))}
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button type="button" onClick={reset} className="h-11 rounded-md border border-[#cdbba8] px-4 text-sm font-semibold text-[#5a4028]">Reset password</button>
        {temporary ? <span className="text-sm">Password sementara (catat sekarang, tidak ditampilkan lagi): <code className="select-all rounded bg-[#f7f3ed] px-2 py-1 font-mono font-semibold">{temporary}</code></span> : null}
        {error ? <span role="alert" className="text-sm font-medium text-rose-700">{error}</span> : null}
      </div>
    </div>
  );
}

function OwnPassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const input = "mt-1 block h-11 w-full rounded-md border border-[#cdbba8] bg-white px-3 text-base outline-none focus:border-[#9a6a3a] sm:text-sm";

  return (
    <form
      className="rounded-md border border-[#eadfd2] bg-[#fffaf4] p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
          await changeOwnPassword(current, next);
          setCurrent("");
          setNext("");
          setMessage({ ok: true, text: "Password diganti. Sesi lain akun ini berakhir; Anda perlu masuk lagi." });
        } catch (e) {
          setMessage({ ok: false, text: e instanceof Error ? e.message : "Gagal mengganti password." });
        } finally {
          setSaving(false);
        }
      }}
    >
      <h3 className="mb-3 text-base font-semibold">Ganti password saya</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#9a6a3a]">Password saat ini<input type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} className={input} /></label>
        <label className="text-xs font-semibold uppercase tracking-wider text-[#9a6a3a]">Password baru (min. 12 karakter)<input type="password" autoComplete="new-password" required minLength={12} value={next} onChange={(e) => setNext(e.target.value)} className={input} /></label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button disabled={saving} className="h-11 rounded-md bg-[#241f1a] px-5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Menyimpan..." : "Ganti password"}</button>
        {message ? <span role={message.ok ? "status" : "alert"} className={`text-sm font-medium ${message.ok ? "text-emerald-700" : "text-rose-700"}`}>{message.text}</span> : null}
      </div>
    </form>
  );
}
