import { useId, useState } from "react";
import { formatReference } from "../bible/reference";
import { findNote, useStudy } from "../lib/study";
import { useTranslation } from "../lib/translation";
import { usePassageText } from "../lib/usePassageText";
import { NOTE_MAX_LENGTH, spanToRef } from "../study/model";
import type { VerseSpan } from "../study/types";
import { Sheet } from "./Sheet";
import "./NoteEditor.css";

/**
 * Plain-text note on a verse or range: Save and Cancel, plus Delete (with a
 * confirmation step) for an existing note. Notes are stored on this device
 * only. Any script is accepted, including Malayalam.
 */
export function NoteEditor({ span, onClose }: { span: VerseSpan; onClose: () => void }) {
  const { notes, saveNote, deleteNote } = useStudy();
  const { repository, translation } = useTranslation();
  const existing = findNote(notes, span);
  const [text, setText] = useState(existing?.text ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const fieldId = useId();
  const ref = spanToRef(span);
  const passage = usePassageText(repository, translation.id, ref);
  const reference = formatReference(ref);

  const canSave = text.trim() !== "" && text !== existing?.text;

  const save = () => {
    if (!canSave) return;
    saveNote(span, text);
    onClose();
  };

  return (
    <Sheet title={existing ? `Note · ${reference}` : `Add a note · ${reference}`} onClose={onClose} className="note-editor">
      {passage && (
        <blockquote className="note-editor__passage" lang={translation.language}>
          {passage}
        </blockquote>
      )}

      {confirmingDelete ? (
        <div className="note-editor__confirm" role="alertdialog" aria-labelledby={`${fieldId}-confirm`}>
          <p id={`${fieldId}-confirm`}>Delete this note on {reference}? This can’t be undone.</p>
          <div className="note-editor__actions">
            <button type="button" className="btn btn--secondary" onClick={() => setConfirmingDelete(false)} autoFocus>
              Keep note
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => {
                if (existing) deleteNote(existing.id);
                onClose();
              }}
            >
              Delete note
            </button>
          </div>
        </div>
      ) : (
        <form
          className="note-editor__form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label htmlFor={fieldId} className="note-editor__label">
            Your note
          </label>
          <textarea
            id={fieldId}
            className="note-editor__field"
            value={text}
            maxLength={NOTE_MAX_LENGTH}
            rows={6}
            autoFocus
            placeholder="Write a thought, prayer or question…"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                save();
              }
            }}
          />
          <p className="note-editor__privacy">Saved only on this device.</p>
          <div className="note-editor__actions">
            {existing && (
              <button type="button" className="btn btn--text-danger" onClick={() => setConfirmingDelete(true)}>
                Delete
              </button>
            )}
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={!canSave}>
              Save
            </button>
          </div>
        </form>
      )}
    </Sheet>
  );
}
