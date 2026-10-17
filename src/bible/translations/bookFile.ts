/**
 * The on-disk format of one book of one translation, produced by
 * scripts/convert-vpl.mjs:
 *
 *   { "format": 1, "translation": "web", "book": "JHN",
 *     "chapters": [ ["text of 1:1", "text of 1:2", null, …], … ],
 *     "bridges": [[5, 3, 4], …] }
 *
 * `chapters[c - 1][v - 1]` is chapter c, verse v. `null` (or an empty
 * string) marks a verse the translation does not contain; a `null` chapter
 * marks a chapter missing from an incomplete dataset.
 *
 * The optional `bridges` lists verses the translation prints as one, as
 * [chapter, first, last]. The text is at the first verse and the slots for
 * the following verses are null. Anything else is rejected as malformed
 * rather than half-displayed.
 */

export type Bridge = readonly [chapter: number, first: number, last: number];

export interface BookData {
  translation: string;
  book: string;
  chapters: ReadonlyArray<ReadonlyArray<string | null> | null>;
  /** Verse bridges, in any order. Empty when the book has none. */
  bridges: readonly Bridge[];
}

export type BookFileResult = { ok: true; data: BookData } | { ok: false; problem: string };

const isCount = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 1;

export function validateBookFile(raw: unknown, translation: string, book: string): BookFileResult {
  const bad = (problem: string): BookFileResult => ({ ok: false, problem });
  if (typeof raw !== "object" || raw === null) return bad("not an object");
  const file = raw as Record<string, unknown>;
  if (file.format !== 1) return bad(`unsupported format ${String(file.format)}`);
  if (file.translation !== translation) return bad(`belongs to translation "${String(file.translation)}"`);
  if (file.book !== book) return bad(`contains book "${String(file.book)}"`);
  if (!Array.isArray(file.chapters)) return bad("chapters is not a list");

  for (const [i, chapter] of file.chapters.entries()) {
    if (chapter === null) continue;
    if (!Array.isArray(chapter)) return bad(`chapter ${i + 1} is not a list`);
    for (const [j, verse] of chapter.entries()) {
      if (verse !== null && typeof verse !== "string") return bad(`verse ${i + 1}:${j + 1} is not text`);
    }
  }
  const chapters = file.chapters as BookData["chapters"];

  const bridges: Bridge[] = [];
  if (file.bridges !== undefined) {
    if (!Array.isArray(file.bridges)) return bad("bridges is not a list");
    const covered = new Set<string>();
    for (const entry of file.bridges as unknown[]) {
      if (!Array.isArray(entry) || entry.length !== 3 || !entry.every(isCount)) return bad("bridge is not [chapter, first, last]");
      const [c, first, last] = entry as [number, number, number];
      const label = `${c}:${first}-${last}`;
      const rows = chapters[c - 1];
      if (last <= first) return bad(`bridge ${label} is not a range`);
      if (!rows?.[first - 1]) return bad(`bridge ${label} has no text`);
      for (let n = first; n <= last; n++) {
        if (covered.has(`${c}:${n}`)) return bad(`bridge ${label} overlaps another`);
        covered.add(`${c}:${n}`);
        if (n > first && (rows.length < n || rows[n - 1])) return bad(`bridge ${label} hides verse ${c}:${n}`);
      }
      bridges.push([c, first, last]);
    }
  }
  return { ok: true, data: { translation, book, chapters, bridges } };
}
