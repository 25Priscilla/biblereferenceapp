/**
 * Common English abbreviations and alternate names for each book, keyed by
 * USFM id. The canonical name and the USFM code itself are always accepted
 * and need not be listed here.
 *
 * Entries are normalised before lookup (lower-cased, spaces and dots
 * removed, "First"/"I"/"1st" → "1"), so "1 Sam", "1Sam" and "I Sam." all
 * match "1sam". Malayalam and Kannada names and abbreviations live in
 * translations/malayalamNames.ts and translations/kannadaNames.ts and are
 * indexed alongside these.
 *
 * Deliberately excluded because they are ambiguous between books:
 * "Ju" (Judges/Jude), "Ph" (Philippians/Philemon), "Jo" (Joshua/Job/Joel/John/Jonah).
 */
export const BOOK_ALIASES: Readonly<Record<string, readonly string[]>> = {
  GEN: ["Ge", "Gn", "Gen"],
  EXO: ["Ex", "Exo", "Exod"],
  LEV: ["Le", "Lv", "Lev"],
  NUM: ["Nu", "Nm", "Nb", "Num"],
  DEU: ["Dt", "Deut", "De"],
  JOS: ["Josh", "Jsh"],
  JDG: ["Judg", "Jdg", "Jg", "Jdgs"],
  RUT: ["Ru", "Rth"],
  "1SA": ["1 Sam", "1 Sa", "1 Sm", "1 S"],
  "2SA": ["2 Sam", "2 Sa", "2 Sm", "2 S"],
  "1KI": ["1 Kgs", "1 Ki", "1 Kin", "1 Kg"],
  "2KI": ["2 Kgs", "2 Ki", "2 Kin", "2 Kg"],
  "1CH": ["1 Chr", "1 Ch", "1 Chron"],
  "2CH": ["2 Chr", "2 Ch", "2 Chron"],
  EZR: ["Ezr"], // "Ez" is ambiguous with Ezekiel
  NEH: ["Ne", "Neh"],
  EST: ["Es", "Esth"],
  JOB: ["Jb"],
  PSA: ["Ps", "Psa", "Psalm", "Pss", "Psm", "Pslm"],
  PRO: ["Pr", "Prov", "Prv"],
  ECC: ["Ec", "Ecc", "Eccl", "Eccles", "Qoh", "Qohelet"],
  SNG: ["Song", "So", "Sg", "Song of Solomon", "SOS", "Canticles", "Cant"],
  ISA: ["Is", "Isa"],
  JER: ["Je", "Jer", "Jr"],
  LAM: ["La", "Lam"],
  EZK: ["Eze", "Ezek", "Ezk"],
  DAN: ["Da", "Dn", "Dan"],
  HOS: ["Ho", "Hos"],
  JOL: ["Jl", "Joe"],
  AMO: ["Am", "Amo"],
  OBA: ["Ob", "Obad", "Oba"],
  JON: ["Jnh", "Jon"],
  MIC: ["Mi", "Mc", "Mic"],
  NAM: ["Na", "Nah"],
  HAB: ["Hb", "Hab"],
  ZEP: ["Zp", "Zep", "Zeph"],
  HAG: ["Hg", "Hag"],
  ZEC: ["Zc", "Zec", "Zech"],
  MAL: ["Ml", "Mal"],
  MAT: ["Mt", "Matt", "Mat"],
  MRK: ["Mk", "Mrk", "Mar", "Mr"],
  LUK: ["Lk", "Luk", "Lu"],
  JHN: ["Jn", "Jhn", "Joh"],
  ACT: ["Ac", "Act"],
  ROM: ["Ro", "Rm", "Rom"],
  "1CO": ["1 Cor", "1 Co"],
  "2CO": ["2 Cor", "2 Co"],
  GAL: ["Ga", "Gal"],
  EPH: ["Eph", "Ephes"],
  PHP: ["Phil", "Php", "Pp"],
  COL: ["Co", "Col"],
  "1TH": ["1 Thess", "1 Thes", "1 Th"],
  "2TH": ["2 Thess", "2 Thes", "2 Th"],
  "1TI": ["1 Tim", "1 Ti", "1 Tm"],
  "2TI": ["2 Tim", "2 Ti", "2 Tm"],
  TIT: ["Ti", "Tit"],
  PHM: ["Philem", "Phm", "Pm", "Phlm"],
  HEB: ["He", "Heb"],
  JAS: ["Jas", "Jm", "Jms"],
  "1PE": ["1 Pet", "1 Pe", "1 Pt", "1 P"],
  "2PE": ["2 Pet", "2 Pe", "2 Pt", "2 P"],
  "1JN": ["1 Jn", "1 Jhn", "1 Jo", "1 Joh", "1 J"],
  "2JN": ["2 Jn", "2 Jhn", "2 Jo", "2 Joh", "2 J"],
  "3JN": ["3 Jn", "3 Jhn", "3 Jo", "3 Joh", "3 J"],
  JUD: ["Jud", "Jd", "Jde"],
  REV: ["Re", "Rev", "Rv", "Revelations", "Apocalypse", "Apoc"],
};
