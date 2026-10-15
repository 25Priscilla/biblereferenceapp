/**
 * The app's repository, wired to the bundled translation files in
 * src/data/bibles/<translationId>/<BOOK>.json.
 *
 * `import.meta.glob` makes each book a separate lazily loaded chunk that is
 * part of the app bundle, so reading never needs a network connection and
 * only the books actually opened are parsed.
 */

import { INSTALLED_TRANSLATIONS } from "./catalog";
import { createRepository } from "./repository";
import type { TranslationSource } from "./repository";

const BOOK_FILES = import.meta.glob<unknown>("../../data/bibles/*/*.json", { import: "default" });

function bundledSources(): TranslationSource[] {
  return INSTALLED_TRANSLATIONS.map((info) => {
    const loaders = new Map<string, () => Promise<unknown>>();
    for (const [path, load] of Object.entries(BOOK_FILES)) {
      const match = /\/bibles\/([^/]+)\/([0-9A-Z]{3})\.json$/.exec(path);
      if (match && match[1] === info.id) loaders.set(match[2]!, load);
    }
    return {
      info,
      books: [...loaders.keys()],
      loadBook: (book) => loaders.get(book)?.() ?? Promise.reject(new Error(`No file for ${book}`)),
    };
  });
}

export const bible = createRepository(bundledSources());

export { DEFAULT_TRANSLATION_ID, INSTALLED_TRANSLATIONS, PLANNED_TRANSLATIONS } from "./catalog";
export type { BibleRepository, ChapterResult, LookupError, TranslationSource } from "./repository";
