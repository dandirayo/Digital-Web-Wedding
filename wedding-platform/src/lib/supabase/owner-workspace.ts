import type { WeddingEvent } from "@/lib/types";
import { createSupabaseBrowserClient } from "./browser";

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

type GuestSummary = { event_id: string; rsvp_status: "pending" | "attending" | "declined" };
type EventReference = { event_id: string };

function assertOk(error: { message: string } | null, fallback: string): void {
  if (error) throw new Error(error.message || fallback);
}

function countByEvent(rows: EventReference[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.event_id, (counts.get(row.event_id) ?? 0) + 1);
  return counts;
}

export async function getOwnerEvents(): Promise<WeddingEvent[]> {
  const supabase = createSupabaseBrowserClient();
  const eventResult = await supabase
    .from("events")
    .select("id,owner_id,client_id,slug,couple_name,template_id,package_id,package_tier,event_date,venue,status,is_published,published_at,expires_at,created_at,updated_at")
    .order("created_at", { ascending: false });
  assertOk(eventResult.error, "Daftar event gagal dimuat.");

  const rows = (eventResult.data ?? []) as EventRow[];
  if (!rows.length) return [];
  const eventIds = rows.map((event) => event.id);
  const [guestResult, wishResult, checkinResult] = await Promise.all([
    supabase.from("guests").select("event_id,rsvp_status").in("event_id", eventIds),
    supabase.from("wishes").select("event_id").in("event_id", eventIds),
    supabase.from("checkin_logs").select("event_id").in("event_id", eventIds),
  ]);
  assertOk(guestResult.error, "Ringkasan tamu gagal dimuat.");
  assertOk(wishResult.error, "Ringkasan ucapan gagal dimuat.");
  assertOk(checkinResult.error, "Ringkasan check-in gagal dimuat.");

  const guests = (guestResult.data ?? []) as GuestSummary[];
  const guestCounts = countByEvent(guests);
  const wishCounts = countByEvent((wishResult.data ?? []) as EventReference[]);
  const checkinCounts = countByEvent((checkinResult.data ?? []) as EventReference[]);

  return rows.map((row) => ({
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
    guestCount: guestCounts.get(row.id) ?? 0,
    rsvpYes: guests.filter((guest) => guest.event_id === row.id && guest.rsvp_status === "attending").length,
    rsvpNo: guests.filter((guest) => guest.event_id === row.id && guest.rsvp_status === "declined").length,
    wishCount: wishCounts.get(row.id) ?? 0,
    checkInCount: checkinCounts.get(row.id) ?? 0,
    lastActivity: row.updated_at,
  }));
}

export async function updateOwnerEventStatus(id: string, status: WeddingEvent["status"]): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("events").update({ status }).eq("id", id);
  assertOk(error, "Status event gagal disimpan.");
}

export async function publishOwnerEvent(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("events")
    .update({ status: "active", is_published: true, published_at: new Date().toISOString() })
    .eq("id", id);
  assertOk(error, "Event gagal dipublikasikan.");
}
