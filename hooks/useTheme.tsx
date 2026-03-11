import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type BrandTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: BrandTheme;
  toggleTheme: () => void;
  setTheme: (theme: BrandTheme) => void;
}

const STORAGE_KEY = 'brand_mosaic_theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getPreferredTheme = (): BrandTheme => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<BrandTheme>(() => getPreferredTheme());

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setThemeState((current) => (current === 'light' ? 'dark' : 'light')),
      setTheme: setThemeState,
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return context;
};
