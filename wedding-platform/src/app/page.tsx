import Link from "next/link";
import { LoginModal } from "@/components/login-modal";
import { packages } from "@/lib/demo-data";

const features = [
  ["Client Portal", "Setiap pasangan punya login untuk edit konten, tamu, RSVP, dan ucapan."],
  ["QR Check-in", "Kode tamu siap dipakai untuk validasi kedatangan pada hari acara."],
  ["Owner Monitor", "Pemilik bisnis bisa melihat semua event aktif dari satu dashboard."],
  ["Template Engine", "Satu desain undangan bisa dipakai ulang untuk banyak client lewat slug."],
  ["Guest Analytics", "Pantau total tamu, RSVP hadir, tidak hadir, pending, dan check-in."],
  ["Supabase Ready", "Struktur auth, database, storage, dan role sudah disiapkan untuk backend."],
];

const workflow = [
  "Client pesan paket",
  "Owner buat event",
  "Client isi konten",
  "Tamu RSVP",
  "QR check-in hari H",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f3ed] text-[#241f1a]">
      <header className="sticky top-0 z-20 border-b border-[#e4d8ca] bg-[#fffaf4]/88 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[#241f1a] text-sm font-semibold text-white">
              O
            </span>
            <span className="text-xl font-semibold tracking-tight">Occasio</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-[#6b6056] md:flex">
            <a href="#fitur" className="transition hover:text-[#241f1a]">Fitur</a>
            <a href="#alur" className="transition hover:text-[#241f1a]">Alur</a>
            <a href="#paket" className="transition hover:text-[#241f1a]">Paket</a>
            <Link href="/wedding/sheila-yoga" className="transition hover:text-[#241f1a]">Preview</Link>
          </nav>
          <LoginModal label="Login" variant="secondary" />
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#e4d8ca] bg-[#fffaf4]">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 gap-10 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="flex flex-col justify-center">
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-[#9a6a3a]">
              Wedding business platform
            </div>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">
              Kelola banyak undangan digital dari satu sistem.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6b6056]">
              Occasio membantu studio undangan digital menjual website wedding,
              memberikan dashboard untuk klien, dan memantau semua event dari sisi owner.
            </p>
            <div className="mt-5 rounded-md border border-[#e0d4c7] bg-white/72 p-4 text-sm leading-6 text-[#6b6056]">
              <strong className="text-[#241f1a]">Tahap aplikasi:</strong> frontend platform demo.
              Login masih demo lokal, sedangkan Supabase/database produksi disiapkan untuk tahap backend berikutnya.
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <LoginModal label="Masuk Dashboard" />
              <a
                href="#paket"
                className="inline-flex h-12 items-center justify-center rounded-md border border-[#cdbba8] px-5 text-sm font-semibold text-[#5a4028] transition hover:bg-[#efe5d8]"
              >
                Lihat Paket
              </a>
              <Link
                href="/wedding/sheila-yoga"
                className="inline-flex h-12 items-center justify-center rounded-md border border-[#cdbba8] px-5 text-sm font-semibold text-[#5a4028] transition hover:bg-[#efe5d8]"
              >
                Preview Wedding
              </Link>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              {[
                ["12+", "event aktif"],
                ["3.2k", "tamu dikelola"],
                ["98%", "ready mobile"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-md border border-[#e0d4c7] bg-white/70 p-4">
                  <div className="text-2xl font-semibold">{value}</div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-[#9a6a3a]">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-end">
            <div className="w-full rounded-md border border-[#e0d4c7] bg-white p-4 shadow-[0_24px_80px_rgba(82,57,38,0.12)]">
              <div className="aspect-[4/5] rounded-md bg-[linear-gradient(rgba(36,31,26,0.02),rgba(36,31,26,0.56)),url('/sample-wedding.svg')] bg-cover bg-center p-5 text-white">
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur">
                      Live Preview
                    </span>
                    <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-semibold backdrop-blur">
                      /wedding/sheila-yoga
                    </span>
                  </div>
                  <div>
                    <div className="text-sm uppercase tracking-[0.24em]">Wedding of</div>
                    <div className="mt-2 text-4xl font-semibold">Sheila & Yoga</div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                      <Metric value="184" label="RSVP" />
                      <Metric value="76" label="Ucapan" />
                      <Metric value="320" label="Tamu" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="fitur" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9a6a3a]">
            Fitur produk
          </div>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">
            Dibuat untuk studio yang menangani banyak pasangan.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map(([title, description]) => (
            <div key={title} className="rounded-md border border-[#e0d4c7] bg-white p-5">
              <div className="text-lg font-semibold">{title}</div>
              <p className="mt-2 text-sm leading-6 text-[#6b6056]">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="alur" className="border-y border-[#e4d8ca] bg-[#fffaf4]">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9a6a3a]">
              Alur kerja
            </div>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Dari order sampai hari H.</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {workflow.map((item, index) => (
              <div key={item} className="rounded-md border border-[#e0d4c7] bg-white p-5">
                <div className="text-sm font-semibold text-[#9a6a3a]">0{index + 1}</div>
                <div className="mt-3 font-semibold">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {[
            ["Owner", "Login sebagai owner untuk membuat event, mengubah status draft/active/completed, dan memantau readiness."],
            ["Client", "Login sebagai client untuk upload tamu, edit konten undangan, melihat ucapan, dan membuka preview website."],
            ["Wedding Page", "Halaman /wedding/[slug] membaca data demo lokal dan menampilkan template dynamic yang dekat dengan HTML asli."],
          ].map(([title, description]) => (
            <article key={title} className="rounded-md border border-[#e0d4c7] bg-white p-5">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a6a3a]">
                Flow
              </div>
              <h2 className="mt-3 text-2xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#6b6056]">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="paket" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9a6a3a]">
            Paket jualan
          </div>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">Mulai dari template, naik ke dashboard.</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {packages.map((item) => (
            <article key={item.name} className="rounded-md border border-[#e0d4c7] bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold">{item.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6b6056]">{item.description}</p>
                </div>
                <div className="text-xl font-semibold text-[#9a6a3a]">{item.price}</div>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-[#5d5146]">
                {item.features.map((feature) => (
                  <li key={feature}>- {feature}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-md bg-white/16 p-3 backdrop-blur">
      <div className="text-2xl font-semibold">{value}</div>
      {label}
    </div>
  );
}
