import type { EventContent, EventMedia } from "@/lib/types";

// Satu cara membaca media untuk semua tema, tanpa gambar bawaan milik event lain.
// Bagian yang kosong berarti belum diunggah; tema harus menyembunyikan bagian itu.
export type ResolvedMedia = {
  cover: string;
  bride: string;
  groom: string;
  prewedding: string;
  gallery: EventMedia[];
  video: string;
  maps: string[];
  music: string;
};

const bySort = (a: EventMedia, b: EventMedia) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt);

export function resolveMedia(content: EventContent, media: EventMedia[]): ResolvedMedia {
  const pick = (category: EventMedia["category"], type: EventMedia["type"]) =>
    media.filter((m) => m.category === category && m.type === type).sort(bySort);
  return {
    cover: pick("cover", "photo")[0]?.url ?? "",
    bride: content.bridePhotoUrl || pick("bride", "photo")[0]?.url || "",
    groom: content.groomPhotoUrl || pick("groom", "photo")[0]?.url || "",
    prewedding: pick("prewedding", "photo")[0]?.url ?? "",
    gallery: pick("gallery", "photo"),
    video: pick("gallery", "video")[0]?.url ?? "",
    maps: pick("map", "photo").map((m) => m.url),
    music: content.musicUrl || "",
  };
}

// Foto untuk tema bergaya album/poster: sampul lebih dulu, lalu foto lain yang ada.
export function heroImage(m: ResolvedMedia): string {
  return m.cover || m.prewedding || m.gallery[0]?.url || "";
}

export function galleryUrls(m: ResolvedMedia): string[] {
  return [...(m.prewedding ? [m.prewedding] : []), ...m.gallery.map((g) => g.url)];
}
