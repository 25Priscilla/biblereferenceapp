/**
 * Previous/next chapter across the whole canon. Crosses book boundaries
 * (Genesis 50 → Exodus 1, Malachi 4 → Matthew 1) and returns null at the
 * very start (Genesis 1) and end (Revelation 22).
 */

import { BOOKS } from "./canon";
import type { PassageRef } from "./types";

function bookIndex(id: string): number {
  return BOOKS.findIndex((b) => b.id === id);
}

export function nextChapter(ref: PassageRef): PassageRef | null {
  const i = bookIndex(ref.book);
  const book = BOOKS[i];
  if (!book) return null;
  if (ref.chapter < book.chapters) return { book: book.id, chapter: ref.chapter + 1 };
  const next = BOOKS[i + 1];
  return next ? { book: next.id, chapter: 1 } : null;
}

export function previousChapter(ref: PassageRef): PassageRef | null {
  const i = bookIndex(ref.book);
  const book = BOOKS[i];
  if (!book) return null;
  if (ref.chapter > 1) return { book: book.id, chapter: ref.chapter - 1 };
  const prev = BOOKS[i - 1];
  return prev ? { book: prev.id, chapter: prev.chapters } : null;
}
