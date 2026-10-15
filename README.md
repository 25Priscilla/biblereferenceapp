# VersePath

**Every Scripture, One Tap Away.**

VersePath is a free mobile Bible app for pastors, preachers, Sunday school teachers, students, families and everyday readers. Its focus is making it very fast to find and switch between Bible references, in multiple English and Malayalam translations.

No account. No ads. No subscriptions.

> **Status: Phase 3 (translations).** Two verified translations are bundled and work fully offline: the **World English Bible** (public domain) and the **IRV Malayalam** (CC BY-SA 4.0, © Bridge Communication Systems). You can switch translation inside the reader, read two translations in parallel, and type references in English or Malayalam. See [docs/TRANSLATIONS.md](docs/TRANSLATIONS.md) and the [Roadmap](#roadmap).

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
  components/          BottomNav, Sidebar, ReferenceSearch, BookNavigator, JumpSheet, TranslationMenu,
                       TranslationList, ParallelText, PlaceholderNotice, Icon
  screens/             Home, Books, Reader, Library, Settings
  bible/               canon.ts (book IDs and metadata, no text), aliases.ts (abbreviations),
                       reference.ts (parse, validate, format), chapterNav.ts (previous/next), types.ts
  bible/translations/  catalog (licensed translations), repository (data access), book file validation,
                       Malayalam book names
  data/bibles/         Bundled per-book JSON for each translation (generated, do not edit)
  lib/                 navigation (router), preferences (theme, translation), translation (active
                       translation context), useChapter, useMediaQuery
  test/                Test setup and labelled sample fixtures (not Scripture)
scripts/               convert-vpl.mjs: converts eBible.org VPL files into data/bibles JSON
src-tauri/             Tauri 2 Rust shell, config, capabilities and icons
docs/                  DESIGN.md and TRANSLATIONS.md
```

## Reference search

The parser (`src/bible/reference.ts`) accepts:

| Input | Opens |
| --- | --- |
| `John 3:16`, `Jn 3.16`, `jn 3 : 16` | John 3, verse 16 marked |
| `Psalm 91:1-4`, `Ps 91:1–4` | Psalm 91, verses 1–4 marked |
| `Genesis 1`, `Gen 1`, `Romans` | The whole chapter (a bare book name opens chapter 1) |
| `1 Cor 13`, `I Corinthians 13`, `First Cor 13`, `1co 13` | Numbered books written several ways |
| `Jude 5` | Verse 5 of a single-chapter book |
| `Revel 1` | A unique prefix of a book name |
| `യോഹ. 3:16`, `യോഹന്നാൻ 3:16`, `സങ്കീ. 23` | Malayalam book names and abbreviations, as printed in the IRV |

Invalid input gets a specific message: unknown books suggest the closest match ("Did you mean John?"), ambiguous abbreviations ("Ph") list the candidates, and chapters past the end of a book say how many chapters it has. Ranges that span chapters (`John 3:16-4:2`, `Genesis 1-3`) are not supported yet and say so. Verse upper bounds are checked by the reader against each translation's own verse counts, not by the parser.

## Parallel reading

The columns button in the reader toolbar shows two translations verse by verse. They sit side by side when there is room and as stacked pairs on phones. Each column has its own translation selector, and choosing the other column's translation swaps the two. Chapter navigation, the passage and verse selection are shared by both columns. Every verse number is a single row, so a verse that one translation omits shows as "not included" in that column, and the other column never shifts. The reading mode and both translations are remembered after a restart. You can also set the reading mode in **Settings → Reading mode**.

## Adding Bible translations

See [docs/TRANSLATIONS.md](docs/TRANSLATIONS.md) for the licence record, data format and conversion steps. In short, no translation is added until its text comes from a verified source and its licence allows offline use.

## Roadmap

1. **Foundation** (done): app shell, design system, main screens
2. **Navigation** (done): reference parser (John 3:16, Psalm 91:1-4, Genesis 1), book abbreviations, validation messages, previous/next chapter, in-reader jump. A verse *picker* waits for real verse counts in Phase 3; verses can already be typed.
3. **Translations** (done): offline per-book JSON data layer, WEB (English) and IRV (Malayalam), in-reader translation switching, verse and range selection, Malayalam reference search, translation choice remembered
4. **Personal library**: favorites, history, labels, highlights, bookmarks, reading preferences, local persistence
5. **Platform QA**: Android and iOS, accessibility, performance, offline behaviour
