import { PLACEHOLDER_TRANSLATION, placeholderChapter } from "./placeholder";

describe("placeholder fixture", () => {
  it("is flagged as a placeholder", () => {
    expect(PLACEHOLDER_TRANSLATION.isPlaceholder).toBe(true);
  });

  it("labels every verse as placeholder text", () => {
    const chapter = placeholderChapter("JHN", 3);
    expect(chapter.verses.length).toBeGreaterThan(0);
    for (const v of chapter.verses) expect(v.text).toMatch(/^\[Placeholder for verse \d+\.\]/);
  });
});

describe("placeholder verse count", () => {
  it("extends to cover a requested verse, within a sane cap", () => {
    expect(placeholderChapter("JHN", 3).verses).toHaveLength(12);
    expect(placeholderChapter("JHN", 3, 16).verses).toHaveLength(16);
    expect(placeholderChapter("PSA", 119, 9999).verses).toHaveLength(200);
  });
});
