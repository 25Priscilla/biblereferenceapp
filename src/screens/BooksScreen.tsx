import { useId, useMemo, useState } from "react";
import { booksIn } from "../bible/canon";
import type { BookInfo, Testament } from "../bible/canon";
import { Icon } from "../components/Icon";
import { useNavigation } from "../lib/navigation";
import "./BooksScreen.css";

/**
 * Book → chapter selector.
 * Phase 1 filters by English book name only; alias search ("Jn", "Ps",
 * Malayalam names) and verse selection arrive in Phase 2.
 */
export function BooksScreen() {
  const { navigate } = useNavigation();
  const filterId = useId();
  const [testament, setTestament] = useState<Testament>("OT");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<BookInfo | null>(null);

  const books = useMemo(() => {
    const q = query.trim().toLowerCase();
    return booksIn(testament).filter((b) => !q || b.name.toLowerCase().includes(q));
  }, [testament, query]);

  if (selected) {
    return (
      <div>
        <div className="books__chapter-header">
          <button
            type="button"
            className="icon-btn"
            aria-label="Back to books"
            onClick={() => setSelected(null)}
          >
            <Icon name="back" />
          </button>
          <h1 className="screen-title books__chapter-title">{selected.name}</h1>
        </div>
        <p className="books__hint">Choose a chapter</p>
        <ol className="chapter-grid" aria-label={`${selected.name} chapters`}>
          {Array.from({ length: selected.chapters }, (_, i) => i + 1).map((chapter) => (
            <li key={chapter}>
              <button
                type="button"
                className="chapter-grid__cell"
                aria-label={`${selected.name} chapter ${chapter}`}
                onClick={() => navigate({ name: "reader", ref: { book: selected.id, chapter } })}
              >
                {chapter}
              </button>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div>
      <h1 className="screen-title">Books</h1>

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

      <label htmlFor={filterId} className="visually-hidden">
        Filter books
      </label>
      <input
        id={filterId}
        className="books__filter"
        type="search"
        placeholder="Filter books"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {books.length === 0 ? (
        <p className="empty-state">
          No {testament === "OT" ? "Old" : "New"} Testament book matches “{query.trim()}”.
        </p>
      ) : (
        <ul className="list">
          {books.map((book) => (
            <li key={book.id} className="list__item">
              <button type="button" className="list__button" onClick={() => setSelected(book)}>
                <span>{book.name}</span>
                <span className="list__meta">
                  {book.chapters} {book.chapters === 1 ? "chapter" : "chapters"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
