/**
 * The active translation, shared by the Reader, Library and Settings.
 *
 * It is remembered across restarts. If the saved translation is no longer
 * installed, the default is used and `unavailableSavedId` lets Settings say so
 * instead of switching silently.
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { bible, DEFAULT_TRANSLATION_ID } from "../bible/translations";
import type { BibleRepository } from "../bible/translations";
import type { TranslationInfo } from "../bible/types";
import { loadTranslationId, saveTranslationId } from "./preferences";

interface TranslationValue {
  repository: BibleRepository;
  translation: TranslationInfo;
  installed: readonly TranslationInfo[];
  setTranslation: (id: string) => void;
  /** A saved id that could not be restored, until the user picks another. */
  unavailableSavedId: string | null;
}

const TranslationContext = createContext<TranslationValue | null>(null);

function initialState(repository: BibleRepository) {
  const saved = loadTranslationId();
  if (saved && repository.getTranslation(saved)) return { id: saved, unavailable: null };
  const fallback = repository.getTranslation(DEFAULT_TRANSLATION_ID)
    ? DEFAULT_TRANSLATION_ID
    : (repository.listTranslations()[0]?.id ?? DEFAULT_TRANSLATION_ID);
  return { id: fallback, unavailable: saved };
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
      saveTranslationId(id);
      setState({ id, unavailable: null });
    },
    [repository],
  );

  const value = useMemo<TranslationValue>(() => {
    const installed = repository.listTranslations();
    const translation = repository.getTranslation(state.id) ?? installed[0]!;
    return { repository, translation, installed, setTranslation, unavailableSavedId: state.unavailable };
  }, [repository, state, setTranslation]);

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation(): TranslationValue {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error("useTranslation must be used inside <TranslationProvider>");
  return ctx;
}
