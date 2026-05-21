import { useEffect, useMemo, useState } from 'react';
import { THEME_MODES, THEME_STORAGE_KEY } from '../config/theme.config';
import { ThemeContext } from '../context/ThemeContext';

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? THEME_MODES.DARK : THEME_MODES.LIGHT;

const resolveTheme = (theme, systemTheme) => (theme === THEME_MODES.SYSTEM ? systemTheme : theme);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || THEME_MODES.SYSTEM);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const resolvedTheme = useMemo(() => resolveTheme(theme, systemTheme), [systemTheme, theme]);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.classList.toggle('dark', resolvedTheme === THEME_MODES.DARK);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [resolvedTheme, theme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setSystemTheme(getSystemTheme());
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
