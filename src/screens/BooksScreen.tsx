import { BookNavigator } from "../components/BookNavigator";
import { useNavigation } from "../lib/navigation";
import { useMediaQuery, WIDE_QUERY } from "../lib/useMediaQuery";

export function BooksScreen() {
  const { navigate } = useNavigation();
  const wide = useMediaQuery(WIDE_QUERY);

  return (
    <div>
      <h1 className="screen-title">Books</h1>
      <BookNavigator sideBySide={wide} onChoose={(ref) => navigate({ name: "reader", ref })} />
    </div>
  );
}
