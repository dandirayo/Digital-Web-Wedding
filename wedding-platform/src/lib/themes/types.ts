import { WeddingEvent, EventContent, Guest, Wish, EventMedia } from '@/lib/types';

export type ThemeProps = {
  event: WeddingEvent;
  content: EventContent;
  guests: Guest[];
  wishes: Wish[];
  media: EventMedia[];
  guestName?: string; // nama tamu dari link pribadi, atau ?to=Nama untuk sapaan saja
  guestData?: Guest | null;  // Data tamu dari link pribadi (?g=token)
  guestToken?: string;       // Token link pribadi; wajib untuk RSVP
  isExpired?: boolean;        // True if event has passed expiresAt
};

export type ThemeComponent = React.ComponentType<ThemeProps>;
