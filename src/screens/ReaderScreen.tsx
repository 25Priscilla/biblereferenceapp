import { useCallback, useEffect, useState } from "react";
import { getBook } from "../bible/canon";
import { formatReference } from "../bible/reference";
import type { PassageRef } from "../bible/types";
import { BookNavigator } from "../components/BookNavigator";
import { Icon } from "../components/Icon";
import { JumpSheet } from "../components/JumpSheet";
import { PlaceholderNotice } from "../components/PlaceholderNotice";
import { ReferenceSearch } from "../components/ReferenceSearch";
import { TranslationMenu } from "../components/TranslationMenu";
import { useNavigation } from "../lib/navigation";
import { useTranslation } from "../lib/translation";
import { useChapter } from "../lib/useChapter";
import { PANEL_QUERY, useMediaQuery, WIDE_QUERY } from "../lib/useMediaQuery";
import "./ReaderScreen.css";

interface Selection {
  start: number;
  end: number;
}

/** Tap a verse to select it, tap another to extend to a range, tap again to clear. */
function nextSelection(current: Selection | null, verse: number): Selection | null {
  if (current && current.start === current.end) {
    if (current.start === verse) return null;
    return { start: Math.min(current.start, verse), end: Math.max(current.start, verse) };
  }
  return { start: verse, end: verse };
}

/**
 * Scripture reader. Kept deliberately quiet: a slim toolbar and the text.
 * Text comes from the active translation via the translation repository.
 */
export function ReaderScreen({ passage }: { passage: PassageRef }) {
  const { back, navigate } = useNavigation();
  const { repository, translation } = useTranslation();
  const wide = useMediaQuery(WIDE_QUERY);
  const withPanel = useMediaQuery(PANEL_QUERY);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(() =>
    passage.verse === undefined ? null : { start: passage.verse, end: passage.verseEnd ?? passage.verse },
  );
  const book = getBook(passage.book);
  const state = useChapter(repository, translation.id, passage.book, passage.chapter);
  const loaded = state.status === "done" && state.result.ok ? state.result.chapter : null;

  const prev = repository.previousChapter(translation.id, passage);
  const next = repository.nextChapter(translation.id, passage);
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
      if (e.altKey || e.ctrlKey || e.metaKey || target?.closest("input, textarea, [role=dialog], [role=menu]")) return;
      if (e.key === "ArrowLeft") go(prev);
      if (e.key === "ArrowRight") go(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wide, go, prev, next]);

  useEffect(() => {
    if (passage.verse === undefined || !loaded) return;
    document.getElementById(`v${passage.verse}`)?.scrollIntoView?.({ block: "start" });
  }, [passage.verse, loaded]);

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

  const shownRef: PassageRef = selection
    ? { book: book.id, chapter: passage.chapter, verse: selection.start, verseEnd: selection.end }
    : { book: book.id, chapter: passage.chapter };
  const chapterTitle = `${repository.bookName(translation.id, book.id)} ${passage.chapter}`;
  const isSelected = (n: number) => selection !== null && n >= selection.start && n <= selection.end;

  let content;
  if (state.status === "loading") {
    content = (
      <p className="reader__status" role="status">
        Opening {formatReference(shownRef)}…
      </p>
    );
  } else if (!state.result.ok) {
    content = (
      <div className="reader__unavailable" role="status">
        <p>{state.result.message}</p>
        <p className="reader__unavailable-hint">Choose another translation above, or another passage.</p>
        <button type="button" className="btn btn--secondary" onClick={() => navigate({ name: "books" })}>
          Browse books
        </button>
      </div>
    );
  } else {
    const chapter = state.result.chapter;
    const requestedEnd = passage.verseEnd ?? passage.verse;
    const outOfRange = requestedEnd !== undefined && requestedEnd > chapter.verseCount;
    const rows = [
      ...chapter.verses.map((v) => ({ number: v.number, text: v.text as string | null })),
      ...chapter.missing.map((n) => ({ number: n, text: null })),
    ].sort((a, b) => a.number - b.number);

    content = (
      <>
        {outOfRange && (
          <p className="reader__range-note" role="note">
            {chapterTitle} has {chapter.verseCount} verses in this translation, so verse {requestedEnd} isn’t
            shown.
          </p>
        )}

        <div className="reader__text" lang={translation.language}>
          {rows.map(({ number, text }) =>
            text === null ? (
              <p key={number} id={`v${number}`} className="verse verse--missing" lang="en">
                <span className="verse__number">{number}</span>
                Verse {number} is not included in the {translation.abbreviation} text.
              </p>
            ) : (
              <p
                key={number}
                id={`v${number}`}
                className={isSelected(number) ? "verse verse--target" : "verse"}
                onClick={() => setSelection((s) => nextSelection(s, number))}
              >
                <button
                  type="button"
                  className="verse__number"
                  aria-label={`Verse ${number}`}
                  aria-pressed={isSelected(number)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelection((s) => nextSelection(s, number));
                  }}
                >
                  {number}
                </button>
                {text}
              </p>
            ),
          )}
        </div>

        {translation.attribution && (
          <p className="reader__attribution" lang="en">
            {translation.attribution}
          </p>
        )}
      </>
    );
  }

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
            aria-label={`${formatReference(shownRef)}. Go to another passage`}
            onClick={() => setJumpOpen(true)}
          >
            <span>{formatReference(shownRef)}</span>
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
        <TranslationMenu />
      </header>

      <div className="reader__body">
        {translation.isPlaceholder && (
          <PlaceholderNotice>
            <strong>Sample data.</strong> {translation.name} is a test fixture, not a Bible translation.
            The lines below are not Scripture.
          </PlaceholderNotice>
        )}

        <h1 id="reader-title" className="reader__heading" lang={translation.language}>
          {chapterTitle}
        </h1>

        {content}

        {selection && loaded && (
          <div className="reader__selection" role="status">
            <span>{formatReference(shownRef)} selected</span>
            <button type="button" className="btn btn--secondary" onClick={() => setSelection(null)}>
              Clear
            </button>
          </div>
        )}

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
