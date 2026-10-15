import { useCallback, useEffect, useState } from "react";
import { getBook } from "../bible/canon";
import { formatReference } from "../bible/reference";
import type { PassageRef } from "../bible/types";
import { BookNavigator } from "../components/BookNavigator";
import { Icon } from "../components/Icon";
import { JumpSheet } from "../components/JumpSheet";
import { NoteEditor } from "../components/NoteEditor";
import { ParallelText } from "../components/ParallelText";
import { PlaceholderNotice } from "../components/PlaceholderNotice";
import { ReferenceSearch } from "../components/ReferenceSearch";
import { TranslationMenu } from "../components/TranslationMenu";
import { VerseActions } from "../components/VerseActions";
import { NO_ANNOTATION, VerseMarkers, verseLabel } from "../components/VerseMarkers";
import type { VerseAnnotation } from "../components/VerseMarkers";
import { useNavigation } from "../lib/navigation";
import { useStudy } from "../lib/study";
import { useTranslation } from "../lib/translation";
import { useChapter } from "../lib/useChapter";
import { PANEL_QUERY, useMediaQuery, WIDE_QUERY } from "../lib/useMediaQuery";
import { chapterHighlights } from "../study/model";
import type { Note, VerseSpan } from "../study/types";
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
 * In parallel mode a second translation is shown verse by verse alongside;
 * navigation, the passage and verse selection are shared by both columns.
 */
export function ReaderScreen({ passage }: { passage: PassageRef }) {
  const { back, navigate } = useNavigation();
  const {
    repository,
    translation,
    parallel,
    readingMode,
    setReadingMode,
    setTranslation,
    setParallelTranslation,
  } = useTranslation();
  const isParallel = readingMode === "parallel" && parallel !== null;
  const wide = useMediaQuery(WIDE_QUERY);
  const withPanel = useMediaQuery(PANEL_QUERY);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [noteSpan, setNoteSpan] = useState<VerseSpan | null>(null);
  const { highlights, bookmarks, notes, recordReading } = useStudy();
  const [selection, setSelection] = useState<Selection | null>(() =>
    passage.verse === undefined ? null : { start: passage.verse, end: passage.verseEnd ?? passage.verse },
  );
  const book = getBook(passage.book);
  const state = useChapter(repository, translation.id, passage.book, passage.chapter);
  // In single mode this resolves to the same cached book as `state`.
  const second = useChapter(repository, (isParallel && parallel?.id) || translation.id, passage.book, passage.chapter);
  const ready = state.status === "done" && (!isParallel || second.status === "done");
  const anyLoaded =
    (state.status === "done" && state.result.ok) || (isParallel && second.status === "done" && second.result.ok);

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

  // Reading history: the passage as opened, then the latest selection in it.
  const validPassage = book !== undefined && passage.chapter >= 1 && passage.chapter <= book.chapters;
  useEffect(() => {
    if (!validPassage) return;
    const ref: PassageRef = { book: passage.book, chapter: passage.chapter };
    if (selection) {
      ref.verse = selection.start;
      if (selection.end !== selection.start) ref.verseEnd = selection.end;
    }
    recordReading(ref);
  }, [validPassage, passage.book, passage.chapter, selection, recordReading]);

  useEffect(() => {
    if (passage.verse === undefined || !ready) return;
    document.getElementById(`v${passage.verse}`)?.scrollIntoView?.({ block: "start" });
  }, [passage.verse, ready, isParallel]);

  if (!book || !validPassage) {
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

  const select = (n: number) => setSelection((s) => nextSelection(s, n));
  const selectedSpan: VerseSpan | null = selection
    ? { book: book.id, chapter: passage.chapter, verse: selection.start, verseEnd: selection.end }
    : null;

  // Study marks are keyed by verse number, so they apply to every translation
  // and to both columns in parallel reading.
  const colours = chapterHighlights(highlights, book.id, passage.chapter);
  const annotations = new Map<number, VerseAnnotation>();
  const annotationAt = (n: number) => {
    let a = annotations.get(n);
    if (!a) annotations.set(n, (a = { bookmarked: false, notes: [] }));
    return a;
  };
  for (const [n, color] of colours) annotationAt(n).highlight = color;
  for (const b of bookmarks) if (b.book === book.id && b.chapter === passage.chapter) annotationAt(b.verse).bookmarked = true;
  for (const note of notes) if (note.book === book.id && note.chapter === passage.chapter) annotationAt(note.verse).notes.push(note);
  const annotate = (n: number) => annotations.get(n) ?? NO_ANNOTATION;
  const openNote = (note: Note) => setNoteSpan(note);
  const requestedEnd = passage.verseEnd ?? passage.verse;

  let content;
  if (!ready) {
    content = (
      <p className="reader__status" role="status">
        Opening {formatReference(shownRef)}…
      </p>
    );
  } else if (isParallel && parallel && second.status === "done") {
    const results = [state.result, second.result];
    const counts = results.map((r) => (r.ok ? r.chapter.verseCount : 0));
    const outOfRange =
      requestedEnd !== undefined && results.some((r) => r.ok) && requestedEnd > Math.max(...counts);
    content = (
      <>
        {outOfRange && (
          <p className="reader__range-note" role="note">
            {chapterTitle} has {Math.max(...counts)} verses in these translations, so verse {requestedEnd}{" "}
            isn’t shown.
          </p>
        )}
        <ParallelText
          columns={[
            {
              info: translation,
              result: state.result,
              title: chapterTitle,
              label: "First column",
              onChange: setTranslation,
            },
            {
              info: parallel,
              result: second.result,
              title: `${repository.bookName(parallel.id, book.id)} ${passage.chapter}`,
              label: "Second column",
              onChange: setParallelTranslation,
            },
          ]}
          isSelected={isSelected}
          onSelect={select}
          annotate={annotate}
          onOpenNote={openNote}
        />
        {[translation, parallel].map(
          (t) =>
            t.attribution && (
              <p key={t.id} className="reader__attribution" lang="en">
                {t.attribution}
              </p>
            ),
        )}
      </>
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
                data-hl={annotate(number).highlight}
                onClick={() => select(number)}
              >
                <button
                  type="button"
                  className="verse__number"
                  aria-label={verseLabel(number, annotate(number))}
                  aria-pressed={isSelected(number)}
                  onClick={(e) => {
                    e.stopPropagation();
                    select(number);
                  }}
                >
                  {number}
                </button>
                {text}
                <VerseMarkers annotation={annotate(number)} onOpenNote={openNote} />
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
        {!isParallel && <TranslationMenu value={translation} onChange={setTranslation} />}
        {parallel && (
          <button
            type="button"
            className={isParallel ? "icon-btn reader__mode reader__mode--on" : "icon-btn reader__mode"}
            aria-label="Parallel reading"
            aria-pressed={isParallel}
            title={isParallel ? "Show one translation" : "Show two translations side by side"}
            onClick={() => setReadingMode(isParallel ? "single" : "parallel")}
          >
            <Icon name="columns" size={20} />
          </button>
        )}
      </header>

      <div className={isParallel ? "reader__body reader__body--parallel" : "reader__body"}>
        {(translation.isPlaceholder || (isParallel && parallel?.isPlaceholder)) && (
          <PlaceholderNotice>
            <strong>Sample data.</strong> {translation.isPlaceholder ? translation.name : parallel?.name} is
            a test fixture, not a Bible translation. Its lines are not Scripture.
          </PlaceholderNotice>
        )}

        <h1 id="reader-title" className="reader__heading" lang={translation.language}>
          {chapterTitle}
        </h1>

        {content}

        {selectedSpan && ready && anyLoaded && (
          <VerseActions
            span={selectedSpan}
            onClear={() => setSelection(null)}
            onOpenNote={() => setNoteSpan(selectedSpan)}
          />
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
      {noteSpan && <NoteEditor span={noteSpan} onClose={() => setNoteSpan(null)} />}
    </div>
  );
}
