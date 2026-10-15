/**
 * Personal study data (bookmarks, highlights, notes, reading history) shared
 * by the Reader, Library and Home. Loaded once from local storage and saved
 * after every change; see src/study/storage.ts.
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { PassageRef } from "../bible/types";
import * as model from "../study/model";
import { loadStudyData, saveCollection } from "../study/storage";
import type { StudyCollection } from "../study/storage";
import type { HighlightColor, Note, StudyData, VerseSpan } from "../study/types";

interface StudyValue extends StudyData {
  toggleBookmark: (span: VerseSpan) => void;
  removeBookmark: (id: string) => void;
  /** `null` removes the highlight from every verse in the span. */
  setHighlight: (span: VerseSpan, color: HighlightColor | null) => void;
  saveNote: (span: VerseSpan, text: string) => void;
  deleteNote: (id: string) => void;
  recordReading: (ref: PassageRef) => void;
  clearHistory: () => void;
}

const StudyContext = createContext<StudyValue | null>(null);

export function StudyProvider({ children, now = Date.now }: { children: ReactNode; now?: () => number }) {
  const [data, setData] = useState<StudyData>(loadStudyData);

  /** Applies a change to one collection and saves it if anything changed. */
  const update = useCallback(<K extends StudyCollection>(name: K, change: (items: StudyData[K]) => StudyData[K]) => {
    setData((current) => {
      const next = change(current[name]);
      if (next === current[name]) return current;
      saveCollection(name, next);
      return { ...current, [name]: next };
    });
  }, []);

  const toggleBookmark = useCallback(
    (span: VerseSpan) => update("bookmarks", (list) => model.toggleBookmark(list, span, now())),
    [update, now],
  );
  const removeBookmark = useCallback(
    (id: string) => update("bookmarks", (list) => model.removeBookmark(list, id)),
    [update],
  );
  const setHighlight = useCallback(
    (span: VerseSpan, color: HighlightColor | null) =>
      update("highlights", (list) => model.setHighlight(list, span, color, now())),
    [update, now],
  );
  const saveNote = useCallback(
    (span: VerseSpan, text: string) => {
      if (!text.trim()) return;
      update("notes", (list) => model.saveNote(list, span, text, now()));
    },
    [update, now],
  );
  const deleteNote = useCallback((id: string) => update("notes", (list) => model.deleteNote(list, id)), [update]);
  const recordReading = useCallback(
    (ref: PassageRef) => update("history", (list) => model.recordReading(list, ref, now())),
    [update, now],
  );
  const clearHistory = useCallback(() => update("history", (list) => (list.length ? [] : list)), [update]);

  const value = useMemo<StudyValue>(
    () => ({
      ...data,
      toggleBookmark,
      removeBookmark,
      setHighlight,
      saveNote,
      deleteNote,
      recordReading,
      clearHistory,
    }),
    [data, toggleBookmark, removeBookmark, setHighlight, saveNote, deleteNote, recordReading, clearHistory],
  );

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy(): StudyValue {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error("useStudy must be used inside <StudyProvider>");
  return ctx;
}

/** The note saved for exactly this passage, if any. */
export function findNote(notes: readonly Note[], span: VerseSpan): Note | undefined {
  return notes.find((n) => model.sameSpan(n, span));
}
