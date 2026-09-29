import { createContext, useContext, useState, useEffect } from 'react';
import { THEMES, getSavedThemeId, getThemeById, applyTheme } from '../lib/theme';

const ThemeContext = createContext({
  currentThemeId: 'cyberTeal',
  currentTheme: THEMES[0],
  setThemeId: () => {},
  themes: THEMES,
});

export function ThemeProvider({ children }) {
  const [currentThemeId, setCurrentThemeId] = useState(getSavedThemeId);

  useEffect(() => {
    applyTheme(currentThemeId);
  }, [currentThemeId]);

  const setThemeId = (newId) => {
    setCurrentThemeId(newId);
    applyTheme(newId);
  };

  const currentTheme = getThemeById(currentThemeId);

  return (
    <ThemeContext.Provider
      value={{
        currentThemeId,
        currentTheme,
        setThemeId,
        themes: THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
