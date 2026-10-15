/**
 * The on-disk format of one book of one translation, produced by
 * scripts/convert-vpl.mjs:
 *
 *   { "format": 1, "translation": "web", "book": "JHN",
 *     "chapters": [ ["text of 1:1", "text of 1:2", null, …], … ] }
 *
 * `chapters[c - 1][v - 1]` is chapter c, verse v. `null` (or an empty
 * string) marks a verse the translation does not contain; a `null` chapter
 * marks a chapter missing from an incomplete dataset. Anything else is
 * rejected as malformed rather than half-displayed.
 */

export interface BookData {
  translation: string;
  book: string;
  chapters: ReadonlyArray<ReadonlyArray<string | null> | null>;
}

export type BookFileResult = { ok: true; data: BookData } | { ok: false; problem: string };

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
  return { ok: true, data: { translation, book, chapters: file.chapters as BookData["chapters"] } };
}
