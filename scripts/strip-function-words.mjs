// 一次性/幂等清洗: 从 word_alignments.csv 中剔除属于 function_words / prepositions
// 两张查表的词 (冠词/al-del/y-o-u-e-ni/介词), 使 word_alignments 只保留开放类实词+代词+否定+中性lo。
// 用法: node scripts/strip-function-words.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CORPUS = resolve(__dirname, "../src/data/corpus");

// 解析一行 CSV (支持双引号包裹字段、字段内逗号、转义双引号 "")
function parseLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") {
        out.push(cur);
        cur = "";
      } else cur += c;
    }
  }
  out.push(cur);
  return out;
}

const FUNC = new Set(
  parseCsvCol("function_words.csv", "surface")
);
const PREP = new Set(
  parseCsvCol("prepositions.csv", "preposition")
);

function parseCsvCol(file, col) {
  const raw = readFileSync(resolve(CORPUS, file), "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== "");
  const header = parseLine(lines[0]);
  const idx = header.indexOf(col);
  const vals = [];
  for (let i = 1; i < lines.length; i++) {
    const f = parseLine(lines[i]);
    if (f[idx]) vals.push(f[idx].trim().toLowerCase());
  }
  return vals;
}

const REMOVE = new Set([...FUNC, ...PREP]);

const alignPath = resolve(CORPUS, "word_alignments.csv");
const raw = readFileSync(alignPath, "utf8");
const eol = raw.includes("\r\n") ? "\r\n" : "\n";
const lines = raw.split(/\r?\n/);
const header = parseLine(lines[0]);
const spIdx = header.indexOf("spanish");
const chIdx = header.indexOf("chapter");

const kept = [lines[0]];
const removed = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim() === "") continue;
  const f = parseLine(line);
  const surface = (f[spIdx] || "").trim().toLowerCase();
  if (REMOVE.has(surface)) {
    removed.push(`ch${f[chIdx]} · ${f[spIdx]}`);
  } else {
    kept.push(line);
  }
}

writeFileSync(alignPath, kept.join(eol) + eol, "utf8");
console.log(`[strip] 剔除 ${removed.length} 行 (查表词):`);
console.log(removed.join("  |  "));
console.log(`[strip] 保留 ${kept.length - 1} 行 word_alignments。`);
