"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  initStore,
  getEventBySlug,
  getEventContent,
  getGuestByToken,
  getWishes,
  getMedia,
  getTemplateById,
} from "@/lib/store";
import { getThemeComponent } from "@/lib/themes/registry";
import type { ThemeProps } from "@/lib/themes/types";
import type { Guest } from "@/lib/types";

export function WeddingView({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const guestToken = searchParams.get("g") || undefined;
  const toName = searchParams.get("to") || undefined;
  
  const [data, setData] = useState<Omit<ThemeProps, "guestName"> | null>(null);
  const [guestName, setGuestName] = useState<string | undefined>(undefined);
  const [inviteInvalid, setInviteInvalid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ThemeComponent, setThemeComponent] = useState<React.ComponentType<ThemeProps> | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        await initStore();
        
        const event = await getEventBySlug(slug);
        if (!event) {
          setError("Event not found");
          setLoading(false);
          return;
        }

        // Server hanya mengirim event draft kepada owner atau klien pemiliknya, jadi ini pratinjau.
        setPreview(!event.isPublished);

        const [content, wishes, media, template, invite] = await Promise.all([
          getEventContent(event.id),
          getWishes(event.id),
          getMedia(event.id),
          getTemplateById(event.templateId),
          guestToken ? getGuestByToken(event.id, guestToken).catch(() => null) : Promise.resolve(null),
        ]);

        if (!content || !template) {
          setError("Incomplete event data");
          setLoading(false);
          return;
        }

        const isExpired = event.expiresAt ? new Date(event.expiresAt) < new Date() : false;
        const guestData = invite ? ({ ...invite, phone: "", qrCode: "", checkedInAt: null, createdAt: "" } as Guest) : null;
        setGuestName(invite?.name ?? toName);
        setInviteInvalid(Boolean(guestToken) && !invite);

        setData({
          event,
          content,
          guests: [],
          wishes,
          media,
          guestData,
          isExpired,
        });
        
        setThemeComponent(() => getThemeComponent(template.slug));
        
      } catch {
        setError("Undangan tidak ditemukan atau belum dipublikasikan.");
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [guestToken, toName, slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3ed]">
        <div className="text-xl font-semibold text-[#9a6a3a]">Loading...</div>
      </div>
    );
  }

  if (error || !data || !ThemeComponent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f3ed] p-5 text-center">
        <h1 className="text-4xl font-bold text-[#241f1a]">404</h1>
        <p className="mt-4 text-lg text-[#6b6056]">{error || "Event not found"}</p>
      </div>
    );
  }

  if (data.isExpired) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f3ed] p-5 text-center">
        <h1 className="text-3xl font-bold text-[#241f1a]">Undangan Berakhir</h1>
        <p className="mt-4 text-lg text-[#6b6056]">Maaf, acara untuk undangan ini sudah berakhir.</p>
      </div>
    );
  }

  return (
    <div className="invitation">
      {preview ? <div role="status" className="sticky top-0 z-[60] bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-amber-950">Pratinjau — undangan ini belum dipublikasikan dan hanya terlihat oleh owner dan klien.</div> : null}
      {inviteInvalid ? <div role="status" className="bg-rose-50 px-4 py-2 text-center text-sm font-medium text-rose-800">Link pribadi Anda tidak dikenali, jadi RSVP belum bisa dikirim. Minta link terbaru kepada mempelai.</div> : null}
      <ThemeComponent {...data} guestName={guestName} guestToken={guestToken} />
    </div>
  );
}
