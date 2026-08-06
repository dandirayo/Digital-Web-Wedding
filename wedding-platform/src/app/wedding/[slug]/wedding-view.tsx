"use client";

import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { FormEvent, useCallback, useMemo, useSyncExternalStore, useState } from "react";
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

type RsvpData = {
  name: string;
  status: "hadir" | "tidak_hadir";
  pax: number;
  code: string;
  qrDataUrl: string;
  submittedAt: string;
};

type WeddingWish = {
  name: string;
  text: string;
  time: string;
};

type GalleryPreview = {
  src: string;
  alt: string;
};

const EVENTS_KEY = "occasio_demo_events";
const TEMPLATE_PATH = "/templates/sheila-yoga/assets";

const galleryImages = ["g1.jpg", "g2.jpg", "g3.jpg", "g4.jpg", "g5.jpg", "g6.jpg"];
const defaultWeddingWishes = recentWishes.map((wish) => ({
  name: wish.name,
  text: wish.text,
  time: wish.time,
}));

function getContentKey(slug: string) {
  return `occasio_demo_content_${slug}`;
}

function getRsvpKey(slug: string) {
  return `occasio_demo_rsvp_${slug}`;
}

function getWishesKey(slug: string) {
  return `occasio_demo_wishes_${slug}`;
}

function buildTicketCode(slug: string, name: string) {
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 18);
  return `${slug}-${safeName || "tamu"}-${Date.now().toString(36)}`.toUpperCase();
}

function subscribeToBrowserHydration(onStoreChange: () => void) {
  const frame = window.requestAnimationFrame(onStoreChange);
  return () => window.cancelAnimationFrame(frame);
}

function getServerSnapshot() {
  return "{}";
}

export function WeddingView({ slug }: { slug: string }) {
  const getLocalSnapshot = useCallback(() => {
    try {
      return JSON.stringify({
        events: localStorage.getItem(EVENTS_KEY),
        content: localStorage.getItem(getContentKey(slug)),
        rsvp: localStorage.getItem(getRsvpKey(slug)),
        wishes: localStorage.getItem(getWishesKey(slug)),
      });
    } catch {
      return "{}";
    }
  }, [slug]);
  const localSnapshot = useSyncExternalStore(
    subscribeToBrowserHydration,
    getLocalSnapshot,
    getServerSnapshot,
  );
  const localData = useMemo(() => {
    try {
      return JSON.parse(localSnapshot) as {
        events?: string | null;
        content?: string | null;
        rsvp?: string | null;
        wishes?: string | null;
      };
    } catch {
      return {};
    }
  }, [localSnapshot]);
  const events = useMemo(() => {
    try {
      return localData.events ? (JSON.parse(localData.events) as WeddingEvent[]) : defaultEvents;
    } catch {
      return defaultEvents;
    }
  }, [localData.events]);
  const content = useMemo(() => {
    try {
      return localData.content ? (JSON.parse(localData.content) as Partial<WeddingContent>) : {};
    } catch {
      return {};
    }
  }, [localData.content]);
  const storedRsvp = useMemo(() => {
    try {
      return localData.rsvp ? (JSON.parse(localData.rsvp) as RsvpData) : null;
    } catch {
      return null;
    }
  }, [localData.rsvp]);
  const storedWishes = useMemo(() => {
    try {
      return localData.wishes ? (JSON.parse(localData.wishes) as WeddingWish[]) : defaultWeddingWishes;
    } catch {
      return defaultWeddingWishes;
    }
  }, [localData.wishes]);
  const [rsvpOverride, setRsvpOverride] = useState<RsvpData | null | undefined>(undefined);
  const [wishesOverride, setWishesOverride] = useState<WeddingWish[] | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryPreview | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState("");
  const [wishStatus, setWishStatus] = useState("");
  const [giftStatus, setGiftStatus] = useState("");
  const rsvp = rsvpOverride === undefined ? storedRsvp : rsvpOverride;
  const wishes = wishesOverride ?? storedWishes;

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
    wishes: wishes.length,
  };

  const [firstName = "Bride", secondName = "Groom"] = resolved.couple
    .split("&")
    .map((name) => name.trim());

  async function handleRsvpSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formData = new FormData(formEvent.currentTarget);
    const name = String(formData.get("rsvpName") || "").trim();
    const status = String(formData.get("rsvpStatus") || "hadir") as RsvpData["status"];
    const pax = Number(formData.get("rsvpPax") || 1);

    if (!name) {
      setRsvpStatus("Nama tamu wajib diisi.");
      return;
    }

    const code = status === "hadir" ? buildTicketCode(slug, name) : "";
    const qrPayload = JSON.stringify({
      type: "occasio-demo-checkin",
      slug,
      guest: name,
      pax: status === "hadir" ? pax : 0,
      code,
    });
    const qrDataUrl =
      status === "hadir"
        ? await QRCode.toDataURL(qrPayload, {
            errorCorrectionLevel: "M",
            margin: 2,
            scale: 8,
            color: {
              dark: "#2b241f",
              light: "#fffaf4",
            },
          })
        : "";
    const nextRsvp: RsvpData = {
      name,
      status,
      pax: status === "hadir" ? pax : 0,
      code,
      qrDataUrl,
      submittedAt: new Date().toISOString(),
    };

    setRsvpOverride(nextRsvp);
    localStorage.setItem(getRsvpKey(slug), JSON.stringify(nextRsvp));
    setRsvpStatus(
      status === "hadir"
        ? "RSVP berhasil. QR check-in demo sudah dibuat."
        : "RSVP berhasil. Terima kasih sudah memberi kabar.",
    );
  }

  function handleResetRsvp() {
    setRsvpOverride(null);
    localStorage.removeItem(getRsvpKey(slug));
    setRsvpStatus("RSVP demo sudah direset.");
  }

  function handleWishSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const form = formEvent.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("wishName") || "").trim();
    const text = String(formData.get("wishText") || "").trim();

    if (!name || !text) {
      setWishStatus("Nama dan ucapan wajib diisi.");
      return;
    }

    const nextWish: WeddingWish = {
      name,
      text,
      time: "Baru saja",
    };
    const nextWishes = [nextWish, ...wishes].slice(0, 20);
    setWishesOverride(nextWishes);
    localStorage.setItem(getWishesKey(slug), JSON.stringify(nextWishes));
    setWishStatus("Ucapan berhasil ditampilkan.");
    form.reset();
  }

  async function handleCopyGift() {
    try {
      await navigator.clipboard.writeText(`BCA 1234567890 a.n. ${resolved.couple}`);
      setGiftStatus("Nomor rekening berhasil disalin.");
    } catch {
      setGiftStatus("Browser belum mengizinkan copy otomatis.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f3ebdf] text-[#2b241f]">
      <section className="relative min-h-[100svh] overflow-hidden bg-[#776859] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${TEMPLATE_PATH}/images/cover.jpg')` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(37,29,23,0.72),rgba(37,29,23,0.2),rgba(37,29,23,0.76))]" />
        <div className="absolute left-1/2 top-0 hidden h-[52vw] max-h-[520px] min-h-[260px] w-[52vw] min-w-[260px] max-w-[520px] -translate-x-[90%] -translate-y-[20%] rounded-full bg-white/22 sm:block" />
        <div className="absolute right-1/2 top-0 hidden h-[52vw] max-h-[520px] min-h-[260px] w-[52vw] min-w-[260px] max-w-[520px] translate-x-[92%] -translate-y-[20%] rounded-full bg-white/18 sm:block" />

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-between px-4 py-5 sm:px-5 sm:py-8">
          <header className="flex items-center justify-between gap-3">
            <Link href="/" className="rounded-full bg-white/18 px-4 py-2 text-sm font-semibold backdrop-blur sm:px-5">
              Occasio
            </Link>
            <span className="rounded-full bg-white/18 px-4 py-2 text-right text-sm font-semibold backdrop-blur sm:px-5">
              {resolved.date}
            </span>
          </header>

          <div className="py-12 text-center sm:py-16 md:py-20">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] sm:text-sm sm:tracking-[0.38em]">The Wedding of</div>
            <h1 className="mt-5 text-[clamp(3.2rem,18vw,5.8rem)] font-semibold leading-none md:text-8xl">
              {firstName}
              <span className="block py-1 text-[clamp(2.2rem,11vw,3.75rem)] font-normal italic md:text-6xl">&</span>
              {secondName}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-sm font-medium leading-7 text-white/88 sm:text-base sm:leading-8">
              {resolved.greeting}
            </p>
          </div>

          <div className="grid gap-3 rounded-md border border-white/22 bg-white/14 p-3 backdrop-blur sm:p-4 md:grid-cols-3">
            <MiniInfo label="Tanggal" value={resolved.date} />
            <MiniInfo label="Lokasi" value={resolved.venue} />
            <MiniInfo label="RSVP" value={`${resolved.rsvp} konfirmasi`} />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-5 py-14 text-center sm:py-20">
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

      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-14 sm:pb-20 md:grid-cols-[1fr_0.75fr_1fr] md:items-center">
        <CoupleCard image="bride.jpg" name={firstName} role="Putri pertama" parent="Bapak Rahman & Ibu Sari" />
        <div className="text-center text-5xl font-semibold italic text-[#9a6a3a]">&</div>
        <CoupleCard image="groom.jpg" name={secondName} role="Putra pertama" parent="Bapak Darma & Ibu Lestari" />
      </section>

      <section className="bg-[#2b241f] px-5 py-14 text-white sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1fr] lg:items-end">
            <div>
              <SectionLabel dark>Save The Date</SectionLabel>
              <h2 className="mt-4 text-3xl font-semibold md:text-6xl">{resolved.date}</h2>
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
                  <div className="text-3xl font-semibold sm:text-4xl">{value}</div>
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

      <section className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
        <div className="text-center">
          <SectionLabel>Our Gallery</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold md:text-5xl">Momen Bahagia</h2>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              setSelectedImage({
                src: `${TEMPLATE_PATH}/images/prewed-1.jpg`,
                alt: "Prewedding Sheila dan Yoga",
              })
            }
            className="group overflow-hidden rounded-md text-left"
            aria-label="Preview foto prewedding"
          >
            <Image
              src={`${TEMPLATE_PATH}/images/prewed-1.jpg`}
              alt="Prewedding Sheila dan Yoga"
              width={900}
              height={900}
              className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.025]"
            />
          </button>
          <div className="grid grid-cols-2 gap-4">
            {galleryImages.slice(0, 4).map((image) => (
              <button
                key={image}
                type="button"
                onClick={() =>
                  setSelectedImage({
                    src: `${TEMPLATE_PATH}/images/${image}`,
                    alt: "Gallery wedding Sheila dan Yoga",
                  })
                }
                className="group overflow-hidden rounded-md text-left"
                aria-label="Preview foto gallery"
              >
                <Image
                  src={`${TEMPLATE_PATH}/images/${image}`}
                  alt="Gallery wedding Sheila dan Yoga"
                  width={520}
                  height={520}
                  className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.035]"
                />
              </button>
            ))}
          </div>
        </div>
        <video
          src={`${TEMPLATE_PATH}/videos/intro.mp4`}
          className="mt-4 aspect-video max-h-[560px] w-full rounded-md bg-[#2b241f] object-cover"
          controls
          muted
          playsInline
        />
      </section>

      <section className="bg-[#fffaf4] px-5 py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
          <Panel title="RSVP" eyebrow={`${resolved.guests} tamu`}>
            <p className="leading-7 text-[#6b6056]">
              Konfirmasi kehadiran demo tersimpan di browser ini. Jika memilih hadir,
              sistem akan membuat QR check-in demo.
            </p>
            <form key={rsvp?.code ?? "new-rsvp"} onSubmit={handleRsvpSubmit} className="mt-5 grid gap-3">
              <input
                name="rsvpName"
                className="h-12 rounded-md border border-[#d8c8b8] bg-white px-4"
                placeholder="Nama tamu"
                defaultValue={rsvp?.name ?? ""}
              />
              <select
                name="rsvpStatus"
                className="h-12 rounded-md border border-[#d8c8b8] bg-white px-4"
                defaultValue={rsvp?.status ?? "hadir"}
              >
                <option value="hadir">Hadir</option>
                <option value="tidak_hadir">Tidak hadir</option>
              </select>
              <select
                name="rsvpPax"
                className="h-12 rounded-md border border-[#d8c8b8] bg-white px-4"
                defaultValue={String(rsvp?.pax || 1)}
              >
                <option value="1">1 orang</option>
                <option value="2">2 orang</option>
                <option value="3">3 orang</option>
                <option value="4">4 orang</option>
              </select>
              <button className="h-12 rounded-md bg-[#2b241f] font-semibold text-white">Kirim RSVP</button>
            </form>
            {rsvpStatus ? <p className="mt-3 text-sm font-semibold text-[#9a6a3a]">{rsvpStatus}</p> : null}
            {rsvp ? (
              <div className="mt-5 rounded-md border border-[#eadfd2] bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a6a3a]">
                  Status RSVP
                </div>
                <div className="mt-2 font-semibold">
                  {rsvp.name} / {rsvp.status === "hadir" ? `${rsvp.pax} hadir` : "Tidak hadir"}
                </div>
                {rsvp.qrDataUrl ? (
                  <div className="mt-4 text-center">
                    <Image
                      src={rsvp.qrDataUrl}
                      alt={`QR check-in demo untuk ${rsvp.name}`}
                      width={220}
                      height={220}
                      unoptimized
                      className="mx-auto rounded-md border border-[#eadfd2] bg-[#fffaf4] p-2"
                    />
                    <div className="mt-3 break-all font-mono text-xs text-[#756a60]">{rsvp.code}</div>
                    <a
                      href={rsvp.qrDataUrl}
                      download={`QR-${rsvp.code}.png`}
                      className="mt-3 inline-flex h-10 items-center justify-center rounded-md border border-[#cdbba8] px-4 text-sm font-semibold text-[#5a4028]"
                    >
                      Download QR
                    </a>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={handleResetRsvp}
                  className="mt-4 h-10 w-full rounded-md border border-[#cdbba8] text-sm font-semibold text-[#5a4028]"
                >
                  Reset RSVP
                </button>
              </div>
            ) : null}
          </Panel>

          <Panel title="Ucapan" eyebrow={`${resolved.wishes} ucapan`}>
            <form onSubmit={handleWishSubmit} className="mb-5 grid gap-3">
              <input
                name="wishName"
                className="h-12 rounded-md border border-[#d8c8b8] bg-white px-4"
                placeholder="Nama"
              />
              <textarea
                name="wishText"
                className="min-h-28 rounded-md border border-[#d8c8b8] bg-white px-4 py-3"
                placeholder="Tulis ucapan..."
              />
              <button className="h-12 rounded-md bg-[#2b241f] font-semibold text-white">Kirim Ucapan</button>
              {wishStatus ? <p className="text-sm font-semibold text-[#9a6a3a]">{wishStatus}</p> : null}
            </form>
            <div className="space-y-3">
              {wishes.map((wish) => (
                <div key={`${wish.name}-${wish.time}`} className="rounded-md border border-[#eadfd2] bg-white p-4">
                  <div className="font-semibold">{wish.name}</div>
                  <p className="mt-1 text-sm leading-6 text-[#6b6056]">{wish.text}</p>
                  <div className="mt-2 text-xs text-[#9a6a3a]">{wish.time}</div>
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
            <button
              type="button"
              onClick={handleCopyGift}
              className="mt-4 h-11 w-full rounded-md bg-[#2b241f] text-sm font-semibold text-white transition hover:bg-[#3a3129]"
            >
              Salin Rekening
            </button>
            {giftStatus ? <p className="mt-3 text-sm font-semibold text-[#9a6a3a]">{giftStatus}</p> : null}
          </Panel>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14 text-center sm:py-20">
        <SectionLabel>Love Story</SectionLabel>
        <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Cerita Kami</h2>
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

      {selectedImage ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#1d1712]/82 px-4 py-6 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Tutup preview gambar"
            onClick={() => setSelectedImage(null)}
          />
          <figure className="relative w-full max-w-5xl overflow-hidden rounded-md bg-[#f8f1e8] p-3 shadow-[0_28px_100px_rgba(0,0,0,0.42)]">
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute right-5 top-5 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/92 text-xl font-semibold text-[#2b241f]"
              aria-label="Tutup preview"
            >
              x
            </button>
            <Image
              src={selectedImage.src}
              alt={selectedImage.alt}
              width={1400}
              height={1000}
              className="max-h-[82vh] w-full rounded-sm object-contain"
            />
            <figcaption className="px-2 pt-3 text-sm font-semibold text-[#6b6056]">
              {selectedImage.alt}
            </figcaption>
          </figure>
        </div>
      ) : null}
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
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`;

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
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md border border-[#cdbba8] px-4 text-sm font-semibold text-[#5a4028] transition hover:bg-[#efe5d8]"
        >
          Buka Maps
        </a>
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
