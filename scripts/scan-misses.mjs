#!/usr/bin/env node
// 扫描 chapters.csv 中每章西语译文, 复现 UI 的分词与查表逻辑,
// 列出"未命中"(灰色不可点)的词, 便于逐章补齐 word_alignments / function_words / prepositions。
//
// 运行:  node scripts/scan-misses.mjs [起始章] [结束章]
//        默认扫描 30~81 章。

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CORPUS_DIR = join(__dirname, "..", "src", "data", "corpus");

const START = Number(process.argv[2]) || 30;
const END = Number(process.argv[3]) || 81;
const TRANSLATOR = "arsovska";

// --- CSV 解析 (与 build-corpus.mjs 相同) ---
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
  }
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    header.forEach((h, idx) => { obj[h] = (r[idx] ?? "").trim(); });
    return obj;
  });
}

// --- 与 UI 完全一致的 cleanOf ---
const cleanOf = (word) => word.replace(/[.,;:!?¿¡"""''()—–-]/g, "");

const chapterRows = parseCsv(readFileSync(join(CORPUS_DIR, "chapters.csv"), "utf8"));
const alignRows = parseCsv(readFileSync(join(CORPUS_DIR, "word_alignments.csv"), "utf8"));
const funcRows = parseCsv(readFileSync(join(CORPUS_DIR, "function_words.csv"), "utf8"));
const prepRows = parseCsv(readFileSync(join(CORPUS_DIR, "prepositions.csv"), "utf8"));

// 每章的 alignment 表面词集合 (小写)
const alignByChapter = new Map(); // chapterNum -> Set(lowercased spanish)
for (const r of alignRows) {
  if (r.translator !== TRANSLATOR || !r.chapter || !r.spanish) continue;
  const n = Number(r.chapter);
  if (!alignByChapter.has(n)) alignByChapter.set(n, new Set());
  alignByChapter.get(n).add(r.spanish.toLowerCase());
}
const funcSet = new Set(funcRows.filter((r) => r.surface).map((r) => r.surface.toLowerCase()));
const prepSet = new Set(prepRows.filter((r) => r.preposition).map((r) => r.preposition.toLowerCase()));

// 译文按章
const transByChapter = new Map();
for (const r of chapterRows) {
  if (r.translator !== TRANSLATOR) continue;
  const n = Number(r.chapter);
  if (Number.isFinite(n) && r.translation) transByChapter.set(n, r.translation);
}

let totalMiss = 0;
const perChapterCounts = [];
for (let n = START; n <= END; n++) {
  const text = transByChapter.get(n);
  if (!text) continue;
  const aset = alignByChapter.get(n) || new Set();
  const words = text.split(/(\s+)/);
  const misses = []; // {word, cw}
  const seen = new Set();
  for (const w of words) {
    if (/^\s+$/.test(w) || w === "") continue;
    const cw = cleanOf(w).toLowerCase();
    if (!cw) continue;
    const hit = aset.has(cw) || funcSet.has(cw) || prepSet.has(cw);
    if (!hit && !seen.has(cw)) {
      seen.add(cw);
      misses.push(cw);
    }
  }
  if (misses.length) {
    totalMiss += misses.length;
    perChapterCounts.push([n, misses.length]);
    console.log(`\n第 ${n} 章  未命中 ${misses.length} 个:`);
    console.log("  " + misses.join("  "));
  }
}

console.log(`\n==== 汇总: ${START}-${END} 章, 共 ${totalMiss} 个未命中(去重/每章) ====`);
console.log("按章:", perChapterCounts.map(([n, c]) => `${n}:${c}`).join("  "));
