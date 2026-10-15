import { ReferenceSearch } from "../components/ReferenceSearch";
import { Icon } from "../components/Icon";
import { useNavigation } from "../lib/navigation";
import "./HomeScreen.css";

export function HomeScreen() {
  const { navigate } = useNavigation();

  return (
    <div className="home">
      <header className="home__brand">
        <h1 className="home__wordmark">VersePath</h1>
        <p className="home__tagline">Every Scripture, One Tap Away.</p>
      </header>

      <ReferenceSearch />

      <div className="home__actions">
        {/* Becomes "Continue reading" with the last position once history lands (Phase 4). */}
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={() => navigate({ name: "reader", ref: { book: "GEN", chapter: 1 } })}
        >
          <Icon name="play" size={18} />
          Start reading · Genesis 1
        </button>
        <button
          type="button"
          className="btn btn--secondary btn--block"
          onClick={() => navigate({ name: "books" })}
        >
          <Icon name="book" size={20} />
          Browse books
        </button>
      </div>

      <section className="section" aria-labelledby="home-recent">
        <div className="section__header">
          <h2 id="home-recent" className="section__title">
            Recently opened
          </h2>
        </div>
        <p className="empty-state">Passages you open will appear here.</p>
      </section>

      <section className="section" aria-labelledby="home-favorites">
        <div className="section__header">
          <h2 id="home-favorites" className="section__title">
            Favorites
          </h2>
        </div>
        <p className="empty-state">Save a passage to keep it close at hand.</p>
      </section>
    </div>
  );
}
