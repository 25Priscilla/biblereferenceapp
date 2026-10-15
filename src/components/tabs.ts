import type { IconName } from "./Icon";
import type { TabName } from "../lib/navigation";

/** Primary destinations, shared by the bottom tab bar and the sidebar. */
export const TABS: readonly { name: TabName; label: string; icon: IconName }[] = [
  { name: "home", label: "Home", icon: "home" },
  { name: "books", label: "Books", icon: "book" },
  { name: "library", label: "Library", icon: "bookmark" },
  { name: "settings", label: "Settings", icon: "settings" },
];
