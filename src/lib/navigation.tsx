/**
 * Tiny dependency-free screen router.
 *
 * Routes are stored in `history.state` so the WebView's native back
 * behaviour (Android back gesture, browser back) moves between screens.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { PassageRef } from "../bible/types";

export type Route =
  | { name: "home" }
  | { name: "books" }
  | { name: "reader"; ref: PassageRef }
  | { name: "library" }
  | { name: "settings" };

export type TabName = "home" | "books" | "library" | "settings";

interface NavigationValue {
  route: Route;
  navigate: (route: Route) => void;
  back: () => void;
  canGoBack: boolean;
}

const NavigationContext = createContext<NavigationValue | null>(null);

interface HistoryEntry {
  route: Route;
  depth: number;
}

function isEntry(value: unknown): value is HistoryEntry {
  return typeof value === "object" && value !== null && "route" in value && "depth" in value;
}

export function NavigationProvider({
  children,
  initialRoute = { name: "home" },
}: {
  children: ReactNode;
  initialRoute?: Route;
}) {
  const [entry, setEntry] = useState<HistoryEntry>(() => {
    const existing: unknown = window.history.state;
    if (isEntry(existing)) return existing;
    const first = { route: initialRoute, depth: 0 };
    window.history.replaceState(first, "");
    return first;
  });

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      if (isEntry(event.state)) setEntry(event.state);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback(
    (route: Route) => {
      const next = { route, depth: entry.depth + 1 };
      window.history.pushState(next, "");
      setEntry(next);
      window.scrollTo(0, 0);
    },
    [entry.depth],
  );

  const back = useCallback(() => {
    if (entry.depth > 0) window.history.back();
    else navigate({ name: "home" });
  }, [entry.depth, navigate]);

  const value = useMemo(
    () => ({ route: entry.route, navigate, back, canGoBack: entry.depth > 0 }),
    [entry, navigate, back],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation(): NavigationValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigation must be used inside <NavigationProvider>");
  return ctx;
}
