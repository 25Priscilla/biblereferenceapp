/**
 * Personal library. Phase 1 shows structure and empty states only;
 * favorites, history, labels and local persistence are built in Phase 4.
 */

import "./LibraryScreen.css";

const EXAMPLE_LABELS = ["Sermon", "Prayer", "Study"];

export function LibraryScreen() {
  return (
    <div>
      <h1 className="screen-title">Library</h1>

      <section aria-labelledby="lib-favorites">
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
