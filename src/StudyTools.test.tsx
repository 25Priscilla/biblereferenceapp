import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { STUDY_KEYS } from "./study/storage";

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "");
});

afterEach(() => {
  // @ts-expect-error — remove any matchMedia stub installed by a test
  delete window.matchMedia;
});

function setViewportWidth(width: number) {
  window.matchMedia = ((query: string) => {
    const min = /min-width:\s*(\d+)px/.exec(query);
    return {
      matches: min ? width >= Number(min[1]) : false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
}

async function chapterLoaded() {
  await waitFor(() => expect(screen.queryByText(/^Opening /)).not.toBeInTheDocument());
}

/** Renders the app (fresh, as after a restart) and opens a reference from Home. */
async function goTo(reference: string) {
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByRole("searchbox", { name: /bible reference/i }), `${reference}{Enter}`);
  await chapterLoaded();
  return user;
}

/** Simulates closing and reopening the app. */
function restart() {
  document.body.innerHTML = "";
  window.history.replaceState(null, "");
}

async function openLibraryTab(user: ReturnType<typeof userEvent.setup>, tab: string) {
  if (screen.queryByRole("button", { name: "Back" })) await user.click(screen.getByRole("button", { name: "Back" }));
  await user.click(screen.getByRole("button", { name: "Library" }));
  await user.click(screen.getByRole("tab", { name: tab }));
  return screen.getByRole("tabpanel");
}

const verse = (n: number) => document.getElementById(`v${n}`)!;
const actions = () => screen.getByRole("group", { name: /^Actions for / });

async function chooseHighlight(user: ReturnType<typeof userEvent.setup>, colour: string) {
  await user.click(within(actions()).getByRole("button", { name: "Highlight" }));
  await user.click(screen.getByRole("menuitemradio", { name: colour }));
}

describe("bookmarks", () => {
  it("bookmarks a verse from the reader, lists it in the Library and reopens it", async () => {
    const user = await goTo("John 3:16");
    const bookmark = within(actions()).getByRole("button", { name: "Bookmark" });
    expect(bookmark).toHaveAttribute("aria-pressed", "false");
    await user.click(bookmark);
    expect(within(actions()).getByRole("button", { name: "Bookmarked" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Verse 16, bookmarked" })).toBeInTheDocument();

    const panel = await openLibraryTab(user, "Bookmarks");
    const item = within(panel).getByRole("button", { name: /^John 3:16/ });
    await waitFor(() => expect(item).toHaveTextContent(/For God so loved the world/));

    await user.click(item);
    await chapterLoaded();
    expect(screen.getByRole("heading", { level: 1, name: "John 3" })).toBeInTheDocument();
    expect(verse(16)).toHaveClass("verse--target");
    expect(within(actions()).getByRole("button", { name: "Bookmarked" })).toBeInTheDocument();
  });

  it("bookmarks a range and does not create duplicates", async () => {
    const user = await goTo("Psalm 91:1-4");
    await user.click(within(actions()).getByRole("button", { name: "Bookmark" }));
    const saved = JSON.parse(localStorage.getItem(STUDY_KEYS.bookmarks)!).items;
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ book: "PSA", chapter: 91, verse: 1, verseEnd: 4 });

    // Pressing again un-bookmarks rather than adding a second copy.
    await user.click(within(actions()).getByRole("button", { name: "Bookmarked" }));
    expect(JSON.parse(localStorage.getItem(STUDY_KEYS.bookmarks)!).items).toHaveLength(0);
  });

  it("removes a bookmark from the Library", async () => {
    const user = await goTo("John 3:16");
    await user.click(within(actions()).getByRole("button", { name: "Bookmark" }));
    const panel = await openLibraryTab(user, "Bookmarks");
    await user.click(within(panel).getByRole("button", { name: "Remove bookmark John 3:16" }));
    expect(within(panel).getByText(/No bookmarks yet/)).toBeInTheDocument();
  });

  it("keeps the same passage when the translation changes", async () => {
    const user = await goTo("John 3:16");
    await user.click(within(actions()).getByRole("button", { name: "Bookmark" }));
    await user.click(screen.getByRole("button", { name: /Change translation/ }));
    await user.click(screen.getByRole("menuitemradio", { name: /IRV/ }));
    await chapterLoaded();

    expect(within(actions()).getByRole("button", { name: "Bookmarked" })).toBeInTheDocument();
    const panel = await openLibraryTab(user, "Bookmarks");
    const item = within(panel).getByRole("button", { name: /^John 3:16/ });
    // The preview follows the current translation; the bookmark itself does not change.
    await waitFor(() => expect(item).toHaveTextContent(/ലോകത്തെ സ്നേഹിച്ചു/));
    expect(JSON.parse(localStorage.getItem(STUDY_KEYS.bookmarks)!).items[0]).not.toHaveProperty("translation");
  });
});

describe("highlights", () => {
  it("highlights a verse, changes its colour and removes it", async () => {
    const user = await goTo("John 3:16");
    await chooseHighlight(user, "Yellow");
    expect(verse(16)).toHaveAttribute("data-hl", "yellow");
    expect(screen.getByRole("button", { name: "Verse 16, highlighted yellow" })).toBeInTheDocument();

    await chooseHighlight(user, "Blue");
    expect(verse(16)).toHaveAttribute("data-hl", "blue");
    await user.click(within(actions()).getByRole("button", { name: "Highlight" }));
    expect(screen.getByRole("menuitemradio", { name: "Blue" })).toHaveAttribute("aria-checked", "true");

    await user.click(screen.getByRole("menuitem", { name: "Remove highlight" }));
    expect(verse(16)).not.toHaveAttribute("data-hl");
    expect(JSON.parse(localStorage.getItem(STUDY_KEYS.highlights)!).items).toEqual([]);
  });

  it("highlights a selected range and lists it in the Library", async () => {
    const user = await goTo("John 3:16-18");
    await chooseHighlight(user, "Green");
    for (const n of [16, 17, 18]) expect(verse(n)).toHaveAttribute("data-hl", "green");
    expect(verse(19)).not.toHaveAttribute("data-hl");

    const panel = await openLibraryTab(user, "Highlights");
    expect(within(panel).getByRole("button", { name: /^John 3:16-18.*Green/ })).toBeInTheDocument();
    await user.click(within(panel).getByRole("button", { name: "Remove highlight John 3:16-18" }));
    expect(within(panel).getByText(/No highlights yet/)).toBeInTheDocument();
  });

  it("closes the colour menu with Escape", async () => {
    const user = await goTo("John 3:16");
    await user.click(within(actions()).getByRole("button", { name: "Highlight" }));
    expect(screen.getByRole("menu", { name: "Highlight colour" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu", { name: "Highlight colour" })).not.toBeInTheDocument();
    expect(within(actions()).getByRole("button", { name: "Highlight" })).toHaveFocus();
  });

  it("stays on the same verses after switching translation", async () => {
    const user = await goTo("John 3:16");
    await chooseHighlight(user, "Pink");
    await user.click(screen.getByRole("button", { name: /Change translation/ }));
    await user.click(screen.getByRole("menuitemradio", { name: /IRV/ }));
    await chapterLoaded();
    expect(verse(16)).toHaveAttribute("data-hl", "pink");
    expect(verse(16).closest(".reader__text")).toHaveAttribute("lang", "ml");
  });

  it("is shared by both columns in parallel reading", async () => {
    const user = await goTo("John 3:16");
    await user.click(screen.getByRole("button", { name: "Parallel reading" }));
    await chapterLoaded();
    await chooseHighlight(user, "Yellow");

    const row = verse(16);
    expect(row).toHaveClass("pverse");
    expect(row).toHaveAttribute("data-hl", "yellow");
    const [en, ml] = row.querySelectorAll(".pverse__cell");
    expect(en).toHaveAttribute("lang", "en");
    expect(ml).toHaveAttribute("lang", "ml");
    expect(row).toContainElement(en as HTMLElement);
    expect(row).toContainElement(ml as HTMLElement);

    // Swapping the columns keeps the highlight on verse 16.
    await user.click(screen.getByRole("button", { name: /^Second column: .*Change translation/ }));
    await user.click(screen.getByRole("menuitemradio", { name: /World English Bible/ }));
    await chapterLoaded();
    expect(verse(16)).toHaveAttribute("data-hl", "yellow");
    expect(verse(16).querySelectorAll(".pverse__cell")[0]).toHaveAttribute("lang", "ml");
  });
});

describe("notes", () => {
  it("adds, edits and deletes a note with confirmation", async () => {
    const user = await goTo("John 3:16");
    await user.click(within(actions()).getByRole("button", { name: "Note" }));
    const dialog = screen.getByRole("dialog", { name: "Add a note · John 3:16" });
    const field = within(dialog).getByRole("textbox", { name: "Your note" });
    expect(field).toHaveFocus();
    expect(within(dialog).getByRole("button", { name: "Save" })).toBeDisabled();
    await user.type(field, "God's love is for everyone.");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // A small marker on the verse opens the note.
    expect(screen.getByRole("button", { name: "Verse 16, has a note" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open note on John 3:16" }));
    const edit = screen.getByRole("dialog", { name: "Note · John 3:16" });
    const editField = within(edit).getByRole("textbox", { name: "Your note" });
    expect(editField).toHaveValue("God's love is for everyone.");
    await user.clear(editField);
    await user.type(editField, "Edited note");
    await user.click(within(edit).getByRole("button", { name: "Save" }));
    expect(JSON.parse(localStorage.getItem(STUDY_KEYS.notes)!).items[0].text).toBe("Edited note");

    await user.click(within(actions()).getByRole("button", { name: "Edit note" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Delete this note on John 3:16? This can’t be undone.");
    await user.click(screen.getByRole("button", { name: "Keep note" }));
    expect(JSON.parse(localStorage.getItem(STUDY_KEYS.notes)!).items).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Delete note" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Open note/ })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STUDY_KEYS.notes)!).items).toEqual([]);
  });

  it("Cancel discards changes", async () => {
    const user = await goTo("John 3:16");
    await user.click(within(actions()).getByRole("button", { name: "Note" }));
    await user.type(screen.getByRole("textbox", { name: "Your note" }), "draft");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem(STUDY_KEYS.notes)).toBeNull();
  });

  it("saves a Malayalam note on a range, restores it after a restart and finds it in the Library", async () => {
    const text = "ദൈവം ലോകത്തെ ഇത്രയധികം സ്നേഹിച്ചു.\nപ്രാർത്ഥന";
    let user = await goTo("John 3:16-17");
    await user.click(within(actions()).getByRole("button", { name: "Note" }));
    await user.type(screen.getByRole("textbox", { name: "Your note" }), text);
    await user.click(screen.getByRole("button", { name: "Save" }));

    restart();
    user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Library" }));
    await user.click(screen.getByRole("tab", { name: "Notes" }));
    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByText(/ദൈവം ലോകത്തെ ഇത്രയധികം സ്നേഹിച്ചു/)).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "Edit note on John 3:16-17" }));
    expect(screen.getByRole("textbox", { name: "Your note" })).toHaveValue(text);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await user.click(within(panel).getByRole("button", { name: /^John 3:16-17/ }));
    await chapterLoaded();
    expect(verse(16)).toHaveClass("verse--target");
    expect(verse(17)).toHaveClass("verse--target");
    expect(within(actions()).getByRole("button", { name: "Edit note" })).toBeInTheDocument();
  });
});

describe("reading history", () => {
  it("records opened passages newest first, without repeats, and reopens them", async () => {
    const user = await goTo("John 3");
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.type(screen.getByRole("searchbox", { name: /bible reference/i }), "Psalm 23{Enter}");
    await chapterLoaded();
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.type(screen.getByRole("searchbox", { name: /bible reference/i }), "John 3:16{Enter}");
    await chapterLoaded();
    await user.click(screen.getByRole("button", { name: "Back" }));

    // Home: continue where you left off, and a short recent list.
    expect(screen.getByRole("button", { name: "Continue reading · John 3:16" })).toBeInTheDocument();
    const recent = screen.getByRole("list", { name: "Recently opened" });
    expect(within(recent).getAllByRole("button").map((b) => b.textContent)).toEqual([
      expect.stringMatching(/^John 3:16/),
      expect.stringMatching(/^Psalm 23/),
    ]);

    await user.click(within(recent).getByRole("button", { name: /^Psalm 23/ }));
    await chapterLoaded();
    expect(screen.getByRole("heading", { level: 1, name: "Psalm 23" })).toBeInTheDocument();
  });

  it("persists across restarts and can be cleared after confirming", async () => {
    let user = await goTo("Genesis 1");
    restart();
    user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole("button", { name: "Continue reading · Genesis 1" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Library" }));
    await user.click(screen.getByRole("tab", { name: "Recent" }));
    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByRole("button", { name: /^Genesis 1/ })).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "Clear history" }));
    await user.click(within(panel).getByRole("button", { name: "Cancel" }));
    expect(within(panel).getByRole("button", { name: /^Genesis 1/ })).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "Clear history" }));
    await user.click(within(panel).getByRole("button", { name: "Clear" }));
    expect(within(panel).getByText("Passages you open will appear here.")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STUDY_KEYS.history)!).items).toEqual([]);

    await user.click(screen.getByRole("button", { name: "Home" }));
    expect(screen.getByRole("button", { name: "Start reading · Genesis 1" })).toBeInTheDocument();
  });

  it("updates the entry with the selected verse", async () => {
    const user = await goTo("John 3");
    await user.click(screen.getByRole("button", { name: "Verse 5" }));
    expect(JSON.parse(localStorage.getItem(STUDY_KEYS.history)!).items[0]).toMatchObject({
      book: "JHN",
      chapter: 3,
      verse: 5,
    });
  });
});

describe("library", () => {
  it("shows a helpful empty state in every section", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Library" }));
    const expected: [string, RegExp][] = [
      ["Bookmarks", /No bookmarks yet/],
      ["Highlights", /No highlights yet/],
      ["Notes", /No notes yet/],
      ["Recent", /Passages you open will appear here/],
    ];
    for (const [tab, text] of expected) {
      await user.click(screen.getByRole("tab", { name: tab }));
      expect(screen.getByRole("tab", { name: tab })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tabpanel")).toHaveTextContent(text);
    }
  });

  it("moves between tabs with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Library" }));
    await user.click(screen.getByRole("tab", { name: "Bookmarks" }));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Highlights" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Highlights" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Recent" })).toHaveFocus();
  });

  it("recovers from damaged saved data without crashing", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem(STUDY_KEYS.bookmarks, "{not json");
    localStorage.setItem(
      STUDY_KEYS.notes,
      JSON.stringify({
        version: 1,
        items: [
          { id: "ok", book: "JHN", chapter: 3, verse: 16, verseEnd: 16, text: "Kept", createdAt: 1, updatedAt: 1 },
          { id: "bad", book: "NOPE", chapter: 1, verse: 1, verseEnd: 1, text: "Dropped", createdAt: 1, updatedAt: 1 },
        ],
      }),
    );
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Library" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent(/No bookmarks yet/);
    expect(localStorage.getItem(`${STUDY_KEYS.bookmarks}.backup`)).toBe("{not json");
    await user.click(screen.getByRole("tab", { name: "Notes" }));
    expect(screen.getByText("Kept")).toBeInTheDocument();
    expect(screen.queryByText("Dropped")).not.toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("keeps the translation choices", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Library" }));
    expect(within(screen.getByRole("radiogroup", { name: "Translations" })).getAllByRole("radio")).toHaveLength(2);
  });
});

describe("responsive layout", () => {
  it.each([
    ["phone", 375],
    ["desktop", 1280],
  ])("offers the same verse actions on a %s", async (_, width) => {
    setViewportWidth(width);
    await goTo("John 3:16");
    const bar = actions();
    for (const name of ["Bookmark", "Highlight", "Note", "Clear"]) {
      expect(within(bar).getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("shows no verse actions until a verse is selected", async () => {
    const user = await goTo("John 3");
    expect(screen.queryByRole("group", { name: /^Actions for / })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Verse 3" }));
    expect(actions()).toHaveAccessibleName("Actions for John 3:3");
  });
});
