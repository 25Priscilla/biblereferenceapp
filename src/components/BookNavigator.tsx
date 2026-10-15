import { useId, useMemo, useState } from "react";
import { BOOKS, booksIn, getBook } from "../bible/canon";
import type { BookInfo, Testament } from "../bible/canon";
import { resolveBook } from "../bible/reference";
import type { PassageRef } from "../bible/types";
import { Icon } from "./Icon";
import "./BookNavigator.css";

/**
 * Book → chapter picker shared by the Books screen, the reader's jump sheet
 * and the desktop reader side panel.
 *
 * The filter matches book names and abbreviations ("Jn", "1 Cor", "Ps").
 * Verse picking needs per-translation verse counts and arrives with the
 * translation data in Phase 3; verses can already be typed ("John 3:16").
 */
export function BookNavigator({
  onChoose,
  current,
  variant = "page",
  sideBySide = false,
}: {
  onChoose: (ref: PassageRef) => void;
  /** Passage being read; opens its book and marks its chapter. */
  current?: PassageRef;
  /** "page" for the Books screen, "panel" for the reader sheet / sidebar. */
  variant?: "page" | "panel";
  /** Show Old and New Testament columns together (wide screens). */
  sideBySide?: boolean;
}) {
  const filterId = useId();
  const [selected, setSelected] = useState<BookInfo | null>(
    () => (current && getBook(current.book)) || null,
  );
  const [testament, setTestament] = useState<Testament>(() => selected?.testament ?? "OT");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => filterBooks(query), [query]);

  if (selected) {
    return (
      <div className={`book-nav book-nav--${variant}`}>
        <div className="book-nav__chapter-header">
          <button
            type="button"
            className="icon-btn"
            aria-label="All books"
            onClick={() => {
              setTestament(selected.testament);
              setSelected(null);
            }}
          >
            <Icon name="back" />
          </button>
          <h2 className="book-nav__book-title">{selected.name}</h2>
        </div>
        <ol className="chapter-grid" aria-label={`${selected.name} chapters`}>
          {Array.from({ length: selected.chapters }, (_, i) => i + 1).map((chapter) => {
            const isCurrent = current?.book === selected.id && current.chapter === chapter;
            return (
              <li key={chapter}>
                <button
                  type="button"
                  className="chapter-grid__cell"
                  aria-label={`${selected.name} chapter ${chapter}`}
                  aria-current={isCurrent ? "page" : undefined}
                  onClick={() => onChoose({ book: selected.id, chapter })}
                >
                  {chapter}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  const searching = query.trim() !== "";

  return (
    <div className={`book-nav book-nav--${variant}`}>
      <div className="book-nav__controls">
        {!sideBySide && !searching && (
          <div className="segmented" role="group" aria-label="Testament">
            {(["OT", "NT"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className="segmented__option"
                aria-pressed={testament === t}
                onClick={() => setTestament(t)}
              >
                {t === "OT" ? "Old Testament" : "New Testament"}
              </button>
            ))}
          </div>
        )}
        <label htmlFor={filterId} className="visually-hidden">
          Filter books
        </label>
        <input
          id={filterId}
          className="book-nav__filter"
          type="search"
          placeholder="Filter books, e.g. Jn or 1 Cor"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {searching ? (
        filtered.length === 0 ? (
          <p className="empty-state">No book matches “{query.trim()}”.</p>
        ) : (
          <BookList books={filtered} onSelect={setSelected} />
        )
      ) : sideBySide ? (
        <div className="book-nav__columns">
          {(["OT", "NT"] as const).map((t) => (
            <section key={t} aria-labelledby={`${filterId}-${t}`}>
              <h2 id={`${filterId}-${t}`} className="section__title book-nav__column-title">
                {t === "OT" ? "Old Testament" : "New Testament"}
              </h2>
              <BookList books={booksIn(t)} onSelect={setSelected} columns />
            </section>
          ))}
        </div>
      ) : (
        <BookList books={booksIn(testament)} onSelect={setSelected} />
      )}
    </div>
  );
}

function BookList({
  books,
  onSelect,
  columns = false,
}: {
  books: BookInfo[];
  onSelect: (book: BookInfo) => void;
  columns?: boolean;
}) {
  return (
    <ul className={columns ? "list book-nav__list book-nav__list--columns" : "list book-nav__list"}>
      {books.map((book) => (
        <li key={book.id} className="list__item">
          <button type="button" className="list__button" onClick={() => onSelect(book)}>
            <span>{book.name}</span>
            <span className="list__meta">{book.chapters}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Name substring matches, plus whatever the reference resolver recognises. */
export function filterBooks(query: string): BookInfo[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...BOOKS];
  const match = resolveBook(q);
  const ids = new Set<string>();
  if (match.kind === "found") ids.add(match.book.id);
  if (match.kind === "ambiguous") match.candidates.forEach((b) => ids.add(b.id));
  return BOOKS.filter((b) => ids.has(b.id) || b.name.toLowerCase().includes(q));
}
