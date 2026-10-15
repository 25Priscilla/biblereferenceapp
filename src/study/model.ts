/**
 * Pure operations on study data. Each returns a new array and never mutates
 * its input, so the provider can persist exactly what it renders.
 */

import type { PassageRef } from "../bible/types";
import type { Bookmark, Highlight, HighlightColor, HistoryEntry, Note, VerseSpan } from "./types";

/** Most recent passages kept in the reading history. */
export const HISTORY_LIMIT = 30;
/** Longest note accepted, in characters — generous, but bounded so storage cannot fill up. */
export const NOTE_MAX_LENGTH = 20000;

export function newId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {
    /* fall through to the timestamp id */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function sameSpan(a: VerseSpan, b: VerseSpan): boolean {
  return a.book === b.book && a.chapter === b.chapter && a.verse === b.verse && a.verseEnd === b.verseEnd;
}

export function spanContains(span: VerseSpan, book: string, chapter: number, verse: number): boolean {
  return span.book === book && span.chapter === chapter && verse >= span.verse && verse <= span.verseEnd;
}

/** The PassageRef that opens a span in the reader. */
export function spanToRef(span: VerseSpan): PassageRef {
  const ref: PassageRef = { book: span.book, chapter: span.chapter, verse: span.verse };
  if (span.verseEnd !== span.verse) ref.verseEnd = span.verseEnd;
  return ref;
}

const spanOf = ({ book, chapter, verse, verseEnd }: VerseSpan): VerseSpan => ({ book, chapter, verse, verseEnd });

// ---------- Bookmarks ----------

/** Adds a bookmark unless the same passage is already bookmarked. Newest first. */
export function addBookmark(list: readonly Bookmark[], span: VerseSpan, now: number): Bookmark[] {
  if (list.some((b) => sameSpan(b, span))) return [...list];
  return [{ id: newId(), ...spanOf(span), createdAt: now }, ...list];
}

export function removeBookmark(list: readonly Bookmark[], id: string): Bookmark[] {
  return list.filter((b) => b.id !== id);
}

export function toggleBookmark(list: readonly Bookmark[], span: VerseSpan, now: number): Bookmark[] {
  const existing = list.find((b) => sameSpan(b, span));
  return existing ? removeBookmark(list, existing.id) : addBookmark(list, span, now);
}

// ---------- Highlights ----------

const highlightKey = (h: Pick<Highlight, "book" | "chapter" | "verse">) => `${h.book}.${h.chapter}.${h.verse}`;

/** Colours (or, with `null`, clears) every verse in the span. */
export function setHighlight(
  list: readonly Highlight[],
  span: VerseSpan,
  color: HighlightColor | null,
  now: number,
): Highlight[] {
  const kept = list.filter((h) => !spanContains(span, h.book, h.chapter, h.verse));
  if (color === null) return kept;
  const added: Highlight[] = [];
  for (let verse = span.verse; verse <= span.verseEnd; verse++) {
    added.push({ book: span.book, chapter: span.chapter, verse, color, updatedAt: now });
  }
  return [...kept, ...added];
}

/** Highlight colour by verse number for one chapter. */
export function chapterHighlights(list: readonly Highlight[], book: string, chapter: number): Map<number, HighlightColor> {
  const map = new Map<number, HighlightColor>();
  for (const h of list) if (h.book === book && h.chapter === chapter) map.set(h.verse, h.color);
  return map;
}

export interface HighlightGroup extends VerseSpan {
  color: HighlightColor;
  updatedAt: number;
}

/**
 * Joins consecutive verses of the same colour into ranges for display
 * ("John 3:16-18, yellow"), most recently changed first.
 */
export function groupHighlights(list: readonly Highlight[]): HighlightGroup[] {
  const sorted = [...list].sort(
    (a, b) => a.book.localeCompare(b.book) || a.chapter - b.chapter || a.verse - b.verse,
  );
  const groups: HighlightGroup[] = [];
  for (const h of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.book === h.book && last.chapter === h.chapter && last.color === h.color && last.verseEnd + 1 === h.verse) {
      last.verseEnd = h.verse;
      last.updatedAt = Math.max(last.updatedAt, h.updatedAt);
    } else {
      groups.push({ book: h.book, chapter: h.chapter, verse: h.verse, verseEnd: h.verse, color: h.color, updatedAt: h.updatedAt });
    }
  }
  return groups.sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Removes duplicate entries for the same verse, keeping the newest. */
export function dedupeHighlights(list: readonly Highlight[]): Highlight[] {
  const byKey = new Map<string, Highlight>();
  for (const h of list) {
    const existing = byKey.get(highlightKey(h));
    if (!existing || h.updatedAt >= existing.updatedAt) byKey.set(highlightKey(h), h);
  }
  return [...byKey.values()];
}

// ---------- Notes ----------

/**
 * Creates or updates the note for exactly this passage (one note per
 * passage). Most recently edited first.
 */
export function saveNote(list: readonly Note[], span: VerseSpan, text: string, now: number): Note[] {
  const body = text.slice(0, NOTE_MAX_LENGTH);
  const existing = list.find((n) => sameSpan(n, span));
  const note: Note = existing
    ? { ...existing, text: body, updatedAt: now }
    : { id: newId(), ...spanOf(span), text: body, createdAt: now, updatedAt: now };
  return [note, ...list.filter((n) => n !== existing)];
}

export function deleteNote(list: readonly Note[], id: string): Note[] {
  return list.filter((n) => n.id !== id);
}

// ---------- Reading history ----------

/**
 * Records that a passage was opened. Reopening a chapter already in the
 * history moves it to the top with the new verse and time instead of adding
 * a duplicate, so repeated visits never crowd the list.
 */
export function recordReading(list: readonly HistoryEntry[], ref: PassageRef, now: number): HistoryEntry[] {
  const entry: HistoryEntry = { book: ref.book, chapter: ref.chapter, openedAt: now };
  if (ref.verse !== undefined) {
    entry.verse = ref.verse;
    if (ref.verseEnd !== undefined && ref.verseEnd !== ref.verse) entry.verseEnd = ref.verseEnd;
  }
  const rest = list.filter((h) => !(h.book === ref.book && h.chapter === ref.chapter));
  return [entry, ...rest].slice(0, HISTORY_LIMIT);
}

export function historyToRef(entry: HistoryEntry): PassageRef {
  const ref: PassageRef = { book: entry.book, chapter: entry.chapter };
  if (entry.verse !== undefined) ref.verse = entry.verse;
  if (entry.verseEnd !== undefined) ref.verseEnd = entry.verseEnd;
  return ref;
}
