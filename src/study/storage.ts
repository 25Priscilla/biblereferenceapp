/**
 * Local persistence for study data.
 *
 * Each collection lives under its own localStorage key as
 * `{ "version": 1, "items": [...] }` — the same on-device storage the app
 * already uses for preferences. Nothing is ever sent anywhere.
 *
 * Loading validates every record: invalid ones are skipped individually so
 * one bad entry cannot hide the rest. If a whole value cannot be read (not
 * JSON, unknown shape or a newer version), it is copied to a backup key
 * before the app starts afresh, so the user's data is never silently lost.
 */

import { getBook } from "../bible/canon";
import { dedupeHighlights, HISTORY_LIMIT, NOTE_MAX_LENGTH } from "./model";
import { HIGHLIGHT_COLORS } from "./types";
import type { Bookmark, Highlight, HistoryEntry, Note, StudyData } from "./types";

export const STORAGE_VERSION = 1;

export const STUDY_KEYS = {
  bookmarks: "versepath.bookmarks",
  highlights: "versepath.highlights",
  notes: "versepath.notes",
  history: "versepath.history",
} as const;

export type StudyCollection = keyof typeof STUDY_KEYS;

const backupKey = (key: string) => `${key}.backup`;

// ---------- Field validation ----------

type Obj = Record<string, unknown>;

const isObject = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isPositiveInt = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 1;
const isTime = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;
const isId = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 100;

/** A canonical book and a chapter that exists in it. */
function validChapter(o: Obj): boolean {
  if (typeof o.book !== "string") return false;
  const book = getBook(o.book);
  return book !== undefined && isPositiveInt(o.chapter) && o.chapter <= book.chapters;
}

function validSpan(o: Obj): boolean {
  return validChapter(o) && isPositiveInt(o.verse) && isPositiveInt(o.verseEnd) && o.verseEnd >= o.verse;
}

function toBookmark(o: Obj): Bookmark | null {
  if (!validSpan(o) || !isId(o.id) || !isTime(o.createdAt)) return null;
  return {
    id: o.id,
    book: o.book as string,
    chapter: o.chapter as number,
    verse: o.verse as number,
    verseEnd: o.verseEnd as number,
    createdAt: o.createdAt,
  };
}

function toHighlight(o: Obj): Highlight | null {
  if (!validChapter(o) || !isPositiveInt(o.verse) || !isTime(o.updatedAt)) return null;
  if (!(HIGHLIGHT_COLORS as readonly unknown[]).includes(o.color)) return null;
  return {
    book: o.book as string,
    chapter: o.chapter as number,
    verse: o.verse,
    color: o.color as Highlight["color"],
    updatedAt: o.updatedAt,
  };
}

function toNote(o: Obj): Note | null {
  if (!validSpan(o) || !isId(o.id) || !isTime(o.createdAt) || !isTime(o.updatedAt)) return null;
  if (typeof o.text !== "string" || o.text.trim() === "") return null;
  return {
    id: o.id,
    book: o.book as string,
    chapter: o.chapter as number,
    verse: o.verse as number,
    verseEnd: o.verseEnd as number,
    text: o.text.slice(0, NOTE_MAX_LENGTH),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

function toHistoryEntry(o: Obj): HistoryEntry | null {
  if (!validChapter(o) || !isTime(o.openedAt)) return null;
  const entry: HistoryEntry = { book: o.book as string, chapter: o.chapter as number, openedAt: o.openedAt };
  if (o.verse !== undefined) {
    if (!isPositiveInt(o.verse)) return null;
    entry.verse = o.verse;
    if (o.verseEnd !== undefined) {
      if (!isPositiveInt(o.verseEnd) || o.verseEnd < o.verse) return null;
      if (o.verseEnd !== o.verse) entry.verseEnd = o.verseEnd;
    }
  }
  return entry;
}

// ---------- Collections ----------

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const spanKey = (s: { book: string; chapter: number; verse: number; verseEnd: number }) =>
  `${s.book}.${s.chapter}.${s.verse}-${s.verseEnd}`;

const PARSERS: { [K in StudyCollection]: (items: unknown[]) => StudyData[K] } = {
  bookmarks: (items) =>
    uniqueBy(
      uniqueBy(parseAll(items, toBookmark), (b) => b.id),
      spanKey,
    ).sort((a, b) => b.createdAt - a.createdAt),
  highlights: (items) => dedupeHighlights(parseAll(items, toHighlight)),
  notes: (items) => uniqueBy(parseAll(items, toNote), (n) => n.id).sort((a, b) => b.updatedAt - a.updatedAt),
  history: (items) =>
    uniqueBy(
      parseAll(items, toHistoryEntry).sort((a, b) => b.openedAt - a.openedAt),
      (h) => `${h.book}.${h.chapter}`,
    ).slice(0, HISTORY_LIMIT),
};

function parseAll<T>(items: unknown[], parse: (o: Obj) => T | null): T[] {
  const out: T[] = [];
  for (const item of items) {
    const parsed = isObject(item) ? parse(item) : null;
    if (parsed) out.push(parsed);
  }
  return out;
}

export interface LoadResult<T> {
  items: T;
  /** Records skipped because they were invalid. */
  skipped: number;
  /** True when the stored value was unreadable and was moved to a backup key. */
  recovered: boolean;
}

export function loadCollection<K extends StudyCollection>(name: K): LoadResult<StudyData[K]> {
  const key = STUDY_KEYS[name];
  const empty = { items: [] as unknown as StudyData[K], skipped: 0, recovered: false };
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return empty;
  }
  if (raw === null) return empty;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }
  if (!isObject(parsed) || parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.items)) {
    console.warn(`VersePath: saved ${name} could not be read; kept a copy in ${backupKey(key)}`);
    try {
      localStorage.setItem(backupKey(key), raw);
    } catch {
      /* nothing more can be done */
    }
    return { ...empty, recovered: true };
  }

  const items = PARSERS[name](parsed.items);
  const skipped = parsed.items.length - items.length;
  if (skipped > 0) console.warn(`VersePath: skipped ${skipped} invalid saved ${name} record(s)`);
  return { items, skipped, recovered: false };
}

export function saveCollection<K extends StudyCollection>(name: K, items: StudyData[K]): void {
  try {
    localStorage.setItem(STUDY_KEYS[name], JSON.stringify({ version: STORAGE_VERSION, items }));
  } catch {
    /* storage full or unavailable — changes just won't persist */
  }
}

export function loadStudyData(): StudyData {
  return {
    bookmarks: loadCollection("bookmarks").items,
    highlights: loadCollection("highlights").items,
    notes: loadCollection("notes").items,
    history: loadCollection("history").items,
  };
}
