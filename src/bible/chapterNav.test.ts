import { BOOKS } from "./canon";
import { nextChapter, previousChapter } from "./chapterNav";

describe("chapter navigation", () => {
  it("moves within a book", () => {
    expect(nextChapter({ book: "JHN", chapter: 3 })).toEqual({ book: "JHN", chapter: 4 });
    expect(previousChapter({ book: "JHN", chapter: 3 })).toEqual({ book: "JHN", chapter: 2 });
  });

  it("drops the verse when changing chapter", () => {
    expect(nextChapter({ book: "JHN", chapter: 3, verse: 16 })).toEqual({ book: "JHN", chapter: 4 });
  });

  it("crosses book boundaries", () => {
    expect(nextChapter({ book: "GEN", chapter: 50 })).toEqual({ book: "EXO", chapter: 1 });
    expect(previousChapter({ book: "EXO", chapter: 1 })).toEqual({ book: "GEN", chapter: 50 });
  });

  it("crosses from the Old to the New Testament", () => {
    expect(nextChapter({ book: "MAL", chapter: 4 })).toEqual({ book: "MAT", chapter: 1 });
    expect(previousChapter({ book: "MAT", chapter: 1 })).toEqual({ book: "MAL", chapter: 4 });
  });

  it("handles single-chapter books", () => {
    expect(nextChapter({ book: "OBA", chapter: 1 })).toEqual({ book: "JON", chapter: 1 });
    expect(previousChapter({ book: "JUD", chapter: 1 })).toEqual({ book: "3JN", chapter: 1 });
    expect(nextChapter({ book: "2JN", chapter: 1 })).toEqual({ book: "3JN", chapter: 1 });
  });

  it("stops at the start and end of the canon", () => {
    expect(previousChapter({ book: "GEN", chapter: 1 })).toBeNull();
    expect(nextChapter({ book: "REV", chapter: 22 })).toBeNull();
  });

  it("returns null for unknown books", () => {
    expect(nextChapter({ book: "XYZ", chapter: 1 })).toBeNull();
    expect(previousChapter({ book: "XYZ", chapter: 1 })).toBeNull();
  });

  it("visits every chapter exactly once from Genesis 1 to Revelation 22", () => {
    let ref = { book: "GEN", chapter: 1 } as ReturnType<typeof nextChapter>;
    let count = 0;
    while (ref) {
      count++;
      ref = nextChapter(ref);
    }
    expect(count).toBe(BOOKS.reduce((n, b) => n + b.chapters, 0));
    expect(count).toBe(1189);
  });
});
