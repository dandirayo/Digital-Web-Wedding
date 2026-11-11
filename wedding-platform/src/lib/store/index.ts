import type { Template, Package, WeddingEvent, EventContent, Guest, Wish, EventMedia, LiveGalleryPhoto, DemoSession, EventStatus, UserProfile } from "../types";
import { api } from "../api";
import { getAuthenticatedUser, signInWithPassword, signOut } from "../auth";
export const initStore = () => api<void>("init");
export const getTemplates = () => api<Template[]>("templates");
export const getTemplateById = async (id: string) => (await getTemplates()).find(t => t.id === id) || null;
export const getTemplateBySlug = async (slug: string) => (await getTemplates()).find(t => t.slug === slug) || null;
export const getPackages = () => api<Package[]>("packages");
export const getPackageById = async (id: string) => (await getPackages()).find(p => p.id === id) || null;
export const getEvents = (filter?: {
    ownerId?: string;
    clientId?: string;
    status?: EventStatus;
}) => api<WeddingEvent[]>("events", [filter]);
export const getEventBySlug = (slug: string) => api<WeddingEvent | null>("event", [slug]);
export const getEventById = (id: string) => api<WeddingEvent | null>("event", [id]);
export const createEvent = (data: Omit<WeddingEvent, "id" | "createdAt" | "guestCount" | "rsvpYes" | "rsvpNo" | "wishCount" | "checkInCount" | "lastActivity">) => api<WeddingEvent>("createEvent", [data]);
export const updateEvent = (id: string, data: Partial<WeddingEvent>) => api<WeddingEvent>("updateEvent", [id, data]);
export const deleteEvent = (id: string) => api<void>("deleteEvent", [id]);
export const getEventContent = (id: string) => api<EventContent | null>("content", [id]);
export const updateEventContent = (id: string, data: Partial<EventContent>) => api<EventContent>("updateContent", [id, data]);
export const getGuests = (id: string) => api<Guest[]>("guests", [id]);
export async function addGuest(id: string, data: Omit<Guest, "id" | "createdAt" | "qrCode" | "checkedInAt" | "eventId">) {
    const guest = await api<Guest>("addGuest", [id, data]);
    try {
    }
    catch { /* RSVP tetap tersimpan di server. */ }
    return guest;
}
export const importGuests = (id: string, data: Array<{
    name: string;
    phone?: string;
    paxLimit?: number;
}>) => api<Guest[]>("importGuests", [id, data]);
export const updateGuest = (id: string, data: Partial<Guest>) => api<Guest>("updateGuest", [id, data,]);
export type GuestInvite = Pick<Guest, "id" | "eventId" | "name" | "paxLimit" | "rsvpStatus" | "paxConfirmed">;
export const getGuestByToken = (eventId: string, token: string) => api<GuestInvite>("guestByToken", [eventId, token]);
export const submitRsvp = (eventId: string, token: string, data: { rsvpStatus: "attending" | "declined"; paxConfirmed?: number }) => api<GuestInvite>("rsvp", [eventId, token, data]);
export const exportGuestsCsv = (eventId: string) => api<string>("exportGuests", [eventId, typeof window !== "undefined" ? window.location.origin : ""]);
export const deleteGuest = (id: string) => api<void>("deleteGuest", [id]);
export const getWishes = (id: string) => api<Wish[]>("wishes", [id]);
export const addWish = (id: string, data: {
    guestName: string;
    message: string;
}) => api<Wish>("addWish", [id, data]);
export const updateWish = (id: string, data: Partial<Wish>) => api<Wish>("updateWish", [id, data]);
export const getMedia = (id: string) => api<EventMedia[]>("media", [id]);
export const addMedia = (id: string, data: Omit<EventMedia, "id" | "createdAt" | "eventId">) => api<EventMedia>("addMedia", [id, data]);
export const deleteMedia = (id: string) => api<void>("deleteMedia", [id]);
export const getLiveGallery = (id: string) => api<LiveGalleryPhoto[]>("gallery", [id]);
export const addLiveGalleryPhoto = (id: string, data: Omit<LiveGalleryPhoto, "id" | "createdAt" | "eventId">) => api<LiveGalleryPhoto>("addGallery", [id, data]);
export const getProfiles = () => api<UserProfile[]>("profiles");
export const createClient = (data: {
    fullName: string;
    email: string;
    password: string;
}) => api<UserProfile>("createClient", [data]);
export async function getCurrentSession(): Promise<DemoSession | null> {
    const u = await getAuthenticatedUser();
    return u ? { userId: u.id, email: u.email, fullName: u.fullName, role: u.role, loggedInAt: new Date().toISOString(), source: "local" } : null;
}
export async function login(email: string, password: string): Promise<DemoSession> { await signInWithPassword(email, password); return (await getCurrentSession())!; }
export const logout = signOut;
export const updatePackage = (id: string, data: Partial<Package>) => api<Package>("updatePackage", [id, data]);
export const updateTemplate = (id: string, data: Partial<Template>) => api<Template>("updateTemplate", [id, data]);
export const updateProfile = (id: string, data: { fullName?: string; email?: string }) => api<UserProfile>("updateProfile", [id, data]);
export const resetClientPassword = (id: string) => api<{ temporaryPassword: string }>("resetPassword", [id]);
export const changeOwnPassword = (current: string, next: string) => api<void>("changePassword", [current, next]);
export const deleteWish = (id: string) => api<void>("deleteWish", [id]);
export type SiteSettings = {
    whatsappNumber: string;
    contactLabel: string;
    showPublicPrices: boolean;
    priceDisclaimer: string;
    paymentInstructions: string;
    faqs: Array<{ question: string; answer: string }>;
    testimonials: Array<{ name: string; quote: string; status: string }>;
};
export const getSiteSettings = () => api<SiteSettings>("siteSettings");
export const updateSiteSettings = (data: Partial<SiteSettings>) => api<SiteSettings>("updateSiteSettings", [data]);
export const updateMedia = (id: string, data: Partial<Pick<EventMedia, "sortOrder" | "altText" | "category">>) => api<EventMedia>("updateMedia", [id, data]);
export async function uploadMedia(eventId: string, file: File, expect?: "photo" | "audio"): Promise<{ url: string; type: EventMedia["type"]; size: number }> {
    const form = new FormData();
    form.append("eventId", eventId);
    if (expect)
        form.append("expect", expect);
    form.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", credentials: "same-origin", body: form });
    const result = await response.json().catch(() => ({}));
    if (!response.ok)
        throw new Error(result.error || "Unggahan gagal.");
    return result.data;
}
