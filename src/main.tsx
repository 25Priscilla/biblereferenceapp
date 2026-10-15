import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource/literata/400.css";
import "@fontsource/literata/600.css";
// Bundled so Malayalam renders consistently offline (SIL Open Font License).
import "@fontsource/noto-serif-malayalam/malayalam-400.css";
import "@fontsource/noto-serif-malayalam/malayalam-600.css";
import "./styles/tokens.css";
import "./styles/base.css";
import { applyTheme, loadTheme } from "./lib/preferences";
import App from "./App";

// Apply the saved theme before first paint to avoid a light/dark flash.
applyTheme(loadTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
