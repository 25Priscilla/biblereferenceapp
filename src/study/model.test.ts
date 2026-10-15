import {
  addBookmark,
  deleteNote,
  groupHighlights,
  HISTORY_LIMIT,
  recordReading,
  removeBookmark,
  saveNote,
  setHighlight,
  chapterHighlights,
  spanToRef,
  toggleBookmark,
} from "./model";
import type { VerseSpan } from "./types";

const span = (book: string, chapter: number, verse: number, verseEnd = verse): VerseSpan => ({
  book,
  chapter,
  verse,
  verseEnd,
});

describe("bookmarks", () => {
  it("adds newest first with a stable unique id and canonical location", () => {
    let list = addBookmark([], span("JHN", 3, 16), 1);
    list = addBookmark(list, span("PSA", 91, 1, 4), 2);
    expect(list.map((b) => [b.book, b.chapter, b.verse, b.verseEnd])).toEqual([
      ["PSA", 91, 1, 4],
      ["JHN", 3, 16, 16],
    ]);
    expect(list[0]!.id).not.toBe(list[1]!.id);
    expect(list[0]!.createdAt).toBe(2);
  });

  it("does not duplicate a bookmark for the same passage", () => {
    const once = addBookmark([], span("JHN", 3, 16), 1);
    const twice = addBookmark(once, span("JHN", 3, 16), 2);
    expect(twice).toHaveLength(1);
    expect(twice[0]!.id).toBe(once[0]!.id);
    // A different range of the same verse is a different passage.
    expect(addBookmark(once, span("JHN", 3, 16, 17), 3)).toHaveLength(2);
  });

  it("toggles and removes", () => {
    const on = toggleBookmark([], span("JHN", 3, 16), 1);
    expect(on).toHaveLength(1);
    expect(toggleBookmark(on, span("JHN", 3, 16), 2)).toEqual([]);
    expect(removeBookmark(on, on[0]!.id)).toEqual([]);
    expect(removeBookmark(on, "missing")).toHaveLength(1);
  });

  it("opens a single verse without a verseEnd and a range with one", () => {
    expect(spanToRef(span("JHN", 3, 16))).toEqual({ book: "JHN", chapter: 3, verse: 16 });
    expect(spanToRef(span("PSA", 91, 1, 4))).toEqual({ book: "PSA", chapter: 91, verse: 1, verseEnd: 4 });
  });
});

describe("highlights", () => {
  it("highlights a range verse by verse, then changes and removes part of it", () => {
    let list = setHighlight([], span("JHN", 3, 16, 18), "yellow", 1);
    expect([...chapterHighlights(list, "JHN", 3)]).toEqual([
      [16, "yellow"],
      [17, "yellow"],
      [18, "yellow"],
    ]);

    list = setHighlight(list, span("JHN", 3, 17), "blue", 2);
    expect(chapterHighlights(list, "JHN", 3).get(17)).toBe("blue");
    expect(list).toHaveLength(3);

    list = setHighlight(list, span("JHN", 3, 18), null, 3);
    expect([...chapterHighlights(list, "JHN", 3).keys()].sort()).toEqual([16, 17]);
    expect(chapterHighlights(list, "JHN", 4).size).toBe(0);
  });

  it("groups consecutive same-colour verses for display, newest first", () => {
    let list = setHighlight([], span("JHN", 3, 16, 18), "yellow", 1);
    list = setHighlight(list, span("JHN", 3, 20), "yellow", 2);
    list = setHighlight(list, span("GEN", 1, 1), "green", 3);
    expect(groupHighlights(list).map((g) => [g.book, g.verse, g.verseEnd, g.color])).toEqual([
      ["GEN", 1, 1, "green"],
      ["JHN", 20, 20, "yellow"],
      ["JHN", 16, 18, "yellow"],
    ]);
  });
});

describe("notes", () => {
  it("creates, edits in place and deletes", () => {
    let list = saveNote([], span("JHN", 3, 16), "God's love", 1);
    const id = list[0]!.id;
    list = saveNote(list, span("JHN", 3, 16), "God's love for the world", 5);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id, text: "God's love for the world", createdAt: 1, updatedAt: 5 });
    expect(deleteNote(list, id)).toEqual([]);
  });

  it("keeps Malayalam text exactly", () => {
    const text = "ദൈവം ലോകത്തെ സ്നേഹിച്ചു — ൻ ർ ൽ ൾ ൺ";
    expect(saveNote([], span("JHN", 3, 16), text, 1)[0]!.text).toBe(text);
  });
});

describe("reading history", () => {
  it("puts the latest first and does not repeat a chapter", () => {
    let list = recordReading([], { book: "JHN", chapter: 3 }, 1);
    list = recordReading(list, { book: "JHN", chapter: 3 }, 2);
    expect(list).toHaveLength(1);
    expect(list[0]!.openedAt).toBe(2);

    list = recordReading(list, { book: "PSA", chapter: 23 }, 3);
    list = recordReading(list, { book: "JHN", chapter: 3, verse: 16, verseEnd: 18 }, 4);
    expect(list.map((h) => `${h.book} ${h.chapter}:${h.verse ?? "-"}-${h.verseEnd ?? "-"}`)).toEqual([
      "JHN 3:16-18",
      "PSA 23:---",
    ]);
  });

  it("keeps only the most recent entries", () => {
    let list = recordReading([], { book: "GEN", chapter: 1 }, 0);
    for (let c = 2; c <= 50; c++) list = recordReading(list, { book: "GEN", chapter: c }, c);
    expect(list).toHaveLength(HISTORY_LIMIT);
    expect(list[0]!.chapter).toBe(50);
  });
});
