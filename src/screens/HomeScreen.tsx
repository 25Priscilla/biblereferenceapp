import { formatReference } from "../bible/reference";
import { ReferenceSearch } from "../components/ReferenceSearch";
import { Icon } from "../components/Icon";
import { BookmarkList, RecentList } from "../components/StudyLists";
import { useNavigation } from "../lib/navigation";
import { useStudy } from "../lib/study";
import { historyToRef } from "../study/model";
import { useMediaQuery, WIDE_QUERY } from "../lib/useMediaQuery";
import "./HomeScreen.css";

export function HomeScreen() {
  const { navigate } = useNavigation();
  // On wide screens the wordmark lives in the sidebar, so Home leads with the task.
  const wide = useMediaQuery(WIDE_QUERY);
  const { history, bookmarks } = useStudy();
  const last = history[0] ? historyToRef(history[0]) : null;

  return (
    <div className="home">
      {wide ? (
        <header className="home__greeting">
          <h1 className="home__greeting-title">Where would you like to read?</h1>
        </header>
      ) : (
        <header className="home__brand">
          <h1 className="home__wordmark">VersePath</h1>
          <p className="home__tagline">Every Scripture, One Tap Away.</p>
        </header>
      )}

      <div className="home__search">
        <ReferenceSearch />
      </div>

      <div className="home__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => navigate({ name: "reader", ref: last ?? { book: "GEN", chapter: 1 } })}
        >
          <Icon name="play" size={18} />
          {last ? `Continue reading · ${formatReference(last)}` : "Start reading · Genesis 1"}
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => navigate({ name: "books" })}
        >
          <Icon name="book" size={20} />
          Browse books
        </button>
      </div>

      <div className="home__collections">
        <section aria-labelledby="home-recent">
          <div className="section__header">
            <h2 id="home-recent" className="section__title">
              Recently opened
            </h2>
          </div>
          <RecentList limit={4} labelledBy="home-recent" />
          {history.length > 4 && <SeeAll />}
        </section>

        <section aria-labelledby="home-bookmarks">
          <div className="section__header">
            <h2 id="home-bookmarks" className="section__title">
              Bookmarks
            </h2>
          </div>
          <BookmarkList limit={3} labelledBy="home-bookmarks" />
          {bookmarks.length > 3 && <SeeAll />}
        </section>
      </div>
    </div>
  );
}

function SeeAll() {
  const { navigate } = useNavigation();
  return (
    <button type="button" className="home__see-all" onClick={() => navigate({ name: "library" })}>
      See all in Library
      <Icon name="chevron" size={16} />
    </button>
  );
}
