"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  events as defaultEvents,
  recentWishes,
  type WeddingEvent,
} from "@/lib/demo-data";

type WeddingContent = {
  couple: string;
  date: string;
  venue: string;
  packageName: string;
  greeting: string;
};

const EVENTS_KEY = "occasio_demo_events";
const TEMPLATE_PATH = "/templates/sheila-yoga/assets";

const galleryImages = ["g1.jpg", "g2.jpg", "g3.jpg", "g4.jpg", "g5.jpg", "g6.jpg"];

function getContentKey(slug: string) {
  return `occasio_demo_content_${slug}`;
}

export function WeddingView({ slug }: { slug: string }) {
  const [events] = useState<WeddingEvent[]>(() => {
    if (typeof window === "undefined") return defaultEvents;
    try {
      const storedEvents = localStorage.getItem(EVENTS_KEY);
      return storedEvents ? (JSON.parse(storedEvents) as WeddingEvent[]) : defaultEvents;
    } catch {
      return defaultEvents;
    }
  });
  const [content] = useState<Partial<WeddingContent>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const storedContent = localStorage.getItem(getContentKey(slug));
      return storedContent ? (JSON.parse(storedContent) as Partial<WeddingContent>) : {};
    } catch {
      return {};
    }
  });

  const event = useMemo(
    () => events.find((item) => item.slug === slug) ?? defaultEvents.find((item) => item.slug === slug),
    [events, slug],
  );

  const resolved = {
    couple: content.couple ?? event?.couple ?? "Nama Pasangan",
    date: content.date ?? event?.date ?? "Tanggal acara",
    venue: content.venue ?? event?.venue ?? "Venue acara",
    packageName: content.packageName ?? event?.packageName ?? "Wedding",
    greeting:
      content.greeting ??
      "Dengan penuh sukacita kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada hari bahagia kami.",
    guests: event?.guests ?? 0,
    rsvp: (event?.rsvpYes ?? 0) + (event?.rsvpNo ?? 0),
    wishes: event?.wishes ?? recentWishes.length,
  };

  const [firstName = "Bride", secondName = "Groom"] = resolved.couple
    .split("&")
    .map((name) => name.trim());

  return (
    <main className="min-h-screen bg-[#f3ebdf] text-[#2b241f]">
      <section className="relative min-h-screen overflow-hidden bg-[#776859] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${TEMPLATE_PATH}/images/cover.jpg')` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(37,29,23,0.72),rgba(37,29,23,0.2),rgba(37,29,23,0.76))]" />
        <div className="absolute left-1/2 top-0 h-[52vw] max-h-[520px] min-h-[320px] w-[52vw] min-w-[320px] max-w-[520px] -translate-x-[90%] -translate-y-[20%] rounded-full bg-white/22" />
        <div className="absolute right-1/2 top-0 h-[52vw] max-h-[520px] min-h-[320px] w-[52vw] min-w-[320px] max-w-[520px] translate-x-[92%] -translate-y-[20%] rounded-full bg-white/18" />

        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-5 py-8">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="rounded-full bg-white/18 px-5 py-2 text-sm font-semibold backdrop-blur">
              Occasio
            </Link>
            <span className="rounded-full bg-white/18 px-5 py-2 text-sm font-semibold backdrop-blur">
              {resolved.date}
            </span>
          </header>

          <div className="py-20 text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.38em]">The Wedding of</div>
            <h1 className="mt-6 text-6xl font-semibold leading-none md:text-8xl">
              {firstName}
              <span className="block py-1 text-4xl font-normal italic md:text-6xl">&</span>
              {secondName}
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-base font-medium leading-8 text-white/88">
              {resolved.greeting}
            </p>
          </div>

          <div className="grid gap-3 rounded-md border border-white/22 bg-white/14 p-4 backdrop-blur md:grid-cols-3">
            <MiniInfo label="Tanggal" value={resolved.date} />
            <MiniInfo label="Lokasi" value={resolved.venue} />
            <MiniInfo label="RSVP" value={`${resolved.rsvp} konfirmasi`} />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-5 py-20 text-center">
        <Image
          src={`${TEMPLATE_PATH}/images/flower-left.png`}
          alt=""
          width={220}
          height={220}
          className="absolute left-0 top-8 hidden w-44 opacity-50 md:block"
        />
        <Image
          src={`${TEMPLATE_PATH}/images/flower-right.png`}
          alt=""
          width={220}
          height={220}
          className="absolute bottom-8 right-0 hidden w-44 opacity-50 md:block"
        />
        <SectionLabel>Assalamualaikum</SectionLabel>
        <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">
          Undangan pernikahan {resolved.couple}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#6b6056]">
          Merupakan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir
          dan memberikan doa restu pada hari bahagia kami.
        </p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-20 md:grid-cols-[1fr_0.75fr_1fr] md:items-center">
        <CoupleCard image="bride.jpg" name={firstName} role="Putri pertama" parent="Bapak Rahman & Ibu Sari" />
        <div className="text-center text-5xl font-semibold italic text-[#9a6a3a]">&</div>
        <CoupleCard image="groom.jpg" name={secondName} role="Putra pertama" parent="Bapak Darma & Ibu Lestari" />
      </section>

      <section className="bg-[#2b241f] px-5 py-20 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1fr] lg:items-end">
            <div>
              <SectionLabel dark>Save The Date</SectionLabel>
              <h2 className="mt-4 text-4xl font-semibold md:text-6xl">{resolved.date}</h2>
              <p className="mt-4 max-w-xl leading-8 text-white/70">
                Simpan tanggalnya dan hadir bersama orang-orang tersayang.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                ["120", "Hari"],
                ["08", "Jam"],
                ["45", "Menit"],
                ["12", "Detik"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-md border border-white/12 bg-white/8 p-5 text-center">
                  <div className="text-4xl font-semibold">{value}</div>
                  <div className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/58">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <EventCard
              title="Akad Nikah"
              time="08.00 - 10.00 WIB"
              venue={resolved.venue}
              mapImage="maps-akad.jpg"
            />
            <EventCard
              title="Resepsi"
              time="11.00 - 14.00 WIB"
              venue={resolved.venue}
              mapImage="maps-resepsi.jpg"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center">
          <SectionLabel>Our Gallery</SectionLabel>
          <h2 className="mt-4 text-4xl font-semibold md:text-5xl">Momen Bahagia</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 md:row-span-2">
            <Image
              src={`${TEMPLATE_PATH}/images/prewed-1.jpg`}
              alt="Prewedding"
              width={900}
              height={720}
              className="h-full min-h-[360px] w-full rounded-md object-cover"
            />
          </div>
          {galleryImages.slice(0, 4).map((image) => (
            <Image
              key={image}
              src={`${TEMPLATE_PATH}/images/${image}`}
              alt="Gallery wedding"
              width={520}
              height={390}
              className="aspect-[4/3] w-full rounded-md object-cover"
            />
          ))}
        </div>
        <video
          src={`${TEMPLATE_PATH}/videos/intro.mp4`}
          className="mt-4 aspect-video w-full rounded-md bg-[#2b241f] object-cover"
          controls
          muted
          playsInline
        />
      </section>

      <section className="bg-[#fffaf4] px-5 py-20">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
          <Panel title="RSVP" eyebrow={`${resolved.guests} tamu`}>
            <p className="leading-7 text-[#6b6056]">
              Konfirmasi kehadiran akan terhubung ke dashboard client. Untuk sementara tombol
              ini menampilkan tampilan form dulu.
            </p>
            <div className="mt-5 grid gap-3">
              <input className="h-12 rounded-md border border-[#d8c8b8] bg-white px-4" placeholder="Nama tamu" />
              <select className="h-12 rounded-md border border-[#d8c8b8] bg-white px-4">
                <option>Hadir</option>
                <option>Tidak hadir</option>
              </select>
              <button className="h-12 rounded-md bg-[#2b241f] font-semibold text-white">Kirim RSVP</button>
            </div>
          </Panel>

          <Panel title="Ucapan" eyebrow={`${resolved.wishes} ucapan`}>
            <div className="space-y-3">
              {recentWishes.map((wish) => (
                <div key={`${wish.name}-${wish.time}`} className="rounded-md border border-[#eadfd2] bg-white p-4">
                  <div className="font-semibold">{wish.name}</div>
                  <p className="mt-1 text-sm leading-6 text-[#6b6056]">{wish.text}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Wedding Gift" eyebrow={resolved.packageName}>
            <p className="leading-7 text-[#6b6056]">
              Bagi keluarga dan sahabat yang ingin mengirimkan tanda kasih, informasi rekening
              dan alamat pengiriman bisa ditampilkan di sini.
            </p>
            <div className="mt-5 rounded-md border border-dashed border-[#cdbba8] bg-white p-4">
              <div className="text-sm text-[#756a60]">BCA</div>
              <div className="mt-1 text-xl font-semibold">1234567890</div>
              <div className="mt-1 text-sm text-[#756a60]">a.n. {resolved.couple}</div>
            </div>
          </Panel>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-20 text-center">
        <SectionLabel>Love Story</SectionLabel>
        <h2 className="mt-4 text-4xl font-semibold">Cerita Kami</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            ["Pertama Bertemu", "Sebuah pertemuan sederhana yang menjadi awal cerita panjang."],
            ["Lamaran", "Dengan restu keluarga, kami memantapkan hati menuju hari bahagia."],
            ["Hari Pernikahan", "Kami mengundang orang-orang terdekat untuk menjadi saksi perjalanan ini."],
          ].map(([title, text]) => (
            <article key={title} className="rounded-md border border-[#e0d4c7] bg-white p-5 text-left">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#6b6056]">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/14 p-4 text-center">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/68">{label}</div>
      <div className="mt-2 font-semibold">{value}</div>
    </div>
  );
}

function SectionLabel({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div
      className={`text-sm font-semibold uppercase tracking-[0.26em] ${
        dark ? "text-[#d6c7a1]" : "text-[#9a6a3a]"
      }`}
    >
      {children}
    </div>
  );
}

function CoupleCard({
  image,
  name,
  role,
  parent,
}: {
  image: string;
  name: string;
  role: string;
  parent: string;
}) {
  return (
    <article className="rounded-md border border-[#e0d4c7] bg-white p-5 text-center">
      <Image
        src={`${TEMPLATE_PATH}/images/${image}`}
        alt={name}
        width={640}
        height={640}
        className="mx-auto aspect-square w-full max-w-sm rounded-md object-cover"
      />
      <h3 className="mt-5 text-4xl font-semibold">{name}</h3>
      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#9a6a3a]">{role}</p>
      <p className="mt-2 text-sm text-[#6b6056]">{parent}</p>
    </article>
  );
}

function EventCard({
  title,
  time,
  venue,
  mapImage,
}: {
  title: string;
  time: string;
  venue: string;
  mapImage: string;
}) {
  return (
    <article className="overflow-hidden rounded-md border border-white/12 bg-white text-[#2b241f]">
      <Image
        src={`${TEMPLATE_PATH}/images/${mapImage}`}
        alt={title}
        width={640}
        height={320}
        className="h-48 w-full object-cover"
      />
      <div className="p-5">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a6a3a]">{title}</div>
        <h3 className="mt-3 text-2xl font-semibold">{time}</h3>
        <p className="mt-3 leading-7 text-[#6b6056]">{venue}</p>
      </div>
    </article>
  );
}

function Panel({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-md border border-[#e0d4c7] bg-[#f8f1e8] p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a6a3a]">{eyebrow}</div>
      <h2 className="mt-3 text-2xl font-semibold">{title}</h2>
      <div className="mt-5">{children}</div>
    </article>
  );
}
