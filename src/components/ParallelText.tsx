import type { ChapterResult } from "../bible/translations";
import type { TranslationInfo } from "../bible/types";
import type { Note } from "../study/types";
import { TranslationMenu } from "./TranslationMenu";
import { NO_ANNOTATION, VerseMarkers, verseLabel } from "./VerseMarkers";
import type { VerseAnnotation } from "./VerseMarkers";
import "./ParallelText.css";

export interface ParallelColumn {
  info: TranslationInfo;
  result: ChapterResult;
  /** Localised chapter title, e.g. "യോഹന്നാന്‍ 3". */
  title: string;
  label: string;
  onChange: (id: string) => void;
}

/**
 * Two translations of one chapter, aligned verse by verse. Each verse number
 * is one row holding both translations, so the columns can never drift
 * apart: a verse one translation omits (or numbers differently) shows as
 * "not included" in that column instead of shifting the text. Side by side
 * when there is room, stacked pairs on narrow screens. Highlights, bookmarks
 * and notes belong to the verse row, so both columns always share them.
 */
export function ParallelText({
  columns,
  isSelected,
  onSelect,
  annotate = () => NO_ANNOTATION,
  onOpenNote = () => {},
}: {
  columns: [ParallelColumn, ParallelColumn];
  isSelected: (verse: number) => boolean;
  onSelect: (verse: number) => void;
  annotate?: (verse: number) => VerseAnnotation;
  onOpenNote?: (note: Note) => void;
}) {
  const texts = columns.map(({ result }) => {
    const byNumber = new Map<number, string>();
    if (result.ok) for (const v of result.chapter.verses) byNumber.set(v.number, v.text);
    return byNumber;
  });
  const lastVerse = Math.max(0, ...columns.map(({ result }) => (result.ok ? result.chapter.verseCount : 0)));
  const numbers = Array.from({ length: lastVerse }, (_, i) => i + 1);

  return (
    <div className="parallel">
      <div className="parallel__heads">
        {columns.map((col, i) => (
          <div key={i} className="parallel__head">
            <TranslationMenu value={col.info} onChange={col.onChange} label={col.label} align="start" />
            <span className="parallel__title" lang={col.info.language}>
              {col.title}
            </span>
            {!col.result.ok && (
              <p className="parallel__error" role="status">
                {col.result.message}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="parallel__rows">
        {numbers.map((n) => (
          <div
            key={n}
            id={`v${n}`}
            className={isSelected(n) ? "pverse verse--target" : "pverse"}
            data-hl={annotate(n).highlight}
            onClick={() => onSelect(n)}
          >
            <div className="pverse__gutter">
              <button
                type="button"
                className="verse__number pverse__number"
                aria-label={verseLabel(n, annotate(n))}
                aria-pressed={isSelected(n)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(n);
                }}
              >
                {n}
              </button>
              <VerseMarkers annotation={annotate(n)} onOpenNote={onOpenNote} />
            </div>
            {columns.map((col, i) => {
              const text = texts[i]!.get(n);
              if (!col.result.ok) return <div key={i} className="pverse__cell" aria-hidden="true" />;
              return text ? (
                <p key={i} className="pverse__cell" lang={col.info.language}>
                  <span className="pverse__tag" lang="en">
                    {col.info.abbreviation}
                  </span>
                  {text}
                </p>
              ) : (
                <p key={i} className="pverse__cell pverse__cell--missing" lang="en">
                  <span className="pverse__tag">{col.info.abbreviation}</span>
                  Verse {n} is not included in the {col.info.abbreviation} text.
                </p>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
