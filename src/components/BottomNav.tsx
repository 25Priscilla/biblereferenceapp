import { Icon } from "./Icon";
import { useNavigation } from "../lib/navigation";
import type { TabName } from "../lib/navigation";
import { TABS } from "./tabs";
import "./BottomNav.css";

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
