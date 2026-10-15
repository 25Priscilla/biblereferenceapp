import { useEffect, useState } from "react";
import type { BibleRepository } from "../bible/translations";
import type { PassageRef } from "../bible/types";

/**
 * Text of a verse or range in one translation, for short previews. Returns
 * null while loading or when the translation lacks the passage.
 */
export function usePassageText(repository: BibleRepository, translationId: string, ref: PassageRef): string | null {
  const key = `${translationId}/${ref.book}/${ref.chapter}/${ref.verse ?? ""}-${ref.verseEnd ?? ""}`;
  const [state, setState] = useState<{ key: string; text: string | null } | null>(null);
  const { book, chapter, verse, verseEnd } = ref;

  useEffect(() => {
    let current = true;
    repository.getVerseRange(translationId, { book, chapter, verse, verseEnd }).then((result) => {
      if (current) setState({ key, text: result.ok ? result.verses.map((v) => v.text).join(" ") : null });
    });
    return () => {
      current = false;
    };
  }, [repository, translationId, book, chapter, verse, verseEnd, key]);

  return state?.key === key ? state.text : null;
}
