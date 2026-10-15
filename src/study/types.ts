/**
 * Personal study data: bookmarks, highlights, notes and reading history.
 *
 * Every record identifies Scripture by USFM book id, chapter and verse
 * numbers — never by translation or by the text itself — so it stays attached
 * to the same passage whichever translation is being read.
 */

/** A verse or an inclusive range of verses within one chapter. */
export interface VerseSpan {
  book: string;
  chapter: number;
  verse: number;
  /** Inclusive end verse; equal to `verse` for a single verse. */
  verseEnd: number;
}

export interface Bookmark extends VerseSpan {
  id: string;
  createdAt: number;
}

export const HIGHLIGHT_COLORS = ["yellow", "green", "blue", "pink"] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

/** One highlighted verse. Ranges are stored verse by verse so they can overlap and be partly changed. */
export interface Highlight {
  book: string;
  chapter: number;
  verse: number;
  color: HighlightColor;
  updatedAt: number;
}

export interface Note extends VerseSpan {
  id: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}

export interface HistoryEntry {
  book: string;
  chapter: number;
  verse?: number;
  verseEnd?: number;
  openedAt: number;
}

export interface StudyData {
  bookmarks: Bookmark[];
  highlights: Highlight[];
  notes: Note[];
  history: HistoryEntry[];
}
