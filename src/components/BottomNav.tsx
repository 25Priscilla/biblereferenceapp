import { Icon } from "./Icon";
import type { IconName } from "./Icon";
import { useNavigation } from "../lib/navigation";
import type { TabName } from "../lib/navigation";
import "./BottomNav.css";

const TABS: { name: TabName; label: string; icon: IconName }[] = [
  { name: "home", label: "Home", icon: "home" },
  { name: "books", label: "Books", icon: "book" },
  { name: "library", label: "Library", icon: "bookmark" },
  { name: "settings", label: "Settings", icon: "settings" },
];

export function BottomNav({ active }: { active: TabName }) {
  const { navigate } = useNavigation();
  return (
    <nav className="bottom-nav" aria-label="Main">
      {TABS.map((tab) => (
        <button
          key={tab.name}
          type="button"
          className="bottom-nav__tab"
          aria-current={tab.name === active ? "page" : undefined}
          onClick={() => navigate({ name: tab.name })}
        >
          <Icon name={tab.icon} />
          <span className="bottom-nav__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
