/**
 * Core Bible data types shared by the UI and (from Phase 3) translation
 * loaders. Bible text never lives in UI code — it is loaded from translation
 * data packages described by `TranslationInfo`.
 */

/** A location in Scripture using stable identifiers. Verse is optional. */
export interface PassageRef {
  /** USFM book code, see canon.ts */
  book: string;
  chapter: number;
  verse?: number;
  /** Inclusive end verse for ranges such as Psalm 91:1-4. */
  verseEnd?: number;
}

export type LanguageCode = "en" | "ml";

/**
 * Metadata a translation must declare before it can be listed in the app.
 * Fields beyond the essentials are wired up in Phase 3; the shape is fixed
 * now so licensing information is never an afterthought.
 */
export interface TranslationInfo {
  /** Stable short id, e.g. "web" or "ml-irv". */
  id: string;
  abbreviation: string;
  name: string;
  language: LanguageCode;
  /** Where the verified text was obtained (organisation + URL). */
  source: string;
  /** Licence name or summary, e.g. "Public Domain", "CC BY-SA 4.0". */
  licence: string;
  /** Exact attribution text that must be shown, if any. */
  attribution?: string;
  /** Whether the licence allows bundling/storing the full text on-device. */
  offlineAllowed: boolean;
  /** True only for clearly labelled development fixtures. */
  isPlaceholder: boolean;
}

export interface Verse {
  number: number;
  text: string;
}

export interface Chapter {
  translationId: string;
  book: string;
  chapter: number;
  verses: Verse[];
}
