/** Theme + accent presets persisted on `profiles.theme` / `profiles.accent_color`. */

export type ThemeId = "dark" | "midnight" | "forest" | "plum";

export interface ThemePreset {
  id: ThemeId;
  label: string;
  description: string;
  swatch: string;
  defaultAccent: string;
}

export const THEMES: ThemePreset[] = [
  {
    id: "dark",
    label: "Ember",
    description: "Warm charcoal with a cozy amber glow",
    swatch: "#1e1a16",
    defaultAccent: "#e0a35e",
  },
  {
    id: "midnight",
    label: "Midnight",
    description: "Cool blue-black for late sessions",
    swatch: "#141a2e",
    defaultAccent: "#7aa2f7",
  },
  {
    id: "forest",
    label: "Forest",
    description: "Deep mossy green, calm and grounded",
    swatch: "#152119",
    defaultAccent: "#7fce9b",
  },
  {
    id: "plum",
    label: "Plum",
    description: "Moody violet with a soft twilight tint",
    swatch: "#211628",
    defaultAccent: "#c084fc",
  },
];

export const ACCENT_PRESETS = [
  "#e0a35e",
  "#f97362",
  "#7aa2f7",
  "#7fce9b",
  "#c084fc",
  "#f472b6",
  "#facc15",
  "#2dd4bf",
];

export const DEFAULT_THEME: ThemeId = "dark";
export const DEFAULT_ACCENT = "#e0a35e";

export function resolveTheme(theme: string | null | undefined): ThemeId {
  return THEMES.some((t) => t.id === theme)
    ? (theme as ThemeId)
    : DEFAULT_THEME;
}

export function resolveAccent(accent: string | null | undefined): string {
  return accent && /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : DEFAULT_ACCENT;
}

/**
 * Apply a theme + accent to the document root. Colours are consumed through CSS
 * variables defined in globals.css.
 */
export function applyTheme(theme: string | null | undefined, accent: string | null | undefined) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(theme);
  root.style.setProperty("--accent", resolveAccent(accent));
}
