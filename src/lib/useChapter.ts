import { useEffect, useState } from "react";
import type { BibleRepository, ChapterResult } from "../bible/translations";

export type ChapterState = { status: "loading" } | { status: "done"; result: ChapterResult };

/** Loads a chapter through the repository, ignoring stale responses. */
export function useChapter(
  repository: BibleRepository,
  translationId: string,
  book: string,
  chapter: number,
): ChapterState {
  const key = `${translationId}/${book}/${chapter}`;
  const [state, setState] = useState<{ key: string; result: ChapterResult } | null>(null);

  useEffect(() => {
    let current = true;
    repository.loadChapter(translationId, book, chapter).then((result) => {
      if (current) setState({ key, result });
    });
    return () => {
      current = false;
    };
  }, [repository, translationId, book, chapter, key]);

  return state?.key === key ? { status: "done", result: state.result } : { status: "loading" };
}
