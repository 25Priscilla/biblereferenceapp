import { useCallback, useEffect, useState } from "react";
import { getBook } from "../bible/canon";
import { nextChapter, previousChapter } from "../bible/chapterNav";
import { bookDisplayName, formatReference } from "../bible/reference";
import type { PassageRef } from "../bible/types";
import { BookNavigator } from "../components/BookNavigator";
import { Icon } from "../components/Icon";
import { JumpSheet } from "../components/JumpSheet";
import { PlaceholderNotice } from "../components/PlaceholderNotice";
import { ReferenceSearch } from "../components/ReferenceSearch";
import { PLACEHOLDER_TRANSLATION, placeholderChapter } from "../fixtures/placeholder";
import { useNavigation } from "../lib/navigation";
import { PANEL_QUERY, useMediaQuery, WIDE_QUERY } from "../lib/useMediaQuery";
import "./ReaderScreen.css";

/**
 * Scripture reader. Kept deliberately quiet: a slim toolbar and the text.
 * Placeholder fixtures only until verified translations land in Phase 3.
 */
export function ReaderScreen({ passage }: { passage: PassageRef }) {
  const { back, navigate } = useNavigation();
  const wide = useMediaQuery(WIDE_QUERY);
  const withPanel = useMediaQuery(PANEL_QUERY);
  const [jumpOpen, setJumpOpen] = useState(false);
  const book = getBook(passage.book);

  const prev = previousChapter(passage);
  const next = nextChapter(passage);
  // Stepping chapters replaces the history entry so Back leaves the reader
  // instead of rewinding chapter by chapter.
  const go = useCallback(
    (ref: PassageRef | null) => ref && navigate({ name: "reader", ref }, { replace: true }),
    [navigate],
  );

  useEffect(() => {
    if (!wide) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.altKey || e.ctrlKey || e.metaKey || target?.closest("input, textarea, [role=dialog]")) return;
      if (e.key === "ArrowLeft") go(prev);
      if (e.key === "ArrowRight") go(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wide, go, prev, next]);

  useEffect(() => {
    if (passage.verse === undefined) return;
    document.getElementById(`v${passage.verse}`)?.scrollIntoView?.({ block: "start" });
  }, [passage.verse]);

  if (!book || passage.chapter < 1 || passage.chapter > book.chapters) {
    return (
      <div className="reader__missing">
        <p>That passage could not be found.</p>
        <button type="button" className="btn btn--primary" onClick={() => navigate({ name: "books" })}>
          Browse books
        </button>
      </div>
    );
  }

  const chapter = placeholderChapter(book.id, passage.chapter, passage.verseEnd ?? passage.verse);
  const chapterTitle = `${bookDisplayName(book)} ${passage.chapter}`;
  const lastVerse = chapter.verses.length;
  const requestedEnd = passage.verseEnd ?? passage.verse;
  const outOfRange = requestedEnd !== undefined && requestedEnd > lastVerse;
  const isTarget = (n: number) =>
    passage.verse !== undefined && n >= passage.verse && n <= (passage.verseEnd ?? passage.verse);

  const article = (
    <article className="reader__article" aria-labelledby="reader-title">
      <header className="reader__bar">
        {!wide && (
          <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
            <Icon name="back" />
          </button>
        )}
        <div className="reader__pager">
          <button
            type="button"
            className="icon-btn"
            aria-label={prev ? `Previous chapter: ${formatReference(prev)}` : "No previous chapter"}
            disabled={!prev}
            onClick={() => go(prev)}
          >
            <Icon name="back" size={20} />
          </button>
          <button
            type="button"
            className="reader__ref"
            aria-haspopup="dialog"
            aria-label={`${formatReference(passage)}. Go to another passage`}
            onClick={() => setJumpOpen(true)}
          >
            <span>{formatReference(passage)}</span>
            <Icon name="chevronDown" size={18} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={next ? `Next chapter: ${formatReference(next)}` : "No next chapter"}
            disabled={!next}
            onClick={() => go(next)}
          >
            <Icon name="chevron" size={20} />
          </button>
        </div>
        {wide && (
          <div className="reader__bar-search">
            <ReferenceSearch compact label="Jump to a reference" />
          </div>
        )}
        <span
          className="reader__translation"
          title={PLACEHOLDER_TRANSLATION.name}
          aria-label={`Translation: ${PLACEHOLDER_TRANSLATION.name}`}
        >
          {PLACEHOLDER_TRANSLATION.abbreviation}
        </span>
      </header>

      <div className="reader__body">
        <PlaceholderNotice>
          <strong>Placeholder text.</strong> No Bible translation is installed yet. The lines below
          only demonstrate the reading layout and are not Scripture.
        </PlaceholderNotice>

        <h1 id="reader-title" className="reader__heading">
          {chapterTitle}
        </h1>

        {outOfRange && (
          <p className="reader__range-note" role="note">
            {chapterTitle} has {lastVerse} verses in this translation, so verse {requestedEnd} isn’t
            shown.
          </p>
        )}

        <div className="reader__text">
          {chapter.verses.map((verse) => (
            <p
              key={verse.number}
              id={`v${verse.number}`}
              className={isTarget(verse.number) ? "verse verse--target" : "verse"}
            >
              <sup className="verse__number" aria-label={`Verse ${verse.number}`}>
                {verse.number}
              </sup>
              {verse.text}
            </p>
          ))}
        </div>

        <nav className="chapter-pager" aria-label="Chapter navigation">
          {prev ? (
            <button type="button" className="chapter-pager__btn" onClick={() => go(prev)}>
              <Icon name="back" size={20} />
              <span>
                <span className="chapter-pager__hint">Previous</span>
                {formatReference(prev)}
              </span>
            </button>
          ) : (
            <span />
          )}
          {next ? (
            <button
              type="button"
              className="chapter-pager__btn chapter-pager__btn--next"
              onClick={() => go(next)}
            >
              <span>
                <span className="chapter-pager__hint">Next</span>
                {formatReference(next)}
              </span>
              <Icon name="chevron" size={20} />
            </button>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </article>
  );

  return (
    <div className={withPanel ? "reader reader--wide reader--panel" : wide ? "reader reader--wide" : "reader"}>
      {withPanel && (
        <aside className="reader__panel" aria-label="Books and chapters">
          <BookNavigator
            variant="panel"
            current={passage}
            onChoose={(ref) => navigate({ name: "reader", ref })}
          />
        </aside>
      )}
      {article}
      {jumpOpen && <JumpSheet current={passage} onClose={() => setJumpOpen(false)} />}
    </div>
  );
}
