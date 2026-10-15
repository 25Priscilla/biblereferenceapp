import { ReferenceSearch } from "../components/ReferenceSearch";
import { Icon } from "../components/Icon";
import { useNavigation } from "../lib/navigation";
import { useMediaQuery, WIDE_QUERY } from "../lib/useMediaQuery";
import "./HomeScreen.css";

export function HomeScreen() {
  const { navigate } = useNavigation();
  // On wide screens the wordmark lives in the sidebar, so Home leads with the task.
  const wide = useMediaQuery(WIDE_QUERY);

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
        {/* Becomes "Continue reading" with the last position once history lands (Phase 4). */}
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => navigate({ name: "reader", ref: { book: "GEN", chapter: 1 } })}
        >
          <Icon name="play" size={18} />
          Start reading · Genesis 1
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
          <p className="empty-state">Passages you open will appear here.</p>
        </section>

        <section aria-labelledby="home-favorites">
          <div className="section__header">
            <h2 id="home-favorites" className="section__title">
              Favorites
            </h2>
          </div>
          <p className="empty-state">Save a passage to keep it close at hand.</p>
        </section>
      </div>
    </div>
  );
}
