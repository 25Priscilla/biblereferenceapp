import { BOOKS, booksIn, getBook } from "./canon";

describe("canon metadata", () => {
  it("contains 66 books: 39 OT and 27 NT", () => {
    expect(BOOKS).toHaveLength(66);
    expect(booksIn("OT")).toHaveLength(39);
    expect(booksIn("NT")).toHaveLength(27);
  });

  it("uses unique USFM ids", () => {
    expect(new Set(BOOKS.map((b) => b.id)).size).toBe(66);
    for (const b of BOOKS) expect(b.id).toMatch(/^[1-3A-Z][A-Z]{2}$/);
  });

  it("has standard English chapter totals (929 OT, 260 NT)", () => {
    const total = (t: "OT" | "NT") => booksIn(t).reduce((n, b) => n + b.chapters, 0);
    expect(total("OT")).toBe(929);
    expect(total("NT")).toBe(260);
  });

  it("looks up books by id", () => {
    expect(getBook("JHN")?.name).toBe("John");
    expect(getBook("PSA")?.chapters).toBe(150);
    expect(getBook("XYZ")).toBeUndefined();
  });
});
