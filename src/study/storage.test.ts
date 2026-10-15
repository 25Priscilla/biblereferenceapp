import { loadCollection, loadStudyData, saveCollection, STUDY_KEYS } from "./storage";
import type { Bookmark, Highlight, HistoryEntry, Note } from "./types";

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

const store = (key: string, items: unknown[], version: unknown = 1) =>
  localStorage.setItem(key, JSON.stringify({ version, items }));

const bookmark: Bookmark = { id: "b1", book: "JHN", chapter: 3, verse: 16, verseEnd: 16, createdAt: 10 };
const note: Note = {
  id: "n1",
  book: "JHN",
  chapter: 3,
  verse: 16,
  verseEnd: 18,
  text: "സ്നേഹം",
  createdAt: 1,
  updatedAt: 2,
};

describe("study storage", () => {
  it("starts empty when nothing is saved", () => {
    expect(loadStudyData()).toEqual({ bookmarks: [], highlights: [], notes: [], history: [] });
  });

  it("round-trips every collection", () => {
    const highlights: Highlight[] = [{ book: "PSA", chapter: 23, verse: 1, color: "green", updatedAt: 3 }];
    const history: HistoryEntry[] = [{ book: "GEN", chapter: 1, openedAt: 4 }];
    saveCollection("bookmarks", [bookmark]);
    saveCollection("highlights", highlights);
    saveCollection("notes", [note]);
    saveCollection("history", history);
    expect(loadStudyData()).toEqual({ bookmarks: [bookmark], highlights, notes: [note], history });
    expect(JSON.parse(localStorage.getItem(STUDY_KEYS.notes)!)).toMatchObject({ version: 1 });
  });

  it("skips invalid records but keeps the valid ones", () => {
    store(STUDY_KEYS.bookmarks, [
      bookmark,
      null,
      "JHN 3:16",
      { ...bookmark, id: "b2", book: "XYZ" }, // unknown book
      { ...bookmark, id: "b3", chapter: 22 }, // John has 21 chapters
      { ...bookmark, id: "b4", verse: 0 },
      { ...bookmark, id: "b5", verse: 5, verseEnd: 4 }, // reversed
      { ...bookmark, id: "b6", verse: 1.5 },
      { ...bookmark, id: "" },
      { ...bookmark, id: "b7" }, // same passage as b1: duplicate
    ]);
    const result = loadCollection("bookmarks");
    expect(result.items).toEqual([bookmark]);
    expect(result.skipped).toBe(9);
    expect(result.recovered).toBe(false);
  });

  it("validates highlight colours, note text and history entries", () => {
    store(STUDY_KEYS.highlights, [
      { book: "JHN", chapter: 3, verse: 16, color: "yellow", updatedAt: 1 },
      { book: "JHN", chapter: 3, verse: 17, color: "purple", updatedAt: 1 },
      { book: "JHN", chapter: 3, verse: 16, color: "blue", updatedAt: 2 }, // newer value for v16 wins
    ]);
    expect(loadCollection("highlights").items).toEqual([
      { book: "JHN", chapter: 3, verse: 16, color: "blue", updatedAt: 2 },
    ]);

    store(STUDY_KEYS.notes, [note, { ...note, id: "n2", text: "   " }, { ...note, id: "n3", text: 42 }]);
    expect(loadCollection("notes").items).toEqual([note]);

    store(STUDY_KEYS.history, [
      { book: "JHN", chapter: 3, verse: 16, openedAt: 5 },
      { book: "JHN", chapter: 3, openedAt: 1 }, // older duplicate chapter
      { book: "GEN", chapter: 1, openedAt: -1 },
      { book: "GEN", chapter: 1, verse: "1", openedAt: 2 },
      { book: "PSA", chapter: 23, openedAt: 9 },
    ]);
    expect(loadCollection("history").items).toEqual([
      { book: "PSA", chapter: 23, openedAt: 9 },
      { book: "JHN", chapter: 3, verse: 16, openedAt: 5 },
    ]);
  });

  it.each([
    ["not JSON", "{oops"],
    ["the wrong shape", JSON.stringify([1, 2, 3])],
    ["a newer format version", JSON.stringify({ version: 2, items: [] })],
  ])("backs up %s instead of losing it", (_, raw) => {
    localStorage.setItem(STUDY_KEYS.notes, raw);
    const result = loadCollection("notes");
    expect(result).toEqual({ items: [], skipped: 0, recovered: true });
    expect(localStorage.getItem(`${STUDY_KEYS.notes}.backup`)).toBe(raw);
  });

  it("works when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(loadStudyData().bookmarks).toEqual([]);
    expect(() => saveCollection("bookmarks", [bookmark])).not.toThrow();
  });

  it("does not touch existing preferences", () => {
    localStorage.setItem("versepath.theme", "dark");
    localStorage.setItem("versepath.translation", "ml-irv");
    saveCollection("bookmarks", [bookmark]);
    loadStudyData();
    expect(localStorage.getItem("versepath.theme")).toBe("dark");
    expect(localStorage.getItem("versepath.translation")).toBe("ml-irv");
  });
});
