/**
 * Bible reference parsing, validation and formatting.
 *
 * Accepts forms such as "John 3:16", "Psalm 91:1-4", "Genesis 1", "Jn 3.16",
 * "1 Cor 13", "I John 4:8", "Jude 5" (single-chapter books) and "Romans"
 * (chapter 1). Everything returns stable USFM ids — never display names.
 *
 * Verse upper bounds are NOT checked here: verse counts depend on each
 * translation's versification, so the reader validates them against the
 * loaded chapter (see ReaderScreen).
 */

import { BOOK_ALIASES } from "./aliases";
import { BOOKS, getBook } from "./canon";
import { KANNADA_BOOK_ABBREVIATIONS, KANNADA_BOOK_NAMES } from "./translations/kannadaNames";
import { MALAYALAM_BOOK_ABBREVIATIONS, MALAYALAM_BOOK_NAMES } from "./translations/malayalamNames";
import type { BookInfo } from "./canon";
import type { PassageRef } from "./types";

// ---------- Normalisation ----------

const ORDINAL_PREFIX: [RegExp, string][] = [
  [/^(?:iii|third|3rd)[\s.]+/, "3"],
  [/^(?:ii|second|2nd)[\s.]+/, "2"],
  [/^(?:i|first|1st)[\s.]+/, "1"],
];

// Malayalam chillu letters have two encodings: the atomic letters (U+0D7A–
// U+0D7F) and the older consonant + virama + zero-width joiner. Published
// texts mix both, so matching folds the old form into the atomic one.
const OLD_CHILLU: [RegExp, string][] = [
  [/\u0D23\u0D4D\u200D/g, "\u0D7A"],
  [/\u0D28\u0D4D\u200D/g, "\u0D7B"],
  [/\u0D30\u0D4D\u200D/g, "\u0D7C"],
  [/\u0D32\u0D4D\u200D/g, "\u0D7D"],
  [/\u0D33\u0D4D\u200D/g, "\u0D7E"],
  [/\u0D15\u0D4D\u200D/g, "\u0D7F"],
];

/** "I Sam." → "1sam", "Song of Songs" → "songofsongs", "യോഹന്നാന്‍" → "യോഹന്നാൻ". */
export function normaliseBookName(input: string): string {
  let s = input.normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");
  for (const [pattern, chillu] of OLD_CHILLU) s = s.replace(pattern, chillu);
  for (const [pattern, digit] of ORDINAL_PREFIX) {
    if (pattern.test(s)) {
      s = s.replace(pattern, digit);
      break;
    }
  }
  return s.replace(/[\s.'’\u200C\u200D]/g, "");
}

/** Book names and abbreviations in each Indian language, from the publishers' own editions. */
const LOCAL_NAMES = [
  [MALAYALAM_BOOK_NAMES, MALAYALAM_BOOK_ABBREVIATIONS],
  [KANNADA_BOOK_NAMES, KANNADA_BOOK_ABBREVIATIONS],
] as const;

const ALIAS_INDEX: ReadonlyMap<string, string> = (() => {
  const index = new Map<string, string>();
  const add = (alias: string, id: string) => {
    const key = normaliseBookName(alias);
    const existing = index.get(key);
    if (existing && existing !== id) {
      throw new Error(`Book alias "${alias}" is ambiguous: ${existing} and ${id}`);
    }
    index.set(key, id);
  };
  for (const book of BOOKS) {
    add(book.name, book.id);
    add(book.id, book.id);
    for (const alias of BOOK_ALIASES[book.id] ?? []) add(alias, book.id);
    for (const [names, abbreviations] of LOCAL_NAMES) {
      const name = names[book.id];
      if (name) add(name, book.id);
      for (const alias of abbreviations[book.id] ?? []) add(alias, book.id);
    }
  }
  return index;
})();

/** Full book names (English, Malayalam and Kannada), normalised, for prefix matching. */
const FULL_NAMES: readonly [string, string][] = BOOKS.flatMap((b) => {
  const names: [string, string][] = [[normaliseBookName(b.name), b.id]];
  for (const [local] of LOCAL_NAMES) {
    const name = local[b.id];
    if (name) names.push([normaliseBookName(name), b.id]);
  }
  return names;
});

// ---------- Book resolution ----------

export type BookMatch =
  | { kind: "found"; book: BookInfo }
  | { kind: "ambiguous"; candidates: BookInfo[] }
  | { kind: "unknown"; suggestion?: BookInfo };

/**
 * Resolves a book name or abbreviation. Exact aliases win; otherwise a
 * unique prefix of a canonical name is accepted ("Revel" → Revelation).
 */
export function resolveBook(input: string): BookMatch {
  const key = normaliseBookName(input);
  if (!key) return { kind: "unknown" };

  const exact = ALIAS_INDEX.get(key);
  if (exact) return { kind: "found", book: getBook(exact)! };

  if (key.replace(/^\d/, "").length >= 2) {
    const ids = new Set(FULL_NAMES.filter(([name]) => name.startsWith(key)).map(([, id]) => id));
    const candidates = BOOKS.filter((b) => ids.has(b.id));
    if (candidates.length === 1) return { kind: "found", book: candidates[0]! };
    if (candidates.length > 1) return { kind: "ambiguous", candidates };
  }

  return { kind: "unknown", suggestion: suggestBook(key) };
}

/** Closest canonical name or alias by edit distance, for "Did you mean…?". */
function suggestBook(key: string): BookInfo | undefined {
  if (key.length < 3) return undefined;
  const maxDistance = key.length >= 5 ? 2 : 1;
  // Score = distance, with a half-point penalty for abbreviations so that on a
  // tie a full name wins ("Jhon" → John, not the Jonah abbreviation "Jon").
  let best: { id: string; score: number } | undefined;
  for (const [alias, id] of ALIAS_INDEX) {
    if (alias.length < 3) continue;
    const distance = editDistance(key, alias);
    if (distance > maxDistance) continue;
    const isFullName = alias === normaliseBookName(getBook(id)!.name);
    const score = distance + (isFullName ? 0 : 0.5);
    if (!best || score < best.score) best = { id, score };
  }
  return best && getBook(best.id);
}

/** Optimal-string-alignment distance (Levenshtein + adjacent transposition). */
function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, d[i - 2]![j - 2]! + 1);
      }
      d[i]![j] = v;
    }
  }
  return d[a.length]![b.length]!;
}

// ---------- Reference parsing ----------

export type ParseErrorCode =
  | "empty"
  | "missing-book"
  | "unknown-book"
  | "ambiguous-book"
  | "malformed"
  | "zero"
  | "chapter-out-of-range"
  | "reversed-range"
  | "cross-chapter-range";

export type ParseResult =
  | { ok: true; ref: PassageRef }
  | { ok: false; code: ParseErrorCode; message: string };

const EXAMPLE = "e.g. John 3:16, Psalm 91:1-4 or Genesis 1";

// Book: optional leading number/ordinal, then a name starting with a letter
// in any script (Malayalam and Kannada names include combining vowel signs and joiners).
// Location: everything from the first digit that follows the name.
const REFERENCE_PATTERN =
  /^((?:[1-3]\s*|(?:iii|ii|i|first|second|third|1st|2nd|3rd)[\s.]+)?\p{L}[\p{L}\p{M}\s.'’\u200C\u200D]*?)\s*(\d[\d\s:.\-]*)?$/iu;

const LOCATION_PATTERN = /^(\d+)(?:[:.](\d+))?(?:-(\d+)(?:[:.](\d+))?)?$/;

function fail(code: ParseErrorCode, message: string): ParseResult {
  return { ok: false, code, message };
}

export function parseReference(input: string): ParseResult {
  const text = input
    .trim()
    .replace(/[೦-೯]/g, (d) => String(d.charCodeAt(0) - 0x0ce6)) // Kannada digits ೦-೯
    .replace(/[‐-―−]/g, "-") // hyphens, en/em dashes, minus
    .replace(/\s+/g, " ");

  if (!text) return fail("empty", `Type a reference, ${EXAMPLE}.`);
  if (/^[\d\s:.\-]+$/.test(text)) {
    return fail("missing-book", `Start with a book name, ${EXAMPLE}.`);
  }

  const match = REFERENCE_PATTERN.exec(text);
  if (!match) {
    return fail("malformed", `“${input.trim()}” isn’t a reference VersePath can read. Try a form like ${EXAMPLE}.`);
  }
  const [, rawBook = "", rawLocation] = match;

  const resolved = resolveBook(rawBook);
  if (resolved.kind === "ambiguous") {
    const names = resolved.candidates.map((b) => b.name);
    const list =
      names.length <= 3
        ? names.join(names.length === 2 ? " or " : ", ")
        : `${names.slice(0, 3).join(", ")} and others`;
    return fail("ambiguous-book", `“${rawBook.trim()}” could mean ${list}. Type a few more letters.`);
  }
  if (resolved.kind === "unknown") {
    const hint = resolved.suggestion ? ` Did you mean ${resolved.suggestion.name}?` : "";
    return fail("unknown-book", `There’s no book called “${rawBook.trim()}”.${hint}`);
  }
  const book = resolved.book;

  if (!rawLocation) return { ok: true, ref: { book: book.id, chapter: 1 } };

  const loc = LOCATION_PATTERN.exec(rawLocation.replace(/\s+/g, ""));
  if (!loc) {
    return fail(
      "malformed",
      `“${rawLocation.trim()}” isn’t a chapter and verse VersePath can read. Use Chapter:Verse, for example ${book.name} 1:1.`,
    );
  }

  const [, c1, v1, n2, v2] = loc;
  const first = Number(c1);
  const firstVerse = v1 === undefined ? undefined : Number(v1);
  const second = n2 === undefined ? undefined : Number(n2);
  const secondVerse = v2 === undefined ? undefined : Number(v2);

  let chapter: number;
  let verse: number | undefined;
  let verseEnd: number | undefined;

  if (firstVerse === undefined) {
    // "Gen 1", "Gen 1-3", or a single-chapter book's verse: "Jude 5", "Jude 3-5".
    if (book.chapters === 1 && (first > 1 || second !== undefined) && secondVerse === undefined) {
      chapter = 1;
      verse = first;
      verseEnd = second;
    } else if (second !== undefined) {
      return fail(
        "cross-chapter-range",
        `Chapter ranges aren’t supported yet. Open ${book.name} ${first} and use Next Chapter to continue.`,
      );
    } else {
      chapter = first;
    }
  } else if (second === undefined) {
    chapter = first;
    verse = firstVerse;
  } else if (secondVerse === undefined) {
    chapter = first; // "Psalm 91:1-4"
    verse = firstVerse;
    verseEnd = second;
  } else if (second === first) {
    chapter = first; // "John 3:16-3:18"
    verse = firstVerse;
    verseEnd = secondVerse;
  } else {
    return fail(
      "cross-chapter-range",
      `Ranges across chapters aren’t supported yet. Try ${book.name} ${first}:${firstVerse} on its own.`,
    );
  }

  if (chapter < 1 || (verse !== undefined && verse < 1) || (verseEnd !== undefined && verseEnd < 1)) {
    return fail("zero", "Chapters and verses start at 1.");
  }
  if (chapter > book.chapters) {
    return fail(
      "chapter-out-of-range",
      book.chapters === 1
        ? `${book.name} has only 1 chapter.`
        : `${book.name} has ${book.chapters} chapters, so there’s no chapter ${chapter}.`,
    );
  }
  if (verse !== undefined && verseEnd !== undefined && verseEnd < verse) {
    return fail(
      "reversed-range",
      `That range ends before it starts. Did you mean ${formatReference({ book: book.id, chapter, verse: verseEnd, verseEnd: verse })}?`,
    );
  }

  const ref: PassageRef = { book: book.id, chapter };
  if (verse !== undefined) ref.verse = verse;
  if (verseEnd !== undefined && verseEnd !== verse) ref.verseEnd = verseEnd;
  return { ok: true, ref };
}

// ---------- Formatting ----------

/** Display name for a book in a chapter reference ("Psalm 23", not "Psalms 23"). */
export function bookDisplayName(book: BookInfo): string {
  return book.id === "PSA" ? "Psalm" : book.name;
}

/** "John 3:16", "Psalm 91:1-4", "Genesis 1". */
export function formatReference(ref: PassageRef): string {
  const book = getBook(ref.book);
  const name = book ? bookDisplayName(book) : ref.book;
  let out = `${name} ${ref.chapter}`;
  if (ref.verse !== undefined) {
    out += `:${ref.verse}`;
    if (ref.verseEnd !== undefined && ref.verseEnd !== ref.verse) out += `-${ref.verseEnd}`;
  }
  return out;
}
