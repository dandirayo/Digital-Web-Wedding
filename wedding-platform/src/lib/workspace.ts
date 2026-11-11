import { publishEvent } from "./business";
import { getEvents, getGuests, getWishes, getEventContent, updateEventContent, addGuest, importGuests, updateEvent } from "./store";
export const getOwnerEvents = getEvents;
export async function updateOwnerEventStatus(id: string, status: Parameters<typeof updateEvent>[1]["status"]) { await updateEvent(id, { status }); }
export async function publishOwnerEvent(id: string, overrideReason?: string) { await publishEvent(id, overrideReason); }
export async function getClientWorkspace() {
    const event = (await getEvents())[0] || null;
    if (!event)
        return { event: null, guests: [], wishes: [], content: null };
    const [guests, wishes, content] = await Promise.all([getGuests(event.id), getWishes(event.id), getEventContent(event.id)]);
    return { event, guests, wishes, content };
}
export async function updateClientContent(id: string, greeting: string) { await updateEventContent(id, { greeting }); }
export const addClientGuest = addGuest;
export const importClientGuests = importGuests;
