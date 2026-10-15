/**
 * Personal library. Translations are chosen here; favorites, history,
 * labels and local persistence are built in Phase 4.
 */

import { PLANNED_TRANSLATIONS } from "../bible/translations";
import { TranslationList } from "../components/TranslationList";
import "./LibraryScreen.css";

const EXAMPLE_LABELS = ["Sermon", "Prayer", "Study"];

export function LibraryScreen() {
  return (
    <div>
      <h1 className="screen-title">Library</h1>

      <section aria-labelledby="lib-translations">
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

      <section className="section" aria-labelledby="lib-favorites">
        <div className="section__header">
          <h2 id="lib-favorites" className="section__title">
            Favorites
          </h2>
        </div>
        <p className="empty-state">No saved passages yet.</p>
      </section>

      <section className="section" aria-labelledby="lib-recent">
        <div className="section__header">
          <h2 id="lib-recent" className="section__title">
            History
          </h2>
        </div>
        <p className="empty-state">Your reading history will appear here.</p>
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
