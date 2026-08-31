import dynamic from 'next/dynamic';
import type { ThemeComponent } from './types';

const themeRegistry: Record<string, React.ComponentType<any>> = {
  'classic-elegant': dynamic(() => import('./classic-elegant/theme')),
};

const fallbackTheme = 'classic-elegant';

export function getThemeComponent(slug: string): React.ComponentType<any> {
  return themeRegistry[slug] || themeRegistry[fallbackTheme];
}

export function getAvailableThemes(): string[] {
  return Object.keys(themeRegistry);
}
