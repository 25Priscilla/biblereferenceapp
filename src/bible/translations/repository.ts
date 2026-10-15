/**
 * Translation data access. Screens never read Bible files directly: they ask
 * a `BibleRepository` for a chapter, verse or range and get a typed result
 * back. Every failure (unknown translation, a book or chapter missing from
 * an incomplete dataset, a verse the translation omits, a malformed file) is
 * a value, never a thrown error, so the reader can explain it calmly.
 *
 * The repository is built from `TranslationSource`s, so tests and future
 * translations plug in without touching the UI.
 */

import { getBook } from "../canon";
import { nextChapter, previousChapter } from "../chapterNav";
import { bookDisplayName } from "../reference";
import type { Chapter, PassageRef, TranslationInfo, Verse } from "../types";
import { validateBookFile } from "./bookFile";
import type { BookData } from "./bookFile";

export interface TranslationSource {
  info: TranslationInfo;
  /** USFM ids of the books this translation's data contains. */
  books: readonly string[];
  /** Loads one book's raw JSON. Must work offline for bundled translations. */
  loadBook: (book: string) => Promise<unknown>;
}

export type LookupErrorCode =
  | "unknown-translation"
  | "unknown-book"
  | "book-not-in-translation"
  | "chapter-not-found"
  | "verse-not-found"
  | "invalid-data"
  | "load-failed";

export interface LookupError {
  ok: false;
  code: LookupErrorCode;
  message: string;
}

export type ChapterResult = { ok: true; chapter: Chapter } | LookupError;
export type VerseResult = { ok: true; verse: Verse } | LookupError;
export type RangeResult =
  | { ok: true; verses: Verse[]; /** Requested numbers the translation omits. */ missing: number[] }
  | LookupError;

export interface BibleRepository {
  listTranslations(): readonly TranslationInfo[];
  getTranslation(id: string): TranslationInfo | undefined;
  hasBook(translationId: string, book: string): boolean;
  /** Book name in the translation's language, falling back to English. */
  bookName(translationId: string, book: string): string;
  loadChapter(translationId: string, book: string, chapter: number): Promise<ChapterResult>;
  getVerse(translationId: string, ref: PassageRef): Promise<VerseResult>;
  getVerseRange(translationId: string, ref: PassageRef): Promise<RangeResult>;
  /** Next/previous chapter among the books this translation contains. */
  nextChapter(translationId: string, ref: PassageRef): PassageRef | null;
  previousChapter(translationId: string, ref: PassageRef): PassageRef | null;
}

const fail = (code: LookupErrorCode, message: string): LookupError => ({ ok: false, code, message });

export function createRepository(sources: readonly TranslationSource[]): BibleRepository {
  const byId = new Map(sources.map((s) => [s.info.id, s]));
  const bookSets = new Map(sources.map((s) => [s.info.id, new Set(s.books)]));
  const cache = new Map<string, Promise<{ ok: true; data: BookData } | LookupError>>();

  function bookName(translationId: string, book: string): string {
    const localised = byId.get(translationId)?.info.bookNames?.[book];
    if (localised) return localised;
    const info = getBook(book);
    return info ? bookDisplayName(info) : book;
  }

  function loadBook(translationId: string, book: string) {
    const key = `${translationId}/${book}`;
    let pending = cache.get(key);
    if (!pending) {
      const source = byId.get(translationId)!;
      pending = source
        .loadBook(book)
        .then((raw) => {
          const result = validateBookFile(raw, translationId, book);
          if (result.ok) return result;
          console.warn(`VersePath: ${key}.json is malformed (${result.problem})`);
          return fail("invalid-data", `The ${source.info.abbreviation} data for this book is damaged and can’t be shown.`);
        })
        .catch(() => fail("load-failed", "This book couldn’t be opened. Please try again."))
        .then((result) => {
          if (!result.ok) cache.delete(key); // allow a retry
          return result;
        });
      cache.set(key, pending);
    }
    return pending;
  }

  async function loadChapter(translationId: string, book: string, chapter: number): Promise<ChapterResult> {
    const source = byId.get(translationId);
    if (!source) return fail("unknown-translation", "That translation isn’t installed.");
    if (!getBook(book)) return fail("unknown-book", "That book isn’t in the Bible.");
    if (!bookSets.get(translationId)!.has(book)) {
      return fail(
        "book-not-in-translation",
        `${bookName(translationId, book)} isn’t included in ${source.info.abbreviation} yet.`,
      );
    }

    const loaded = await loadBook(translationId, book);
    if (!loaded.ok) return loaded;

    const rows = Number.isInteger(chapter) && chapter >= 1 ? loaded.data.chapters[chapter - 1] : undefined;
    const verses: Verse[] = [];
    const missing: number[] = [];
    rows?.forEach((text, i) => {
      if (text) verses.push({ number: i + 1, text });
      else missing.push(i + 1);
    });
    if (verses.length === 0) {
      return fail(
        "chapter-not-found",
        `${bookName(translationId, book)} ${chapter} isn’t available in ${source.info.abbreviation}.`,
      );
    }
    const verseCount = verses[verses.length - 1]!.number;
    return {
      ok: true,
      chapter: {
        translationId,
        book,
        chapter,
        verses,
        verseCount,
        missing: missing.filter((n) => n < verseCount),
      },
    };
  }

  async function getVerseRange(translationId: string, ref: PassageRef): Promise<RangeResult> {
    const result = await loadChapter(translationId, ref.book, ref.chapter);
    if (!result.ok) return result;
    const { chapter } = result;
    const start = ref.verse ?? 1;
    const end = ref.verse === undefined ? chapter.verseCount : (ref.verseEnd ?? ref.verse);
    const verses = chapter.verses.filter((v) => v.number >= start && v.number <= end);
    const missing: number[] = [];
    for (let n = start; n <= Math.min(end, chapter.verseCount); n++) {
      if (!verses.some((v) => v.number === n)) missing.push(n);
    }
    if (verses.length === 0) {
      const label = `${bookName(translationId, ref.book)} ${ref.chapter}:${start}${end !== start ? `-${end}` : ""}`;
      return fail("verse-not-found", `${label} isn’t in this translation.`);
    }
    return { ok: true, verses, missing };
  }

  async function getVerse(translationId: string, ref: PassageRef): Promise<VerseResult> {
    if (ref.verse === undefined) return fail("verse-not-found", "No verse was given.");
    const range = await getVerseRange(translationId, { ...ref, verseEnd: ref.verse });
    if (!range.ok) return range;
    return { ok: true, verse: range.verses[0]! };
  }

  function step(translationId: string, ref: PassageRef, direction: 1 | -1): PassageRef | null {
    const books = bookSets.get(translationId);
    if (!books) return null;
    const move = direction === 1 ? nextChapter : previousChapter;
    let candidate = move(ref);
    while (candidate && !books.has(candidate.book)) {
      // Skip the whole book: jump to its far edge, then step past it.
      const skipped = getBook(candidate.book)!;
      candidate = move({ book: skipped.id, chapter: direction === 1 ? skipped.chapters : 1 });
    }
    return candidate;
  }

  return {
    listTranslations: () => sources.map((s) => s.info),
    getTranslation: (id) => byId.get(id)?.info,
    hasBook: (translationId, book) => bookSets.get(translationId)?.has(book) ?? false,
    bookName,
    loadChapter,
    getVerse,
    getVerseRange,
    nextChapter: (translationId, ref) => step(translationId, ref, 1),
    previousChapter: (translationId, ref) => step(translationId, ref, -1),
  };
}
