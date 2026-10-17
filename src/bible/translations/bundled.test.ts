/**
 * Checks the real bundled translation files. These assertions mostly use short
 * fragments, to confirm the right text is wired to the right reference. The IRV
 * Kannada block also compares a few whole verses with the publisher's own page.
 */

import { BOOKS } from "../canon";
import { bible, INSTALLED_TRANSLATIONS } from "./index";

describe("bundled translations", () => {
  it("installs the World English Bible, the IRV Malayalam and the IRV Kannada with licence metadata", () => {
    const ids = bible.listTranslations().map((t) => t.id);
    expect(ids).toEqual(["web", "ml-irv", "kn-irv"]);
    for (const t of INSTALLED_TRANSLATIONS) {
      expect(t.isPlaceholder).toBe(false);
      expect(t.offlineAllowed).toBe(true);
      expect(t.licence).not.toBe("");
      expect(t.attribution).toBeTruthy();
    }
    expect(bible.getTranslation("ml-irv")?.licence).toBe("CC BY-SA 4.0");
    expect(bible.getTranslation("ml-irv")?.attribution).toContain("Bridge Communication Systems");
    expect(bible.getTranslation("kn-irv")?.licence).toBe("CC BY-SA 4.0");
    expect(bible.getTranslation("kn-irv")?.attribution).toContain("© 2017, 2019 Bridge Connectivity Solutions");
    // Abbreviations label parallel columns, so they must be unique.
    const abbreviations = INSTALLED_TRANSLATIONS.map((t) => t.abbreviation);
    expect(new Set(abbreviations).size).toBe(abbreviations.length);
  });

  it("contains all 66 books in every translation", () => {
    for (const t of INSTALLED_TRANSLATIONS) {
      for (const book of BOOKS) expect(bible.hasBook(t.id, book.id)).toBe(true);
    }
  });

  it("reads John 3:16 in English", async () => {
    const result = await bible.getVerse("web", { book: "JHN", chapter: 3, verse: 16 });
    expect(result.ok && result.verse.text).toMatch(/^For God so loved the world/);
  });

  it("reads John 3:16 in Malayalam, as valid NFC Malayalam script", async () => {
    const result = await bible.getVerse("ml-irv", { book: "JHN", chapter: 3, verse: 16 });
    const text = result.ok ? result.verse.text : "";
    expect(text).toMatch(/^[ഀ-ൿ]/);
    expect(text).toContain("ലോകത്തെ");
    expect(text).not.toContain("�");
    expect(text.normalize("NFC")).toBe(text);
  });

  it("reads Psalm 91:1-4 as a range", async () => {
    const result = await bible.getVerseRange("web", { book: "PSA", chapter: 91, verse: 1, verseEnd: 4 });
    expect(result.ok && result.verses.map((v) => v.number)).toEqual([1, 2, 3, 4]);
  });

  it("marks verses the WEB omits as missing rather than inventing them", async () => {
    const result = await bible.loadChapter("web", "ACT", 8);
    expect(result.ok && result.chapter.missing).toEqual([37]);
    expect(result.ok && result.chapter.verseCount).toBe(40);
  });

  it("uses Malayalam book names for the IRV", () => {
    expect(bible.bookName("ml-irv", "JHN")).toBe("യോഹന്നാന്‍");
    expect(bible.bookName("web", "JHN")).toBe("John");
  });

  it("loads without any network access", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const result = await bible.loadChapter("ml-irv", "GEN", 1);
    expect(result.ok && result.chapter.verses.length).toBe(31);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("every bundled book file is well formed", async () => {
    const warn = vi.spyOn(console, "warn");
    for (const t of INSTALLED_TRANSLATIONS) {
      for (const book of BOOKS) {
        const result = await bible.loadChapter(t.id, book.id, 1);
        expect(result.ok, `${t.id} ${book.id}`).toBe(true);
      }
    }
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  }, 30_000);
});

describe("IRV Kannada (kn-irv)", () => {
  // The five verses eBible.org quotes on https://ebible.org/find/details.php?id=kanirv,
  // copied from that page (October 2026) to confirm the data matches the licensed source.
  it.each([
    ["GEN", 1, 1, "ಆದಿಯಲ್ಲಿ ದೇವರು ಆಕಾಶವನ್ನು, ಭೂಮಿಯನ್ನು ಸೃಷ್ಟಿಮಾಡಿದನು."],
    ["PSA", 23, 1, "ದಾವೀದನ ಕೀರ್ತನೆ. ಯೆಹೋವನು ನನಗೆ ಕುರುಬನು; ಕೊರತೆಪಡೆನು."],
    ["MAT", 6, 33, "ಹೀಗಿರುವುದರಿಂದ, ನೀವು ಮೊದಲು ದೇವರ ರಾಜ್ಯವನ್ನೂ ನೀತಿಯನ್ನೂ ಹುಡುಕಿರಿ. ಇವುಗಳ ಕೂಡ ಅವೆಲ್ಲವೂ ನಿಮಗೆ ದೊರಕುವವು."],
    [
      "JHN",
      3,
      16,
      "“ದೇವರು ಲೋಕದ ಮೇಲೆ ಎಷ್ಟೋ ಪ್ರೀತಿಯನ್ನಿಟ್ಟು ತನ್ನ ಒಬ್ಬನೇ ಮಗನನ್ನು ಕೊಟ್ಟನು ಆತನನ್ನು ನಂಬುವ ಒಬ್ಬನಾದರೂ ನಾಶವಾಗದೆ ಎಲ್ಲರೂ ನಿತ್ಯಜೀವವನ್ನು ಪಡೆಯಬೇಕೆಂದು ಆತನನ್ನು ಕೊಟ್ಟನು.",
    ],
    [
      "ROM",
      8,
      28,
      "ಇದಲ್ಲದೆ ದೇವರ ಸಂಕಲ್ಪದ ಮೇರೆಗೆ ಕರೆಯಲ್ಪಟ್ಟು ಆತನನ್ನು ಪ್ರೀತಿಸುವವರ ಹಿತಕ್ಕಾಗಿ ಎಲ್ಲಾ ಕಾರ್ಯಗಳು ಒಳ್ಳೆಯದಕ್ಕಾಗಿಯೇ ಆಗುವುದೆಂದು ನಮಗೆ ತಿಳಿದಿದೆ.",
    ],
  ] as const)("matches the publisher's text of %s %i:%i", async (book, chapter, verse, text) => {
    const result = await bible.getVerse("kn-irv", { book, chapter, verse });
    expect(result.ok && result.verse.text).toBe(text);
  });

  it("is the complete text: every book and chapter, every verse number accounted for", async () => {
    let numbers = 0;
    let entries = 0;
    let bridges = 0;
    for (const book of BOOKS) {
      for (let c = 1; c <= book.chapters; c++) {
        const result = await bible.loadChapter("kn-irv", book.id, c);
        expect(result.ok, `${book.id} ${c}`).toBe(true);
        if (!result.ok) continue;
        expect(result.chapter.missing, `${book.id} ${c}`).toEqual([]);
        numbers += result.chapter.verseCount;
        entries += result.chapter.verses.length;
        bridges += result.chapter.verses.filter((v) => v.through).length;
        for (const v of result.chapter.verses) {
          // Kannada script, spaces, digits and ordinary punctuation only.
          expect(v.text, `${book.id} ${c}:${v.number}`).toMatch(/^[ಀ-೿‌‍\s0-9.,;:?!“”‘’()-]+$/);
          expect(v.text.normalize("NFC")).toBe(v.text);
        }
      }
    }
    expect({ numbers, entries, bridges }).toEqual({ numbers: 31104, entries: 31031, bridges: 71 });
  }, 60_000);

  it("keeps verses the IRV prints together as one bridged verse", async () => {
    const mark = await bible.loadChapter("kn-irv", "MRK", 5);
    const bridged = mark.ok ? mark.chapter.verses.find((v) => v.number === 3) : undefined;
    expect(bridged?.through).toBe(4);
    expect(bridged?.text).toContain("ಸಮಾಧಿಯಲ್ಲಿನ ಗವಿಗಳೇ");
    const luke = await bible.getVerse("kn-irv", { book: "LUK", chapter: 3, verse: 5 });
    expect(luke.ok && [luke.verse.number, luke.verse.through]).toEqual([4, 6]);
  });

  it("follows the same numbering differences as the IRV Malayalam where the text does", async () => {
    const counts = async (book: string, chapter: number) => {
      const result = await bible.loadChapter("kn-irv", book, chapter);
      return result.ok ? result.chapter.verseCount : 0;
    };
    expect(await counts("3JN", 1)).toBe(15);
    expect(await counts("REV", 12)).toBe(18);
    expect(await counts("ROM", 14)).toBe(23);
    expect(await counts("ROM", 16)).toBe(27);
  });

  it("uses Kannada book names", () => {
    expect(bible.bookName("kn-irv", "JHN")).toBe("ಯೋಹಾನನು");
    expect(bible.bookName("kn-irv", "PSA")).toBe("ಕೀರ್ತನೆಗಳು");
    for (const book of BOOKS) expect(bible.bookName("kn-irv", book.id)).toMatch(/^[1-3 ]*[ಀ-೿]/);
  });

  it("loads without any network access", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const result = await bible.loadChapter("kn-irv", "PSA", 23);
    expect(result.ok && result.chapter.verses.length).toBe(6);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
