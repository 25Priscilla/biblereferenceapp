import type { ReactNode } from "react";
import { Icon } from "./Icon";
import "./PlaceholderNotice.css";

/** Shown wherever placeholder fixtures stand in for verified Bible text. */
export function PlaceholderNotice({ children }: { children: ReactNode }) {
  return (
    <div className="placeholder-notice" role="note">
      <Icon name="info" size={20} />
      <p>{children}</p>
    </div>
  );
}
