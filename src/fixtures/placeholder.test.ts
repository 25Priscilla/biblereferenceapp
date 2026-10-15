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
