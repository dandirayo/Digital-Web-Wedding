import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  formatRupiah,
  templateCategories,
  templateShowcase,
  type TemplateCategory,
} from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Gallery Template - Occasio",
  description: "Katalog template undangan digital Occasio untuk preview, paket, dan konsultasi client.",
};

type GalleryPageProps = {
  searchParams?: Promise<{
    category?: string;
  }>;
};

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const params = await searchParams;
  const selectedCategory = isTemplateCategory(params?.category) ? params.category : "all";
  const templates =
    selectedCategory === "all"
      ? templateShowcase
      : templateShowcase.filter((template) => template.category === selectedCategory);

  return (
    <main className="min-h-screen bg-[#f7f3ed] text-[#241f1a]">
      <header className="border-b border-[#e4d8ca] bg-[#fffaf4]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[#241f1a] text-sm font-semibold text-white">
              O
            </span>
            <span className="text-xl font-semibold tracking-tight">Occasio</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-[#6b6056] md:flex">
            <Link href="/#fitur" className="transition hover:text-[#241f1a]">
              Fitur
            </Link>
            <Link href="/gallery" className="text-[#241f1a]">
              Template
            </Link>
            <Link href="/#paket" className="transition hover:text-[#241f1a]">
              Paket
            </Link>
            <Link href="/wedding/sheila-yoga" className="transition hover:text-[#241f1a]">
              Preview
            </Link>
          </nav>
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#cdbba8] px-4 text-sm font-semibold text-[#5a4028] transition hover:bg-[#efe5d8]"
          >
            Masuk
          </Link>
        </div>
      </header>

      <section className="border-b border-[#e4d8ca] bg-[#fffaf4]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:py-14 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
          <div className="flex flex-col justify-center">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#9a6a3a]">
              Gallery template
            </div>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Pilih desain yang sesuai dengan cerita pernikahan Anda.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#6b6056]">
              Bandingkan nuansa, fitur, dan paket minimum. Setelah memilih, kirim brief agar tim
              dapat menyiapkan workspace dan jadwal pengerjaan.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/wedding/sheila-yoga"
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#241f1a] px-5 text-sm font-semibold text-white transition hover:bg-[#3a3129]"
              >
                Preview Wedding
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-md border border-[#cdbba8] px-5 text-sm font-semibold text-[#5a4028] transition hover:bg-[#efe5d8]"
              >
                Masuk untuk Chat
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {templateShowcase.slice(0, 3).map((template) => (
              <div key={template.id} className="overflow-hidden rounded-md border border-[#e0d4c7] bg-white">
                <div className="relative aspect-[4/5]">
                  <Image
                    src={template.thumbnail}
                    alt={`Preview template ${template.name}`}
                    fill
                    sizes="(min-width: 1024px) 220px, 45vw"
                    className="object-cover"
                    priority={template.id === "sheila-yoga"}
                  />
                </div>
                <div className="p-3">
                  <div className="text-sm font-semibold">{template.name}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.14em] text-[#9a6a3a]">
                    {template.packageLevel}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {templateCategories.map((category) => {
            const href = category.id === "all" ? "/gallery" : `/gallery?category=${category.id}`;
            const active = category.id === selectedCategory;

            return (
              <Link
                key={category.id}
                href={href}
                className={[
                  "inline-flex h-10 shrink-0 items-center rounded-md border px-4 text-sm font-semibold transition",
                  active
                    ? "border-[#241f1a] bg-[#241f1a] text-white"
                    : "border-[#cdbba8] bg-white text-[#5a4028] hover:bg-[#efe5d8]",
                ].join(" ")}
              >
                {category.label}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-14 lg:px-8">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Katalog konsep template</h2>
            <p className="mt-1 text-sm text-[#6b6056]">
              {templates.filter((template) => template.demoHref).length} preview aktif; konsep lain belum dapat dipilih untuk order.
            </p>
          </div>
          <Link href="/#paket" className="text-sm font-semibold text-[#5a4028] transition hover:text-[#241f1a]">
            Bandingkan paket
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <article key={template.id} className="overflow-hidden rounded-md border border-[#e0d4c7] bg-white">
              <div className="relative aspect-[16/11]">
                <Image
                  src={template.thumbnail}
                  alt={`Thumbnail template ${template.name}`}
                  fill
                  sizes="(min-width: 1280px) 390px, (min-width: 768px) 45vw, 92vw"
                  className="object-cover"
                />
                <div className="absolute left-3 top-3 rounded-full bg-white/86 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#5a4028] backdrop-blur">
                  {template.badge}
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">{template.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#6b6056]">{template.description}</p>
                  </div>
                  <div className="text-right text-sm font-semibold text-[#9a6a3a]">
                    {formatRupiah(template.priceFrom)}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {template.colors.map((color) => (
                    <span
                      key={color}
                      className="h-5 w-5 rounded-full border border-[#d7c9b8]"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>

                <ul className="mt-5 grid gap-2 text-sm text-[#5d5146]">
                  {template.features.map((feature) => (
                    <li key={feature} className="rounded-md bg-[#f7f3ed] px-3 py-2">
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  {template.demoHref ? (
                    <Link
                      href={template.demoHref}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white transition hover:bg-[#3a3129]"
                    >
                      Buka Preview
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-md bg-[#d8cdbc] px-4 text-sm font-semibold text-white"
                    >
                      Konsep — belum tersedia
                    </button>
                  )}
                  {template.demoHref ? (
                    <Link
                      href="/login"
                      className="inline-flex h-10 items-center justify-center rounded-md border border-[#cdbba8] px-4 text-sm font-semibold text-[#5a4028] transition hover:bg-[#efe5d8]"
                    >
                      Masuk untuk Pilih
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function isTemplateCategory(value: string | undefined): value is "all" | TemplateCategory {
  return templateCategories.some((category) => category.id === value);
}
