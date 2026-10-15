import { useEffect, useRef } from "react";
import type { PassageRef } from "../bible/types";
import { BookNavigator } from "./BookNavigator";
import { Icon } from "./Icon";
import { ReferenceSearch } from "./ReferenceSearch";
import { useNavigation } from "../lib/navigation";
import "./JumpSheet.css";

/**
 * "Go to passage" sheet opened from the reader's reference button, so a
 * reader can switch passages without returning Home. Bottom sheet on
 * phones; centred dialog on larger screens.
 */
export function JumpSheet({ current, onClose }: { current: PassageRef; onClose: () => void }) {
  const { navigate } = useNavigation();
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") trapFocus(e, sheetRef.current);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="jump-sheet" onClick={onClose}>
      <div
        ref={sheetRef}
        className="jump-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="jump-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="jump-sheet__header">
          <h2 id="jump-sheet-title" className="jump-sheet__title">
            Go to passage
          </h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>
        <ReferenceSearch compact autoFocus label="Type a reference" onNavigated={onClose} />
        <div className="jump-sheet__browse">
          <BookNavigator
            variant="panel"
            current={current}
            onChoose={(ref) => {
              onClose();
              navigate({ name: "reader", ref });
            }}
          />
        </div>
      </div>
    </div>
  );
}

function trapFocus(event: KeyboardEvent, container: HTMLElement | null) {
  if (!container) return;
  const focusable = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
