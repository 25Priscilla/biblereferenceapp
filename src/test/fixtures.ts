/**
 * ⚠ TEST FIXTURES — NOT SCRIPTURE ⚠
 *
 * Tiny, obviously labelled translations used only by tests to exercise the
 * data layer (missing books, chapters and verses, malformed files, verse
 * bridges, Unicode Malayalam and Kannada). Every line says it is sample
 * text. Never ship these.
 */

import { createRepository } from "../bible/translations/repository";
import type { TranslationSource } from "../bible/translations/repository";
import type { TranslationInfo } from "../bible/types";

const fixtureInfo = (overrides: Partial<TranslationInfo> & Pick<TranslationInfo, "id">): TranslationInfo => ({
  abbreviation: overrides.id.toUpperCase(),
  name: `Test fixture ${overrides.id}`,
  language: "en",
  languageName: "English",
  source: "VersePath test suite",
  sourceUrl: "about:blank",
  licence: "Not applicable — contains no Bible text",
  offlineAllowed: true,
  isPlaceholder: true,
  ...overrides,
});

const line = (ref: string) => `[Sample text, not Scripture] ${ref}`;
/** "[മാതൃക — തിരുവെഴുത്തല്ല]" = "[Sample — not Scripture]". */
const mlLine = (ref: string) => `[മാതൃക — തിരുവെഴുത്തല്ല] ${ref}`;

/** English-style fixture: JHN (3 has a gap at verse 3) and GEN only. */
export const SAMPLE_EN: TranslationSource = {
  info: fixtureInfo({ id: "sample-en", abbreviation: "SMP" }),
  books: ["GEN", "JHN"],
  loadBook: async (book) => ({
    format: 1,
    translation: "sample-en",
    book,
    chapters:
      book === "JHN"
        ? [
            [line("JHN 1:1"), line("JHN 1:2")],
            null, // chapter 2 missing from this incomplete dataset
            [line("JHN 3:1"), line("JHN 3:2"), null, line("JHN 3:4"), "", line("JHN 3:6")],
          ]
        : [[line("GEN 1:1"), line("GEN 1:2"), line("GEN 1:3")]],
  }),
};

/** Malayalam fixture with localised book names; JHN only. */
export const SAMPLE_ML: TranslationSource = {
  info: fixtureInfo({
    id: "sample-ml",
    abbreviation: "SML",
    name: "മാതൃക (പരിശോധന)",
    language: "ml",
    languageName: "മലയാളം",
    bookNames: { JHN: "യോഹന്നാന്‍" },
  }),
  books: ["JHN"],
  loadBook: async (book) => ({
    format: 1,
    translation: "sample-ml",
    book,
    chapters: [[mlLine("1:1")], null, [mlLine("3:1"), mlLine("3:2"), mlLine("3:3")]],
  }),
};

/** "ಮಾದರಿ ಪಠ್ಯ" = "sample text". */
const knLine = (ref: string) => `[ಮಾದರಿ ಪಠ್ಯ — sample text, not Scripture] ${ref}`;

/**
 * Kannada fixture with verse bridges; MRK only. Chapter 1 prints 2-3 as one
 * verse and omits 4. Chapter 2 ends with the bridge 2-3.
 */
export const SAMPLE_KN: TranslationSource = {
  info: fixtureInfo({
    id: "sample-kn",
    abbreviation: "SKN",
    name: "ಮಾದರಿ (ಪರೀಕ್ಷೆ)",
    language: "kn",
    languageName: "ಕನ್ನಡ",
    bookNames: { MRK: "ಮಾರ್ಕನು" },
  }),
  books: ["MRK"],
  loadBook: async (book) => ({
    format: 1,
    translation: "sample-kn",
    book,
    chapters: [
      [knLine("1:1"), knLine("1:2-3"), null, null, knLine("1:5")],
      [knLine("2:1"), knLine("2:2-3"), null],
    ],
    bridges: [
      [1, 2, 3],
      [2, 2, 3],
    ],
  }),
};

/** Declares GEN but its file is malformed. */
export const SAMPLE_BROKEN: TranslationSource = {
  info: fixtureInfo({ id: "sample-broken" }),
  books: ["GEN", "EXO"],
  loadBook: async (book) =>
    book === "GEN"
      ? { format: 1, translation: "sample-broken", book, chapters: [[42]] }
      : Promise.reject(new Error("disk error")),
};

export const ML_SAMPLE_LINE = mlLine;
export const KN_SAMPLE_LINE = knLine;
export const SAMPLE_LINE = line;

export function sampleRepository(sources: TranslationSource[] = [SAMPLE_EN, SAMPLE_ML, SAMPLE_BROKEN]) {
  return createRepository(sources);
}
