#!/usr/bin/env node
// 将道德经中西语料 CSV 转换为 TypeScript 数据模块。
// 输入:  src/data/corpus/chapters.csv         (章节原文 + 整段译文)
//        src/data/corpus/word_alignments.csv  (词级对齐 + 语法标注)
//        若上述文件不存在, 自动回退到同名的 *_template.csv 并给出提示。
// 输出:  src/data/corpus/generated.ts
//
// 运行:  npm run build:corpus

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CORPUS_DIR = join(__dirname, "..", "src", "data", "corpus");
const OUT_FILE = join(CORPUS_DIR, "generated.ts");

// 译者元数据: 只有这一本书。id 需与 CSV 中的 translator 列一致。
const TRANSLATOR_META = {
  arsovska: {
    name: "Liljana Arsovska & Pablo Rodríguez Durán",
    year: 2023,
  },
};

/**
 * 解析 CSV 文本为对象数组, 首行作为表头。
 * 支持: 双引号包裹字段、字段内逗号/换行、以 "" 转义的双引号。
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, ""); // 去掉 BOM

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
  }

  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    header.forEach((h, idx) => {
      obj[h] = (r[idx] ?? "").trim();
    });
    return obj;
  });
}

/** 选择真实数据文件, 缺失时回退到模板。 */
function resolveInput(base, optional = false) {
  const real = join(CORPUS_DIR, `${base}.csv`);
  const tpl = join(CORPUS_DIR, `${base}_template.csv`);
  if (existsSync(real)) return { path: real, isTemplate: false };
  if (existsSync(tpl)) return { path: tpl, isTemplate: true };
  if (optional) return null;
  throw new Error(`找不到 ${base}.csv 或 ${base}_template.csv`);
}

/** 转义字符串以安全嵌入 TS 双引号字面量。 */
function esc(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function main() {
  const chaptersIn = resolveInput("chapters");
  const alignIn = resolveInput("word_alignments");

  if (chaptersIn.isTemplate || alignIn.isTemplate) {
    console.warn(
      "[build:corpus] 提示: 正在使用模板文件。请把 *_template.csv 复制为 chapters.csv / word_alignments.csv 后填入真实数据。"
    );
  }

  const glossaryIn = resolveInput("glossary", true);
  const funcWordsIn = resolveInput("function_words", true);
  const prepositionsIn = resolveInput("prepositions", true);
  const sentencesIn = resolveInput("sentence_alignments", true);

  const chapterRows = parseCsv(readFileSync(chaptersIn.path, "utf8"));
  const alignRows = parseCsv(readFileSync(alignIn.path, "utf8"));
  const glossaryRows = glossaryIn
    ? parseCsv(readFileSync(glossaryIn.path, "utf8"))
    : [];
  const funcWordsRows = funcWordsIn
    ? parseCsv(readFileSync(funcWordsIn.path, "utf8"))
    : [];
  const prepositionsRows = prepositionsIn
    ? parseCsv(readFileSync(prepositionsIn.path, "utf8"))
    : [];
  const sentenceRows = sentencesIn
    ? parseCsv(readFileSync(sentencesIn.path, "utf8"))
    : [];

  // 1) 组装 chapters: 按章号聚合, translations 为 { 译者: 译文 }
  const chapterMap = new Map();
  for (const r of chapterRows) {
    const num = Number(r.chapter);
    if (!Number.isFinite(num)) continue;
    if (!chapterMap.has(num)) {
      chapterMap.set(num, {
        number: num,
        edition: r.zh_source_edition || "",
        chinese: r.chinese || "",
        translations: {},
        aiInterpretation: r.ai_interpretation || "",
      });
    }
    const ch = chapterMap.get(num);
    if (r.chinese && !ch.chinese) ch.chinese = r.chinese;
    if (r.zh_source_edition && !ch.edition) ch.edition = r.zh_source_edition;
    if (r.ai_interpretation && !ch.aiInterpretation)
      ch.aiInterpretation = r.ai_interpretation;
    if (r.translator) ch.translations[r.translator] = r.translation || "";
  }
  const chapters = [...chapterMap.values()].sort((a, b) => a.number - b.number);

  // 2) 组装 wordAlignments: key = `${translator}-${chapter}`
  const alignMap = new Map();
  const translatorIds = new Set();
  for (const r of alignRows) {
    if (!r.translator || !r.chapter || !r.spanish) continue;
    translatorIds.add(r.translator);
    const key = `${r.translator}-${r.chapter}`;
    if (!alignMap.has(key)) alignMap.set(key, []);
    alignMap.get(key).push({
      tokenIndex: Number(r.token_index) || 0,
      sentenceId: r.sentence_id || "",
      spanish: r.spanish,
      lemma: r.lemma || "",
      chinese: r.chinese || "",
      pinyin: r.pinyin || "",
      meaning: r.meaning || "",
      pos: r.pos || "",
      isProperNoun: String(r.is_proper_noun).toLowerCase() === "true",
      syntacticRole: r.syntactic_role_es || "",
      syntacticRoleChinese: r.syntactic_role_zh || "",
      verbPerson: r.verb_person || "",
      verbNumber: r.verb_number || "",
      verbTense: r.verb_tense || "",
      verbMood: r.verb_mood || "",
      otherTranslation: r.other_translation || "",
      pronounRef: r.pronoun_ref || "",
      clauseType: r.clause_type || "",
      note: r.note || "",
    });
  }
  for (const list of alignMap.values())
    list.sort((a, b) => a.tokenIndex - b.tokenIndex);

  // 章节里出现过的译者也纳入
  for (const ch of chapters)
    Object.keys(ch.translations).forEach((t) => translatorIds.add(t));

  const translators = [...translatorIds].map((id) => ({
    id,
    name: TRANSLATOR_META[id]?.name ?? id,
    year: TRANSLATOR_META[id]?.year ?? 0,
  }));

  // 3) 组装 glossary (专有名词 / 术语表)
  const glossary = glossaryRows
    .filter((r) => r.term_zh)
    .map((r) => ({
      termZh: r.term_zh,
      pinyin: r.pinyin || "",
      termEs: r.term_es || "",
      category: r.category || "",
      firstChapter: Number(r.first_chapter) || 0,
      note: r.note || "",
    }));

  // 3b) 组装 functionWords (封闭类固定词: 冠词/缩合/并列连词), 以 surface 为键便于查表
  const functionWords = {};
  for (const r of funcWordsRows) {
    if (!r.surface) continue;
    functionWords[r.surface.toLowerCase()] = {
      surface: r.surface,
      pos: r.pos || "",
      meaningEs: r.meaning_es || "",
      meaningZh: r.meaning_zh || "",
      syntacticRoleEs: r.syntactic_role_es || "",
      syntacticRoleZh: r.syntactic_role_zh || "",
      note: r.note || "",
    };
  }

  // 3c) 组装 prepositions (介词义项表), 以 preposition 为键, 值为义项数组
  const prepositions = {};
  for (const r of prepositionsRows) {
    if (!r.preposition) continue;
    const key = r.preposition.toLowerCase();
    if (!prepositions[key]) prepositions[key] = [];
    prepositions[key].push({
      senseNo: Number(r.sense_no) || 0,
      meaningEs: r.meaning_es || "",
      meaningZh: r.meaning_zh || "",
      example: r.example || "",
    });
  }
  for (const k of Object.keys(prepositions))
    prepositions[k].sort((a, b) => a.senseNo - b.senseNo);

  // 3d) 组装 sentenceAlignments (章内逐句对应表), key = `${translator}-${chapter}`
  const sentenceMap = new Map();
  for (const r of sentenceRows) {
    if (!r.translator || !r.chapter || !r.chinese) continue;
    const key = `${r.translator}-${r.chapter}`;
    if (!sentenceMap.has(key)) sentenceMap.set(key, []);
    sentenceMap.get(key).push({
      no: Number(r.sentence_no) || 0,
      chinese: r.chinese,
      spanish: r.spanish || "",
      note: r.note || "",
    });
  }
  for (const list of sentenceMap.values()) list.sort((a, b) => a.no - b.no);

  // 校验: 每章逐句的中文按序拼接应与该章原文完全一致 (确保前端可无损渲染句级高亮)
  for (const [key, list] of sentenceMap.entries()) {
    const [t, chStr] = key.split("-");
    const ch = chapterMap.get(Number(chStr));
    if (!ch) continue;
    const joined = list.map((s) => s.chinese).join("");
    if (joined !== ch.chinese) {
      console.warn(
        `[build:corpus] 警告: 句对齐中文拼接与原文不一致 (${key})\n  原文: ${ch.chinese}\n  拼接: ${joined}`
      );
    }
    const trans = ch.translations[t] || "";
    for (const s of list) {
      if (s.spanish && !trans.includes(s.spanish)) {
        console.warn(
          `[build:corpus] 警告: 句对齐西语片段不在译文中 (${key} #${s.no}): "${s.spanish}"`
        );
      }
    }
  }

  // 3) 序列化为 TS
  const optional = (obj, key, val, isNum = false) => {
    if (val === "" || val == null) return;
    obj.push(`      ${key}: ${isNum ? val : `"${esc(val)}"`},`);
  };

  const alignBlocks = [...alignMap.entries()]
    .map(([key, list]) => {
      const items = list
        .map((w) => {
          const lines = [];
          lines.push(`      tokenIndex: ${w.tokenIndex},`);
          lines.push(`      spanish: "${esc(w.spanish)}",`);
          lines.push(`      chinese: "${esc(w.chinese)}",`);
          lines.push(`      pinyin: "${esc(w.pinyin)}",`);
          lines.push(`      meaning: "${esc(w.meaning)}",`);
          lines.push(`      syntacticRole: "${esc(w.syntacticRole)}",`);
          lines.push(
            `      syntacticRoleChinese: "${esc(w.syntacticRoleChinese)}",`
          );
          if (w.isProperNoun) lines.push(`      isProperNoun: true,`);
          optional(lines, "sentenceId", w.sentenceId);
          optional(lines, "lemma", w.lemma);
          optional(lines, "pos", w.pos);
          optional(lines, "verbPerson", w.verbPerson);
          optional(lines, "verbNumber", w.verbNumber);
          optional(lines, "verbTense", w.verbTense);
          optional(lines, "verbMood", w.verbMood);
          optional(lines, "otherTranslation", w.otherTranslation);
          optional(lines, "pronounRef", w.pronounRef);
          optional(lines, "clauseType", w.clauseType);
          optional(lines, "note", w.note);
          return `    {\n${lines.join("\n")}\n    }`;
        })
        .join(",\n");
      return `  "${esc(key)}": [\n${items}\n  ],`;
    })
    .join("\n");

  const chapterBlocks = chapters
    .map((ch) => {
      const trans = Object.entries(ch.translations)
        .map(([t, v]) => `      ${JSON.stringify(t)}: "${esc(v)}",`)
        .join("\n");
      return [
        "  {",
        `    number: ${ch.number},`,
        `    edition: "${esc(ch.edition)}",`,
        `    chinese: "${esc(ch.chinese)}",`,
        "    translations: {",
        trans,
        "    },",
        `    aiInterpretation: "${esc(ch.aiInterpretation)}",`,
        "  },",
      ].join("\n");
    })
    .join("\n");

  const out = `// 本文件由 scripts/build-corpus.mjs 自动生成, 请勿手动编辑。
// 数据来源: src/data/corpus/*.csv  ->  运行 \`npm run build:corpus\` 重新生成。

export interface Chapter {
  number: number;
  edition: string;
  chinese: string;
  translations: Record<string, string>;
  aiInterpretation: string;
}

export interface WordAlignment {
  tokenIndex: number;
  spanish: string;
  chinese: string;
  pinyin: string;
  meaning: string;
  syntacticRole: string;
  syntacticRoleChinese: string;
  isProperNoun?: boolean;
  sentenceId?: string;
  lemma?: string;
  pos?: string;
  verbPerson?: string;
  verbNumber?: string;
  verbTense?: string;
  verbMood?: string;
  otherTranslation?: string;
  pronounRef?: string;
  clauseType?: string;
  note?: string;
}

export interface GlossaryEntry {
  termZh: string;
  pinyin: string;
  termEs: string;
  category: string;
  firstChapter: number;
  note: string;
}

export interface FunctionWord {
  surface: string;
  pos: string;
  meaningEs: string;
  meaningZh: string;
  syntacticRoleEs: string;
  syntacticRoleZh: string;
  note: string;
}

export interface PrepositionSense {
  senseNo: number;
  meaningEs: string;
  meaningZh: string;
  example: string;
}

export interface SentencePair {
  no: number;
  chinese: string;
  spanish: string;
  note?: string;
}

export const translators = ${JSON.stringify(translators, null, 2)};

export const chapters: Chapter[] = [
${chapterBlocks}
];

export const wordAlignments: Record<string, WordAlignment[]> = {
${alignBlocks}
};

export const glossary: GlossaryEntry[] = ${JSON.stringify(glossary, null, 2)};

// 封闭类固定词表 (冠词 / al-del / 并列连词): 以小写 surface 为键
export const functionWords: Record<string, FunctionWord> = ${JSON.stringify(functionWords, null, 2)};

// 介词义项表: 以小写 preposition 为键, 值为该介词的全部义项
export const prepositions: Record<string, PrepositionSense[]> = ${JSON.stringify(prepositions, null, 2)};

// 章内逐句对应表: 以 \`\${translator}-\${chapter}\` 为键, 值为该章逐句中西对照
export const sentenceAlignments: Record<string, SentencePair[]> = ${JSON.stringify(
    Object.fromEntries(sentenceMap),
    null,
    2
  )};
`;

  writeFileSync(OUT_FILE, out, "utf8");

  // ---- 额外产出: 供运行时 (OSS / 本地) 加载的 JSON ----
  // 大语料不再打进 JS 包, 前端打开镜像书架时按需 fetch 此文件。
  const corpusJson = {
    translators,
    chapters,
    wordAlignments: Object.fromEntries(alignMap),
    glossary,
    functionWords,
    prepositions,
    sentenceAlignments: Object.fromEntries(sentenceMap),
  };
  const jsonStr = JSON.stringify(corpusJson);

  // 1) public 本地副本: dev 直接用, 也作为线上 OSS 失败时的傅底 (/corpus/tao-corpus.json)
  const publicDir = join(__dirname, "..", "public", "corpus");
  mkdirSync(publicDir, { recursive: true });
  writeFileSync(join(publicDir, "tao-corpus.json"), jsonStr, "utf8");

  // 2) 待上传 OSS 的副本 (仓库根 oss/ 目录)
  const ossDir = join(__dirname, "..", "oss");
  mkdirSync(ossDir, { recursive: true });
  const ossFile = join(ossDir, "tao-corpus.json");
  writeFileSync(ossFile, jsonStr, "utf8");

  const jsonKB = (jsonStr.length / 1024).toFixed(1);
  console.log(
    `[build:corpus] 已生成 ${OUT_FILE}\n  章节: ${chapters.length}  词对齐分组: ${alignMap.size}  术语: ${glossary.length}  固定词: ${Object.keys(functionWords).length}  介词: ${Object.keys(prepositions).length}  句对齐分组: ${sentenceMap.size}  译者: ${translators
      .map((t) => t.id)
      .join(", ")}`
  );
  console.log(
    `[build:corpus] 已生成 JSON (${jsonKB} KB):\n  本地: public/corpus/tao-corpus.json\n  上传: oss/tao-corpus.json  ->  上传到 OSS 后设置 VITE_CORPUS_URL`
  );
}

main();
