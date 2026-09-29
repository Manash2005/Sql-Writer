/**
 * Centralized 4-Color Theme System
 * 
 * Each theme is defined by 4 major colors:
 * - c1: Primary Interactive & Accent (e.g. Teal / Turquoise)
 * - c2: Warm Secondary Accent & Highlighting (e.g. Champagne / Sand / Gold)
 * - c3: Alert, Danger & Safety Checks (e.g. Crimson / Scarlet)
 * - c4: Structural Depth, Borders & 3D Drop Shadows (e.g. Deep Maroon / Wine)
 * 
 * To change a palette, simply change these 4 variables!
 */

export const THEMES = [
  {
    id: 'cyberTeal',
    name: 'Teal & Maroon',
    subtitle: 'Primary Cyberpunk Palette',
    colors: {
      c1: '#31AAA9', // Teal / Turquoise
      c2: '#F8E0A4', // Champagne / Sand
      c3: '#A82020', // Crimson Red
      c4: '#6C1A1A', // Deep Maroon / Wine
    },
    darkBase: '#0a0607',
    darkSurface: '#120a0c',
    darkElevated: '#1c1013',
    darkOverlay: '#261519',
    textPrimary: '#FFFFFF',
    textSecondary: '#E2D9D4',
    textMuted: '#9E8C8F',
  },
  {
    id: 'nordicOcean',
    name: 'Nordic Ocean',
    subtitle: 'Arctic Sky & Midnight Navy',
    colors: {
      c1: '#38BDF8', // Electric Sky Blue
      c2: '#FDE68A', // Pale Amber Sand
      c3: '#F43F5E', // Coral Crimson
      c4: '#1E293B', // Deep Slate Navy
    },
    darkBase: '#080d14',
    darkSurface: '#0e1724',
    darkElevated: '#152236',
    darkOverlay: '#1d2e47',
    textPrimary: '#FFFFFF',
    textSecondary: '#CBD5E1',
    textMuted: '#64748B',
  },
  {
    id: 'emeraldMatrix',
    name: 'Emerald Matrix',
    subtitle: 'Mint Green & Deep Forest Pine',
    colors: {
      c1: '#10B981', // Mint Emerald
      c2: '#FDE047', // Solar Gold
      c3: '#E11D48', // Scarlet Red
      c4: '#064E3B', // Deep Pine / Spruce
    },
    darkBase: '#050c08',
    darkSurface: '#0a1710',
    darkElevated: '#102419',
    darkOverlay: '#163324',
    textPrimary: '#FFFFFF',
    textSecondary: '#D1FAE5',
    textMuted: '#6EE7B7',
  },
  {
    id: 'royalPlum',
    name: 'Royal Obsidian',
    subtitle: 'Neon Violet & Velvet Wine',
    colors: {
      c1: '#818CF8', // Electric Violet / Indigo
      c2: '#FCD34D', // Topaz Gold
      c3: '#F43F5E', // Neon Crimson
      c4: '#4C0519', // Deep Velvet Plum
    },
    darkBase: '#0c0712',
    darkSurface: '#150c20',
    darkElevated: '#1f132e',
    darkOverlay: '#2a1a3e',
    textPrimary: '#FFFFFF',
    textSecondary: '#E0E7FF',
    textMuted: '#A5B4FC',
  },
];

export const DEFAULT_THEME_ID = 'cyberTeal';
const STORAGE_KEY = 'sql_assistant_theme_id';

/**
 * Get the currently active theme ID from localStorage or fallback to default
 */
export function getSavedThemeId() {
  if (typeof window === 'undefined') return DEFAULT_THEME_ID;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && THEMES.some((t) => t.id === saved)) {
    return saved;
  }
  return DEFAULT_THEME_ID;
}

/**
 * Get the theme object by ID
 */
export function getThemeById(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

/**
 * Apply the 4 color variables to document.documentElement
 */
export function applyTheme(themeId) {
  if (typeof document === 'undefined') return;
  const theme = getThemeById(themeId);
  const root = document.documentElement;

  // Set the 4 major color variables
  root.style.setProperty('--theme-c1', theme.colors.c1);
  root.style.setProperty('--theme-c2', theme.colors.c2);
  root.style.setProperty('--theme-c3', theme.colors.c3);
  root.style.setProperty('--theme-c4', theme.colors.c4);

  // Set harmonized surfaces and text
  root.style.setProperty('--theme-bg-base', theme.darkBase);
  root.style.setProperty('--theme-bg-surface', theme.darkSurface);
  root.style.setProperty('--theme-bg-elevated', theme.darkElevated);
  root.style.setProperty('--theme-bg-overlay', theme.darkOverlay);
  root.style.setProperty('--theme-text-primary', theme.textPrimary);
  root.style.setProperty('--theme-text-secondary', theme.textSecondary);
  root.style.setProperty('--theme-text-muted', theme.textMuted);

  // Set data-theme attribute on root for specific selectors if needed
  root.setAttribute('data-theme', theme.id);

  try {
    localStorage.setItem(STORAGE_KEY, theme.id);
  } catch {
    // Ignore localStorage errors (e.g. private mode)
  }
}
