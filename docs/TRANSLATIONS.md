# Integrating Bible translations

> **Current status:** no translation is integrated. The only data source is `src/fixtures/placeholder.ts`, which generates clearly labelled stand-in lines and contains no Bible text.

This document sets the rules now, so licensing is never an afterthought. The loader and data format are implemented in **Phase 3**, and this guide will be expanded then.

## Rules (non-negotiable)

1. **Verify the source.** Text must come from the rights holder or a reputable distributor (for example eBible.org, the Digital Bible Library, or a publisher's licensed API), never from scraped websites.
2. **Confirm the licence** before adding any text. Record the licence name and a link, and keep a copy of the permission in the repository or project records.
3. **Respect offline permissions.** Bundle or cache a translation on the device only if `offlineAllowed` is true for it. Otherwise it must be streamed and must not be stored.
4. **Show the required attribution** wherever the licence demands it.
5. **Never invent or "fill in" verses.** A missing verse is shown as missing.
6. **Never list a translation in the UI** until its verified text has been integrated and tested.

## Identifiers

- **Books:** USFM 3 codes (`GEN`, `PSA`, `JHN`…), defined in `src/bible/canon.ts`.
- **Passages:** `{ book, chapter, verse?, verseEnd? }` (`PassageRef` in `src/bible/types.ts`).
- UI state, bookmarks, history and highlights store these IDs, never display names. This keeps saved data valid across translations and languages.

## Required metadata (`TranslationInfo`)

| Field | Meaning |
| --- | --- |
| `id` | Stable short ID, for example `"web"`. Never reuse or rename one. |
| `abbreviation`, `name` | Display labels |
| `language` | `"en"` or `"ml"` |
| `source` | Organisation and URL the text came from |
| `licence` | Licence name or summary |
| `attribution` | Exact attribution text, if the licence requires it |
| `offlineAllowed` | Whether the full text may be stored on the device |
| `isPlaceholder` | `true` only for development fixtures |

## Versification and missing verses

Translations can differ in numbering. For example, Malachi and Joel are split differently in Hebrew-based numbering, and Psalm superscriptions are numbered in some traditions. In Phase 3 each translation will declare its own chapter and verse counts, and the reader will:

- keep the current `PassageRef` when switching translations if it exists in the target;
- fall back to the nearest valid chapter or verse with a visible notice if it does not;
- render absent verses as "not present in this translation" rather than skipping them silently.

## Candidate sources to evaluate (not yet verified)

These are leads to check, not commitments. Each one needs licence review before use.

- English public-domain or open texts, such as the World English Bible and the King James Version (note the KJV's Crown patent in the UK).
- Malayalam open-licensed texts, such as the Indian Revised Version (IRV) Malayalam, distributed under a Creative Commons licence by Bridge Connectivity Solutions. Confirm the current terms.
- Other Malayalam editions, such as BSI's Sathyavedapusthakam, require **explicit permission** from the publisher.
