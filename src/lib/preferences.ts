/**
 * Minimal preference storage: the theme and the active translation. Reading
 * preferences, history and the library are added in Phase 4.
 *
 * All storage access is guarded: WebViews can throw on localStorage access
 * (private modes, storage disabled) and the app must still run.
 */

export type ThemePreference = "system" | "light" | "dark";

const THEME_KEY = "versepath.theme";

export function loadTheme(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    /* storage unavailable — fall back to default */
  }
  return "system";
}

export function saveTheme(theme: ThemePreference): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore — preference just won't persist */
  }
}

const TRANSLATION_KEY = "versepath.translation";

/** The saved translation id, unvalidated: callers check it is still installed. */
export function loadTranslationId(): string | null {
  try {
    return localStorage.getItem(TRANSLATION_KEY);
  } catch {
    return null;
  }
}

export function saveTranslationId(id: string): void {
  try {
    localStorage.setItem(TRANSLATION_KEY, id);
  } catch {
    /* ignore — preference just won't persist */
  }
}

/** Reflects the preference on <html data-theme>; "system" removes it. */
export function applyTheme(theme: ThemePreference): void {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}
