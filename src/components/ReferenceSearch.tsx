import { useId, useState } from "react";
import type { FormEvent } from "react";
import { parseReference } from "../bible/reference";
import { Icon } from "./Icon";
import { useNavigation } from "../lib/navigation";
import "./ReferenceSearch.css";

/**
 * Quick reference search: parses input such as "John 3:16", "Ps 91:1-4" or
 * "Genesis 1" and opens it in the reader, or explains what is wrong.
 */
export function ReferenceSearch({
  autoFocus = false,
  compact = false,
  label = "Go to a Bible reference",
  onNavigated,
}: {
  autoFocus?: boolean;
  /** Smaller variant for the reader toolbar and jump sheet. */
  compact?: boolean;
  label?: string;
  /** Called after a successful jump (e.g. to close a sheet). */
  onNavigated?: () => void;
}) {
  const inputId = useId();
  const messageId = useId();
  const { navigate } = useNavigation();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const result = parseReference(value);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    setValue("");
    // A jump adds a history entry, so Back returns to the previous passage.
    navigate({ name: "reader", ref: result.ref });
    onNavigated?.();
  }

  return (
    <form
      className={compact ? "ref-search ref-search--compact" : "ref-search"}
      role="search"
      aria-label={label}
      onSubmit={onSubmit}
      noValidate
    >
      <label htmlFor={inputId} className="visually-hidden">
        {label}
      </label>
      <div className="ref-search__field" data-invalid={error ? "" : undefined}>
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
          autoCapitalize="words"
          spellCheck={false}
          autoFocus={autoFocus}
          placeholder="e.g. John 3:16"
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
        />
        <button type="submit" className="ref-search__go">
          Go
        </button>
      </div>
      <p id={messageId} className="ref-search__message" role="status" aria-live="polite">
        {error ?? (compact ? null : "Try John 3:16, Ps 91:1-4, Gen 1 or 1 Cor 13.")}
      </p>
    </form>
  );
}
