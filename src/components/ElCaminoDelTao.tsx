import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Check, Star, ChevronRight, ArrowLeft } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const TOTAL_CHAPTERS = 81;

const levelInfo = [
  { name: "Vocabulario", sub: "词汇匹配", icon: "📝", questions: 15 },
  { name: "Traducción", sub: "句子翻译", icon: "🔄", questions: 15 },
  { name: "Gramática y Semántica", sub: "语法语义", icon: "🔍", questions: 15 },
  { name: "Diálogo y Comprensión", sub: "对话理解", icon: "💬", questions: 10 },
  { name: "Repaso General", sub: "综合复习", icon: "🎯", questions: 15 },
];

// Mock progress: first 3 chapters have some progress
const initialProgress: Record<number, number[]> = {
  1: [15, 15, 15, 10, 15], // fully complete
  2: [15, 15, 10, 0, 0], // partial
  3: [8, 0, 0, 0, 0], // just started
};

// Mock vocab question
const mockVocabQuestions = [
  { question: '¿Qué significa "道" (dào)?', options: ["El Camino", "La Montaña", "El Río", "El Cielo"], correct: 0 },
  { question: '¿Cómo se traduce "德" (dé)?', options: ["Fuerza", "Virtud", "Poder", "Sabiduría"], correct: 1 },
  { question: '"无为" (wú wéi) se refiere a:', options: ["Violencia", "Meditación", "No-acción", "Silencio"], correct: 2 },
  { question: '¿Qué significa "名" (míng)?', options: ["Agua", "Nombre", "Luz", "Tierra"], correct: 1 },
  { question: '"天" (tiān) se traduce como:', options: ["Tierra", "Mar", "Cielo", "Bosque"], correct: 2 },
];

const ElCaminoDelTao = ({ isOpen, onClose }: Props) => {
  const [progress] = useState(initialProgress);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const getChapterStatus = (ch: number) => {
    const p = progress[ch];
    if (!p) return "locked";
    const total = p.reduce((a, b) => a + b, 0);
    const max = levelInfo.reduce((a, l) => a + l.questions, 0);
    if (total >= max) return "complete";
    if (total > 0) return "in-progress";
    return "unlocked";
  };

  const isChapterUnlocked = (ch: number) => {
    if (ch <= 3) return true; // first 3 unlocked for demo
    const prev = progress[ch - 1];
    if (!prev) return false;
    const total = prev.reduce((a, b) => a + b, 0);
    const max = levelInfo.reduce((a, l) => a + l.questions, 0);
    return total >= max;
  };

  const handleAnswer = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    if (idx === mockVocabQuestions[currentQ]?.correct) {
      setScore((s) => s + 1);
    }
    setTimeout(() => {
      if (currentQ < mockVocabQuestions.length - 1) {
        setCurrentQ((q) => q + 1);
        setSelectedAnswer(null);
      } else {
        // Quiz done
        setActiveLevel(null);
        setCurrentQ(0);
        setSelectedAnswer(null);
      }
    }, 800);
  };

  // Render quiz view
  if (activeLevel !== null && selectedChapter !== null) {
    const q = mockVocabQuestions[currentQ];
    const level = levelInfo[activeLevel];
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
          >
            {/* Quiz header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <button onClick={() => { setActiveLevel(null); setCurrentQ(0); setSelectedAnswer(null); setScore(0); }} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>
              <div className="text-center">
                <p className="font-display text-sm font-medium text-foreground">
                  Cap. {selectedChapter} · {level.icon} {level.name}
                </p>
                <p className="font-chinese text-xs text-muted-foreground">{level.sub}</p>
              </div>
              <span className="text-sm font-body text-muted-foreground">
                {currentQ + 1}/{mockVocabQuestions.length}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-secondary">
              <motion.div
                className="h-full bg-primary"
                animate={{ width: `${((currentQ + 1) / mockVocabQuestions.length) * 100}%` }}
              />
            </div>

            {/* Question */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-xl mx-auto w-full">
              <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full">
                <h2 className="font-display text-xl text-foreground text-center mb-8">{q.question}</h2>
                <div className="space-y-3">
                  {q.options.map((opt, i) => {
                    let cls = "border-border hover:border-primary/50";
                    if (selectedAnswer !== null) {
                      if (i === q.correct) cls = "border-green-500 bg-green-50 text-green-800";
                      else if (i === selectedAnswer) cls = "border-red-400 bg-red-50 text-red-700";
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        disabled={selectedAnswer !== null}
                        className={`w-full p-4 rounded-xl border-2 text-left font-body text-sm transition-all ${cls} disabled:cursor-default`}
                      >
                        <span className="font-medium mr-2 text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                <p className="text-center text-sm text-muted-foreground mt-6 font-body">
                  Puntuación: {score}/{currentQ + (selectedAnswer !== null ? 1 : 0)}
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Render chapter levels view
  if (selectedChapter !== null) {
    const chProgress = progress[selectedChapter] || [0, 0, 0, 0, 0];
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <button onClick={() => setSelectedChapter(null)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" /> El Camino
              </button>
              <div className="text-center">
                <p className="font-display text-lg font-semibold text-foreground">Capítulo {selectedChapter}</p>
                <p className="font-chinese text-xs text-muted-foreground">第{selectedChapter}章</p>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 max-w-lg mx-auto w-full">
              <div className="space-y-3">
                {levelInfo.map((level, i) => {
                  const done = chProgress[i] || 0;
                  const pct = Math.round((done / level.questions) * 100);
                  const complete = pct >= 100;
                  const unlocked = i === 0 || (chProgress[i - 1] || 0) >= levelInfo[i - 1].questions;

                  return (
                    <motion.button
                      key={level.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => unlocked && setActiveLevel(i)}
                      disabled={!unlocked}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        complete
                          ? "border-green-400 bg-green-50/50"
                          : unlocked
                          ? "border-border hover:border-primary/50 hover:shadow-sm"
                          : "border-border/50 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                          complete ? "bg-green-100" : unlocked ? "bg-secondary" : "bg-muted"
                        }`}>
                          {complete ? <Check className="w-5 h-5 text-green-600" /> : unlocked ? <span>{level.icon}</span> : <Lock className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-body text-sm font-medium text-foreground">Nivel {i + 1}: {level.name}</span>
                            {complete && <Star className="w-3.5 h-3.5 text-accent fill-accent" />}
                          </div>
                          <span className="font-chinese text-xs text-muted-foreground">{level.sub} · {level.questions} preguntas</span>
                          {unlocked && !complete && (
                            <div className="mt-1.5 h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          )}
                        </div>
                        {unlocked && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Main path view - winding path of 81 chapters
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/90 backdrop-blur-md">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">El Camino del Tao</h2>
              <p className="font-chinese text-xs text-muted-foreground">闯关修道 · 81 capítulos</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Winding path */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto">
              {Array.from({ length: Math.ceil(TOTAL_CHAPTERS / 5) }, (_, rowIdx) => {
                const start = rowIdx * 5 + 1;
                const end = Math.min(start + 4, TOTAL_CHAPTERS);
                const chapters = Array.from({ length: end - start + 1 }, (_, i) => start + i);
                const reversed = rowIdx % 2 === 1;
                const row = reversed ? [...chapters].reverse() : chapters;

                return (
                  <div key={rowIdx} className="mb-2">
                    <div className={`flex ${reversed ? "flex-row-reverse" : "flex-row"} items-center gap-2 justify-center`}>
                      {row.map((ch) => {
                        const status = getChapterStatus(ch);
                        const unlocked = isChapterUnlocked(ch);
                        return (
                          <motion.button
                            key={ch}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: ch * 0.01 }}
                            onClick={() => unlocked && setSelectedChapter(ch)}
                            disabled={!unlocked}
                            className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-sm font-display font-bold transition-all shrink-0 ${
                              status === "complete"
                                ? "bg-green-100 text-green-700 border-2 border-green-400 shadow-sm"
                                : status === "in-progress"
                                ? "bg-primary/10 text-primary border-2 border-primary shadow-sm animate-pulse"
                                : unlocked
                                ? "bg-secondary text-foreground border-2 border-border hover:border-primary hover:shadow-md cursor-pointer"
                                : "bg-muted/50 text-muted-foreground/40 border-2 border-transparent cursor-not-allowed"
                            }`}
                          >
                            {status === "complete" ? (
                              <Check className="w-5 h-5" />
                            ) : !unlocked ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              ch
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                    {/* Connector line */}
                    {rowIdx < Math.ceil(TOTAL_CHAPTERS / 5) - 1 && (
                      <div className={`flex ${reversed ? "justify-start pl-6" : "justify-end pr-6"} my-1`}>
                        <div className="w-0.5 h-6 bg-border rounded-full" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ElCaminoDelTao;
