import { WeddingEvent, EventContent, Guest, Wish, EventMedia } from '@/lib/types';

export type ThemeProps = {
  event: WeddingEvent;
  content: EventContent;
  guests: Guest[];
  wishes: Wish[];
  media: EventMedia[];
  guestName?: string; // from URL ?to=NamaTamu
  guestData?: Guest | null;  // Full guest record if found by name
  isExpired?: boolean;        // True if event has passed expiresAt
};

export type ThemeComponent = React.ComponentType<ThemeProps>;
