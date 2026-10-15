/**
 * The active translation(s) and reading mode, shared by the Reader, Library
 * and Settings.
 *
 * Everything is remembered across restarts. If the saved translation is no
 * longer installed, the default is used and `unavailableSavedId` lets
 * Settings say so instead of switching silently.
 *
 * Parallel reading shows `translation` in the first column and `parallel` in
 * the second. The two are always different: choosing the other column's
 * translation swaps them.
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { bible, DEFAULT_TRANSLATION_ID } from "../bible/translations";
import type { BibleRepository } from "../bible/translations";
import type { TranslationInfo } from "../bible/types";
import {
  loadParallelTranslationId,
  loadReadingMode,
  loadTranslationId,
  saveParallelTranslationId,
  saveReadingMode,
  saveTranslationId,
} from "./preferences";
import type { ReadingMode } from "./preferences";

interface TranslationValue {
  repository: BibleRepository;
  translation: TranslationInfo;
  /** Second column in parallel mode; null when only one translation is installed. */
  parallel: TranslationInfo | null;
  installed: readonly TranslationInfo[];
  setTranslation: (id: string) => void;
  setParallelTranslation: (id: string) => void;
  readingMode: ReadingMode;
  setReadingMode: (mode: ReadingMode) => void;
  /** A saved id that could not be restored, until the user picks another. */
  unavailableSavedId: string | null;
}

interface State {
  primary: string;
  secondary: string | null;
  mode: ReadingMode;
  unavailable: string | null;
}

const TranslationContext = createContext<TranslationValue | null>(null);

/** The saved second translation if valid, else the first installed one that differs. */
function pickSecondary(repository: BibleRepository, primary: string, preferred: string | null): string | null {
  if (preferred && preferred !== primary && repository.getTranslation(preferred)) return preferred;
  return repository.listTranslations().find((t) => t.id !== primary)?.id ?? null;
}

function initialState(repository: BibleRepository): State {
  const saved = loadTranslationId();
  let primary = saved;
  let unavailable: string | null = null;
  if (!primary || !repository.getTranslation(primary)) {
    unavailable = saved;
    primary = repository.getTranslation(DEFAULT_TRANSLATION_ID)
      ? DEFAULT_TRANSLATION_ID
      : (repository.listTranslations()[0]?.id ?? DEFAULT_TRANSLATION_ID);
  }
  const secondary = pickSecondary(repository, primary, loadParallelTranslationId());
  return { primary, secondary, mode: secondary ? loadReadingMode() : "single", unavailable };
}

export function TranslationProvider({
  children,
  repository = bible,
}: {
  children: ReactNode;
  repository?: BibleRepository;
}) {
  const [state, setState] = useState(() => initialState(repository));

  const setTranslation = useCallback(
    (id: string) => {
      if (!repository.getTranslation(id)) return;
      setState((s) => {
        const secondary = id === s.secondary ? s.primary : s.secondary;
        saveTranslationId(id);
        if (secondary) saveParallelTranslationId(secondary);
        return { ...s, primary: id, secondary, unavailable: null };
      });
    },
    [repository],
  );

  const setParallelTranslation = useCallback(
    (id: string) => {
      if (!repository.getTranslation(id)) return;
      setState((s) => {
        const primary = id === s.primary ? (s.secondary ?? s.primary) : s.primary;
        saveParallelTranslationId(id);
        saveTranslationId(primary);
        return { ...s, primary, secondary: id };
      });
    },
    [repository],
  );

  const setReadingMode = useCallback((mode: ReadingMode) => {
    saveReadingMode(mode);
    setState((s) => ({ ...s, mode: s.secondary ? mode : "single" }));
  }, []);

  const value = useMemo<TranslationValue>(() => {
    const installed = repository.listTranslations();
    const translation = repository.getTranslation(state.primary) ?? installed[0]!;
    const parallel = (state.secondary && repository.getTranslation(state.secondary)) || null;
    return {
      repository,
      translation,
      parallel,
      installed,
      setTranslation,
      setParallelTranslation,
      readingMode: parallel ? state.mode : "single",
      setReadingMode,
      unavailableSavedId: state.unavailable,
    };
  }, [repository, state, setTranslation, setParallelTranslation, setReadingMode]);

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation(): TranslationValue {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error("useTranslation must be used inside <TranslationProvider>");
  return ctx;
}
