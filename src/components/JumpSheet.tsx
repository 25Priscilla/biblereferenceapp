import type { PassageRef } from "../bible/types";
import { BookNavigator } from "./BookNavigator";
import { ReferenceSearch } from "./ReferenceSearch";
import { Sheet } from "./Sheet";
import { useNavigation } from "../lib/navigation";
import "./JumpSheet.css";

/**
 * "Go to passage" sheet opened from the reader's reference button, so a
 * reader can switch passages without returning Home. Bottom sheet on
 * phones; centred dialog on larger screens.
 */
export function JumpSheet({ current, onClose }: { current: PassageRef; onClose: () => void }) {
  const { navigate } = useNavigation();

  return (
    <Sheet title="Go to passage" onClose={onClose}>
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
    </Sheet>
  );
}
