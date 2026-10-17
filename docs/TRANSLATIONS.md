# Bible translations

> **Current status (Phase 4.1):** three verified translations are bundled and work fully offline: the **World English Bible** (English), the **Indian Revised Version (IRV) Malayalam** and the **Indian Revised Version (IRV) Kannada**. Tests use small fixtures that are clearly labelled as not Scripture (`src/test/fixtures.ts`). These fixtures are never shipped.

## Installed translations and licence record

| ID | Translation | Language | Source | Licence | Offline bundling |
| --- | --- | --- | --- | --- | --- |
| `web` | World English Bible (engwebp edition) | English (`en`) | [eBible.org: engwebp](https://ebible.org/find/details.php?id=engwebp), file `engwebp_vpl.zip` | **Public Domain**. “World English Bible” is a trademark of eBible.org. | Permitted: “copy, publish, … distribute, redistribute, … post on the Internet” |
| `ml-irv` | ഇന്ത്യൻ റിവൈസ്ഡ് വേർഷൻ (IRV) - മലയാളം | Malayalam (`ml`) | [eBible.org: malirv](https://ebible.org/find/details.php?id=malirv), file `mal_vpl.zip` | **CC BY-SA 4.0**, copyright © 2017, 2019 Bridge Communication Systems. Contributor: Bridge Connectivity Solutions Pvt. Ltd. | Permitted: share and redistribute “in any format” with attribution, under ShareAlike |
| `kn-irv` | ಇಂಡಿಯನ್ ರಿವೈಜ್ಡ್ ವರ್ಸನ್ (IRV) - ಕನ್ನಡ - 2019 (abbreviation `IRVKan`) | Kannada (`kn`) | [eBible.org: kanirv](https://ebible.org/find/details.php?id=kanirv), file `kanirv_vpl.zip` | **CC BY-SA 4.0**, copyright © 2017, 2019 Bridge Connectivity Solutions. Translation by Bridge Connectivity Solutions. Contributor: Bridge Connectivity Solutions Pvt. Ltd. | Permitted: share and redistribute “in any format” with attribution, under ShareAlike |

Licences were checked on the distributor pages (`details.php` and each translation's `copyright.htm`) and against the `*_about.htm` file inside each download, in October 2026. WEB and IRV Malayalam files were downloaded from `https://eBible.org/Scriptures/` on 2026-10-15, and the IRV Kannada file on 2026-10-17. The source files are dated 13 Oct 2026 (WEB), 13 May 2025 (IRV Malayalam) and 13 Apr 2023 (IRV Kannada; licence statement dated 2023-04-12).

### IRV Kannada verification (2026-10-17)

- `kanirv_vpl.zip` (SHA-256 `d336951f5c8b06e9f24e3d6632ec86fe362bbd87beae858a59ccfa2fc3338a09`) contains all 66 books of the Protestant canon in canonical order, with every chapter count matching `canon.ts`. It has 31,031 verse entries covering 31,104 verse numbers, because 71 entries are verse bridges (see below). There are no empty, duplicate or out-of-order verses, and all text is NFC Unicode in the Kannada block plus ordinary punctuation and digits.
- Every converted verse was compared with the publisher's USFM edition (`kanirv_usfm.zip`). The text is identical, except that eBible's VPL edition (like the WEB's) keeps the Psalm titles at the start of verse 1 and the Psalm 119 letter headings (for example “ಬೇತ್.”) at the end of the verse before them.
- The five verses quoted on the eBible.org details page (Genesis 1:1, Psalm 23:1, Matthew 6:33, John 3:16, Romans 8:28) match exactly, and are checked in `bundled.test.ts`.
- Book names and abbreviations are the USFM `\h` and `\toc2` headers, which are also the labels in the online book index.

### Obligations

- **WEB:** the text is used unmodified, so it may be called the World English Bible. If the text is ever changed, it must be renamed. The attribution line is shown under every chapter.
- **IRV Malayalam and IRV Kannada (CC BY-SA 4.0):** the copyright line, source and licence link are shown under every chapter and in **Settings → Sources and licences**. The text is unmodified. The bundled data files in `src/data/bibles/ml-irv/` and `src/data/bibles/kn-irv/` remain under CC BY-SA 4.0, and each folder has a `LICENSE.md` with the notice. Anyone who adapts *that text* must share it under the same licence. This does not change the licence of VersePath's own code. CC BY-SA 4.0 does not restrict commercial use. VersePath is free regardless.

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
  "chapters": [ ["text of 1:1", "text of 1:2", …], … ],
  "bridges": [[5, 3, 4], …] }
```

- `chapters[c - 1][v - 1]` is chapter *c*, verse *v*. `null` marks a verse the source omits (for example Acts 8:37 in the WEB), and a `null` chapter marks an incomplete dataset.
- `bridges` (optional) lists verses the translation prints as one, as `[chapter, first, last]`. Mark 5:3-4 in the IRV Kannada is `[5, 3, 4]`. The text is stored once at the first verse, and the following slots are `null`. Files without bridges have no `bridges` key, so the format version is still 1. The validator rejects a bridge without text, one that would hide another verse's text, and overlapping bridges.
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
| `src/bible/translations/kannadaNames.ts` | Kannada book names and abbreviations, copied from the IRV Kannada edition |
| `src/lib/translation.tsx` | Active translation context, persisted in `localStorage` (`versepath.translation`) |

## Adding a translation

1. Verify and record the licence as described above.
2. Download the eBible.org `<id>_vpl.zip` and run `node scripts/convert-vpl.mjs <path>/<id>_vpl.xml <translationId>`. The converter keeps verse bridges and stops with an error on any `<v>` element it doesn't understand, so no text is dropped silently. An optional third argument writes to another folder, for a dry run.
3. Add a `TranslationInfo` to `INSTALLED_TRANSLATIONS` in `catalog.ts`, with its attribution and, if the language is not English, `bookNames`.
4. Add the language code to `LanguageCode` if needed, and add book-name aliases only from the publisher's own edition.
5. Run `npm test`. `bundled.test.ts` validates every file.

## Versification and missing verses

Translations can differ in numbering. Each translation's data defines its own verse counts. The reader:

- keeps the current `PassageRef` when switching translations;
- shows a note if the requested verse is past the end of the chapter in that translation;
- shows omitted verses as “Verse N is not included in the … text” rather than skipping them silently;
- in parallel reading, aligns both translations by verse number. Rows run to the higher of the two verse counts, and a verse missing from one translation shows as not included in that column only.

### Verse bridges

Some translations print two or three verses as one paragraph with one combined number (“3-4”). The text can't be split between the numbers honestly, so VersePath keeps it whole:

- the single reader shows it once, numbered “3–4”. Tapping the number selects both verses, and a link to verse 4 lands on it;
- in parallel reading it sits on the row of its first verse, with the range in its tag (“IRVKan 3–4”). The later rows say “Verse 4 is combined with verse 3 in the IRVKan text”, while the other column shows its own verse 4;
- bookmarks, highlights and notes are still stored by verse number. A bridged verse shows the marks made on any of its numbers;
- `getVerse` and `getVerseRange` return the bridged verse when any of its numbers is asked for, and `Chapter.missing` never lists a bridged number.

The IRV Kannada has 71 bridges, for example Exodus 38:14-15, Mark 5:3-4, Luke 3:4-6 and Revelation 2:26-28. Philippians 2:29-30 and Revelation 4:10-11 end their chapters, so those chapters still count 30 and 11 verses.

### Known differences in the bundled texts

- The WEB has no text for Luke 17:36, Acts 8:37, Acts 15:34, Acts 24:7 or Romans 16:25.
- The IRV Malayalam places the Romans doxology at 16:25-27 and has no 16:24-25. It also has 3 John 1:15 and Revelation 12:18.
- The IRV Kannada also has 3 John 1:15 and Revelation 12:18, ends Romans 14 at verse 23 and places the doxology at Romans 16:25-27 (as the bridge 25-26, then 27).
- All three follow the English chapter structure of all 66 books.

> **Known issue in the Malayalam data (found in Phase 4.1, not yet fixed).** The Phase 3 converter only read single verse numbers, so it silently skipped the two verse bridges in `mal_vpl.xml`: **1 Samuel 30:30-31** and **Romans 16:24-25**. Their text is missing from `src/data/bibles/ml-irv/`. That is why 1 Samuel 30 ends at verse 29 and Romans 16:24-25 shows as “not included”. The fixed converter restores both, and a dry run reproduces every other Malayalam file byte for byte. Regenerating `ml-irv` is left for a separate, reviewed change.

## Identifiers

- **Books:** USFM 3 codes (`GEN`, `PSA`, `JHN`…), defined in `src/bible/canon.ts`.
- **Passages:** `{ book, chapter, verse?, verseEnd? }` (`PassageRef` in `src/bible/types.ts`).
- **Languages:** BCP 47 codes (`en`, `ml`, `kn`). Text is rendered with `lang` set, so the bundled Noto Serif Malayalam and Noto Serif Kannada fonts (`@fontsource/noto-serif-*`, © The Noto Project Authors, SIL Open Font License 1.1) are used offline. Only the 400 and 600 weights of the Malayalam and Kannada subsets are imported.
- **References in Kannada:** full book names and index abbreviations (`ಯೋಹಾನನು 3:16`, `ಯೋಹಾ 3:16`, `ಅ. ಕೃ. 2:38`), unique prefixes (`ಯೆರೆಮೀ 1`) and Kannada digits (`ಯೋಹಾನನು ೩:೧೬`) are accepted.
- UI state stores these IDs, never display names, so saved data stays valid across translations and languages.
