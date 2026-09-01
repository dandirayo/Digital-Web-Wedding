import {
  Template,
  Package,
  WeddingEvent,
  EventContent,
  Guest,
  Wish,
  EventMedia,
  LiveGalleryPhoto,
  DemoSession,
  EventStatus,
  UserProfile
} from '../types';
import { seedData } from './seed';

// Utility for generating unique IDs
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Helper for simulating async operations
const delay = (ms = 50) => new Promise(resolve => setTimeout(resolve, ms));

export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

export const setStorageItem = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
};

// Initialize seed data if needed
export const initStore = async () => {
  if (typeof window === 'undefined') return;
  const isSeeded = getStorageItem('occasio_seeded', false);
  if (!isSeeded) {
    setStorageItem('occasio_templates', seedData.templates);
    setStorageItem('occasio_packages', seedData.packages);
    setStorageItem('occasio_events', seedData.events);
    setStorageItem('occasio_event_contents', seedData.eventContents);
    setStorageItem('occasio_guests', seedData.guests);
    setStorageItem('occasio_wishes', seedData.wishes);
    setStorageItem('occasio_media', seedData.media);
    setStorageItem('occasio_profiles', seedData.profiles);
    setStorageItem('occasio_seeded', true);
  }
};

// API implementation

// Templates
export const getTemplates = async (): Promise<Template[]> => {
  await delay();
  return getStorageItem<Template[]>('occasio_templates', []);
};

export const getTemplateById = async (id: string): Promise<Template | null> => {
  const templates = await getTemplates();
  return templates.find(t => t.id === id) || null;
};

export const getTemplateBySlug = async (slug: string): Promise<Template | null> => {
  const templates = await getTemplates();
  return templates.find(t => t.slug === slug) || null;
};

// Packages
export const getPackages = async (): Promise<Package[]> => {
  await delay();
  return getStorageItem<Package[]>('occasio_packages', []);
};

export const getPackageById = async (id: string): Promise<Package | null> => {
  const pkgs = await getPackages();
  return pkgs.find(p => p.id === id) || null;
};

// Events
export const getEvents = async (filter?: { ownerId?: string; clientId?: string; status?: EventStatus }): Promise<WeddingEvent[]> => {
  await delay();
  let events = getStorageItem<WeddingEvent[]>('occasio_events', []);
  
  if (filter) {
    if (filter.ownerId) events = events.filter(e => e.ownerId === filter.ownerId);
    if (filter.clientId) events = events.filter(e => e.clientId === filter.clientId);
    if (filter.status) events = events.filter(e => e.status === filter.status);
  }
  
  return events;
};

export const getEventBySlug = async (slug: string): Promise<WeddingEvent | null> => {
  const events = await getEvents();
  return events.find(e => e.slug === slug) || null;
};

export const getEventById = async (id: string): Promise<WeddingEvent | null> => {
  const events = await getEvents();
  return events.find(e => e.id === id) || null;
};

export const createEvent = async (data: Omit<WeddingEvent, 'id' | 'createdAt' | 'guestCount' | 'rsvpYes' | 'rsvpNo' | 'wishCount' | 'checkInCount' | 'lastActivity'>): Promise<WeddingEvent> => {
  await delay();
  const events = getStorageItem<WeddingEvent[]>('occasio_events', []);
  const now = new Date().toISOString();
  const newEvent: WeddingEvent = {
    ...data,
    id: generateId(),
    createdAt: now,
    lastActivity: now,
    guestCount: 0,
    rsvpYes: 0,
    rsvpNo: 0,
    wishCount: 0,
    checkInCount: 0
  };
  events.push(newEvent);
  setStorageItem('occasio_events', events);
  return newEvent;
};

export const updateEvent = async (id: string, data: Partial<WeddingEvent>): Promise<WeddingEvent> => {
  await delay();
  const events = getStorageItem<WeddingEvent[]>('occasio_events', []);
  const index = events.findIndex(e => e.id === id);
  if (index === -1) throw new Error('Event not found');
  
  const updatedEvent = { ...events[index], ...data, lastActivity: new Date().toISOString() };
  events[index] = updatedEvent;
  setStorageItem('occasio_events', events);
  return updatedEvent;
};

export const deleteEvent = async (id: string): Promise<void> => {
  await delay();
  const events = getStorageItem<WeddingEvent[]>('occasio_events', []);
  setStorageItem('occasio_events', events.filter(e => e.id !== id));
  
  // Clean up relations
  const contents = getStorageItem<EventContent[]>('occasio_event_contents', []);
  setStorageItem('occasio_event_contents', contents.filter(c => c.eventId !== id));
  
  const guests = getStorageItem<Guest[]>('occasio_guests', []);
  setStorageItem('occasio_guests', guests.filter(g => g.eventId !== id));
  
  const wishes = getStorageItem<Wish[]>('occasio_wishes', []);
  setStorageItem('occasio_wishes', wishes.filter(w => w.eventId !== id));
};

// Event Content
export const getEventContent = async (eventId: string): Promise<EventContent | null> => {
  await delay();
  const contents = getStorageItem<EventContent[]>('occasio_event_contents', []);
  return contents.find(c => c.eventId === eventId) || null;
};

export const updateEventContent = async (eventId: string, data: Partial<EventContent>): Promise<EventContent> => {
  await delay();
  const contents = getStorageItem<EventContent[]>('occasio_event_contents', []);
  const index = contents.findIndex(c => c.eventId === eventId);
  
  if (index === -1) {
    // Create new if doesn't exist
    const newContent = {
      eventId,
      greeting: data.greeting || '',
      brideName: data.brideName || '',
      bridePhotoUrl: data.bridePhotoUrl || '',
      brideParent: data.brideParent || '',
      groomName: data.groomName || '',
      groomPhotoUrl: data.groomPhotoUrl || '',
      groomParent: data.groomParent || '',
      akadTime: data.akadTime || '',
      akadVenue: data.akadVenue || '',
      resepsiTime: data.resepsiTime || '',
      resepsiVenue: data.resepsiVenue || '',
      loveStory: data.loveStory || [],
      bankAccounts: data.bankAccounts || [],
      musicUrl: data.musicUrl || '',
      customCss: data.customCss || '',
      updatedAt: new Date().toISOString(),
      ...data
    } as EventContent;
    contents.push(newContent);
    setStorageItem('occasio_event_contents', contents);
    return newContent;
  }
  
  const updatedContent = { ...contents[index], ...data, updatedAt: new Date().toISOString() };
  contents[index] = updatedContent;
  setStorageItem('occasio_event_contents', contents);
  return updatedContent;
};

// Guests
export const getGuests = async (eventId: string): Promise<Guest[]> => {
  await delay();
  const guests = getStorageItem<Guest[]>('occasio_guests', []);
  return guests.filter(g => g.eventId === eventId);
};

export const addGuest = async (eventId: string, data: Omit<Guest, 'id' | 'createdAt' | 'qrCode' | 'checkedInAt' | 'eventId'>): Promise<Guest> => {
  await delay();
  const guests = getStorageItem<Guest[]>('occasio_guests', []);
  const id = generateId();
  const newGuest: Guest = {
    ...data,
    eventId,
    id,
    createdAt: new Date().toISOString(),
    qrCode: `QR-${id}`,
    checkedInAt: null
  };
  guests.push(newGuest);
  setStorageItem('occasio_guests', guests);
  
  // Update event counts
  const event = await getEventById(eventId);
  if (event) {
    await updateEvent(eventId, { guestCount: event.guestCount + 1 });
  }
  
  return newGuest;
};

export const importGuests = async (eventId: string, guestData: Array<{ name: string; phone?: string; paxLimit?: number }>): Promise<Guest[]> => {
  await delay(300);
  const guests = getStorageItem<Guest[]>('occasio_guests', []);
  const newGuests: Guest[] = guestData.map(data => {
    const id = generateId();
    return {
      id,
      eventId,
      name: data.name,
      phone: data.phone || '',
      paxLimit: data.paxLimit || 1,
      rsvpStatus: 'pending',
      paxConfirmed: 0,
      qrCode: `QR-${id}`,
      checkedInAt: null,
      createdAt: new Date().toISOString()
    };
  });
  
  const updatedGuests = [...guests, ...newGuests];
  setStorageItem('occasio_guests', updatedGuests);
  
  const event = await getEventById(eventId);
  if (event) {
    await updateEvent(eventId, { guestCount: event.guestCount + newGuests.length });
  }
  
  return newGuests;
};

export const updateGuest = async (id: string, data: Partial<Guest>): Promise<Guest> => {
  await delay();
  const guests = getStorageItem<Guest[]>('occasio_guests', []);
  const index = guests.findIndex(g => g.id === id);
  if (index === -1) throw new Error('Guest not found');
  
  const oldStatus = guests[index].rsvpStatus;
  const updatedGuest = { ...guests[index], ...data };
  guests[index] = updatedGuest;
  setStorageItem('occasio_guests', guests);
  
  // Update event counts if RSVP changed
  if (data.rsvpStatus && data.rsvpStatus !== oldStatus) {
    const eventId = updatedGuest.eventId;
    const eventGuests = guests.filter(g => g.eventId === eventId);
    const rsvpYes = eventGuests.filter(g => g.rsvpStatus === 'attending').length;
    const rsvpNo = eventGuests.filter(g => g.rsvpStatus === 'declined').length;
    await updateEvent(eventId, { rsvpYes, rsvpNo });
  }
  
  return updatedGuest;
};

export const deleteGuest = async (id: string): Promise<void> => {
  await delay();
  const guests = getStorageItem<Guest[]>('occasio_guests', []);
  const guestToDelete = guests.find(g => g.id === id);
  if (!guestToDelete) return;
  
  setStorageItem('occasio_guests', guests.filter(g => g.id !== id));
  
  // Update event counts
  const eventId = guestToDelete.eventId;
  const eventGuests = guests.filter(g => g.eventId === eventId && g.id !== id);
  const guestCount = eventGuests.length;
  const rsvpYes = eventGuests.filter(g => g.rsvpStatus === 'attending').length;
  const rsvpNo = eventGuests.filter(g => g.rsvpStatus === 'declined').length;
  await updateEvent(eventId, { guestCount, rsvpYes, rsvpNo });
};

// Wishes
export const getWishes = async (eventId: string): Promise<Wish[]> => {
  await delay();
  const wishes = getStorageItem<Wish[]>('occasio_wishes', []);
  return wishes.filter(w => w.eventId === eventId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const addWish = async (eventId: string, data: { guestName: string; message: string }): Promise<Wish> => {
  await delay();
  const wishes = getStorageItem<Wish[]>('occasio_wishes', []);
  const newWish: Wish = {
    id: generateId(),
    eventId,
    guestName: data.guestName,
    message: data.message,
    isVisible: true,
    createdAt: new Date().toISOString()
  };
  wishes.push(newWish);
  setStorageItem('occasio_wishes', wishes);
  
  const event = await getEventById(eventId);
  if (event) {
    await updateEvent(eventId, { wishCount: event.wishCount + 1 });
  }
  
  return newWish;
};

export const updateWish = async (id: string, data: Partial<Wish>): Promise<Wish> => {
  await delay();
  const wishes = getStorageItem<Wish[]>('occasio_wishes', []);
  const index = wishes.findIndex(w => w.id === id);
  if (index === -1) throw new Error('Wish not found');
  
  const updatedWish = { ...wishes[index], ...data };
  wishes[index] = updatedWish;
  setStorageItem('occasio_wishes', wishes);
  return updatedWish;
};

// Media
export const getMedia = async (eventId: string): Promise<EventMedia[]> => {
  await delay();
  const media = getStorageItem<EventMedia[]>('occasio_media', []);
  return media.filter(m => m.eventId === eventId).sort((a, b) => a.sortOrder - b.sortOrder);
};

export const addMedia = async (eventId: string, data: Omit<EventMedia, 'id' | 'createdAt' | 'eventId'>): Promise<EventMedia> => {
  await delay();
  const media = getStorageItem<EventMedia[]>('occasio_media', []);
  const newMedia: EventMedia = {
    ...data,
    id: generateId(),
    eventId,
    createdAt: new Date().toISOString()
  };
  media.push(newMedia);
  setStorageItem('occasio_media', media);
  return newMedia;
};

export const deleteMedia = async (id: string): Promise<void> => {
  await delay();
  const media = getStorageItem<EventMedia[]>('occasio_media', []);
  setStorageItem('occasio_media', media.filter(m => m.id !== id));
};

// Live Gallery
export const getLiveGallery = async (eventId: string): Promise<LiveGalleryPhoto[]> => {
  await delay();
  const gallery = getStorageItem<LiveGalleryPhoto[]>('occasio_live_gallery', []);
  return gallery.filter(g => g.eventId === eventId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const addLiveGalleryPhoto = async (eventId: string, data: Omit<LiveGalleryPhoto, 'id' | 'createdAt' | 'eventId'>): Promise<LiveGalleryPhoto> => {
  await delay();
  const gallery = getStorageItem<LiveGalleryPhoto[]>('occasio_live_gallery', []);
  const newPhoto: LiveGalleryPhoto = {
    ...data,
    id: generateId(),
    eventId,
    createdAt: new Date().toISOString()
  };
  gallery.push(newPhoto);
  setStorageItem('occasio_live_gallery', gallery);
  return newPhoto;
};

// Auth/Session
export const getCurrentSession = async (): Promise<DemoSession | null> => {
  await delay();
  return getStorageItem<DemoSession | null>('occasio_session', null);
};

export const login = async (email: string, _password: string): Promise<DemoSession> => {
  await delay(500); // Simulate network
  
  // Simple mock login
  const users = getStorageItem<UserProfile[]>('occasio_profiles', []);
  const user = users.find(u => u.email === email);
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  const session: DemoSession = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    loggedInAt: new Date().toISOString(),
    source: 'demo'
  };
  
  setStorageItem('occasio_session', session);
  return session;
};

export const logout = async (): Promise<void> => {
  await delay();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('occasio_session');
  }
};
