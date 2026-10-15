# VersePath

**Every Scripture, One Tap Away.**

VersePath is a free mobile Bible app for pastors, preachers, Sunday school teachers, students, families and everyday readers. Its focus is making it very fast to find and switch between Bible references, in multiple English and Malayalam translations.

No account. No ads. No subscriptions.

> **Status: Phase 1 (foundation).** The app shell, design system and main screens are in place. **No Bible translation is integrated yet.** The reader shows clearly labelled placeholder text that is not Scripture. See [Roadmap](#roadmap).

## Tech stack

- [Tauri 2](https://v2.tauri.app/) for desktop, Android and iOS
- React 19, TypeScript and Vite
- Plain CSS with design tokens (`src/styles/tokens.css`)
- Vitest and Testing Library for tests

## Prerequisites

| Target | Requirements |
| --- | --- |
| Web preview | Node.js 22.12+ and npm |
| Desktop (Windows) | The above, plus Rust (stable) and the [Tauri Windows prerequisites](https://v2.tauri.app/start/prerequisites/) (MSVC build tools, WebView2) |
| Android | The above, plus Android Studio, an Android SDK, an NDK, a JDK 17+, `JAVA_HOME`, `ANDROID_HOME` and `NDK_HOME`, and the Rust Android targets |
| iOS | macOS with Xcode and the Rust iOS targets. **iOS cannot be built on Windows.** |

## Running VersePath

```bash
npm install            # install dependencies
npm run dev            # web preview at http://localhost:1420
npm run tauri dev      # desktop window via Tauri
```

### Checks

```bash
npm run typecheck      # TypeScript
npm test               # unit and UI tests (Vitest)
npm run build          # production web bundle in dist/
cd src-tauri && cargo check   # Rust / Tauri compile check
```

### Mobile (not yet set up in this repo)

The native Android and iOS projects are generated once, after the SDKs are installed:

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
npm run tauri android init
npm run tauri android dev      # emulator or connected device
```

```bash
# macOS only
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim
npm run tauri ios init
npm run tauri ios dev
```

## Project structure

```
src/
  App.tsx              App shell and route switch
  main.tsx             Entry point: fonts, global CSS, theme applied before first paint
  styles/              tokens.css (design tokens, light/dark) and base.css (shared primitives)
  components/          BottomNav, ReferenceSearch, PlaceholderNotice, Icon
  screens/             Home, Books, Reader, Library, Settings
  bible/               canon.ts (book IDs and metadata, no text) and types.ts (translation/passage types)
  fixtures/            Labelled placeholder data. Not Scripture.
  lib/                 navigation (history-backed router) and preferences (theme)
src-tauri/             Tauri 2 Rust shell, config, capabilities and icons
docs/                  DESIGN.md and TRANSLATIONS.md
```

## Adding Bible translations

See [docs/TRANSLATIONS.md](docs/TRANSLATIONS.md). In short, no translation is added until its text comes from a verified source and its licence allows that use.

## Roadmap

1. **Foundation** (done): app shell, design system, main screens
2. **Navigation**: reference parser (John 3:16, Psalm 91:1-4, Genesis 1), book aliases, verse selection, previous/next chapter, in-reader jump
3. **Translations**: data format and loader, verified and licensed English and Malayalam texts
4. **Personal library**: favorites, history, labels, highlights, bookmarks, reading preferences, local persistence
5. **Platform QA**: Android and iOS, accessibility, performance, offline behaviour
