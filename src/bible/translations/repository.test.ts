import { KN_SAMPLE_LINE, ML_SAMPLE_LINE, SAMPLE_EN, SAMPLE_KN, SAMPLE_LINE, sampleRepository } from "../../test/fixtures";
import { validateBookFile } from "./bookFile";
import { createRepository } from "./repository";

describe("translation repository (sample fixtures)", () => {
  const repo = sampleRepository();

  it("lists the installed translations", () => {
    expect(repo.listTranslations().map((t) => t.id)).toEqual(["sample-en", "sample-ml", "sample-broken"]);
    expect(repo.getTranslation("sample-ml")?.language).toBe("ml");
    expect(repo.getTranslation("nope")).toBeUndefined();
  });

  it("reads a chapter and reports verses the translation omits", async () => {
    const result = await repo.loadChapter("sample-en", "JHN", 3);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.chapter.verses.map((v) => v.number)).toEqual([1, 2, 4, 6]);
    expect(result.chapter.verses[0]!.text).toBe(SAMPLE_LINE("JHN 3:1"));
    expect(result.chapter.verseCount).toBe(6);
    expect(result.chapter.missing).toEqual([3, 5]);
  });

  it("looks up a single verse", async () => {
    const result = await repo.getVerse("sample-en", { book: "JHN", chapter: 3, verse: 4 });
    expect(result).toEqual({ ok: true, verse: { number: 4, text: SAMPLE_LINE("JHN 3:4") } });
  });

  it("reads a verse range, listing gaps inside it", async () => {
    const result = await repo.getVerseRange("sample-en", { book: "JHN", chapter: 3, verse: 2, verseEnd: 5 });
    expect(result.ok && result.verses.map((v) => v.number)).toEqual([2, 4]);
    expect(result.ok && result.missing).toEqual([3, 5]);
  });

  it("clips a range that runs past the end of the chapter", async () => {
    const result = await repo.getVerseRange("sample-en", { book: "JHN", chapter: 3, verse: 6, verseEnd: 40 });
    expect(result.ok && result.verses.map((v) => v.number)).toEqual([6]);
    expect(result.ok && result.missing).toEqual([]);
  });

  it("reports a verse that is missing or out of range", async () => {
    expect(await repo.getVerse("sample-en", { book: "JHN", chapter: 3, verse: 3 })).toMatchObject({
      ok: false,
      code: "verse-not-found",
    });
    expect(await repo.getVerse("sample-en", { book: "JHN", chapter: 3, verse: 99 })).toMatchObject({
      ok: false,
      code: "verse-not-found",
    });
  });

  it("reports missing chapters, books and translations", async () => {
    expect(await repo.loadChapter("sample-en", "JHN", 2)).toMatchObject({ ok: false, code: "chapter-not-found" });
    expect(await repo.loadChapter("sample-en", "JHN", 9)).toMatchObject({ ok: false, code: "chapter-not-found" });
    expect(await repo.loadChapter("sample-en", "ROM", 1)).toMatchObject({
      ok: false,
      code: "book-not-in-translation",
    });
    expect(await repo.loadChapter("sample-en", "XYZ", 1)).toMatchObject({ ok: false, code: "unknown-book" });
    expect(await repo.loadChapter("nope", "JHN", 1)).toMatchObject({ ok: false, code: "unknown-translation" });
  });

  it("rejects malformed data and load failures without throwing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await repo.loadChapter("sample-broken", "GEN", 1)).toMatchObject({ ok: false, code: "invalid-data" });
    expect(await repo.loadChapter("sample-broken", "EXO", 1)).toMatchObject({ ok: false, code: "load-failed" });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("retries a book after a failed load", async () => {
    let attempts = 0;
    const flaky = createRepository([
      {
        ...SAMPLE_EN,
        loadBook: (book) => (++attempts === 1 ? Promise.reject(new Error("busy")) : SAMPLE_EN.loadBook(book)),
      },
    ]);
    expect((await flaky.loadChapter("sample-en", "GEN", 1)).ok).toBe(false);
    expect((await flaky.loadChapter("sample-en", "GEN", 1)).ok).toBe(true);
  });

  it("loads each book once and serves later chapters from cache", async () => {
    const loadBook = vi.fn(SAMPLE_EN.loadBook);
    const cached = createRepository([{ ...SAMPLE_EN, loadBook }]);
    await cached.loadChapter("sample-en", "JHN", 1);
    await cached.loadChapter("sample-en", "JHN", 3);
    expect(loadBook).toHaveBeenCalledTimes(1);
  });

  it("steps chapters across books, skipping books the translation lacks", () => {
    expect(repo.nextChapter("sample-en", { book: "JHN", chapter: 3 })).toEqual({ book: "JHN", chapter: 4 });
    expect(repo.previousChapter("sample-en", { book: "JHN", chapter: 1 })).toEqual({ book: "GEN", chapter: 50 });
    expect(repo.nextChapter("sample-en", { book: "JHN", chapter: 21 })).toBeNull();
    expect(repo.previousChapter("sample-en", { book: "GEN", chapter: 1 })).toBeNull();
  });

  it("keeps the same reference valid when switching translations", async () => {
    const ref = { book: "JHN", chapter: 3, verse: 2 };
    const en = await repo.getVerse("sample-en", ref);
    const ml = await repo.getVerse("sample-ml", ref);
    expect(en.ok && en.verse.number).toBe(2);
    expect(ml.ok && ml.verse.text).toBe(ML_SAMPLE_LINE("3:2"));
  });

  it("returns Unicode Malayalam text and book names unchanged", async () => {
    const result = await repo.loadChapter("sample-ml", "JHN", 1);
    const text = result.ok ? result.chapter.verses[0]!.text : "";
    expect(text).toBe("[മാതൃക — തിരുവെഴുത്തല്ല] 1:1");
    expect(text.normalize("NFC")).toBe(text);
    expect(repo.bookName("sample-ml", "JHN")).toBe("യോഹന്നാന്‍");
    // Books without a localised name fall back to English.
    expect(repo.bookName("sample-ml", "GEN")).toBe("Genesis");
    expect(repo.bookName("sample-en", "PSA")).toBe("Psalm");
  });
});

describe("book file validation", () => {
  const valid = { format: 1, translation: "t", book: "GEN", chapters: [["a", null]] };

  it("accepts a well-formed file", () => {
    expect(validateBookFile(valid, "t", "GEN").ok).toBe(true);
  });

  it.each([
    ["not an object", null],
    ["a wrong format version", { ...valid, format: 2 }],
    ["another translation's file", { ...valid, translation: "other" }],
    ["another book's file", { ...valid, book: "EXO" }],
    ["chapters that are not a list", { ...valid, chapters: "x" }],
    ["a chapter that is not a list", { ...valid, chapters: [{}] }],
    ["a verse that is not text", { ...valid, chapters: [["a", 3]] }],
  ])("rejects %s", (_label, raw) => {
    expect(validateBookFile(raw, "t", "GEN").ok).toBe(false);
  });

  it("accepts verse bridges and defaults to none", () => {
    const bridged = { ...valid, chapters: [["a", "b", null]], bridges: [[1, 2, 3]] };
    const result = validateBookFile(bridged, "t", "GEN");
    expect(result.ok && result.data.bridges).toEqual([[1, 2, 3]]);
    const plain = validateBookFile(valid, "t", "GEN");
    expect(plain.ok && plain.data.bridges).toEqual([]);
  });

  it.each([
    ["bridges that are not a list", "x"],
    ["a bridge that is not three numbers", [[1, 2]]],
    ["a bridge that is not a range", [[1, 2, 2]]],
    ["a bridge with no text", [[1, 3, 4]]],
    ["a bridge that would hide a verse's text", [[1, 1, 2]]],
    ["a bridge past the end of the chapter", [[1, 2, 4]]],
    ["overlapping bridges", [[1, 2, 3], [1, 2, 3]]],
  ])("rejects %s", (_label, bridges) => {
    const raw = { ...valid, chapters: [["a", "b", null]], bridges };
    expect(validateBookFile(raw, "t", "GEN").ok).toBe(false);
  });
});

describe("verse bridges (Kannada sample fixture)", () => {
  const repo = createRepository([SAMPLE_KN]);

  it("lists a bridged verse once, and does not report its numbers as missing", async () => {
    const result = await repo.loadChapter("sample-kn", "MRK", 1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.chapter.verses).toEqual([
      { number: 1, text: KN_SAMPLE_LINE("1:1") },
      { number: 2, through: 3, text: KN_SAMPLE_LINE("1:2-3") },
      { number: 5, text: KN_SAMPLE_LINE("1:5") },
    ]);
    expect(result.chapter.missing).toEqual([4]);
    expect(result.chapter.verseCount).toBe(5);
  });

  it("counts a bridge at the end of a chapter in the verse count", async () => {
    const result = await repo.loadChapter("sample-kn", "MRK", 2);
    expect(result.ok && result.chapter.verseCount).toBe(3);
    expect(result.ok && result.chapter.missing).toEqual([]);
  });

  it("finds the bridged verse from either of its numbers", async () => {
    for (const verse of [2, 3]) {
      const result = await repo.getVerse("sample-kn", { book: "MRK", chapter: 1, verse });
      expect(result.ok && result.verse).toEqual({ number: 2, through: 3, text: KN_SAMPLE_LINE("1:2-3") });
    }
  });

  it("includes a bridge that overlaps a range, once", async () => {
    const result = await repo.getVerseRange("sample-kn", { book: "MRK", chapter: 1, verse: 3, verseEnd: 5 });
    expect(result.ok && result.verses.map((v) => v.number)).toEqual([2, 5]);
    expect(result.ok && result.missing).toEqual([4]);
  });

  it("keeps Kannada text and book names unchanged", async () => {
    expect(repo.bookName("sample-kn", "MRK")).toBe("ಮಾರ್ಕನು");
    expect(repo.getTranslation("sample-kn")?.language).toBe("kn");
  });
});
