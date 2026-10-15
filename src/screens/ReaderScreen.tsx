import { getBook } from "../bible/canon";
import type { PassageRef } from "../bible/types";
import { Icon } from "../components/Icon";
import { PlaceholderNotice } from "../components/PlaceholderNotice";
import { PLACEHOLDER_TRANSLATION, placeholderChapter } from "../fixtures/placeholder";
import { useNavigation } from "../lib/navigation";
import "./ReaderScreen.css";

/**
 * Scripture reader. Kept deliberately quiet: a slim top bar and the text.
 * Phase 1 renders placeholder fixtures only. Chapter navigation and the
 * in-reader reference jump arrive in Phase 2; real translations in Phase 3.
 */
export function ReaderScreen({ passage }: { passage: PassageRef }) {
  const { back, navigate } = useNavigation();
  const book = getBook(passage.book);

  if (!book || passage.chapter < 1 || passage.chapter > book.chapters) {
    return (
      <div className="reader__missing">
        <p>That passage could not be found.</p>
        <button type="button" className="btn btn--primary" onClick={() => navigate({ name: "books" })}>
          Browse books
        </button>
      </div>
    );
  }

  const chapter = placeholderChapter(book.id, passage.chapter);
  const title = `${book.name} ${passage.chapter}`;

  return (
    <article className="reader" aria-labelledby="reader-title">
      <header className="reader__bar">
        <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
          <Icon name="back" />
        </button>
        <button
          type="button"
          className="reader__ref"
          aria-label={`${title}. Choose another book or chapter`}
          onClick={() => navigate({ name: "books" })}
        >
          {title}
        </button>
        <span
          className="reader__translation"
          title={PLACEHOLDER_TRANSLATION.name}
          aria-label={`Translation: ${PLACEHOLDER_TRANSLATION.name}`}
        >
          {PLACEHOLDER_TRANSLATION.abbreviation}
        </span>
      </header>

      <div className="reader__body">
        <PlaceholderNotice>
          <strong>Placeholder text.</strong> No Bible translation is installed yet. The lines below
          only demonstrate the reading layout and are not Scripture.
        </PlaceholderNotice>

        <h1 id="reader-title" className="reader__heading">
          {title}
        </h1>

        <div className="reader__text">
          {chapter.verses.map((verse) => (
            <p key={verse.number} className="verse" id={`v${verse.number}`}>
              <sup className="verse__number" aria-label={`Verse ${verse.number}`}>
                {verse.number}
              </sup>
              {verse.text}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}
