import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { dark, light, Palette, radius, space, type } from '@cards/tokens';

type Scheme = 'light' | 'dark';
type Mode = Scheme | 'system';

type Theme = {
  scheme: Scheme;
  colors: Palette;
  space: typeof space;
  radius: typeof radius;
  type: typeof type;
  mode: Mode;
  setMode: (mode: Mode) => void;
};

const ThemeContext = createContext<Theme | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const system = useColorScheme();
  const [mode, setMode] = useState<Mode>('system');
  const scheme: Scheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo<Theme>(
    () => ({
      scheme,
      colors: scheme === 'dark' ? dark : light,
      space,
      radius,
      type,
      mode,
      setMode,
    }),
    [scheme, mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside <ThemeProvider>');
  return theme;
}
