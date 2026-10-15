import { BOOK_ALIASES } from "./aliases";
import { BOOKS } from "./canon";
import { formatReference, normaliseBookName, parseReference, resolveBook } from "./reference";
import type { ParseErrorCode } from "./reference";
import type { PassageRef } from "./types";

function ok(input: string): PassageRef {
  const result = parseReference(input);
  if (!result.ok) throw new Error(`Expected "${input}" to parse, got: ${result.message}`);
  return result.ref;
}

function err(input: string, code: ParseErrorCode): string {
  const result = parseReference(input);
  if (result.ok) throw new Error(`Expected "${input}" to fail, got ${JSON.stringify(result.ref)}`);
  expect(result.code).toBe(code);
  return result.message;
}

describe("parseReference — valid references", () => {
  it.each<[string, PassageRef]>([
    ["John 3:16", { book: "JHN", chapter: 3, verse: 16 }],
    ["Psalm 91:1-4", { book: "PSA", chapter: 91, verse: 1, verseEnd: 4 }],
    ["Genesis 1", { book: "GEN", chapter: 1 }],
    ["Psalms 23", { book: "PSA", chapter: 23 }],
    ["Romans", { book: "ROM", chapter: 1 }],
  ])("%s", (input, expected) => {
    expect(ok(input)).toEqual(expected);
  });

  it("accepts common abbreviations", () => {
    expect(ok("Jn 3:16")).toEqual({ book: "JHN", chapter: 3, verse: 16 });
    expect(ok("Ps 23")).toEqual({ book: "PSA", chapter: 23 });
    expect(ok("Gen 1")).toEqual({ book: "GEN", chapter: 1 });
    expect(ok("Matt 5:3-12")).toEqual({ book: "MAT", chapter: 5, verse: 3, verseEnd: 12 });
    expect(ok("Rev 22:21")).toMatchObject({ book: "REV", chapter: 22 });
    expect(ok("Phil 4:13")).toMatchObject({ book: "PHP" });
    expect(ok("Phm 1")).toMatchObject({ book: "PHM" });
    expect(ok("Jon 2")).toMatchObject({ book: "JON" });
    expect(ok("Jdg 6")).toMatchObject({ book: "JDG" });
    expect(ok("Song of Solomon 2:1")).toMatchObject({ book: "SNG", chapter: 2, verse: 1 });
  });

  it("accepts USFM codes", () => {
    expect(ok("JHN 1")).toMatchObject({ book: "JHN" });
    expect(ok("1co 13")).toMatchObject({ book: "1CO", chapter: 13 });
  });

  it("handles numbered books written several ways", () => {
    for (const input of ["1 Corinthians 13", "1Corinthians 13", "1 Cor 13", "I Cor 13", "First Corinthians 13", "1st Cor. 13"]) {
      expect(ok(input)).toEqual({ book: "1CO", chapter: 13 });
    }
    expect(ok("II Kings 2")).toMatchObject({ book: "2KI" });
    expect(ok("3 John 4")).toEqual({ book: "3JN", chapter: 1, verse: 4 });
  });

  it("is forgiving about case, spacing, dots and dashes", () => {
    expect(ok("  john   3 : 16 ")).toEqual({ book: "JHN", chapter: 3, verse: 16 });
    expect(ok("JOHN 3.16")).toEqual({ book: "JHN", chapter: 3, verse: 16 });
    expect(ok("Jn. 3:16")).toMatchObject({ book: "JHN" });
    expect(ok("Psalm 91:1–4")).toEqual({ book: "PSA", chapter: 91, verse: 1, verseEnd: 4 });
    expect(ok("Psalm 91:1 - 4")).toEqual({ book: "PSA", chapter: 91, verse: 1, verseEnd: 4 });
  });

  it("does not mistake Isaiah for a numbered book", () => {
    expect(ok("Isaiah 53")).toEqual({ book: "ISA", chapter: 53 });
    expect(ok("Is 53")).toEqual({ book: "ISA", chapter: 53 });
  });

  it("treats a lone number in a single-chapter book as a verse", () => {
    expect(ok("Jude 5")).toEqual({ book: "JUD", chapter: 1, verse: 5 });
    expect(ok("Jude 3-5")).toEqual({ book: "JUD", chapter: 1, verse: 3, verseEnd: 5 });
    expect(ok("Jude 1")).toEqual({ book: "JUD", chapter: 1 });
    expect(ok("Jude 1:24")).toEqual({ book: "JUD", chapter: 1, verse: 24 });
  });

  it("accepts a same-chapter range written in full", () => {
    expect(ok("John 3:16-3:18")).toEqual({ book: "JHN", chapter: 3, verse: 16, verseEnd: 18 });
  });

  it("collapses a one-verse range", () => {
    expect(ok("John 3:16-16")).toEqual({ book: "JHN", chapter: 3, verse: 16 });
  });

  it("accepts unique prefixes of book names", () => {
    expect(ok("Revel 1")).toMatchObject({ book: "REV" });
    expect(ok("Deuter 6:4")).toMatchObject({ book: "DEU" });
  });

  it("accepts the first and last chapters of the canon", () => {
    expect(ok("Genesis 1:1")).toMatchObject({ book: "GEN", chapter: 1 });
    expect(ok("Revelation 22")).toMatchObject({ book: "REV", chapter: 22 });
    expect(ok("Psalm 150")).toMatchObject({ book: "PSA", chapter: 150 });
  });
});

describe("parseReference — invalid references", () => {
  it("explains empty input", () => {
    expect(err("   ", "empty")).toMatch(/John 3:16/);
  });

  it("asks for a book when only numbers are given", () => {
    expect(err("3:16", "missing-book")).toMatch(/book name/);
  });

  it("suggests the closest book for typos", () => {
    expect(err("Jhon 3:16", "unknown-book")).toMatch(/Did you mean John\?/);
    expect(err("Genisis 1", "unknown-book")).toMatch(/Did you mean Genesis\?/);
    expect(err("Xyzzy 1", "unknown-book")).not.toMatch(/Did you mean/);
  });

  it("asks for more letters when a prefix is ambiguous", () => {
    expect(err("Ph 1", "ambiguous-book")).toMatch(/Philippians or Philemon/);
    expect(err("Ju 1", "ambiguous-book")).toMatch(/Judges or Jude/);
    expect(err("Jo 1", "ambiguous-book")).toMatch(/and others/);
  });

  it("rejects chapters beyond the end of a book", () => {
    expect(err("John 22", "chapter-out-of-range")).toBe("John has 21 chapters, so there’s no chapter 22.");
    expect(err("Psalm 151", "chapter-out-of-range")).toMatch(/150 chapters/);
    expect(err("Jude 1:1-2:1", "cross-chapter-range")).toBeTruthy();
    expect(err("Obadiah 2:1", "chapter-out-of-range")).toBe("Obadiah has only 1 chapter.");
  });

  it("rejects chapter or verse zero", () => {
    expect(err("John 0", "zero")).toMatch(/start at 1/);
    expect(err("John 3:0", "zero")).toMatch(/start at 1/);
  });

  it("rejects reversed ranges and suggests the fix", () => {
    expect(err("Psalm 91:4-1", "reversed-range")).toMatch(/Did you mean Psalm 91:1-4\?/);
  });

  it("explains that chapter-spanning ranges are not supported yet", () => {
    expect(err("Genesis 1-3", "cross-chapter-range")).toMatch(/Genesis 1/);
    expect(err("John 3:16-4:2", "cross-chapter-range")).toMatch(/John 3:16/);
  });

  it("rejects malformed locations", () => {
    expect(err("John 3::16", "malformed")).toMatch(/Chapter:Verse/);
    expect(err("John 3:", "malformed")).toBeTruthy();
    expect(err("John 3:16abc", "malformed")).toBeTruthy();
    expect(err("John 3:16-", "malformed")).toBeTruthy();
  });
});

describe("book aliases", () => {
  it("never maps one alias to two books", () => {
    // The alias index throws on construction if two books share an alias,
    // so resolving every alias also proves there are no collisions.
    for (const [id, aliases] of Object.entries(BOOK_ALIASES)) {
      for (const alias of aliases) {
        const match = resolveBook(alias);
        expect(match.kind === "found" && match.book.id, alias).toBe(id);
      }
    }
  });

  it("covers all 66 books, and every canonical name resolves to itself", () => {
    expect(Object.keys(BOOK_ALIASES).sort()).toEqual(BOOKS.map((b) => b.id).sort());
    for (const book of BOOKS) {
      const match = resolveBook(book.name);
      expect(match.kind === "found" && match.book.id).toBe(book.id);
    }
  });

  it("normalises ordinals, spacing and punctuation", () => {
    expect(normaliseBookName("I Sam.")).toBe("1sam");
    expect(normaliseBookName("Second  Kings")).toBe("2kings");
    expect(normaliseBookName("Song of Songs")).toBe("songofsongs");
  });
});

describe("formatReference", () => {
  it.each<[PassageRef, string]>([
    [{ book: "JHN", chapter: 3, verse: 16 }, "John 3:16"],
    [{ book: "PSA", chapter: 91, verse: 1, verseEnd: 4 }, "Psalm 91:1-4"],
    [{ book: "GEN", chapter: 1 }, "Genesis 1"],
    [{ book: "1CO", chapter: 13 }, "1 Corinthians 13"],
  ])("%j → %s", (ref, expected) => {
    expect(formatReference(ref)).toBe(expected);
  });

  it("round-trips through the parser", () => {
    for (const input of ["John 3:16", "Psalm 91:1-4", "Genesis 1", "Song of Songs 2:1", "3 John 1:4"]) {
      expect(formatReference(ok(input))).toBe(input);
    }
  });
});
