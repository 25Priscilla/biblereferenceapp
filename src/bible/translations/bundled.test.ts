/**
 * Checks the real bundled translation files. These assertions use short
 * fragments only, to confirm the right text is wired to the right reference.
 */

import { BOOKS } from "../canon";
import { bible, INSTALLED_TRANSLATIONS } from "./index";

describe("bundled translations", () => {
  it("installs the World English Bible and the IRV Malayalam with licence metadata", () => {
    const ids = bible.listTranslations().map((t) => t.id);
    expect(ids).toEqual(["web", "ml-irv"]);
    for (const t of INSTALLED_TRANSLATIONS) {
      expect(t.isPlaceholder).toBe(false);
      expect(t.offlineAllowed).toBe(true);
      expect(t.licence).not.toBe("");
      expect(t.attribution).toBeTruthy();
    }
    expect(bible.getTranslation("ml-irv")?.licence).toBe("CC BY-SA 4.0");
    expect(bible.getTranslation("ml-irv")?.attribution).toContain("Bridge Communication Systems");
  });

  it("contains all 66 books in both translations", () => {
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
