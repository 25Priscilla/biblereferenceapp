import { useEffect, useState } from "react";

/** Breakpoint where the sidebar replaces the bottom tab bar. Keep in sync with CSS. */
export const WIDE_QUERY = "(min-width: 900px)";
/** Breakpoint where the reader also shows the book/chapter side panel. */
export const PANEL_QUERY = "(min-width: 1200px)";

function matches(query: string): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(query).matches;
}

export function useMediaQuery(query: string): boolean {
  const [value, setValue] = useState(() => matches(query));
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(query);
    const onChange = () => setValue(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return value;
}
