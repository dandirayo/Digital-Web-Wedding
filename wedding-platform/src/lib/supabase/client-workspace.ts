import type { EventContent, Guest, WeddingEvent, Wish } from "@/lib/types";
import { createSupabaseBrowserClient } from "./browser";
import {
  initStore,
  getEvents,
  getGuests,
  getWishes,
  getEventContent,
  updateEventContent,
  addGuest,
  importGuests,
} from "@/lib/store";

type EventRow = {
  id: string;
  owner_id: string;
  client_id: string | null;
  slug: string;
  couple_name: string;
  template_id: string;
  package_id: string;
  package_tier: WeddingEvent["packageTier"];
  event_date: string;
  venue: string;
  status: WeddingEvent["status"];
  is_published: boolean;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

const toEvent = (row: EventRow, guestCount: number, rsvpYes: number, rsvpNo: number, wishCount: number): WeddingEvent => ({
  id: row.id,
  ownerId: row.owner_id,
  clientId: row.client_id,
  slug: row.slug,
  coupleName: row.couple_name,
  templateId: row.template_id,
  packageId: row.package_id,
  packageTier: row.package_tier,
  eventDate: row.event_date,
  venue: row.venue,
  status: row.status,
  isPublished: row.is_published,
  publishedAt: row.published_at,
  expiresAt: row.expires_at,
  createdAt: row.created_at,
  guestCount,
  rsvpYes,
  rsvpNo,
  wishCount,
  checkInCount: 0,
  lastActivity: row.updated_at,
});

export async function getClientWorkspace(): Promise<{
  event: WeddingEvent | null;
  guests: Guest[];
  wishes: Wish[];
  content: EventContent | null;
}> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (!userError && userData?.user) {
      const { data: rows, error: eventError } = await supabase
        .from("events")
        .select("id,owner_id,client_id,slug,couple_name,template_id,package_id,package_tier,event_date,venue,status,is_published,published_at,expires_at,created_at,updated_at")
        .eq("client_id", userData.user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!eventError && rows && rows.length > 0) {
        const row = rows[0] as EventRow;
        const [guestResult, wishResult, contentResult] = await Promise.all([
          supabase.from("guests").select("id,event_id,name,phone,pax_limit,rsvp_status,pax_confirmed,qr_code,checked_in_at,created_at").eq("event_id", row.id).order("created_at", { ascending: false }),
          supabase.from("wishes").select("id,event_id,guest_name,message,is_visible,created_at").eq("event_id", row.id).order("created_at", { ascending: false }),
          supabase.from("event_content").select("event_id,greeting,bride_name,bride_photo_url,bride_parent,groom_name,groom_photo_url,groom_parent,akad_time,akad_venue,resepsi_time,resepsi_venue,love_story,bank_accounts,music_url,custom_css,updated_at").eq("event_id", row.id).maybeSingle(),
        ]);

        const guests = (guestResult.data ?? []).map((g) => ({ id: g.id, eventId: g.event_id, name: g.name, phone: g.phone, paxLimit: g.pax_limit, rsvpStatus: g.rsvp_status, paxConfirmed: g.pax_confirmed, qrCode: g.qr_code, checkedInAt: g.checked_in_at, createdAt: g.created_at } as Guest));
        const wishes = (wishResult.data ?? []).map((w) => ({ id: w.id, eventId: w.event_id, guestName: w.guest_name, message: w.message, isVisible: w.is_visible, createdAt: w.created_at } as Wish));
        return { event: toEvent(row, guests.length, guests.filter((g) => g.rsvpStatus === "attending").length, guests.filter((g) => g.rsvpStatus === "declined").length, wishes.length), guests, wishes, content: contentResult.data as EventContent | null };
      }
    }
  } catch (error) {
    console.warn("Supabase tidak dapat dijangkau, fallback ke demo store:", error);
  }

  // Fallback ke local store untuk live demo preview
  await initStore();
  const events = await getEvents();
  const event = events.find((e) => e.slug === "sheila-yoga") || events[0] || null;
  if (!event) return { event: null, guests: [], wishes: [], content: null };

  const [guests, wishes, content] = await Promise.all([
    getGuests(event.id),
    getWishes(event.id),
    getEventContent(event.id),
  ]);

  return { event, guests, wishes, content };
}

export async function updateClientContent(eventId: string, greeting: string): Promise<void> {
  try {
    const supabase = createSupabaseBrowserClient();
    await supabase.from("event_content").upsert({ event_id: eventId, greeting }, { onConflict: "event_id" });
  } catch {
    // Ignore in demo mode
  }
  await updateEventContent(eventId, { greeting });
}

export async function addClientGuest(eventId: string, guest: Omit<Guest, "id" | "createdAt" | "qrCode" | "checkedInAt" | "eventId">): Promise<Guest> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.from("guests").insert({ event_id: eventId, name: guest.name, phone: guest.phone, pax_limit: guest.paxLimit, rsvp_status: guest.rsvpStatus, pax_confirmed: guest.paxConfirmed, qr_code: `QR-${crypto.randomUUID()}` }).select("id,event_id,name,phone,pax_limit,rsvp_status,pax_confirmed,qr_code,checked_in_at,created_at").single();
    if (!error && data) {
      return { id: data.id, eventId: data.event_id, name: data.name, phone: data.phone, paxLimit: data.pax_limit, rsvpStatus: data.rsvp_status, paxConfirmed: data.pax_confirmed, qrCode: data.qr_code, checkedInAt: data.checked_in_at, createdAt: data.created_at };
    }
  } catch {
    // Ignore in demo mode
  }
  return await addGuest(eventId, guest);
}

export async function importClientGuests(eventId: string, guests: Array<{ name: string; phone?: string; paxLimit?: number }>): Promise<Guest[]> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.from("guests").insert(guests.map((guest) => ({ event_id: eventId, name: guest.name, phone: guest.phone ?? "", pax_limit: guest.paxLimit ?? 1, rsvp_status: "pending", pax_confirmed: 0, qr_code: `QR-${crypto.randomUUID()}` }))).select("id,event_id,name,phone,pax_limit,rsvp_status,pax_confirmed,qr_code,checked_in_at,created_at");
    if (!error && data) {
      return (data ?? []).map((g) => ({ id: g.id, eventId: g.event_id, name: g.name, phone: g.phone, paxLimit: g.pax_limit, rsvpStatus: g.rsvp_status, paxConfirmed: g.pax_confirmed, qrCode: g.qr_code, checkedInAt: g.checked_in_at, createdAt: g.created_at }));
    }
  } catch {
    // Ignore in demo mode
  }
  return await importGuests(eventId, guests);
}
