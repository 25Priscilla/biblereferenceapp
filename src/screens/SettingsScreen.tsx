import { TranslationList } from "../components/TranslationList";
import type { ThemePreference } from "../lib/preferences";
import { useTranslation } from "../lib/translation";
import "./SettingsScreen.css";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function SettingsScreen({
  theme,
  onThemeChange,
}: {
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
}) {
  const { translation, installed, unavailableSavedId } = useTranslation();
  return (
    <div>
      <h1 className="screen-title">Settings</h1>

      <section aria-labelledby="set-theme">
        <div className="section__header">
          <h2 id="set-theme" className="section__title">
            Appearance
          </h2>
        </div>
        <div className="segmented" role="radiogroup" aria-labelledby="set-theme">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              className="segmented__option"
              aria-checked={theme === opt.value}
              onClick={() => onThemeChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="set-translations">
        <div className="section__header">
          <h2 id="set-translations" className="section__title">
            Translations
          </h2>
        </div>
        {unavailableSavedId && (
          <p className="settings__notice" role="status">
            Your saved translation (“{unavailableSavedId}”) is no longer available, so{" "}
            {translation.name} is being used. Choose one below to remember it.
          </p>
        )}
        <TranslationList labelledBy="set-translations" />
        <p className="settings__hint">Opens in the reader and is remembered after restarting.</p>
      </section>


      <section className="section" aria-labelledby="set-licences">
        <div className="section__header">
          <h2 id="set-licences" className="section__title">
            Sources and licences
          </h2>
        </div>
        <ul className="list">
          {installed.map((t) => (
            <li key={t.id} className="list__item translation-list__details">
              <span lang={t.language}>{t.name}</span>
              <span className="translation-list__details-meta">
                {t.attribution ?? t.licence}
                <br />
                Source: {t.sourceUrl}
                {t.licenceUrl && (
                  <>
                    <br />
                    Licence: {t.licenceUrl}
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="set-about">
        <div className="section__header">
          <h2 id="set-about" className="section__title">
            About
          </h2>
        </div>
        <ul className="list">
          <li className="list__item">
            <div className="list__button">
              <span>VersePath</span>
              <span className="list__meta">Version {__APP_VERSION__}</span>
            </div>
          </li>
          <li className="list__item">
            <div className="list__button">
              <span>No account, no ads, no tracking</span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  );
}
