// 镜像书架大语料的「运行时加载器」。
// 语料 (章节/词对齐/句对齐/术语/固定词/介词) 不再打进 JS 包, 而是构建时产出
// tao-corpus.json, 由前端首次打开镜像书架时按需 fetch。
//   - 生产环境: 上传 tao-corpus.json 到 OSS, 并在构建时设置 VITE_CORPUS_URL 指向 OSS 链接。
//   - 开发/傅底: 使用 public/corpus/tao-corpus.json (同源, 无需 CORS)。
import type {
  Chapter,
  WordAlignment,
  GlossaryEntry,
  FunctionWord,
  PrepositionSense,
  SentencePair,
} from "./corpus/generated";

export type {
  Chapter,
  WordAlignment,
  GlossaryEntry,
  FunctionWord,
  PrepositionSense,
  SentencePair,
};

export interface Translator {
  id: string;
  name: string;
  year: number;
}

export interface TaoCorpus {
  translators: Translator[];
  chapters: Chapter[];
  wordAlignments: Record<string, WordAlignment[]>;
  glossary: GlossaryEntry[];
  functionWords: Record<string, FunctionWord>;
  prepositions: Record<string, PrepositionSense[]>;
  sentenceAlignments: Record<string, SentencePair[]>;
}

// 依次尝试: 环境变量覆盖 -> OSS -> 本地 public 副本(傅底)
const OSS_CORPUS_URL =
  "https://nkuquetao.oss-cn-shanghai.aliyuncs.com/corpus/tao-corpus.json";
const CANDIDATE_URLS = [
  import.meta.env.VITE_CORPUS_URL as string | undefined,
  OSS_CORPUS_URL,
  "/corpus/tao-corpus.json",
].filter((u): u is string => Boolean(u));

let cache: Promise<TaoCorpus> | null = null;

async function fetchFirstAvailable(urls: string[]): Promise<TaoCorpus> {
  let lastError: unknown = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "force-cache" });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} (${url})`);
        continue;
      }
      return (await res.json()) as TaoCorpus;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("No se pudo cargar el corpus del Tao Te Ching");
}

/** 加载语料 (带缓存)。失败会清空缓存以便重试。 */
export function loadCorpus(): Promise<TaoCorpus> {
  if (!cache) {
    cache = fetchFirstAvailable(CANDIDATE_URLS).catch((error) => {
      cache = null;
      throw error;
    });
  }
  return cache;
}
