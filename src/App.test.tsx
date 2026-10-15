import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { sampleRepository } from "./test/fixtures";

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "");
  document.documentElement.removeAttribute("data-theme");
});

afterEach(() => {
  // @ts-expect-error — remove any matchMedia stub installed by a test
  delete window.matchMedia;
});

/** Simulates a viewport of the given width for matchMedia("(min-width: Npx)"). */
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

/** Waits until the reader has finished loading its chapter (no-op elsewhere). */
async function chapterLoaded() {
  await waitFor(() => expect(screen.queryByText(/^Opening /)).not.toBeInTheDocument());
}

async function goTo(reference: string, app = <App />) {
  const user = userEvent.setup();
  render(app);
  await user.type(screen.getByRole("searchbox", { name: /bible reference/i }), `${reference}{Enter}`);
  await chapterLoaded();
  return user;
}

describe("app shell (mobile)", () => {
  it("shows the brand, reference search and bottom tabs on Home", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "VersePath" })).toBeInTheDocument();
    expect(screen.getByText("Every Scripture, One Tap Away.")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: /bible reference/i })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav).toHaveClass("bottom-nav");
    expect(nav).toHaveTextContent(/Home.*Books.*Library.*Settings/);
  });

  it("navigates Books → chapter → Reader with the World English Bible text", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Books" }));
    await user.click(screen.getByRole("button", { name: "New Testament" }));
    await user.click(screen.getByRole("button", { name: /^John/ }));
    await user.click(screen.getByRole("button", { name: "John chapter 3" }));

    expect(screen.getByRole("heading", { level: 1, name: "John 3" })).toBeInTheDocument();
    expect(await screen.findByText(/^For God so loved the world/)).toBeInTheDocument();
    expect(screen.queryByText(/placeholder/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Main" })).not.toBeInTheDocument();
  });

  it("filters books by name or abbreviation", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Books" }));
    const filter = screen.getByRole("searchbox", { name: "Filter books" });

    await user.type(filter, "sam");
    expect(screen.getByRole("button", { name: /^1 Samuel/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Genesis/ })).not.toBeInTheDocument();

    await user.clear(filter);
    await user.type(filter, "1 cor");
    expect(screen.getByRole("button", { name: /^1 Corinthians/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^2 Corinthians/ })).not.toBeInTheDocument();
  });

  it("persists the theme preference", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Settings" }));
    await user.click(screen.getByRole("radio", { name: "Dark" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem("versepath.theme")).toBe("dark");
  });
});

describe("reference search", () => {
  it("opens John 3:16 and marks the verse", async () => {
    await goTo("John 3:16");
    expect(screen.getByRole("heading", { level: 1, name: "John 3" })).toBeInTheDocument();
    expect(document.getElementById("v16")).toHaveClass("verse--target");
    expect(document.getElementById("v15")).not.toHaveClass("verse--target");
  });

  it("opens a verse range", async () => {
    await goTo("Ps 91:1-4");
    expect(screen.getByRole("heading", { level: 1, name: "Psalm 91" })).toBeInTheDocument();
    for (const n of [1, 2, 3, 4]) expect(document.getElementById(`v${n}`)).toHaveClass("verse--target");
    expect(document.getElementById("v5")).not.toHaveClass("verse--target");
  });

  it("opens a whole chapter", async () => {
    await goTo("Genesis 1");
    expect(screen.getByRole("heading", { level: 1, name: "Genesis 1" })).toBeInTheDocument();
    expect(document.querySelector(".verse--target")).toBeNull();
  });

  it("explains invalid input and stays on Home", async () => {
    await goTo("John 22");
    expect(screen.getByRole("status")).toHaveTextContent("John has 21 chapters, so there’s no chapter 22.");
    expect(screen.getByRole("searchbox", { name: /bible reference/i })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("heading", { name: "VersePath" })).toBeInTheDocument();
  });

  it("clears the error when the user edits the input", async () => {
    const user = await goTo("Jhon 3:16");
    expect(screen.getByRole("status")).toHaveTextContent(/Did you mean John\?/);
    await user.type(screen.getByRole("searchbox", { name: /bible reference/i }), "x");
    expect(screen.getByRole("status")).not.toHaveTextContent(/Did you mean/);
  });
});

describe("reader chapter navigation", () => {
  it("steps forward and back between chapters", async () => {
    const user = await goTo("John 3");
    await user.click(screen.getByRole("button", { name: "Next chapter: John 4" }));
    expect(screen.getByRole("heading", { level: 1, name: "John 4" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Previous chapter: John 3" }));
    expect(screen.getByRole("heading", { level: 1, name: "John 3" })).toBeInTheDocument();
  });

  it("crosses into the next book from the end-of-chapter controls", async () => {
    const user = await goTo("Genesis 50");
    const pager = screen.getByRole("navigation", { name: "Chapter navigation" });
    await user.click(within(pager).getByRole("button", { name: /Next.*Exodus 1/ }));
    expect(screen.getByRole("heading", { level: 1, name: "Exodus 1" })).toBeInTheDocument();
  });

  it("disables Previous at Genesis 1 and Next at Revelation 22", async () => {
    await goTo("Genesis 1");
    expect(screen.getByRole("button", { name: "No previous chapter" })).toBeDisabled();
    const pager = screen.getByRole("navigation", { name: "Chapter navigation" });
    expect(within(pager).queryByRole("button", { name: /Previous/ })).not.toBeInTheDocument();
  });

  it("has no Next chapter at the end of Revelation", async () => {
    await goTo("Revelation 22");
    expect(screen.getByRole("button", { name: "No next chapter" })).toBeDisabled();
    const pager = screen.getByRole("navigation", { name: "Chapter navigation" });
    expect(within(pager).queryByRole("button", { name: /Next/ })).not.toBeInTheDocument();
  });

  it("chapter steps replace history so Back leaves the reader", async () => {
    const user = await goTo("John 3");
    await user.click(screen.getByRole("button", { name: "Next chapter: John 4" }));
    await user.click(screen.getByRole("button", { name: "Next chapter: John 5" }));
    expect(window.history.state.depth).toBe(1);
  });
});

describe("jumping from the reader", () => {
  it("opens another passage via the Go to passage sheet", async () => {
    const user = await goTo("John 3:16");
    await user.click(screen.getByRole("button", { name: /John 3:16\. Go to another passage/ }));
    const dialog = screen.getByRole("dialog", { name: "Go to passage" });
    await user.type(within(dialog).getByRole("searchbox", { name: "Type a reference" }), "Romans 8:28{Enter}");
    await chapterLoaded();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Romans 8" })).toBeInTheDocument();
    expect(document.getElementById("v28")).toHaveClass("verse--target");
  });

  it("shows validation errors inside the sheet", async () => {
    const user = await goTo("John 3");
    await user.click(screen.getByRole("button", { name: /Go to another passage/ }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByRole("searchbox"), "Ph 1{Enter}");
    expect(within(dialog).getByRole("status")).toHaveTextContent(/Philippians or Philemon/);
  });

  it("can pick a chapter from the sheet, starting at the current book", async () => {
    const user = await goTo("John 3");
    await user.click(screen.getByRole("button", { name: /Go to another passage/ }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "John chapter 3" })).toHaveAttribute("aria-current", "page");
    await user.click(within(dialog).getByRole("button", { name: "John chapter 10" }));
    expect(screen.getByRole("heading", { level: 1, name: "John 10" })).toBeInTheDocument();
  });

  it("closes the sheet with Escape", async () => {
    const user = await goTo("John 3");
    await user.click(screen.getByRole("button", { name: /Go to another passage/ }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("wide layout", () => {
  it("uses a sidebar instead of the bottom tab bar", () => {
    setViewportWidth(1280);
    render(<App />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav.closest(".sidebar")).not.toBeNull();
    expect(document.querySelector(".bottom-nav")).toBeNull();
    expect(screen.getByRole("heading", { level: 1, name: /where would you like to read/i })).toBeInTheDocument();
  });

  it("keeps the sidebar in the reader and adds the book panel and inline search at 1200px+", async () => {
    setViewportWidth(1280);
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole("searchbox", { name: /bible reference/i }), "John 3{Enter}");
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Books and chapters" })).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox", { name: "Jump to a reference" }), "Gen 1{Enter}");
    expect(screen.getByRole("heading", { level: 1, name: "Genesis 1" })).toBeInTheDocument();
  });

  it("omits the reader book panel between 900px and 1200px", async () => {
    setViewportWidth(1000);
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole("searchbox", { name: /bible reference/i }), "John 3{Enter}");
    expect(screen.queryByRole("complementary", { name: "Books and chapters" })).not.toBeInTheDocument();
  });

  it("steps chapters with the arrow keys", async () => {
    setViewportWidth(1280);
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole("searchbox", { name: /bible reference/i }), "John 3{Enter}");
    (document.activeElement as HTMLElement | null)?.blur();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("heading", { level: 1, name: "John 4" })).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByRole("heading", { level: 1, name: "John 2" })).toBeInTheDocument();
  });
});

describe("translations in the reader", () => {
  it("shows the real verse text for John 3:16 with attribution", async () => {
    await goTo("John 3:16");
    expect(document.getElementById("v16")).toHaveTextContent(/For God so loved the world/);
    expect(screen.getByText(/World English Bible\. Public domain\./)).toBeInTheDocument();
  });

  it("switches translation from the reader and keeps the passage", async () => {
    const user = await goTo("John 3:16");
    await user.click(screen.getByRole("button", { name: /Translation: World English Bible/ }));
    await user.click(screen.getByRole("menuitemradio", { name: /IRV/ }));
    await chapterLoaded();

    expect(screen.getByRole("heading", { level: 1, name: "യോഹന്നാന്‍ 3" })).toHaveAttribute("lang", "ml");
    expect(document.getElementById("v16")).toHaveTextContent(/ലോകത്തെ സ്നേഹിച്ചു/);
    expect(document.getElementById("v16")).toHaveClass("verse--target");
    expect(screen.getByRole("button", { name: /John 3:16\. Go to another passage/ })).toBeInTheDocument();
    expect(screen.getByText(/Bridge Communication Systems/)).toBeInTheDocument();
    expect(localStorage.getItem("versepath.translation")).toBe("ml-irv");
  });

  it("restores the saved translation after a restart", async () => {
    localStorage.setItem("versepath.translation", "ml-irv");
    await goTo("Genesis 1");
    expect(screen.getByRole("heading", { level: 1, name: "ഉല്‍പത്തി 1" })).toBeInTheDocument();
    expect(document.getElementById("v1")).toHaveTextContent(/ആദിയിൽ ദൈവം/);
  });

  it("falls back to the default when the saved translation is gone, and says so", async () => {
    localStorage.setItem("versepath.translation", "retired-version");
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByRole("status")).toHaveTextContent(/“retired-version”\) is no longer available/);
    expect(screen.getByRole("radio", { name: /World English Bible/ })).toHaveAttribute("aria-checked", "true");
  });

  it("selects a verse and extends it to a range", async () => {
    const user = await goTo("John 3");
    await user.click(screen.getByRole("button", { name: "Verse 16" }));
    expect(screen.getByRole("button", { name: /^John 3:16\. Go to another passage/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Verse 18" }));
    expect(screen.getByRole("button", { name: /^John 3:16-18\. Go to another passage/ })).toBeInTheDocument();
    for (const n of [16, 17, 18]) expect(document.getElementById(`v${n}`)).toHaveClass("verse--target");
    expect(screen.getByText("John 3:16-18 selected")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(document.querySelector(".verse--target")).toBeNull();
  });

  it("shows a verse the translation omits as missing, not as text", async () => {
    await goTo("Acts 8:36-38");
    expect(document.getElementById("v37")).toHaveTextContent("Verse 37 is not included in the WEB text.");
    expect(document.getElementById("v37")).toHaveClass("verse--missing");
  });

  it("notes a verse beyond the end of the chapter", async () => {
    await goTo("John 3:99");
    expect(screen.getByRole("note")).toHaveTextContent("John 3 has 36 verses in this translation");
  });

  it("opens a reference typed in Malayalam", async () => {
    await goTo("യോഹ. 3:16");
    expect(screen.getByRole("heading", { level: 1, name: "John 3" })).toBeInTheDocument();
    expect(document.getElementById("v16")).toHaveClass("verse--target");
  });
});

describe("translation data problems", () => {
  beforeEach(() => vi.spyOn(console, "warn").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it("labels sample fixture data clearly", async () => {
    await goTo("John 3", <App repository={sampleRepository()} />);
    expect(screen.getByRole("note")).toHaveTextContent(/Sample data\..*not Scripture/);
    expect(document.getElementById("v1")).toHaveTextContent("[Sample text, not Scripture] JHN 3:1");
  });

  it("explains a book missing from the translation", async () => {
    await goTo("Romans 8", <App repository={sampleRepository()} />);
    expect(screen.getByRole("status")).toHaveTextContent("Romans isn’t included in SMP yet.");
  });

  it("explains a missing chapter and keeps the translation switcher available", async () => {
    await goTo("John 2", <App repository={sampleRepository()} />);
    expect(screen.getByRole("status")).toHaveTextContent("John 2 isn’t available in SMP.");
    expect(screen.getByRole("button", { name: /Change translation/ })).toBeInTheDocument();
  });

  it("explains damaged data without crashing", async () => {
    localStorage.setItem("versepath.translation", "sample-broken");
    await goTo("Genesis 1", <App repository={sampleRepository()} />);
    expect(screen.getByRole("status")).toHaveTextContent(/data for this book is damaged/);
  });
});

describe("library and settings", () => {
  it("lists installed and not-installed translations in the Library and lets the user choose", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Library" }));
    const group = screen.getByRole("radiogroup", { name: "Translations" });
    expect(within(group).getAllByRole("radio")).toHaveLength(2);
    expect(within(group).getByRole("radio", { name: /World English Bible.*English/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("list", { name: "Not installed" })).toHaveTextContent(/സത്യവേദപുസ്തകം 1910/);

    await user.click(within(group).getByRole("radio", { name: /IRV/ }));
    expect(within(group).getByRole("radio", { name: /IRV/ })).toHaveAttribute("aria-checked", "true");
    expect(localStorage.getItem("versepath.translation")).toBe("ml-irv");
  });

  it("sets the translation from Settings and shows sources and licences", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Settings" }));
    await user.click(screen.getByRole("radio", { name: /IRV/ }));
    expect(localStorage.getItem("versepath.translation")).toBe("ml-irv");
    expect(screen.getByText(/creativecommons\.org\/licenses\/by-sa\/4\.0/)).toBeInTheDocument();
  });
});
