import { createContext } from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

export const THEME_STORAGE_KEY = 'blog_theme_v2';

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
