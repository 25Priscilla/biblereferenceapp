#!/usr/bin/env node
/**
 * Converts an eBible.org "VPL" XML file (…_vpl.xml from …_vpl.zip) into
 * VersePath's per-book JSON format:
 *
 *   src/data/bibles/<translationId>/<BOOK>.json
 *   { "format": 1, "translation": "web", "book": "JHN",
 *     "chapters": [ ["1:1 text", "1:2 text", …], … ],
 *     "bridges": [[5, 3, 4], …] }
 *
 * `chapters[c - 1][v - 1]` is the text of chapter c, verse v. A verse that the
 * source does not contain (versification gaps) is stored as null so the reader
 * can show it as "not present in this translation" instead of inventing it.
 *
 * Some sources print several verses as one ("verse bridges", e.g. Mark 5:3-4,
 * written v="3-4"). Their text is stored once, at the first verse, and the
 * span is listed in the optional `bridges` array as [chapter, first, last].
 * The later slots stay null, but `bridges` says they are part of the text.
 * Files without bridges have no `bridges` key.
 *
 * The text is copied verbatim apart from trimming whitespace and decoding XML
 * entities. Every <v> element must be understood; anything else is an error,
 * so no verse can be dropped silently. Never edit the generated files by
 * hand: re-run this script.
 *
 * Usage: node scripts/convert-vpl.mjs <path/to/xxx_vpl.xml> <translationId> [outDir]
 * outDir defaults to src/data/bibles/<translationId>.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [xmlPath, translationId, outArg] = process.argv.slice(2);
if (!xmlPath || !translationId || !/^[a-z0-9-]+$/.test(translationId)) {
  console.error("Usage: node scripts/convert-vpl.mjs <xxx_vpl.xml> <translationId> [outDir]");
  process.exit(1);
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => {
    if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
    return ENTITIES[e] ?? m;
  });

const xml = readFileSync(xmlPath, "utf8").normalize("NFC");
const VERSE = /<v b="([0-9A-Z]{3})" c="(\d+)" v="(\d+)(?:-(\d+))?">([\s\S]*?)<\/v>/g;

/** @type {Map<string, (string | null)[][]>} */
const books = new Map();
/** @type {Map<string, [number, number, number][]>} */
const bridges = new Map();
let count = 0;
let bridged = 0;
let elements = 0;
for (const [, book, c, v, last, raw] of xml.matchAll(VERSE)) {
  elements++;
  const text = decode(raw).replace(/\s+/g, " ").trim();
  if (!text) continue;
  if (/[<>]/.test(text)) throw new Error(`Unexpected markup in ${book} ${c}:${v}`);
  const first = Number(v);
  const end = last === undefined ? first : Number(last);
  if (end <= first && last !== undefined) throw new Error(`Bad verse bridge ${book} ${c}:${v}-${last}`);
  const chapters = books.get(book) ?? [];
  books.set(book, chapters);
  const verses = (chapters[Number(c) - 1] ??= []);
  for (let n = first; n <= end; n++) {
    if (verses[n - 1] !== undefined) throw new Error(`Duplicate verse ${book} ${c}:${n}`);
    verses[n - 1] = null; // continuation slots of a bridge stay null
  }
  verses[first - 1] = text;
  if (end > first) {
    const list = bridges.get(book) ?? [];
    bridges.set(book, list);
    list.push([Number(c), first, end]);
    bridged++;
  }
  count++;
}
const opened = (xml.match(/<v\b/g) ?? []).length;
if (opened !== elements) throw new Error(`${opened - elements} <v> elements were not understood`);

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = outArg ? resolve(outArg) : join(root, "src", "data", "bibles", translationId);
mkdirSync(outDir, { recursive: true });

let gaps = 0;
for (const [book, chapters] of books) {
  // Fill holes (sparse array slots) with explicit nulls.
  const dense = Array.from(chapters, (verses) => Array.from(verses ?? [], (t) => t ?? null));
  const file = { format: 1, translation: translationId, book, chapters: dense };
  const spans = bridges.get(book);
  if (spans) file.bridges = spans;
  const joined = new Set((spans ?? []).flatMap(([c, f, l]) => Array.from({ length: l - f }, (_, i) => `${c}:${f + 1 + i}`)));
  dense.forEach((row, ci) => row.forEach((t, vi) => t === null && !joined.has(`${ci + 1}:${vi + 1}`) && gaps++));
  writeFileSync(join(outDir, `${book}.json`), JSON.stringify(file) + "\n", "utf8");
}

console.log(
  `${translationId}: ${books.size} books, ${count} verse entries (${bridged} bridged), ${gaps} numbered gaps → ${outDir}`,
);
