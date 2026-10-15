import { useEffect, useRef, useState } from "react";
import { formatReference } from "../bible/reference";
import { findNote, useStudy } from "../lib/study";
import { chapterHighlights, sameSpan, spanToRef } from "../study/model";
import { HIGHLIGHT_COLORS } from "../study/types";
import type { HighlightColor, VerseSpan } from "../study/types";
import { Icon } from "./Icon";
import "./VerseActions.css";

export const HIGHLIGHT_LABELS: Record<HighlightColor, string> = {
  yellow: "Yellow",
  green: "Green",
  blue: "Blue",
  pink: "Pink",
};

/**
 * Actions for the selected verse or range, shown only while something is
 * selected so the text itself stays uncluttered: bookmark, highlight, note.
 */
export function VerseActions({
  span,
  onClear,
  onOpenNote,
}: {
  span: VerseSpan;
  onClear: () => void;
  onOpenNote: () => void;
}) {
  const { bookmarks, toggleBookmark, highlights, setHighlight, notes } = useStudy();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const reference = formatReference(spanToRef(span));
  const bookmarked = bookmarks.some((b) => sameSpan(b, span));
  const hasNote = findNote(notes, span) !== undefined;

  // The selection's colour when every verse in it shares one.
  const colours = chapterHighlights(highlights, span.book, span.chapter);
  const selected = new Set<HighlightColor | undefined>();
  for (let v = span.verse; v <= span.verseEnd; v++) selected.add(colours.get(v));
  const current = selected.size === 1 ? [...selected][0] : undefined;
  const anyHighlighted = [...selected].some((c) => c !== undefined);

  return (
    <div className="verse-actions" role="group" aria-label={`Actions for ${reference}`}>
      <div className="verse-actions__head">
        <span role="status">{reference} selected</span>
        <button type="button" className="btn btn--secondary verse-actions__clear" onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="verse-actions__row">
        <button
          type="button"
          className="verse-actions__btn"
          aria-pressed={bookmarked}
          onClick={() => toggleBookmark(span)}
        >
          <Icon name="bookmark" size={20} filled={bookmarked} />
          {bookmarked ? "Bookmarked" : "Bookmark"}
        </button>
        <HighlightPicker
          open={paletteOpen}
          setOpen={setPaletteOpen}
          current={current}
          anyHighlighted={anyHighlighted}
          onPick={(color) => setHighlight(span, color)}
        />
        <button type="button" className="verse-actions__btn" aria-haspopup="dialog" onClick={onOpenNote}>
          <Icon name="note" size={20} />
          {hasNote ? "Edit note" : "Note"}
        </button>
      </div>
    </div>
  );
}

function HighlightPicker({
  open,
  setOpen,
  current,
  anyHighlighted,
  onPick,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  current: HighlightColor | undefined;
  anyHighlighted: boolean;
  onPick: (color: HighlightColor | null) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    rootRef.current?.querySelector<HTMLElement>("[role=menuitemradio]")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, setOpen]);

  const pick = (color: HighlightColor | null) => {
    onPick(color);
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div className="highlight-picker" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="verse-actions__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="highlight-picker__icon" data-hl={current}>
          <Icon name="highlight" size={20} />
        </span>
        Highlight
      </button>
      {open && (
        <div className="highlight-picker__menu" role="menu" aria-label="Highlight colour">
          <div className="highlight-picker__swatches">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                role="menuitemradio"
                aria-checked={current === color}
                aria-label={HIGHLIGHT_LABELS[color]}
                title={HIGHLIGHT_LABELS[color]}
                className="highlight-picker__swatch"
                data-hl={color}
                onClick={() => pick(color)}
              />
            ))}
          </div>
          <button
            type="button"
            role="menuitem"
            className="highlight-picker__remove"
            disabled={!anyHighlighted}
            onClick={() => pick(null)}
          >
            Remove highlight
          </button>
        </div>
      )}
    </div>
  );
}
