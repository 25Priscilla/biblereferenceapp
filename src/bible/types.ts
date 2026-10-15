/**
 * Core Bible data types shared by the UI and the translation data layer
 * (src/bible/translations). Bible text never lives in UI code — it is loaded
 * from translation data packages described by `TranslationInfo`.
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

/** BCP 47 language codes. */
export type LanguageCode = "en" | "ml";

/** Metadata a translation must declare before it can be listed in the app. */
export interface TranslationInfo {
  /** Stable short id, e.g. "web" or "ml-irv". Never reuse or rename one. */
  id: string;
  abbreviation: string;
  name: string;
  language: LanguageCode;
  /** Language name in that language, e.g. "English", "മലയാളം". */
  languageName: string;
  /** Where the verified text was obtained (organisation + URL). */
  source: string;
  sourceUrl: string;
  /** Licence name or summary, e.g. "Public Domain", "CC BY-SA 4.0". */
  licence: string;
  licenceUrl?: string;
  /** Exact attribution text that must be shown, if any. */
  attribution?: string;
  /** Whether the licence allows bundling/storing the full text on-device. */
  offlineAllowed: boolean;
  /** True only for clearly labelled development/test fixtures. */
  isPlaceholder: boolean;
  /** Book names in the translation's language, keyed by USFM id. */
  bookNames?: Readonly<Record<string, string>>;
}

/**
 * A translation that is known to the app but not installed: shown in the
 * Library as "not installed" and never selectable.
 */
export interface PlannedTranslation {
  id: string;
  name: string;
  language: LanguageCode;
  languageName: string;
  /** Why it isn't installed yet, in plain words. */
  note: string;
}

export interface Verse {
  number: number;
  text: string;
}

export interface Chapter {
  translationId: string;
  book: string;
  chapter: number;
  /** Verses present in the translation, in order. */
  verses: Verse[];
  /** Highest verse number in this chapter. */
  verseCount: number;
  /** Verse numbers within 1…verseCount that this translation omits. */
  missing: number[];
}
