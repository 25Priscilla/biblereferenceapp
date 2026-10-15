# VersePath design system

The goal is a peaceful, trustworthy interface that gets out of the way of Scripture.

## Principles

1. **Scripture first.** The reader shows text and a slim top bar, nothing else. The tab bar is hidden there.
2. **One obvious action per screen.** Home leads with reference search, Books with the book list, the Reader with the text.
3. **Quiet ornament.** Gold is an accent, not a fill. It is used for verse numbers, focus rings, the active translation and a single rule under the wordmark. There are no gradients and no decorative imagery.
4. **Few cards.** Grouped lists and plain sections are preferred over stacks of cards.
5. **Accessible by default.** Touch targets are at least 48px, focus is visible, colour is never the only signal, motion is reduced when the system asks, and safe-area insets are respected.

## Palette

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--color-bg` | `#faf6ec` warm ivory | `#101a15` | App background |
| `--color-surface` | `#fdfaf3` | `#16231c` | Lists, inputs |
| `--color-text` | `#1c1f1d` | `#ece6d6` | Body and Scripture |
| `--color-primary` | `#1f3d2e` forest green | `#8fbf9f` | Primary buttons, headings, active tab |
| `--color-accent` | `#94723a` gold | `#d2b073` | Verse numbers, focus, ornament |

Personal highlights use four translucent colours (`--color-hl-yellow|green|blue|pink`, with solid `-swatch` variants for the picker), tuned separately for light and dark so Scripture keeps full contrast. A highlighted verse that is also selected keeps its colour and gains the gold selection edge. Highlights are never the only signal: the verse number's accessible name says "highlighted yellow", and the picker rings the current colour.

Components use **semantic tokens only**, never raw values. Dark mode is chosen by the system by default and can be overridden in Settings (`<html data-theme="light|dark">`).

## Typography

- **Scripture:** Literata, a serif designed for long-form screen reading. It falls back to Noto Serif Malayalam (to be bundled in Phase 3), then Georgia.
- **Interface:** Inter Variable.
- Both are bundled locally through `@fontsource`, so they work offline and never call a font CDN.
- Reader defaults are 20px with a 1.75 line height (`--reader-font-size`, `--reader-line-height`). These become user-adjustable in Phase 4.

## Layout

Breakpoints are defined in `src/lib/useMediaQuery.ts` (and mirrored in CSS):

| Width | Navigation | Home | Books | Reader |
| --- | --- | --- | --- | --- |
| < 900px (phones, small tablets) | Fixed bottom tab bar | Single column with wordmark | Testament toggle and one list | Text only; ‹ › and the reference button in the top bar; the reference button opens the "Go to passage" sheet |
| 900–1199px | Left sidebar (wordmark plus tabs) | Heading, search, side-by-side buttons, Recent and Favorites in two columns | Old and New Testament side by side | Sidebar and text; inline jump box in the toolbar |
| ≥ 1200px | Left sidebar | As above | As above | Adds a book and chapter panel beside the text |

- App screens are at most 40rem wide on phones and 72rem on wide screens. The reader's text column is always at most 36rem, for a comfortable line length.
- 4px spacing scale (`--space-1` to `--space-7`).
- The main content's bottom padding clears the fixed tab bar plus the safe-area inset, so nothing is hidden behind it.
- Touch targets are at least 44px, and most are 48px.
- Navigation is stored in `history.state`, so the Android back gesture and browser back work naturally. Jumping to a passage adds a history entry. Previous/Next Chapter replaces it, so Back leaves the reader instead of rewinding chapter by chapter.
- On wide screens, ← and → step chapters, except while typing.
