/**
 * Lists of saved study items for the Library and Home. Each row opens its
 * passage in the reader; previews use the current translation, because the
 * saved items themselves are independent of translation.
 */

import { useState } from "react";
import type { ReactNode } from "react";
import { formatReference } from "../bible/reference";
import type { PassageRef } from "../bible/types";
import { useNavigation } from "../lib/navigation";
import { useStudy } from "../lib/study";
import { useTranslation } from "../lib/translation";
import { usePassageText } from "../lib/usePassageText";
import { groupHighlights, historyToRef, spanToRef } from "../study/model";
import type { Note } from "../study/types";
import { Icon } from "./Icon";
import { NoteEditor } from "./NoteEditor";
import { HIGHLIGHT_LABELS } from "./VerseActions";
import "./StudyLists.css";

/** "Today, 14:05", "Yesterday, 09:30", "3 Oct" or "3 Oct 2025". */
export function formatWhen(time: number, now = Date.now()): string {
  const date = new Date(time);
  const today = new Date(now);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const clock = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (time >= startOfToday) return `Today, ${clock}`;
  if (time >= startOfToday - 86_400_000) return `Yesterday, ${clock}`;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() !== today.getFullYear() && { year: "numeric" }),
  });
}

function Preview({ passage }: { passage: PassageRef }) {
  const { repository, translation } = useTranslation();
  const text = usePassageText(repository, translation.id, passage);
  if (!text) return null;
  return (
    <span className="study-item__preview" lang={translation.language}>
      {text}
    </span>
  );
}

function StudyItem({
  passage,
  children,
  preview = true,
  meta,
  actions,
}: {
  passage: PassageRef;
  /** Body shown under the reference instead of the text preview. */
  children?: ReactNode;
  preview?: boolean;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  const { navigate } = useNavigation();
  return (
    <li className="list__item study-item">
      <button
        type="button"
        className="study-item__open"
        onClick={() => navigate({ name: "reader", ref: passage })}
      >
        <span className="study-item__head">
          <span className="study-item__ref">{formatReference(passage)}</span>
          {meta && <span className="study-item__meta">{meta}</span>}
        </span>
        {children ?? (preview && <Preview passage={passage} />)}
      </button>
      {actions && <span className="study-item__actions">{actions}</span>}
    </li>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="icon-btn study-item__action" aria-label={label} title={label} onClick={onClick}>
      <Icon name="trash" size={20} />
    </button>
  );
}

export function BookmarkList({ limit, labelledBy }: { limit?: number; labelledBy?: string }) {
  const { bookmarks, removeBookmark } = useStudy();
  if (bookmarks.length === 0) {
    return <p className="empty-state">No bookmarks yet. Select a verse in the reader and tap Bookmark.</p>;
  }
  return (
    <ul className="list" aria-labelledby={labelledBy}>
      {bookmarks.slice(0, limit).map((b) => {
        const ref = spanToRef(b);
        return (
          <StudyItem
            key={b.id}
            passage={ref}
            actions={
              limit === undefined && (
                <RemoveButton label={`Remove bookmark ${formatReference(ref)}`} onClick={() => removeBookmark(b.id)} />
              )
            }
          />
        );
      })}
    </ul>
  );
}

export function HighlightList({ labelledBy }: { labelledBy?: string }) {
  const { highlights, setHighlight } = useStudy();
  const groups = groupHighlights(highlights);
  if (groups.length === 0) {
    return <p className="empty-state">No highlights yet. Select verses in the reader and choose a colour.</p>;
  }
  return (
    <ul className="list" aria-labelledby={labelledBy}>
      {groups.map((g) => {
        const ref = spanToRef(g);
        return (
          <StudyItem
            key={`${g.book}.${g.chapter}.${g.verse}`}
            passage={ref}
            meta={
              <span className="study-item__colour" data-hl={g.color}>
                {HIGHLIGHT_LABELS[g.color]}
              </span>
            }
            actions={
              <RemoveButton label={`Remove highlight ${formatReference(ref)}`} onClick={() => setHighlight(g, null)} />
            }
          />
        );
      })}
    </ul>
  );
}

export function NoteList({ labelledBy }: { labelledBy?: string }) {
  const { notes } = useStudy();
  const [editing, setEditing] = useState<Note | null>(null);
  if (notes.length === 0) {
    return <p className="empty-state">No notes yet. Select a verse in the reader and tap Note.</p>;
  }
  return (
    <>
      <ul className="list" aria-labelledby={labelledBy}>
        {notes.map((n) => {
          const ref = spanToRef(n);
          return (
            <StudyItem
              key={n.id}
              passage={ref}
              meta={formatWhen(n.updatedAt)}
              actions={
                <button
                  type="button"
                  className="icon-btn study-item__action"
                  aria-label={`Edit note on ${formatReference(ref)}`}
                  title="Edit note"
                  onClick={() => setEditing(n)}
                >
                  <Icon name="note" size={20} />
                </button>
              }
            >
              <span className="study-item__note">{n.text}</span>
            </StudyItem>
          );
        })}
      </ul>
      {editing && <NoteEditor span={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

export function RecentList({ limit, labelledBy }: { limit?: number; labelledBy?: string }) {
  const { history, clearHistory } = useStudy();
  const [confirming, setConfirming] = useState(false);
  if (history.length === 0) {
    return <p className="empty-state">Passages you open will appear here.</p>;
  }
  return (
    <>
      <ul className="list" aria-labelledby={labelledBy}>
        {history.slice(0, limit).map((h) => (
          <StudyItem
            key={`${h.book}.${h.chapter}`}
            passage={historyToRef(h)}
            meta={formatWhen(h.openedAt)}
            preview={false}
          />
        ))}
      </ul>
      {limit === undefined && (
        <div className="study-list__footer">
          {confirming ? (
            <>
              <span role="status">Clear your reading history?</span>
              <button type="button" className="btn btn--secondary" onClick={() => setConfirming(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => {
                  clearHistory();
                  setConfirming(false);
                }}
              >
                Clear
              </button>
            </>
          ) : (
            <button type="button" className="btn btn--text-danger" onClick={() => setConfirming(true)}>
              Clear history
            </button>
          )}
        </div>
      )}
    </>
  );
}
