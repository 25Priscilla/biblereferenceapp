/**
 * Personal library: saved study items (bookmarks, highlights, notes and
 * recent reading) in one tabbed section, then the translations.
 */

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { PLANNED_TRANSLATIONS } from "../bible/translations";
import { BookmarkList, HighlightList, NoteList, RecentList } from "../components/StudyLists";
import { TranslationList } from "../components/TranslationList";
import "./LibraryScreen.css";

const EXAMPLE_LABELS = ["Sermon", "Prayer", "Study"];

const TABS = [
  { id: "bookmarks", label: "Bookmarks" },
  { id: "highlights", label: "Highlights" },
  { id: "notes", label: "Notes" },
  { id: "recent", label: "Recent" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function LibraryScreen() {
  const [tab, setTab] = useState<TabId>("bookmarks");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Arrow keys move between tabs, as in any tab list.
  const onTabKey = (e: KeyboardEvent) => {
    const index = TABS.findIndex((t) => t.id === tab);
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    else return;
    e.preventDefault();
    const id = TABS[next]!.id;
    setTab(id);
    tabRefs.current[id]?.focus();
  };

  const panelLabel = `lib-tab-${tab}`;

  return (
    <div>
      <h1 className="screen-title">Library</h1>

      <section aria-labelledby="lib-study">
        <div className="section__header">
          <h2 id="lib-study" className="section__title">
            Your study
          </h2>
          <span className="list__meta">Saved on this device</span>
        </div>
        <div className="segmented library__tabs" role="tablist" aria-labelledby="lib-study" onKeyDown={onTabKey}>
          {TABS.map((t) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[t.id] = el;
              }}
              id={`lib-tab-${t.id}`}
              type="button"
              role="tab"
              className="segmented__option"
              aria-selected={tab === t.id}
              aria-controls="lib-tabpanel"
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div id="lib-tabpanel" role="tabpanel" aria-labelledby={panelLabel} className="library__panel">
          {tab === "bookmarks" && <BookmarkList labelledBy={panelLabel} />}
          {tab === "highlights" && <HighlightList labelledBy={panelLabel} />}
          {tab === "notes" && <NoteList labelledBy={panelLabel} />}
          {tab === "recent" && <RecentList labelledBy={panelLabel} />}
        </div>
      </section>

      <section className="section" aria-labelledby="lib-translations">
        <div className="section__header">
          <h2 id="lib-translations" className="section__title">
            Translations
          </h2>
          <span className="list__meta">Installed · works offline</span>
        </div>
        <TranslationList labelledBy="lib-translations" />

        {PLANNED_TRANSLATIONS.length > 0 && (
          <>
            <h3 id="lib-planned" className="library__subhead">
              Not installed
            </h3>
            <ul className="list" aria-labelledby="lib-planned">
              {PLANNED_TRANSLATIONS.map((t) => (
                <li key={t.id} className="list__item translation-list__planned">
                  <span className="translation-list__planned-head">
                    <span lang={t.language}>{t.name}</span>
                    <span className="chip">Not installed</span>
                  </span>
                  <span className="list__meta">
                    <span lang={t.language}>{t.languageName}</span> · {t.note}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="section" aria-labelledby="lib-labels">
        <div className="section__header">
          <h2 id="lib-labels" className="section__title">
            Labels
          </h2>
        </div>
        <p className="library__hint">Organise saved passages with simple labels, for example:</p>
        <ul className="library__labels" aria-label="Example labels">
          {EXAMPLE_LABELS.map((label) => (
            <li key={label} className="chip">
              {label}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
