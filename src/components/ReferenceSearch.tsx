import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Icon } from "./Icon";
import "./ReferenceSearch.css";

/**
 * Quick reference search field.
 *
 * Phase 1: UI shell only. Reference parsing and validation (John 3:16,
 * Psalm 91:1-4, Genesis 1 …) are implemented in Phase 2; until then a
 * submission explains that honestly instead of guessing.
 */
export function ReferenceSearch({ autoFocus = false }: { autoFocus?: boolean }) {
  const inputId = useId();
  const hintId = useId();
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim()) {
      setMessage("Type a reference such as John 3:16, Psalm 91:1-4 or Genesis 1.");
      return;
    }
    setMessage("Reference search is not available yet. Browse by book for now.");
  }

  return (
    <form className="ref-search" role="search" onSubmit={onSubmit}>
      <label htmlFor={inputId} className="visually-hidden">
        Go to a Bible reference
      </label>
      <div className="ref-search__field">
        <span className="ref-search__icon">
          <Icon name="search" size={20} />
        </span>
        <input
          id={inputId}
          className="ref-search__input"
          type="search"
          inputMode="search"
          enterKeyHint="go"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          placeholder="e.g. John 3:16"
          value={value}
          aria-describedby={message ? hintId : undefined}
          onChange={(e) => {
            setValue(e.target.value);
            setMessage(null);
          }}
        />
        <button type="submit" className="ref-search__go">
          Go
        </button>
      </div>
      <p id={hintId} className="ref-search__message" role="status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}
