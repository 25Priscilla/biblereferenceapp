import { useTranslation } from "../lib/translation";
import "./TranslationList.css";

/** Installed translations as a radio list; picking one makes it active and remembered. */
export function TranslationList({ labelledBy }: { labelledBy: string }) {
  const { translation, installed, setTranslation } = useTranslation();
  return (
    <div className="list translation-list" role="radiogroup" aria-labelledby={labelledBy}>
      {installed.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={t.id === translation.id}
          className="translation-list__option"
          onClick={() => setTranslation(t.id)}
        >
          <span className="translation-list__text">
            <span className="translation-list__name" lang={t.language}>
              {t.name}
            </span>
            <span className="list__meta">
              <span lang={t.language}>{t.languageName}</span> · {t.abbreviation} · {t.licence}
              {t.isPlaceholder ? " · Sample data" : ""}
            </span>
          </span>
          <span className="translation-list__mark" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
