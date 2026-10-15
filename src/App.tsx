import { useEffect, useState } from "react";
import type { BibleRepository } from "./bible/translations";
import { BottomNav } from "./components/BottomNav";
import { Sidebar } from "./components/Sidebar";
import { NavigationProvider, useNavigation } from "./lib/navigation";
import type { Route, TabName } from "./lib/navigation";
import { applyTheme, loadTheme, saveTheme } from "./lib/preferences";
import type { ThemePreference } from "./lib/preferences";
import { TranslationProvider } from "./lib/translation";
import { useMediaQuery, WIDE_QUERY } from "./lib/useMediaQuery";
import { BooksScreen } from "./screens/BooksScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { LibraryScreen } from "./screens/LibraryScreen";
import { ReaderScreen } from "./screens/ReaderScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

function Screens() {
  const { route } = useNavigation();
  const [theme, setTheme] = useState<ThemePreference>(loadTheme);

  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);

  const wide = useMediaQuery(WIDE_QUERY);
  const isReader = route.name === "reader";
  const activeTab: TabName | null = isReader ? null : (route.name as TabName);

  return (
    <div className={wide ? "app app--wide" : "app"}>
      {wide && <Sidebar active={activeTab} />}
      <main className={isReader ? "app__main app__main--reader" : "app__main"}>
        {renderRoute(route, theme, setTheme)}
      </main>
      {/* On phones the reader hides the tab bar so attention stays on the text. */}
      {!wide && activeTab && <BottomNav active={activeTab} />}
    </div>
  );
}

function renderRoute(
  route: Route,
  theme: ThemePreference,
  setTheme: (t: ThemePreference) => void,
) {
  switch (route.name) {
    case "home":
      return <HomeScreen />;
    case "books":
      return <BooksScreen />;
    case "reader":
      return (
        <ReaderScreen
          key={`${route.ref.book}.${route.ref.chapter}.${route.ref.verse ?? ""}-${route.ref.verseEnd ?? ""}`}
          passage={route.ref}
        />
      );
    case "library":
      return <LibraryScreen />;
    case "settings":
      return <SettingsScreen theme={theme} onThemeChange={setTheme} />;
  }
}

export default function App({ repository }: { repository?: BibleRepository } = {}) {
  return (
    <TranslationProvider repository={repository}>
      <NavigationProvider>
        <Screens />
      </NavigationProvider>
    </TranslationProvider>
  );
}
