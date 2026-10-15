import { Icon } from "./Icon";
import { useNavigation } from "../lib/navigation";
import type { TabName } from "../lib/navigation";
import { TABS } from "./tabs";
import "./Sidebar.css";

/** Desktop / tablet-landscape navigation. Replaces the bottom tab bar ≥ 900px. */
export function Sidebar({ active }: { active: TabName | null }) {
  const { navigate } = useNavigation();
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <p className="sidebar__wordmark">VersePath</p>
        <p className="sidebar__tagline">Every Scripture, One Tap Away.</p>
      </div>
      <nav aria-label="Main">
        <ul className="sidebar__list">
          {TABS.map((tab) => (
            <li key={tab.name}>
              <button
                type="button"
                className="sidebar__item"
                aria-current={tab.name === active ? "page" : undefined}
                onClick={() => navigate({ name: tab.name })}
              >
                <Icon name={tab.icon} size={22} />
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
