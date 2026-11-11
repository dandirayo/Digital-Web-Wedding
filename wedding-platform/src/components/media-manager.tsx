"use client";

import { useRef, useState } from "react";
import { addMedia, deleteMedia, updateEventContent, updateMedia, uploadMedia } from "@/lib/store";
import type { EventContent, EventMedia, MediaCategory } from "@/lib/types";
import { MediaImage } from "@/components/wedding/media-image";

const SECTIONS: Array<{ category: MediaCategory; title: string; hint: string; accept: string }> = [
  { category: "cover", title: "Sampul", hint: "Foto utama bagian atas undangan. Yang paling atas dipakai.", accept: "image/jpeg,image/png,image/webp" },
  { category: "prewedding", title: "Prewedding", hint: "Foto besar di bagian galeri. Yang paling atas dipakai.", accept: "image/jpeg,image/png,image/webp" },
  { category: "gallery", title: "Galeri foto & video", hint: "Foto tampil sesuai urutan; video pertama diputar di bagian galeri.", accept: "image/jpeg,image/png,image/webp,video/mp4" },
  { category: "map", title: "Gambar lokasi", hint: "Pertama untuk akad, kedua untuk resepsi.", accept: "image/jpeg,image/png,image/webp" },
];

const bySort = (a: EventMedia, b: EventMedia) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt);
const ownUpload = (url: string) => url.startsWith("/api/media/");

export function MediaManager({
  eventId,
  media,
  content,
  onMedia,
  onContent,
}: {
  eventId: string;
  media: EventMedia[];
  content: EventContent;
  onMedia: (media: EventMedia[]) => void;
  onContent: (content: EventContent) => void;
}) {
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(label: string, task: () => Promise<string | void>) {
    setBusy(label);
    setMessage(null);
    try {
      const done = await task();
      setMessage({ ok: true, text: done || "Tersimpan." });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Gagal." });
    } finally {
      setBusy("");
    }
  }

  async function uploadFiles(category: MediaCategory, files: FileList | null) {
    if (!files?.length) return;
    await run(category, async () => {
      let current = [...media];
      const failed: string[] = [];
      for (const file of Array.from(files)) {
        try {
          const uploaded = await uploadMedia(eventId, file);
          const sortOrder = current.filter((m) => m.category === category).length;
          const saved = await addMedia(eventId, { url: uploaded.url, type: uploaded.type, category, altText: "", sortOrder });
          current = [...current, saved];
          onMedia(current);
        } catch (e) {
          failed.push(`${file.name}: ${e instanceof Error ? e.message : "gagal"}`);
        }
      }
      if (failed.length) throw new Error(failed.join(" • "));
      return `${files.length} file diunggah.`;
    });
  }

  async function remove(item: EventMedia) {
    if (!window.confirm("Hapus file ini dari undangan? File juga dihapus dari server.")) return;
    await run(item.id, async () => {
      await deleteMedia(item.id);
      onMedia(media.filter((m) => m.id !== item.id));
      return "Dihapus.";
    });
  }

  async function move(category: MediaCategory, item: EventMedia, direction: -1 | 1) {
    const list = media.filter((m) => m.category === category).sort(bySort);
    const index = list.findIndex((m) => m.id === item.id);
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    await run(item.id, async () => {
      const updated = new Map<string, EventMedia>();
      for (const [order, m] of list.entries()) {
        if (m.sortOrder === order) continue;
        updated.set(m.id, await updateMedia(m.id, { sortOrder: order }));
      }
      onMedia(media.map((m) => updated.get(m.id) ?? m));
      return "Urutan disimpan.";
    });
  }

  async function setContentFile(field: "bridePhotoUrl" | "groomPhotoUrl" | "musicUrl", file: File | undefined) {
    if (!file) return;
    await run(field, async () => {
      // Periksa jenis sebelum mengunggah agar tidak ada file yatim di server.
      const isAudio = file.type.startsWith("audio/") || /\.(mp3|m4a)$/i.test(file.name);
      if (field === "musicUrl" ? !isAudio : !file.type.startsWith("image/"))
        throw new Error(field === "musicUrl" ? "Pilih file audio MP3 atau M4A." : "Pilih file foto JPG, PNG, atau WebP.");
      const uploaded = await uploadMedia(eventId, file, field === "musicUrl" ? "audio" : "photo");
      onContent(await updateEventContent(eventId, { [field]: uploaded.url }));
      return "Diunggah dan disimpan.";
    });
  }

  async function clearContentFile(field: "bridePhotoUrl" | "groomPhotoUrl" | "musicUrl") {
    await run(field, async () => {
      onContent(await updateEventContent(eventId, { [field]: "" }));
      return "Dihapus.";
    });
  }

  return (
    <div className="space-y-4">
      <div role={message?.ok ? "status" : "alert"} className={`text-sm font-medium ${message ? (message.ok ? "text-emerald-700" : "text-rose-700") : ""}`}>
        {busy ? "Memproses..." : message?.text}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SingleFile title="Foto mempelai wanita" url={content.bridePhotoUrl} kind="photo" accept="image/jpeg,image/png,image/webp" busy={busy === "bridePhotoUrl"} onFile={(f) => setContentFile("bridePhotoUrl", f)} onClear={() => clearContentFile("bridePhotoUrl")} />
        <SingleFile title="Foto mempelai pria" url={content.groomPhotoUrl} kind="photo" accept="image/jpeg,image/png,image/webp" busy={busy === "groomPhotoUrl"} onFile={(f) => setContentFile("groomPhotoUrl", f)} onClear={() => clearContentFile("groomPhotoUrl")} />
        <SingleFile title="Musik latar" url={content.musicUrl} kind="audio" accept="audio/mpeg,audio/mp4,.mp3,.m4a" busy={busy === "musicUrl"} onFile={(f) => setContentFile("musicUrl", f)} onClear={() => clearContentFile("musicUrl")} />
      </div>
      <p className="text-xs text-[#6b6056]">Batas ukuran: foto 8 MB, video 60 MB, audio 15 MB. Kuota 500 MB per event. Bagian yang kosong disembunyikan dari undangan.</p>

      {SECTIONS.map((section) => {
        const list = media.filter((m) => m.category === section.category).sort(bySort);
        return (
          <section key={section.category} className="rounded-md border border-[#eadfd2] bg-[#fffaf4] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">{section.title}</h3>
                <p className="text-xs text-[#6b6056]">{section.hint}</p>
              </div>
              <label className={`inline-flex h-11 cursor-pointer items-center rounded-md bg-[#241f1a] px-4 text-sm font-semibold text-white ${busy ? "pointer-events-none opacity-50" : ""}`}>
                + Unggah
                <input type="file" multiple accept={section.accept} className="sr-only" disabled={Boolean(busy)} onChange={(e) => { uploadFiles(section.category, e.target.files); e.target.value = ""; }} />
              </label>
            </div>
            {list.length ? (
              <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {list.map((item, index) => (
                  <li key={item.id} className="rounded-md border border-[#eadfd2] bg-white p-2">
                    <div className="aspect-square overflow-hidden rounded bg-[#f7f3ed]">
                      {item.type === "video" ? <video src={item.url} className="h-full w-full object-cover" preload="metadata" muted /> : <MediaImage src={item.url} alt={item.altText || section.title} className="h-full w-full object-cover" />}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-[#6b6056]">#{index + 1}{item.type === "video" ? " · video" : ""}</span>
                      <span className="flex gap-1">
                        <button type="button" aria-label="Naikkan urutan" disabled={index === 0 || Boolean(busy)} onClick={() => move(section.category, item, -1)} className="h-8 w-8 rounded border border-[#cdbba8] text-sm disabled:opacity-30">↑</button>
                        <button type="button" aria-label="Turunkan urutan" disabled={index === list.length - 1 || Boolean(busy)} onClick={() => move(section.category, item, 1)} className="h-8 w-8 rounded border border-[#cdbba8] text-sm disabled:opacity-30">↓</button>
                        <button type="button" aria-label="Hapus file" disabled={Boolean(busy)} onClick={() => remove(item)} className="h-8 w-8 rounded border border-rose-200 text-sm text-rose-700 disabled:opacity-30">✕</button>
                      </span>
                    </div>
                    {!ownUpload(item.url) ? <p className="mt-1 text-[10px] text-[#887a6d]">File bawaan</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm italic text-[#6b6056]">Belum ada file.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

function SingleFile({ title, url, kind, accept, busy, onFile, onClear }: { title: string; url: string; kind: "photo" | "audio"; accept: string; busy: boolean; onFile: (file: File | undefined) => void; onClear: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="rounded-md border border-[#eadfd2] bg-[#fffaf4] p-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-2">
        {url ? (kind === "photo" ? <MediaImage src={url} alt={title} className="aspect-square w-full rounded object-cover" /> : <audio src={url} controls preload="none" className="w-full" />) : <p className="text-sm italic text-[#6b6056]">Belum ada.</p>}
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="h-10 rounded-md bg-[#241f1a] px-3 text-sm font-semibold text-white disabled:opacity-50">{url ? "Ganti" : "Unggah"}</button>
        {url ? <button type="button" disabled={busy} onClick={onClear} className="h-10 rounded-md border border-rose-200 px-3 text-sm font-semibold text-rose-700 disabled:opacity-50">Hapus</button> : null}
        <input ref={input} type="file" accept={accept} className="sr-only" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
    </div>
  );
}
