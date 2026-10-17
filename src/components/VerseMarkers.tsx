import { formatReference } from "../bible/reference";
import { spanToRef } from "../study/model";
import type { HighlightColor, Note } from "../study/types";
import { Icon } from "./Icon";
import { HIGHLIGHT_LABELS } from "./VerseActions";

/** What the reader shows on one verse number, regardless of translation. */
export interface VerseAnnotation {
  highlight?: HighlightColor;
  /** A bookmark starts at this verse. */
  bookmarked: boolean;
  /** Notes that start at this verse. */
  notes: Note[];
}

export const NO_ANNOTATION: VerseAnnotation = { bookmarked: false, notes: [] };

/**
 * Accessible name for a verse number, so highlights and notes are not
 * conveyed by colour alone. `through` is the end of a bridged verse.
 */
export function verseLabel(n: number, a: VerseAnnotation, through?: number): string {
  let label = through ? `Verses ${n}–${through}` : `Verse ${n}`;
  if (a.highlight) label += `, highlighted ${HIGHLIGHT_LABELS[a.highlight].toLowerCase()}`;
  if (a.bookmarked) label += ", bookmarked";
  if (a.notes.length) label += ", has a note";
  return label;
}

/** Small bookmark and note markers. The note marker opens the note. */
export function VerseMarkers({
  annotation,
  onOpenNote,
}: {
  annotation: VerseAnnotation;
  onOpenNote: (note: Note) => void;
}) {
  if (!annotation.bookmarked && annotation.notes.length === 0) return null;
  return (
    <span className="verse-markers">
      {annotation.bookmarked && (
        <span className="verse-markers__bookmark" title="Bookmarked">
          <Icon name="bookmark" size={14} filled />
        </span>
      )}
      {annotation.notes.map((note) => (
        <button
          key={note.id}
          type="button"
          className="verse-markers__note"
          aria-label={`Open note on ${formatReference(spanToRef(note))}`}
          title="Open note"
          onClick={(e) => {
            e.stopPropagation();
            onOpenNote(note);
          }}
        >
          <Icon name="note" size={16} />
        </button>
      ))}
    </span>
  );
}
