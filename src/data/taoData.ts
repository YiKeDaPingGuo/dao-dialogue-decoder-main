// 章节 / 词对齐数据由 CSV 语料生成 (scripts/build-corpus.mjs)。
// 修改数据请编辑 src/data/corpus/*.csv 后运行 `npm run build:corpus`。
//
// 注意: 大语料 (chapters / wordAlignments / sentenceAlignments 等) 已改为
// 「运行时从 OSS/本地 JSON 加载」, 不再打进 JS 包。请通过 src/data/taoCorpus.ts
// 的 loadCorpus() 获取, 这里仅再导出类型 (编译期, 零体积)。
export type {
  Chapter,
  WordAlignment,
  GlossaryEntry,
  FunctionWord,
  PrepositionSense,
  SentencePair,
} from "./corpus/generated";

export const graphNodes = [
  { id: "dao", label: "道 (Dào)", x: 300, y: 150, type: "concept" as const },
  { id: "camino", label: "El Camino", x: 150, y: 300, type: "translation" as const },
  { id: "via", label: "La Vía", x: 450, y: 300, type: "translation" as const },
  { id: "tao", label: "El Tao", x: 300, y: 350, type: "translation" as const },
  { id: "wuwei", label: "无为 (Wú Wéi)", x: 550, y: 150, type: "concept" as const },
  { id: "noaction", label: "No-acción", x: 650, y: 300, type: "translation" as const },
  { id: "sinactuar", label: "Sin actuar", x: 500, y: 400, type: "translation" as const },
  { id: "de", label: "德 (Dé)", x: 100, y: 150, type: "concept" as const },
  { id: "virtud", label: "La Virtud", x: 50, y: 300, type: "translation" as const },
  { id: "carmelo_t", label: "Elorduy", x: 200, y: 450, type: "translator" as const },
  { id: "preciado_t", label: "Preciado", x: 400, y: 450, type: "translator" as const },
];

export const graphEdges = [
  { from: "dao", to: "camino", label: "Domesticación" },
  { from: "dao", to: "via", label: "Domesticación" },
  { from: "dao", to: "tao", label: "Extranjerización" },
  { from: "wuwei", to: "noaction", label: "Calco semántico" },
  { from: "wuwei", to: "sinactuar", label: "Perífrasis" },
  { from: "de", to: "virtud", label: "Domesticación" },
  { from: "carmelo_t", to: "camino", label: "Traduce como" },
  { from: "carmelo_t", to: "noaction", label: "Traduce como" },
  { from: "preciado_t", to: "tao", label: "Traduce como" },
  { from: "preciado_t", to: "sinactuar", label: "Traduce como" },
];

export const mbtiData = {
  type: "INFJ",
  label: "El Consejero",
  wuWeiAlignment: 82,
  dimensions: [
    { axis: "Intuición (N)", value: 88 },
    { axis: "Sentimiento (F)", value: 75 },
    { axis: "Introversión (I)", value: 92 },
    { axis: "Juicio (J)", value: 68 },
    { axis: "Wu Wei (无为)", value: 82 },
    { axis: "Vacuidad (空)", value: 71 },
    { axis: "Armonía (和)", value: 89 },
    { axis: "Naturalidad (自然)", value: 76 },
  ],
};

export const chatPersonas = {
  laozi: {
    name: "老子 · Laozi",
    avatar: "🏔️",
    description: "Philosophical perspective",
    greeting: "El Dao que puede ser nombrado... Pregúntame sobre el misterio que subyace a las palabras.",
  },
  translator: {
    name: "Traductor · Lingüista",
    avatar: "📜",
    description: "Linguistic & syntactic analysis",
    greeting: "Analicemos las estrategias de traducción. ¿Qué versión te gustaría comparar?",
  },
  student: {
    name: "Compañero · Estudiante",
    avatar: "💬",
    description: "Casual discussion",
    greeting: "¡Hola! ¿Qué parte del Tao Te Ching estás estudiando? Podemos explorarlo juntos.",
  },
};
