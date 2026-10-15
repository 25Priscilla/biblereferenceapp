import { useEffect, useRef, useState } from "react";
import type { TranslationInfo } from "../bible/types";
import { useTranslation } from "../lib/translation";
import { Icon } from "./Icon";
import "./TranslationMenu.css";

/**
 * Translation switcher in the reader. Changing translation keeps the current
 * passage, because the passage lives in the route, not here. Parallel reading
 * uses one menu per column, each with its own `label`.
 */
export function TranslationMenu({
  value,
  onChange,
  label = "Translation",
  align = "end",
}: {
  value: TranslationInfo;
  onChange: (id: string) => void;
  /** Prefix for the accessible name, e.g. "Translation" or "First column". */
  label?: string;
  align?: "start" | "end";
}) {
  const { installed } = useTranslation();
  const translation = value;
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
        aria-label={`${label}: ${translation.name}. Change translation`}
        title={translation.name}
        onClick={() => setOpen((o) => !o)}
      >
        {translation.abbreviation}
        <Icon name="chevronDown" size={16} />
      </button>
      {open && (
        <div
          className={`translation-menu__list translation-menu__list--${align}`}
          role="menu"
          aria-label={label === "Translation" ? "Translations" : `${label} translations`}
        >
          {installed.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={t.id === translation.id}
              className="translation-menu__item"
              onClick={() => {
                onChange(t.id);
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
