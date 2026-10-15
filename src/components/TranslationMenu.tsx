import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../lib/translation";
import { Icon } from "./Icon";
import "./TranslationMenu.css";

/**
 * Translation switcher in the reader toolbar. Changing translation keeps the
 * current passage, because the passage lives in the route, not here.
 */
export function TranslationMenu() {
  const { translation, installed, setTranslation } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    rootRef.current?.querySelector<HTMLElement>("[aria-checked=true]")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div className="translation-menu" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="translation-menu__button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Translation: ${translation.name}. Change translation`}
        title={translation.name}
        onClick={() => setOpen((o) => !o)}
      >
        {translation.abbreviation}
        <Icon name="chevronDown" size={16} />
      </button>
      {open && (
        <div className="translation-menu__list" role="menu" aria-label="Translations">
          {installed.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={t.id === translation.id}
              className="translation-menu__item"
              onClick={() => {
                setTranslation(t.id);
                setOpen(false);
                buttonRef.current?.focus();
              }}
            >
              <span className="translation-menu__abbr">{t.abbreviation}</span>
              <span className="translation-menu__name" lang={t.language}>
                {t.name}
                <span className="translation-menu__lang" lang={t.language}>
                  {t.languageName}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
