import dynamic from 'next/dynamic';
import type { ThemeComponent } from './types';

const themeRegistry: Record<string, ThemeComponent> = {
  'classic-elegant': dynamic(() => import('./classic-elegant/theme')),
  'netflix': dynamic(() => import('./netflix/theme')),
  'spotify': dynamic(() => import('./spotify/theme')),
  'boarding-pass': dynamic(() => import('./boarding-pass/theme')),
};

const fallbackTheme = 'classic-elegant';

export function getThemeComponent(slug: string): ThemeComponent {
  return themeRegistry[slug] || themeRegistry[fallbackTheme];
}

export function getAvailableThemes(): string[] {
  return Object.keys(themeRegistry);
}
