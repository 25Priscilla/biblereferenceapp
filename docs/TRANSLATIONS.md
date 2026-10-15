# Bible translations

> **Current status (Phase 3):** two verified translations are bundled and work fully offline: the **World English Bible** (English) and the **Indian Revised Version (IRV) Malayalam**. Tests use small fixtures that are clearly labelled as not Scripture (`src/test/fixtures.ts`). These fixtures are never shipped.

## Installed translations and licence record

| ID | Translation | Language | Source | Licence | Offline bundling |
| --- | --- | --- | --- | --- | --- |
| `web` | World English Bible (engwebp edition) | English (`en`) | [eBible.org: engwebp](https://ebible.org/find/details.php?id=engwebp), file `engwebp_vpl.zip` | **Public Domain**. “World English Bible” is a trademark of eBible.org. | Permitted: “copy, publish, … distribute, redistribute, … post on the Internet” |
| `ml-irv` | ഇന്ത്യൻ റിവൈസ്ഡ് വേർഷൻ (IRV) - മലയാളം | Malayalam (`ml`) | [eBible.org: malirv](https://ebible.org/find/details.php?id=malirv), file `mal_vpl.zip` | **CC BY-SA 4.0**, copyright © 2017, 2019 Bridge Communication Systems. Contributor: Bridge Connectivity Solutions Pvt. Ltd. | Permitted: share and redistribute “in any format” with attribution, under ShareAlike |

Licences were checked on the distributor pages (`details.php` and each translation's `copyright.htm`) and against the `*_about.htm` file inside each download, in October 2026. Files were downloaded from `https://eBible.org/Scriptures/` on 2026-10-15. The source files are dated 13 Oct 2026 (WEB) and 13 May 2025 (IRV).

### Obligations

- **WEB:** the text is used unmodified, so it may be called the World English Bible. If the text is ever changed, it must be renamed. The attribution line is shown under every chapter.
- **IRV (CC BY-SA 4.0):** the copyright line, source and licence link are shown under every chapter and in **Settings → Sources and licences**. The text is unmodified. The bundled data files in `src/data/bibles/ml-irv/` remain under CC BY-SA 4.0. Anyone who adapts *that text* must share it under the same licence. This does not change the licence of VersePath's own code. CC BY-SA 4.0 does not restrict commercial use. VersePath is free regardless.

### Investigated but not bundled

- **മലയാളം സത്യവേദപുസ്തകം 1910 (revised orthography), eBible.org `mal2015`.** The 2015 edition is copyright © 2015 The Free Bible Foundation and licensed under CC BY-SA 4.0 ([copyright page](https://ebible.org/mal2015/copyright.htm)). The licence is verified, but the text is not bundled yet. The Library lists it as “Not installed”.
- **KJV.** Public domain in most countries, but under Crown patent in the UK. Not used.
- **BSI Sathyavedapusthakam (current editions) and other publishers' texts.** These need explicit permission. Not used.

## Rules (non-negotiable)

1. **Verify the source.** Text must come from the rights holder or a reputable distributor (for example eBible.org, the Digital Bible Library, or a publisher's licensed API), never from scraped websites.
2. **Confirm the licence** before adding any text, and record it in the table above.
3. **Respect offline permissions.** Bundle a translation only if `offlineAllowed` is true for it.
4. **Show the required attribution** wherever the licence demands it (`attribution` is rendered under each chapter).
5. **Never invent or “fill in” verses.** A missing verse is shown as missing.
6. **Only installed, tested translations are selectable.** Planned ones may be listed as “Not installed” (`PLANNED_TRANSLATIONS`) but can never be chosen.
7. **Never edit generated data by hand.** Re-run the converter instead.

## Data format

Each translation is one folder of per-book JSON files:

```
src/data/bibles/<translationId>/<BOOK>.json
{ "format": 1, "translation": "web", "book": "JHN",
  "chapters": [ ["text of 1:1", "text of 1:2", …], … ] }
```

- `chapters[c - 1][v - 1]` is chapter *c*, verse *v*. `null` marks a verse the source omits (for example Acts 8:37 in the WEB), and a `null` chapter marks an incomplete dataset.
- Books are USFM 3 codes (`src/bible/canon.ts`). Display names come from `TranslationInfo.bookNames`, or from the English canon when a translation has none.
- Vite's `import.meta.glob` bundles each book as its own lazily loaded chunk. Nothing needs a network connection, and only the books that are opened are parsed.

Plain JSON was chosen over SQLite because the data is read-only, needs no Rust or plugin code, works the same in the browser preview, the desktop app, mobile and tests, and is easy to diff and validate.

### Code

| File | Role |
| --- | --- |
| `src/bible/translations/catalog.ts` | `TranslationInfo` for each installed translation, plus planned ones |
| `src/bible/translations/repository.ts` | Data access: list translations, load a chapter, verse or range, and previous/next chapter. Every failure is returned as a typed value, never thrown. |
| `src/bible/translations/bookFile.ts` | Validation of the JSON format. Malformed files are rejected, not half-shown. |
| `src/bible/translations/index.ts` | Wires the repository to the bundled files |
| `src/bible/translations/malayalamNames.ts` | Malayalam book names and abbreviations, copied from the IRV edition |
| `src/lib/translation.tsx` | Active translation context, persisted in `localStorage` (`versepath.translation`) |

## Adding a translation

1. Verify and record the licence as described above.
2. Download the eBible.org `<id>_vpl.zip` and run `node scripts/convert-vpl.mjs <path>/<id>_vpl.xml <translationId>`.
3. Add a `TranslationInfo` to `INSTALLED_TRANSLATIONS` in `catalog.ts`, with its attribution and, if the language is not English, `bookNames`.
4. Add the language code to `LanguageCode` if needed, and add book-name aliases only from the publisher's own edition.
5. Run `npm test`. `bundled.test.ts` validates every file.

## Versification and missing verses

Translations can differ in numbering. Each translation's data defines its own verse counts. The reader:

- keeps the current `PassageRef` when switching translations;
- shows a note if the requested verse is past the end of the chapter in that translation;
- shows omitted verses as “Verse N is not included in the … text” rather than skipping them silently;
- in parallel reading, aligns both translations by verse number. Rows run to the higher of the two verse counts, and a verse missing from one translation shows as not included in that column only.

Known differences in the bundled texts: the WEB has no text for Luke 17:36, Acts 8:37, Acts 15:34, Acts 24:7 or Romans 16:25. The IRV places the Romans doxology at 16:25-27 and has no 16:24-25. The IRV also has 3 John 1:15 and Revelation 12:18. Both follow the English chapter structure of all 66 books.

## Identifiers

- **Books:** USFM 3 codes (`GEN`, `PSA`, `JHN`…), defined in `src/bible/canon.ts`.
- **Passages:** `{ book, chapter, verse?, verseEnd? }` (`PassageRef` in `src/bible/types.ts`).
- **Languages:** BCP 47 codes (`en`, `ml`). Text is rendered with `lang` set, so the bundled Noto Serif Malayalam font (SIL OFL) is used offline.
- UI state stores these IDs, never display names, so saved data stays valid across translations and languages.
