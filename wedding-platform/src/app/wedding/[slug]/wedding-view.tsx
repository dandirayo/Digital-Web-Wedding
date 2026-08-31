"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  initStore,
  getEventBySlug,
  getEventContent,
  getGuests,
  getWishes,
  getMedia,
  getTemplateById,
} from "@/lib/store";
import { getThemeComponent } from "@/lib/themes/registry";
import type { ThemeProps } from "@/lib/themes/types";

export function WeddingView({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const guestName = searchParams.get("to") || undefined;
  
  const [data, setData] = useState<Omit<ThemeProps, "guestName"> | null>(null);
  const [loading, setLoading] = useState(true);
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

        const [content, guests, wishes, media, template] = await Promise.all([
          getEventContent(event.id),
          getGuests(event.id),
          getWishes(event.id),
          getMedia(event.id),
          getTemplateById(event.templateId),
        ]);

        if (!content || !template) {
          setError("Incomplete event data");
          setLoading(false);
          return;
        }

        setData({
          event,
          content,
          guests,
          wishes,
          media,
        });
        
        setThemeComponent(() => getThemeComponent(template.slug));
        
      } catch (err) {
        setError("Error loading event");
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [slug]);

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

  return <ThemeComponent {...data} guestName={guestName} />;
}
