"use client";

import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { FormEvent, useState, useMemo } from "react";
import { addWish, submitRsvp } from "@/lib/store";
import type { ThemeProps } from "../types";
import { Wish, Guest } from "@/lib/types";
import { Countdown } from "@/components/wedding/countdown";
import { MusicPlayer } from "@/components/wedding/music-player";
import { PersonalizedGreeting } from "@/components/wedding/personalized-greeting";
import { resolveMedia } from "../media";

// Hiasan bunga milik tema (bukan foto pasangan).
const TEMPLATE_PATH = "/templates/sheila-yoga/assets";

type GalleryPreview = {
  src: string;
  alt: string;
};

export default function ClassicElegantTheme({
  event,
  content,
  wishes: initialWishes,
  media,
  guestName,
  guestData,
  guestToken,
}: ThemeProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryPreview | null>(null);
  
  // Local state for interactive UI
  const [wishes, setWishes] = useState<Wish[]>(initialWishes);
  
  const [rsvpStatus, setRsvpStatus] = useState("");
  const [wishStatus, setWishStatus] = useState("");
  const [giftStatus, setGiftStatus] = useState("");

  const [rsvpGuest, setRsvpGuest] = useState<Guest | null>(
    guestData || null
  );

  const resolved = {
    couple: event.coupleName || "Nama Pasangan",
    date: new Date(event.eventDate).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    venue: event.venue || "Venue acara",
    packageName: event.packageTier || "Wedding",
    greeting:
      content.greeting ||
      "Dengan penuh sukacita kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada hari bahagia kami.",
    guestsCount: event.guestCount || 0,
    rsvpCount: (event.rsvpYes || 0) + (event.rsvpNo || 0),
    wishesCount: wishes.length,
  };

  const firstName = content.brideName || "Bride";
  const secondName = content.groomName || "Groom";

  async function handleRsvpSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formData = new FormData(formEvent.currentTarget);
    const status = String(formData.get("rsvpStatus") || "attending") as "attending" | "declined";
    const pax = Number(formData.get("rsvpPax") || 1);

    if (!guestToken || !rsvpGuest) {
      setRsvpStatus("RSVP hanya bisa dikirim lewat link undangan pribadi Anda.");
      return;
    }

    try {
      const saved = await submitRsvp(event.id, guestToken, { rsvpStatus: status, paxConfirmed: pax });
      const qr = status === "attending"
        ? await QRCode.toDataURL(guestToken, { errorCorrectionLevel: "M", margin: 2, scale: 8, color: { dark: "#2b241f", light: "#fffaf4" } })
        : "";
      setRsvpGuest({ ...rsvpGuest, ...saved, qrCode: qr });
      setRsvpStatus(status === "attending" ? "RSVP berhasil. QR check-in sudah dibuat." : "RSVP berhasil. Terima kasih sudah memberi kabar.");
    } catch (e) {
      setRsvpStatus(e instanceof Error ? e.message : "Terjadi kesalahan saat menyimpan RSVP.");
    }
  }

  function handleResetRsvp() {
    setRsvpGuest((current) => (current ? { ...current, rsvpStatus: "pending", qrCode: "" } : null));
    setRsvpStatus("Silakan ubah RSVP Anda.");
  }

  async function handleWishSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const form = formEvent.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("wishName") || "").trim();
    const text = String(formData.get("wishText") || "").trim();

    if (!name || !text) {
      setWishStatus("Nama dan ucapan wajib diisi.");
      return;
    }

    try {
      const newWish = await addWish(event.id, {
        guestName: name,
        message: text,
      });
      setWishes([newWish, ...wishes]);
      setWishStatus("Ucapan berhasil ditampilkan.");
      form.reset();
    } catch {
      setWishStatus("Terjadi kesalahan saat menyimpan ucapan.");
    }
  }

  async function handleCopyGift(bankAccountText: string) {
    try {
      await navigator.clipboard.writeText(bankAccountText);
      setGiftStatus("Nomor rekening berhasil disalin.");
    } catch {
      setGiftStatus("Browser belum mengizinkan copy otomatis.");
    }
  }
  
  const m = useMemo(() => resolveMedia(content, media), [content, media]);
  const galleryImages = m.gallery;
  const prewedImage = m.prewedding;
  const hasGallery = Boolean(prewedImage || galleryImages.length || m.video);

  return (
    <main className="min-h-screen bg-[#f3ebdf] text-[#2b241f]">
      <section className="relative min-h-[100svh] overflow-hidden bg-[#776859] text-white">
        {m.cover ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${m.cover}')` }}
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(37,29,23,0.72),rgba(37,29,23,0.2),rgba(37,29,23,0.76))]" />
        <div className="absolute left-1/2 top-0 hidden h-[52vw] max-h-[520px] min-h-[260px] w-[52vw] min-w-[260px] max-w-[520px] -translate-x-[90%] -translate-y-[20%] rounded-full bg-white/22 sm:block" />
        <div className="absolute right-1/2 top-0 hidden h-[52vw] max-h-[520px] min-h-[260px] w-[52vw] min-w-[260px] max-w-[520px] translate-x-[92%] -translate-y-[20%] rounded-full bg-white/18 sm:block" />

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-between px-4 py-5 sm:px-5 sm:py-8">
          <header className="flex items-center justify-between gap-3">
            <Link href="/" className="shrink-0 rounded-full bg-white/18 px-4 py-2 text-sm font-semibold backdrop-blur sm:px-5">
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
            <div className="mt-6">
              <PersonalizedGreeting
                guestName={guestName}
                guestData={guestData}
                greeting={resolved.greeting}
              />
            </div>
          </div>

          <div className="grid gap-3 rounded-md border border-white/22 bg-white/14 p-3 backdrop-blur sm:p-4 md:grid-cols-3">
            <MiniInfo label="Tanggal" value={resolved.date} />
            <MiniInfo label="Lokasi" value={resolved.venue} />
            <MiniInfo label="RSVP" value={`${resolved.rsvpCount} konfirmasi`} />
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
        <CoupleCard 
          image={m.bride} 
          name={firstName} 
          role="Putri pertama" 
          parent={content.brideParent || "Bapak & Ibu"} 
        />
        <div className="text-center text-5xl font-semibold italic text-[#9a6a3a]">&</div>
        <CoupleCard 
          image={m.groom} 
          name={secondName} 
          role="Putra pertama" 
          parent={content.groomParent || "Bapak & Ibu"} 
        />
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
            <Countdown targetDate={event.eventDate} />
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <EventCard
              title="Akad Nikah"
              time={content.akadTime || "08.00 - 10.00 WIB"}
              venue={content.akadVenue || resolved.venue}
              mapImage={m.maps[0]}
            />
            <EventCard
              title="Resepsi"
              time={content.resepsiTime || "11.00 - 14.00 WIB"}
              venue={content.resepsiVenue || resolved.venue}
              mapImage={m.maps[1]}
            />
          </div>
        </div>
      </section>

      {hasGallery ? (
      <section className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
        <div className="text-center">
          <SectionLabel>Our Gallery</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold md:text-5xl">Momen Bahagia</h2>
        </div>
        <div className={`mt-10 grid gap-4 ${prewedImage && galleryImages.length ? "lg:grid-cols-2" : ""}`}>
          {prewedImage ? (
          <button
            type="button"
            onClick={() =>
              setSelectedImage({
                src: prewedImage,
                alt: "Prewedding",
              })
            }
            className="group overflow-hidden rounded-md text-left"
            aria-label="Preview foto prewedding"
          >
            <Image
              src={prewedImage}
              unoptimized
              alt="Prewedding"
              width={900}
              height={900}
              className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.025]"
            />
          </button>
          ) : null}
          <div className="grid grid-cols-2 gap-4">
            {galleryImages.slice(0, 4).map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() =>
                  setSelectedImage({
                    src: image.url,
                    alt: image.altText || "Gallery",
                  })
                }
                className="group overflow-hidden rounded-md text-left"
                aria-label="Preview foto gallery"
              >
                <Image
                  src={image.url}
                  unoptimized
                  alt={image.altText || "Gallery"}
                  width={520}
                  height={520}
                  className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.035]"
                />
              </button>
            ))}
          </div>
        </div>
        {m.video ? (
          <video
            src={m.video}
            className="mt-4 aspect-video max-h-[560px] w-full rounded-md bg-[#2b241f] object-cover"
            controls
            muted
            playsInline
            preload="metadata"
          />
        ) : null}
      </section>
      ) : null}

      <section className="bg-[#fffaf4] px-5 py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
          <Panel title="RSVP" eyebrow={`${resolved.guestsCount} tamu`}>
            <p className="leading-7 text-[#6b6056]">
              Konfirmasi kehadiran. Jika memilih hadir,
              sistem akan membuat QR check-in.
            </p>
            {!rsvpGuest ? <p className="mt-4 text-sm font-semibold text-[#9a6a3a]">Buka link undangan pribadi yang dikirim mempelai untuk mengirim RSVP.</p> : null}
            {rsvpGuest && rsvpGuest.rsvpStatus === "pending" && (
              <form key={rsvpGuest?.id || "new-rsvp"} onSubmit={handleRsvpSubmit} className="mt-5 grid gap-3">
                <input
                  name="rsvpName"
                  className="h-12 rounded-md border border-[#d8c8b8] bg-white px-4"
                  placeholder="Nama tamu"
                  readOnly
                  defaultValue={rsvpGuest?.name || guestName || ""}
                />
                <select
                  name="rsvpStatus"
                  className="h-12 rounded-md border border-[#d8c8b8] bg-white px-4"
                  defaultValue="attending"
                >
                  <option value="attending">Hadir</option>
                  <option value="declined">Tidak hadir</option>
                </select>
                <select
                  name="rsvpPax"
                  className="h-12 rounded-md border border-[#d8c8b8] bg-white px-4"
                  defaultValue={String(rsvpGuest?.paxConfirmed || 1)}
                >
                  {Array.from({ length: Math.min(rsvpGuest?.paxLimit || 1, 20) }, (_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1} orang</option>)}
                </select>
                <button className="h-12 rounded-md bg-[#2b241f] font-semibold text-white">Kirim RSVP</button>
              </form>
            )}
            {rsvpStatus ? <p className="mt-3 text-sm font-semibold text-[#9a6a3a]">{rsvpStatus}</p> : null}
            {rsvpGuest && rsvpGuest.rsvpStatus !== "pending" ? (
              <div className="mt-5 rounded-md border border-[#eadfd2] bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a6a3a]">
                  Status RSVP
                </div>
                <div className="mt-2 font-semibold">
                  {rsvpGuest.name} / {rsvpGuest.rsvpStatus === "attending" ? `${rsvpGuest.paxConfirmed} hadir` : "Tidak hadir"}
                </div>
                {rsvpGuest.rsvpStatus === "attending" && rsvpGuest.qrCode?.startsWith("data:image") ? (
                  <div className="mt-4 text-center">
                    <Image
                      src={rsvpGuest.qrCode}
                      alt={`QR check-in untuk ${rsvpGuest.name}`}
                      width={220}
                      height={220}
                      unoptimized
                      className="mx-auto rounded-md border border-[#eadfd2] bg-[#fffaf4] p-2"
                    />
                    <a
                      href={rsvpGuest.qrCode}
                      download={`QR-${rsvpGuest.name}.png`}
                      className="mt-3 inline-flex h-10 items-center justify-center rounded-md border border-[#cdbba8] px-4 text-sm font-semibold text-[#5a4028]"
                    >
                      Download QR
                    </a>
                  </div>
                ) : rsvpGuest.rsvpStatus === "declined" ? (
                  <div className="mt-4 text-center text-sm text-[#6b6056]">
                    Terima kasih atas responnya. Kami memaklumi ketidakhadiran Anda.
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

          <Panel title="Ucapan" eyebrow={`${resolved.wishesCount} ucapan`}>
            <form onSubmit={handleWishSubmit} className="mb-5 grid gap-3">
              <input
                name="wishName"
                className="h-12 rounded-md border border-[#d8c8b8] bg-white px-4"
                placeholder="Nama"
                defaultValue={guestName || ""}
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
              {wishes.filter(w => w.isVisible).map((wish) => (
                <div key={wish.id} className="rounded-md border border-[#eadfd2] bg-white p-4">
                  <div className="font-semibold">{wish.guestName}</div>
                  <p className="mt-1 text-sm leading-6 text-[#6b6056]">{wish.message}</p>
                  <div className="mt-2 text-xs text-[#9a6a3a]">
                    {new Date(wish.createdAt).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Wedding Gift" eyebrow={resolved.packageName}>
            <p className="leading-7 text-[#6b6056]">
              Bagi keluarga dan sahabat yang ingin mengirimkan tanda kasih, informasi rekening
              dan alamat pengiriman bisa ditampilkan di sini.
            </p>
            {content.bankAccounts && content.bankAccounts.length > 0 ? (
              content.bankAccounts.map((account, idx) => (
                <div key={idx} className="mt-5 rounded-md border border-dashed border-[#cdbba8] bg-white p-4">
                  <div className="text-sm text-[#756a60]">{account.bank}</div>
                  <div className="mt-1 text-xl font-semibold">{account.accountNumber}</div>
                  <div className="mt-1 text-sm text-[#756a60]">a.n. {account.accountName}</div>
                  <button
                    type="button"
                    onClick={() => handleCopyGift(`${account.bank} ${account.accountNumber} a.n. ${account.accountName}`)}
                    className="mt-4 h-11 w-full rounded-md bg-[#2b241f] text-sm font-semibold text-white transition hover:bg-[#3a3129]"
                  >
                    Salin Rekening
                  </button>
                </div>
              ))
            ) : (
              <div className="mt-5 rounded-md border border-dashed border-[#cdbba8] bg-white p-4">
                <div className="text-sm text-[#756a60]">BCA</div>
                <div className="mt-1 text-xl font-semibold">1234567890</div>
                <div className="mt-1 text-sm text-[#756a60]">a.n. {resolved.couple}</div>
                <button
                  type="button"
                  onClick={() => handleCopyGift(`BCA 1234567890 a.n. ${resolved.couple}`)}
                  className="mt-4 h-11 w-full rounded-md bg-[#2b241f] text-sm font-semibold text-white transition hover:bg-[#3a3129]"
                >
                  Salin Rekening
                </button>
              </div>
            )}
            
            {giftStatus ? <p className="mt-3 text-sm font-semibold text-[#9a6a3a]">{giftStatus}</p> : null}
          </Panel>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14 text-center sm:py-20">
        <SectionLabel>Love Story</SectionLabel>
        <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Cerita Kami</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {(content.loveStory && content.loveStory.length > 0) ? (
            content.loveStory.map((story, idx) => (
              <article key={idx} className="rounded-md border border-[#e0d4c7] bg-white p-5 text-left">
                <h3 className="text-lg font-semibold">{story.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#6b6056]">{story.description}</p>
              </article>
            ))
          ) : (
            [
              ["Pertama Bertemu", "Sebuah pertemuan sederhana yang menjadi awal cerita panjang."],
              ["Lamaran", "Dengan restu keluarga, kami memantapkan hati menuju hari bahagia."],
              ["Hari Pernikahan", "Kami mengundang orang-orang terdekat untuk menjadi saksi perjalanan ini."],
            ].map(([title, text]) => (
              <article key={title} className="rounded-md border border-[#e0d4c7] bg-white p-5 text-left">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#6b6056]">{text}</p>
              </article>
            ))
          )}
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
              unoptimized
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

      {m.music ? <MusicPlayer musicUrl={m.music} /> : null}
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
      {image ? (
        <Image
          src={image}
          alt={name}
          width={640}
          height={640}
          unoptimized
          className="mx-auto aspect-square w-full max-w-sm rounded-md object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="mx-auto grid aspect-square w-full max-w-sm place-items-center rounded-md bg-[#efe5d8] text-7xl font-semibold text-[#9a6a3a]"
        >
          {name.trim().charAt(0).toUpperCase()}
        </div>
      )}
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
  mapImage?: string;
}) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`;

  return (
    <article className="overflow-hidden rounded-md border border-white/12 bg-white text-[#2b241f]">
      {mapImage ? (
        <Image
          src={mapImage}
          alt={title}
          width={640}
          height={320}
          unoptimized
          className="h-48 w-full object-cover"
        />
      ) : null}
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
