// Enums
export type AppRole = 'owner' | 'client';
export type EventStatus = 'draft' | 'active' | 'completed' | 'archived';
export type RsvpStatus = 'pending' | 'attending' | 'declined';
export type PackageTier = 'silver' | 'gold' | 'platinum';
export type TemplateCategory = 'standard' | 'unique' | 'custom';
export type MediaType = 'photo' | 'video' | 'audio';
export type MediaCategory = 'cover' | 'bride' | 'groom' | 'prewedding' | 'gallery' | 'map';

// Template
export type Template = {
  id: string;
  name: string;
  slug: string;
  category: TemplateCategory;
  description: string;
  thumbnailUrl: string;
  previewUrl: string;
  minPackage: PackageTier;
  isActive: boolean;
  configJson: TemplateConfig;
  createdAt: string;
};

export type TemplateConfig = {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  darkMode: boolean;
  sections: string[]; // which sections to show
};

// Package
export type Package = {
  id: string;
  name: string;
  slug: PackageTier;
  price: string;
  priceNumeric: number;
  description: string;
  features: string[];
  maxGuests: number;
  maxRevisions: number;
  durationMonths: number;
  includesTablet: boolean;
  includesCrew: number;
  includesLiveGallery: boolean;
  includesPhotoBooth: boolean;
  includesQrCheckin: boolean;
  sortOrder: number;
  isActive: boolean;
};

// Event (expanded from existing WeddingEvent)
export type WeddingEvent = {
  id: string;
  ownerId: string;
  clientId: string | null;
  slug: string;
  coupleName: string;
  templateId: string;
  packageId: string;
  packageTier: PackageTier;
  eventDate: string;
  venue: string;
  status: EventStatus;
  isPublished: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  // Computed/joined fields
  guestCount: number;
  rsvpYes: number;
  rsvpNo: number;
  wishCount: number;
  checkInCount: number;
  lastActivity: string;
};

// Event Content (1:1 with event)
export type EventContent = {
  eventId: string;
  greeting: string;
  brideName: string;
  bridePhotoUrl: string;
  brideParent: string;
  groomName: string;
  groomPhotoUrl: string;
  groomParent: string;
  akadTime: string;
  akadVenue: string;
  resepsiTime: string;
  resepsiVenue: string;
  loveStory: LoveStoryItem[];
  bankAccounts: BankAccount[];
  musicUrl: string;
  customCss: string;
  updatedAt: string;
};

export type LoveStoryItem = {
  title: string;
  description: string;
};

export type BankAccount = {
  bank: string;
  accountNumber: string;
  accountName: string;
};

// Guest
export type Guest = {
  id: string;
  eventId: string;
  name: string;
  phone: string;
  paxLimit: number;
  rsvpStatus: RsvpStatus;
  paxConfirmed: number;
  qrCode: string;
  checkedInAt: string | null;
  createdAt: string;
};

// Wish
export type Wish = {
  id: string;
  eventId: string;
  guestName: string;
  message: string;
  isVisible: boolean;
  createdAt: string;
};

// Media
export type EventMedia = {
  id: string;
  eventId: string;
  type: MediaType;
  url: string;
  altText: string;
  category: MediaCategory;
  sortOrder: number;
  createdAt: string;
};

// Live Gallery photo
export type LiveGalleryPhoto = {
  id: string;
  eventId: string;
  photoUrl: string;
  caption: string;
  uploadedBy: string;
  createdAt: string;
};

// User/Profile
export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  role: AppRole;
  createdAt: string;
};

// Session
export type DemoSession = {
  userId: string;
  email: string;
  fullName: string;
  role: AppRole;
  loggedInAt: string;
  source: 'demo' | 'supabase';
};
