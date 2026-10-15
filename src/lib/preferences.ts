/**
 * Minimal preference storage: the theme, the active translation(s) and the
 * reading mode. Other reading preferences, history and the library are added
 * in Phase 4.
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

function readString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore — preference just won't persist */
  }
}

const TRANSLATION_KEY = "versepath.translation";
const PARALLEL_TRANSLATION_KEY = "versepath.parallelTranslation";
const READING_MODE_KEY = "versepath.readingMode";

/** The saved translation id, unvalidated: callers check it is still installed. */
export const loadTranslationId = () => readString(TRANSLATION_KEY);
export const saveTranslationId = (id: string) => writeString(TRANSLATION_KEY, id);

/** The second column's translation in parallel reading, unvalidated. */
export const loadParallelTranslationId = () => readString(PARALLEL_TRANSLATION_KEY);
export const saveParallelTranslationId = (id: string) => writeString(PARALLEL_TRANSLATION_KEY, id);

/** "single": one translation. "parallel": two translations side by side. */
export type ReadingMode = "single" | "parallel";

export function loadReadingMode(): ReadingMode {
  return readString(READING_MODE_KEY) === "parallel" ? "parallel" : "single";
}

export const saveReadingMode = (mode: ReadingMode) => writeString(READING_MODE_KEY, mode);

/** Reflects the preference on <html data-theme>; "system" removes it. */
export function applyTheme(theme: ThemePreference): void {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}
