import { useEffect, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { NavigationProvider, useNavigation } from "./lib/navigation";
import type { Route, TabName } from "./lib/navigation";
import { applyTheme, loadTheme, saveTheme } from "./lib/preferences";
import type { ThemePreference } from "./lib/preferences";
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

  const isReader = route.name === "reader";

  return (
    <div className="app">
      <main className={isReader ? "app__main app__main--reader" : "app__main"}>
        {renderRoute(route, theme, setTheme)}
      </main>
      {/* The reader hides the tab bar so attention stays on the text. */}
      {!isReader && <BottomNav active={route.name as TabName} />}
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
      return <ReaderScreen key={`${route.ref.book}.${route.ref.chapter}`} passage={route.ref} />;
    case "library":
      return <LibraryScreen />;
    case "settings":
      return <SettingsScreen theme={theme} onThemeChange={setTheme} />;
  }
}

export default function App() {
  return (
    <NavigationProvider>
      <Screens />
    </NavigationProvider>
  );
}
