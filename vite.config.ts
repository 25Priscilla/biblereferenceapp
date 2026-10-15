/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pkg from "./package.json" with { type: "json" };

// Tauri dev server settings: https://v2.tauri.app/start/frontend/vite/
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    // Android WebView / iOS WKWebView targets
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari15",
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    // Each Bible book is its own lazily loaded chunk; the largest (Malayalam
    // Psalms) is ~700 kB raw / ~100 kB gzipped. App code stays far below this.
    chunkSizeWarningLimit: 800,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
