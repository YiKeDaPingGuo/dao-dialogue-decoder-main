import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  type WordAlignment,
  type FunctionWord,
  type PrepositionSense,
  type SentencePair,
} from "@/data/taoData";
import { loadCorpus, type TaoCorpus } from "@/data/taoCorpus";
import { ChevronDown, Volume2, Loader2 } from "lucide-react";
import { Snail } from "lucide-react";
import { useSpeaker, type SpeakLang } from "@/lib/speech";

// 一组「小喇叭(正常语速) + 小蜗牛(慢速)」朗读按钮
const SpeakButtons = ({
  text,
  lang,
  size = "sm",
}: {
  text: string;
  lang: SpeakLang;
  size?: "sm" | "xs";
}) => {
  const { speakingId, play } = useSpeaker();
  const normalId = `${lang}-normal`;
  const slowId = `${lang}-slow`;
  const cls = size === "xs" ? "h-3.5 w-3.5" : "h-4 w-4";
  const btn =
    "flex items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:text-primary hover:bg-primary/10";
  return (
    <span className="inline-flex items-center gap-0.5">
      <button
        type="button"
        aria-label="Leer en voz alta"
        title="朗读 · Leer"
        onClick={(e) => {
          e.stopPropagation();
          play(normalId, text, { lang, rate: 1 });
        }}
        className={btn}
      >
        <Volume2 className={`${cls} ${speakingId === normalId ? "text-primary animate-pulse" : ""}`} />
      </button>
      <button
        type="button"
        aria-label="Leer despacio"
        title="慢速朗读 · Leer despacio"
        onClick={(e) => {
          e.stopPropagation();
          play(slowId, text, { lang, rate: 0.6 });
        }}
        className={btn}
      >
        <Snail className={`${cls} ${speakingId === slowId ? "text-primary animate-pulse" : ""}`} />
      </button>
    </span>
  );
};

// 点击某个词后, 可能来自三张表之一
type SelectedInfo =
  | { kind: "align"; surface: string; data: WordAlignment }
  | { kind: "func"; surface: string; data: FunctionWord }
  | { kind: "prep"; surface: string; senses: PrepositionSense[] };

const CloseBtn = ({ onClose }: { onClose: () => void }) => (
  <button
    aria-label="Cerrar"
    onClick={onClose}
    className="flex min-h-11 min-w-11 -m-2 items-center justify-center text-lg leading-none text-muted-foreground hover:text-foreground"
  >
    ×
  </button>
);

const Field = ({ label, value, zh }: { label: string; value?: string; zh?: boolean }) =>
  value ? (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={`text-foreground text-right ${zh ? "font-chinese" : ""}`}>{value}</span>
    </div>
  ) : null;

const conjugation = (w: WordAlignment): string => {
  if (w.verbMood === "infinitivo") return "infinitivo";
  const parts: string[] = [];
  if (w.verbPerson) parts.push(`${w.verbPerson}ª`);
  if (w.verbNumber) parts.push(w.verbNumber === "singular" ? "sing." : "pl.");
  if (w.verbTense) parts.push(w.verbTense);
  if (w.verbMood) parts.push(w.verbMood);
  return parts.join(" · ");
};

const AlignmentCard = ({ word, onClose }: { word: WordAlignment; onClose: () => void }) => {
  const conj = conjugation(word);
  const { speakingId, play } = useSpeaker();
  return (
    <>
      <div className="flex items-start justify-between mb-3">
        <div>
          {/* 点击中文即朗读道德经原文该字/词的读音 */}
          <button
            type="button"
            onClick={() => word.chinese && play("zh", word.chinese, { lang: "zh", rate: 1 })}
            className="group inline-flex items-baseline gap-1.5 text-left"
            title="点击朗读原文读音"
          >
            <span className="font-chinese text-2xl text-primary group-hover:underline decoration-primary/40 underline-offset-4">
              {word.chinese}
            </span>
            <Volume2
              className={`h-4 w-4 self-center text-muted-foreground transition-colors group-hover:text-primary ${
                speakingId === "zh" ? "text-primary animate-pulse" : ""
              }`}
            />
          </button>
          {word.pinyin && word.pinyin !== "-" && (
            <span className="text-sm text-muted-foreground ml-2 font-body">{word.pinyin}</span>
          )}
        </div>
        <CloseBtn onClose={onClose} />
      </div>
      {/* 朗读: 西语词 */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => play("es", word.spanish, { lang: "es", rate: 1 })}
          className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-body text-foreground transition-colors hover:bg-accent"
        >
          <Volume2 className={`h-3.5 w-3.5 ${speakingId === "es" ? "text-primary animate-pulse" : ""}`} />
          Español
        </button>
      </div>
      <div className="space-y-2 text-sm font-body">
        <Field label="Español" value={word.spanish} />
        {word.lemma && word.lemma !== word.spanish && <Field label="Lema" value={word.lemma} />}
        <Field label="Significado" value={word.meaning} />
        {word.pos && <Field label="Categoría" value={word.pos} />}
        {conj && <Field label="Conjugación" value={conj} />}
        {word.pronounRef && <Field label="Referencia" value={word.pronounRef} />}
        {word.otherTranslation && <Field label="Otra trad." value={word.otherTranslation} />}
        <div className="border-t border-border pt-2 mt-2">
          <span className="text-muted-foreground text-xs">Función sintáctica:</span>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
              {word.syntacticRole}
            </span>
            <span className="text-xs text-muted-foreground font-chinese">
              {word.syntacticRoleChinese}
            </span>
          </div>
          {word.clauseType && (
            <div className="text-xs text-muted-foreground mt-1">Cláusula: {word.clauseType}</div>
          )}
        </div>
        {word.note && (
          <div className="border-t border-border pt-2 text-xs text-muted-foreground font-chinese">
            {word.note}
          </div>
        )}
      </div>
    </>
  );
};

const FunctionWordCard = ({ word, onClose }: { word: FunctionWord; onClose: () => void }) => (
  <>
    <div className="flex items-start justify-between mb-3">
      <div>
        <span className="font-display text-xl text-primary font-semibold">{word.surface}</span>
        <span className="text-xs text-muted-foreground ml-2">{word.pos}</span>
      </div>
      <CloseBtn onClose={onClose} />
    </div>
    <div className="space-y-2 text-sm font-body">
      <Field label="Significado" value={word.meaningEs} />
      <Field label="含义" value={word.meaningZh} zh />
      <div className="border-t border-border pt-2 mt-2">
        <span className="text-muted-foreground text-xs">Función:</span>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
            {word.syntacticRoleEs}
          </span>
          <span className="text-xs text-muted-foreground font-chinese">{word.syntacticRoleZh}</span>
        </div>
      </div>
      {word.note && (
        <div className="border-t border-border pt-2 text-xs text-muted-foreground font-chinese">
          {word.note}
        </div>
      )}
    </div>
  </>
);

const PrepositionCard = ({
  surface,
  senses,
  onClose,
}: {
  surface: string;
  senses: PrepositionSense[];
  onClose: () => void;
}) => (
  <>
    <div className="flex items-start justify-between mb-3">
      <div>
        <span className="font-display text-xl text-primary font-semibold">{surface}</span>
        <span className="text-xs text-muted-foreground ml-2">
          preposición · {senses.length} acepciones
        </span>
      </div>
      <CloseBtn onClose={onClose} />
    </div>
    <div className="space-y-2.5 text-sm font-body">
      <p className="text-xs text-muted-foreground">Elige la acepción según el contexto:</p>
      {senses.map((s) => (
        <div key={s.senseNo} className="border-t border-border pt-2">
          <div className="flex gap-2">
            <span className="text-primary font-semibold">{s.senseNo}.</span>
            <div className="flex-1">
              <div className="text-foreground">{s.meaningEs}</div>
              <div className="text-muted-foreground font-chinese">{s.meaningZh}</div>
              {s.example && (
                <div className="text-xs text-muted-foreground/80 mt-0.5 font-chinese">
                  例: {s.example}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </>
);

const SentenceCard = ({ pair, onClose }: { pair: SentencePair; onClose: () => void }) => {
  const { speakingId, play, playSequence } = useSpeaker();
  return (
    <>
      <div className="flex items-start justify-between mb-3 gap-3">
        <span className="text-xs font-body uppercase tracking-[0.15em] text-primary">
          句 · Oración
        </span>
        <CloseBtn onClose={onClose} />
      </div>
      {/* 朗读: 中文 / 西语 / 中西连读 */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => play("zh", pair.chinese, { lang: "zh", rate: 1 })}
          className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-body text-foreground transition-colors hover:bg-accent"
        >
          <Volume2 className={`h-3.5 w-3.5 ${speakingId === "zh" ? "text-primary animate-pulse" : ""}`} />
          中文
        </button>
        <button
          type="button"
          onClick={() => play("es", pair.spanish, { lang: "es", rate: 1 })}
          className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-body text-foreground transition-colors hover:bg-accent"
        >
          <Volume2 className={`h-3.5 w-3.5 ${speakingId === "es" ? "text-primary animate-pulse" : ""}`} />
          Español
        </button>
        <button
          type="button"
          onClick={() =>
            playSequence(
              "both",
              [
                { text: pair.chinese, lang: "zh" },
                { text: pair.spanish, lang: "es" },
              ],
              1,
            )
          }
          className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-body text-primary transition-colors hover:bg-primary/20"
        >
          <Volume2 className={`h-3.5 w-3.5 ${speakingId === "both" ? "animate-pulse" : ""}`} />
          中西连读
        </button>
      </div>
      <div className="space-y-3 text-sm font-body">
        <p className="font-chinese text-base leading-relaxed text-foreground">{pair.chinese}</p>
        <div className="border-t border-border pt-3">
          <span className="text-muted-foreground text-xs">Traducción</span>
          <p className="mt-1 font-display text-base leading-relaxed text-foreground">
            {pair.spanish}
          </p>
        </div>
        {pair.note && (
          <div className="border-t border-border pt-2 text-xs text-muted-foreground font-chinese">
            {pair.note}
          </div>
        )}
      </div>
    </>
  );
};

/** Build a compact page list: 1 2 3 4 5 … 81, or 1 … 38 39 40 41 42 … 81 */
function chapterPageItems(current: number, total: number): Array<number | "…"> {
  if (total <= 9) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total]);
  for (let i = current - 2; i <= current + 2; i++) {
    if (i >= 1 && i <= total) set.add(i);
  }
  // Near start / end: show a longer contiguous run instead of tiny gaps
  if (current <= 4) {
    for (let i = 1; i <= 5; i++) set.add(i);
  }
  if (current >= total - 3) {
    for (let i = total - 4; i <= total; i++) set.add(i);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: Array<number | "…"> = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
    out.push(sorted[i]);
  }
  return out;
}

const MirrorBookshelf = () => {
  const [corpus, setCorpus] = useState<TaoCorpus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [activeTranslator, setActiveTranslator] = useState("");
  const [selected, setSelected] = useState<SelectedInfo | null>(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });
  const [popoverDirection, setPopoverDirection] = useState<{ vertical: 'up' | 'down'; horizontal: 'center' | 'left' | 'right' }>({ vertical: 'up', horizontal: 'center' });
  const [showInterpretation, setShowInterpretation] = useState(false);
  const [showTranslatorDropdown, setShowTranslatorDropdown] = useState(false);
  const [activeSentence, setActiveSentence] = useState<number | null>(null);
  const [sentencePos, setSentencePos] = useState({ x: 0, y: 0, below: true });
  const spanishRef = useRef<HTMLDivElement>(null);
  const chineseRef = useRef<HTMLDivElement>(null);

  // 运行时加载语料 (OSS / 本地 JSON), 不再打进 JS 包
  const loadCorpusData = useCallback(() => {
    setLoadError(null);
    loadCorpus()
      .then((c) => {
        setCorpus(c);
        setActiveTranslator((prev) => prev || c.translators[0]?.id || "");
      })
      .catch((e) =>
        setLoadError(e instanceof Error ? e.message : "Error al cargar el corpus"),
      );
  }, []);
  useEffect(() => {
    loadCorpusData();
  }, [loadCorpusData]);

  // 语料各表 (加载完成前用空值傅底, 保证 Hooks 顺序稳定)
  const chaptersData = corpus?.chapters ?? [];
  const translatorsData = corpus?.translators ?? [];
  const wordAlignments = corpus?.wordAlignments ?? {};
  const functionWords = corpus?.functionWords ?? {};
  const prepositions = corpus?.prepositions ?? {};
  const sentenceAlignments = corpus?.sentenceAlignments ?? {};

  const chapter = chaptersData[activeChapter];
  const translation = chapter?.translations[activeTranslator] ?? "";
  const alignmentKey = chapter ? `${activeTranslator}-${chapter.number}` : "";
  const alignments = useMemo(
    () => wordAlignments[alignmentKey] || [],
    [wordAlignments, alignmentKey],
  );
  const sentences = useMemo(
    () => sentenceAlignments[alignmentKey] || [],
    [sentenceAlignments, alignmentKey],
  );
  const activeSentencePair = useMemo(
    () => sentences.find((s) => s.no === activeSentence) ?? null,
    [sentences, activeSentence]
  );

  // 切换章节 / 译者时清空句级选中
  useEffect(() => {
    setActiveSentence(null);
  }, [alignmentKey]);
  const chapterPages = useMemo(
    () => chapterPageItems(activeChapter + 1, Math.max(1, chaptersData.length)),
    [activeChapter, chaptersData.length],
  );

  const cleanOf = (word: string) =>
    word.replace(/[.,;:!?¿¡"""''()—–-]/g, "");

  // 依次查三张表: 对齐表(实词/代词) -> 固定词表(冠词等) -> 介词义项表
  const lookup = useCallback(
    (cleanWord: string): SelectedInfo | null => {
      const cw = cleanWord.toLowerCase();
      if (!cw) return null;
      const alignment = alignments.find((a) => a.spanish.toLowerCase() === cw);
      if (alignment) return { kind: "align", surface: cw, data: alignment };
      const fw = functionWords[cw];
      if (fw) return { kind: "func", surface: cw, data: fw };
      const prep = prepositions[cw];
      if (prep && prep.length) return { kind: "prep", surface: cw, senses: prep };
      return null;
    },
    [alignments, functionWords, prepositions]
  );

  const handleWordClick = useCallback(
    (word: string, e: React.MouseEvent) => {
      setActiveSentence(null); // 打开词卡时关闭句级高亮
      const info = lookup(cleanOf(word));
      if (!info) {
        setSelected(null);
        return;
      }
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const containerRect = spanishRef.current?.getBoundingClientRect();
      if (containerRect) {
        const relX = rect.left - containerRect.left + rect.width / 2;
        const relY = rect.top - containerRect.top;
        const popoverW = 288;
        const popoverH = 200;
        const vertical = relY < popoverH + 20 ? "down" : "up";
        let horizontal: "center" | "left" | "right" = "center";
        if (relX < popoverW / 2 + 16) horizontal = "left";
        else if (relX > containerRect.width - popoverW / 2 - 16) horizontal = "right";
        setPopoverPos({ x: relX, y: relY });
        setPopoverDirection({ vertical, horizontal });
      }
      setSelected(info);
    },
    [lookup]
  );

  // 点击中文句子: 句级高亮 + 显示西译卡片 (位置就近, 相对中文面板容器)
  const handleSentenceClick = useCallback(
    (no: number, e: React.MouseEvent) => {
      setSelected(null); // 关闭词卡, 避免两种卡片同时出现
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const containerRect = chineseRef.current?.getBoundingClientRect();
      if (containerRect) {
        const relX = rect.left - containerRect.left + rect.width / 2;
        const relTop = rect.top - containerRect.top;
        const relBottom = relTop + rect.height;
        // 上半区在句子下方弹出, 下半区在上方弹出
        const below = relTop < containerRect.height * 0.55;
        setSentencePos({ x: relX, y: below ? relBottom : relTop, below });
      }
      setActiveSentence((prev) => (prev === no ? null : no));
    },
    []
  );

  const renderClickableText = (text: string) => {
    const words = text.split(/(\s+)/);
    return words.map((word, i) => {
      if (/^\s+$/.test(word)) return <span key={i}>{word}</span>;
      const cw = cleanOf(word).toLowerCase();
      const hasEntry = Boolean(
        alignments.some((a) => a.spanish.toLowerCase() === cw) ||
          functionWords[cw] ||
          (prepositions[cw] && prepositions[cw].length)
      );
      const isActive = selected?.surface === cw;
      // 固定词(冠词/连词)用较淡的样式区分, 实词/介词用高亮
      const isFunc = !alignments.some((a) => a.spanish.toLowerCase() === cw) && Boolean(functionWords[cw]);
      return (
        <span
          key={i}
          className={`word-highlight ${hasEntry ? "cursor-pointer" : ""} ${isActive ? "active" : ""}`}
          onClick={(e) => hasEntry && handleWordClick(word, e)}
          style={{ opacity: hasEntry ? (isFunc ? 0.85 : 1) : 0.7 }}
        >
          {word}
        </span>
      );
    });
  };

  // 渲染单个中文句子内的字符, 保留"点击西语词 -> 汉字高亮"的效果
  const renderChineseChars = (text: string) =>
    text.split("").map((char, i) => {
      const isHighlighted =
        Boolean(highlightChinese) && highlightChinese.includes(char) && char.trim() !== "";
      return (
        <span
          key={i}
          className={
            isHighlighted ? "bg-accent/40 text-accent-foreground rounded px-0.5" : ""
          }
        >
          {char}
        </span>
      );
    });

  // 中文面板高亮: 仅当点击的是对齐表实词时才有对应汉字
  const highlightChinese =
    selected?.kind === "align" ? selected.data.chinese : "";

  const closePopover = () => setSelected(null);

  // 加载错误
  if (loadError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="font-body text-sm text-muted-foreground">
          No se pudo cargar el corpus · 语料加载失败
        </p>
        <p className="max-w-md text-xs text-muted-foreground/80">{loadError}</p>
        <button
          type="button"
          onClick={loadCorpusData}
          className="rounded-md bg-primary px-4 py-2 text-sm font-body text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Reintentar · 重试
        </button>
      </div>
    );
  }

  // 加载中
  if (!corpus || !chapter) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="font-body text-sm text-muted-foreground">
          Cargando corpus · 正在加载语料…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col lg:h-full">
      {/* Chapter selector — compact: 1 2 3 4 5 … 81 */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-3 sm:px-6 sm:py-4 border-b border-border">
        <span className="text-sm font-body text-muted-foreground">Capítulo</span>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            aria-label="Capítulo anterior"
            disabled={activeChapter === 0}
            onClick={() => {
              setActiveChapter((i) => Math.max(0, i - 1));
              setSelected(null);
              setShowInterpretation(false);
            }}
            className="flex h-9 w-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
          </button>
          {chapterPages.map((item, idx) =>
            item === "…" ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-0.5 text-sm font-display text-muted-foreground select-none"
                aria-hidden
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setActiveChapter(item - 1);
                  setSelected(null);
                  setShowInterpretation(false);
                }}
                className={`min-w-9 h-9 rounded-md px-2 text-sm font-display font-semibold transition-all duration-300 ${
                  activeChapter === item - 1
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            aria-label="Capítulo siguiente"
            disabled={activeChapter >= chaptersData.length - 1}
            onClick={() => {
              setActiveChapter((i) => Math.min(chaptersData.length - 1, i + 1));
              setSelected(null);
              setShowInterpretation(false);
            }}
            className="flex h-9 w-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </button>
        </div>

        <div className="ml-auto relative">
          <button
            onClick={() => setShowTranslatorDropdown(!showTranslatorDropdown)}
            className="flex min-h-11 items-center gap-2 px-3 sm:px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-body transition-colors hover:bg-accent"
          >
            {translatorsData.find((t) => t.id === activeTranslator)?.name}
            <ChevronDown className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {showTranslatorDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-full mt-1 w-64 glass-panel p-1.5 z-50 shadow-xl"
              >
                {translatorsData.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTranslator(t.id);
                      setShowTranslatorDropdown(false);
                      setSelected(null);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors ${
                      activeTranslator === t.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="font-medium">{t.name}</span>
                    <span className="text-muted-foreground ml-2">({t.year})</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Split reader */}
      <div className="grid flex-none grid-cols-1 gap-0 lg:flex-1 lg:grid-cols-2 lg:overflow-hidden">
        {/* Chinese panel */}
        <div
          ref={chineseRef}
          className="relative min-h-[38dvh] p-4 sm:p-6 lg:min-h-0 lg:p-8 lg:border-r border-border lg:overflow-y-auto bg-secondary/30"
        >
          <motion.div key={chapter.number} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-body uppercase tracking-[0.2em] text-muted-foreground">
                原文 · Texto Original
              </span>
              <SpeakButtons text={chapter.chinese} lang="zh" />
            </div>
            <p className="font-chinese text-xl sm:text-2xl lg:text-3xl leading-relaxed tracking-wider text-foreground">
              {sentences.length > 0
                ? sentences.map((s) => (
                    <span
                      key={s.no}
                      onClick={(e) => handleSentenceClick(s.no, e)}
                      className={`cursor-pointer rounded transition-colors duration-300 ${
                        activeSentence === s.no
                          ? "bg-red-500/25 text-foreground"
                          : "hover:bg-red-500/10"
                      }`}
                    >
                      {renderChineseChars(s.chinese)}
                    </span>
                  ))
                : renderChineseChars(chapter.chinese)}
            </p>
            {sentences.length > 0 && (
              <p className="text-xs text-muted-foreground mt-4 font-body">
                点击句子查看整句西译 · Haz clic en una frase para ver su traducción
              </p>
            )}
          </motion.div>

          {/* Sentence popover (整句西译卡片) */}
          <AnimatePresence>
            {activeSentencePair && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="absolute z-50 glass-panel p-4 shadow-xl w-72 max-h-[60vh] overflow-y-auto"
                style={{
                  left: Math.max(
                    8,
                    Math.min(
                      sentencePos.x - 144,
                      (chineseRef.current?.clientWidth ?? 320) - 296
                    )
                  ),
                  top: sentencePos.below ? sentencePos.y + 12 : undefined,
                  bottom: sentencePos.below
                    ? undefined
                    : Math.max(
                        8,
                        (chineseRef.current?.clientHeight ?? 0) - sentencePos.y + 12
                      ),
                }}
              >
                <SentenceCard
                  pair={activeSentencePair}
                  onClose={() => setActiveSentence(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Spanish panel */}
        <div className="min-h-[38dvh] p-4 sm:p-6 lg:min-h-0 lg:p-8 lg:overflow-y-auto relative" ref={spanishRef}>
          <motion.div key={`${chapter.number}-${activeTranslator}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-body uppercase tracking-[0.2em] text-muted-foreground">
                Traducción · {translatorsData.find((t) => t.id === activeTranslator)?.name}
              </span>
              <SpeakButtons text={translation} lang="es" />
            </div>
            <p className="font-display text-lg lg:text-xl leading-relaxed text-foreground">
              {sentences.length > 0
                ? sentences.map((s, idx) => (
                    <span
                      key={s.no}
                      className={`rounded transition-colors duration-300 ${
                        activeSentence === s.no ? "bg-red-500/20" : ""
                      }`}
                    >
                      {renderClickableText(s.spanish)}
                      {idx < sentences.length - 1 ? " " : ""}
                    </span>
                  ))
                : renderClickableText(translation)}
            </p>
            {alignments.length > 0 && (
              <p className="text-xs text-muted-foreground mt-4 font-body">
                点击高亮词语查看对齐 · Haz clic en las palabras resaltadas para ver la alineación
              </p>
            )}
          </motion.div>

          {/* Word popover */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="absolute z-50 glass-panel p-4 shadow-xl w-72 max-h-[65vh] overflow-y-auto"
                style={{
                  left: popoverDirection.horizontal === 'left'
                    ? 8
                    : popoverDirection.horizontal === 'right'
                      ? (spanishRef.current?.clientWidth ?? 300) - 296
                      : popoverPos.x - 144,
                  top: popoverDirection.vertical === 'down'
                    ? popoverPos.y + 32
                    : popoverPos.y - 200,
                }}
              >
                {selected.kind === "align" && (
                  <AlignmentCard word={selected.data} onClose={closePopover} />
                )}
                {selected.kind === "func" && (
                  <FunctionWordCard word={selected.data} onClose={closePopover} />
                )}
                {selected.kind === "prep" && (
                  <PrepositionCard
                    surface={selected.surface}
                    senses={selected.senses}
                    onClose={closePopover}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* AI Interpretation bar */}
      <div className="border-t border-border">
        <button
          onClick={() => setShowInterpretation(!showInterpretation)}
          className="w-full px-6 py-3 flex items-center justify-between text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>🔮 Interpretación IA — Capítulo {chapter.number}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showInterpretation ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {showInterpretation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-5">
                <p className="text-sm font-body leading-relaxed text-foreground bg-secondary/50 rounded-lg p-4">
                  {chapter.aiInterpretation}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MirrorBookshelf;
