#!/usr/bin/env node
/**
 * Converts an eBible.org "VPL" XML file (…_vpl.xml from …_vpl.zip) into
 * VersePath's per-book JSON format:
 *
 *   src/data/bibles/<translationId>/<BOOK>.json
 *   { "format": 1, "translation": "web", "book": "JHN",
 *     "chapters": [ ["1:1 text", "1:2 text", …], … ] }
 *
 * `chapters[c - 1][v - 1]` is the text of chapter c, verse v. A verse that the
 * source does not contain (versification gaps) is stored as null so the reader
 * can show it as "not present in this translation" instead of inventing it.
 *
 * The text is copied verbatim apart from trimming whitespace and decoding XML
 * entities. Never edit the generated files by hand: re-run this script.
 *
 * Usage: node scripts/convert-vpl.mjs <path/to/xxx_vpl.xml> <translationId>
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const [xmlPath, translationId] = process.argv.slice(2);
if (!xmlPath || !translationId || !/^[a-z0-9-]+$/.test(translationId)) {
  console.error("Usage: node scripts/convert-vpl.mjs <xxx_vpl.xml> <translationId>");
  process.exit(1);
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => {
    if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
    return ENTITIES[e] ?? m;
  });

const xml = readFileSync(xmlPath, "utf8").normalize("NFC");
const VERSE = /<v b="([0-9A-Z]{3})" c="(\d+)" v="(\d+)">([\s\S]*?)<\/v>/g;

/** @type {Map<string, (string | null)[][]>} */
const books = new Map();
let count = 0;
for (const [, book, c, v, raw] of xml.matchAll(VERSE)) {
  const text = decode(raw).replace(/\s+/g, " ").trim();
  if (!text) continue;
  if (/[<>]/.test(text)) throw new Error(`Unexpected markup in ${book} ${c}:${v}`);
  const chapters = books.get(book) ?? [];
  books.set(book, chapters);
  const verses = (chapters[Number(c) - 1] ??= []);
  if (verses[Number(v) - 1] != null) throw new Error(`Duplicate verse ${book} ${c}:${v}`);
  verses[Number(v) - 1] = text;
  count++;
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "src", "data", "bibles", translationId);
mkdirSync(outDir, { recursive: true });

let gaps = 0;
for (const [book, chapters] of books) {
  // Fill holes (sparse array slots) with explicit nulls.
  const dense = Array.from(chapters, (verses) => {
    const row = Array.from(verses ?? [], (t) => t ?? null);
    gaps += row.filter((t) => t === null).length;
    return row;
  });
  const json = JSON.stringify({ format: 1, translation: translationId, book, chapters: dense });
  writeFileSync(join(outDir, `${book}.json`), json + "\n", "utf8");
}

console.log(`${translationId}: ${books.size} books, ${count} verses, ${gaps} numbered gaps → ${outDir}`);
