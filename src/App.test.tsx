import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "");
  document.documentElement.removeAttribute("data-theme");
});

describe("VersePath app shell", () => {
  it("shows the brand, reference search and main tabs on Home", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "VersePath" })).toBeInTheDocument();
    expect(screen.getByText("Every Scripture, One Tap Away.")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: /bible reference/i })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav).toHaveTextContent(/Home.*Books.*Library.*Settings/);
  });

  it("explains that reference search is not available yet", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole("searchbox"), "John 3:16{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent(/not available yet/i);
  });

  it("navigates Books → chapter → Reader with labelled placeholder text", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Books" }));
    await user.click(screen.getByRole("button", { name: "New Testament" }));
    await user.click(screen.getByRole("button", { name: /^John/ }));
    await user.click(screen.getByRole("button", { name: "John chapter 3" }));

    expect(screen.getByRole("heading", { level: 1, name: "John 3" })).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent(/placeholder text/i);
    expect(screen.queryByRole("navigation", { name: "Main" })).not.toBeInTheDocument();
  });

  it("filters books by name", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Books" }));
    await user.type(screen.getByRole("searchbox", { name: "Filter books" }), "sam");
    expect(screen.getByRole("button", { name: /^1 Samuel/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Genesis/ })).not.toBeInTheDocument();
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
