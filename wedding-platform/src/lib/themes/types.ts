import { WeddingEvent, EventContent, Guest, Wish, EventMedia } from '@/lib/types';

export type ThemeProps = {
  event: WeddingEvent;
  content: EventContent;
  guests: Guest[];
  wishes: Wish[];
  media: EventMedia[];
  guestName?: string; // from URL ?to=NamaTamu
};

export type ThemeComponent = React.ComponentType<ThemeProps>;
