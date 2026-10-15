/**
 * Translations VersePath knows about. Each installed entry's licence was
 * verified against the distributor's copyright page before its text was
 * bundled (see docs/TRANSLATIONS.md for the record).
 */

import type { PlannedTranslation, TranslationInfo } from "../types";
import { MALAYALAM_BOOK_NAMES } from "./malayalamNames";

export const WEB: TranslationInfo = {
  id: "web",
  abbreviation: "WEB",
  name: "World English Bible",
  language: "en",
  languageName: "English",
  source: "eBible.org (engwebp, VPL edition)",
  sourceUrl: "https://ebible.org/find/details.php?id=engwebp",
  licence: "Public Domain",
  attribution:
    "World English Bible. Public domain. “World English Bible” is a trademark of eBible.org.",
  offlineAllowed: true,
  isPlaceholder: false,
};

export const ML_IRV: TranslationInfo = {
  id: "ml-irv",
  abbreviation: "IRV",
  name: "ഇന്ത്യൻ റിവൈസ്ഡ് വേർഷൻ (IRV) - മലയാളം",
  language: "ml",
  languageName: "മലയാളം",
  source: "eBible.org (mal, VPL edition)",
  sourceUrl: "https://ebible.org/find/details.php?id=malirv",
  licence: "CC BY-SA 4.0",
  licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  attribution:
    "Indian Revised Version (IRV) Malayalam Bible, copyright © 2017, 2019 Bridge Communication Systems. " +
    "Contributor: Bridge Connectivity Solutions Pvt. Ltd. Licensed under CC BY-SA 4.0. Text unmodified.",
  offlineAllowed: true,
  isPlaceholder: false,
  bookNames: MALAYALAM_BOOK_NAMES,
};

export const INSTALLED_TRANSLATIONS: readonly TranslationInfo[] = [WEB, ML_IRV];

export const DEFAULT_TRANSLATION_ID = WEB.id;

/** Known but not bundled. Listed in the Library as "not installed". */
export const PLANNED_TRANSLATIONS: readonly PlannedTranslation[] = [
  {
    id: "ml-1910",
    name: "മലയാളം സത്യവേദപുസ്തകം 1910",
    language: "ml",
    languageName: "മലയാളം",
    note: "Licence verified (CC BY-SA 4.0, The Free Bible Foundation). Not bundled yet.",
  },
];
