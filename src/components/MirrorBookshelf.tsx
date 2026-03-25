import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { chapters, translators, wordAlignments, type WordAlignment } from "@/data/taoData";
import { ChevronDown } from "lucide-react";

const MirrorBookshelf = () => {
  const [activeChapter, setActiveChapter] = useState(0);
  const [activeTranslator, setActiveTranslator] = useState("carmelo");
  const [selectedWord, setSelectedWord] = useState<WordAlignment | null>(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });
  const [popoverDirection, setPopoverDirection] = useState<{ vertical: 'up' | 'down'; horizontal: 'center' | 'left' | 'right' }>({ vertical: 'up', horizontal: 'center' });
  const [showInterpretation, setShowInterpretation] = useState(false);
  const [showTranslatorDropdown, setShowTranslatorDropdown] = useState(false);
  const spanishRef = useRef<HTMLDivElement>(null);

  const chapter = chapters[activeChapter];
  const translation = chapter.translations[activeTranslator];
  const alignmentKey = `${activeTranslator}-${chapter.number}`;
  const alignments = wordAlignments[alignmentKey] || [];

  const handleWordClick = useCallback((word: string, e: React.MouseEvent) => {
    const cleanWord = word.replace(/[.,;:!?¿¡"""''()—–\-]/g, "");
    const alignment = alignments.find(
      (a) => a.spanish.toLowerCase() === cleanWord.toLowerCase()
    );
    if (alignment) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const containerRect = spanishRef.current?.getBoundingClientRect();
      if (containerRect) {
        const relX = rect.left - containerRect.left + rect.width / 2;
        const relY = rect.top - containerRect.top;
        const popoverW = 288;
        const popoverH = 200;

        // Vertical: if word is near top of container, show below
        const vertical = relY < popoverH + 20 ? 'down' : 'up';
        // Horizontal: adjust if near edges
        let horizontal: 'center' | 'left' | 'right' = 'center';
        if (relX < popoverW / 2 + 16) horizontal = 'left';
        else if (relX > (containerRect.width - popoverW / 2 - 16)) horizontal = 'right';

        setPopoverPos({ x: relX, y: relY });
        setPopoverDirection({ vertical, horizontal });
      }
      setSelectedWord(alignment);
    } else {
      setSelectedWord(null);
    }
  }, [alignments]);

  const renderClickableText = (text: string) => {
    const words = text.split(/(\s+)/);
    return words.map((word, i) => {
      if (/^\s+$/.test(word)) return <span key={i}>{word}</span>;
      const cleanWord = word.replace(/[.,;:!?¿¡"""''()—–\-]/g, "");
      const hasAlignment = alignments.some(
        (a) => a.spanish.toLowerCase() === cleanWord.toLowerCase()
      );
      const isActive = selectedWord?.spanish.toLowerCase() === cleanWord.toLowerCase();
      return (
        <span
          key={i}
          className={`word-highlight ${hasAlignment ? "cursor-pointer" : ""} ${isActive ? "active" : ""}`}
          onClick={(e) => hasAlignment && handleWordClick(word, e)}
          style={{ opacity: hasAlignment ? 1 : 0.7 }}
        >
          {word}
        </span>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chapter selector */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <span className="text-sm font-body text-muted-foreground">Capítulo</span>
        <div className="flex gap-1.5">
          {chapters.map((ch, i) => (
            <button
              key={ch.number}
              onClick={() => { setActiveChapter(i); setSelectedWord(null); setShowInterpretation(false); }}
              className={`w-9 h-9 rounded-md text-sm font-display font-semibold transition-all duration-300 ${
                activeChapter === i
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {ch.number}
            </button>
          ))}
        </div>

        <div className="ml-auto relative">
          <button
            onClick={() => setShowTranslatorDropdown(!showTranslatorDropdown)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-body transition-colors hover:bg-accent"
          >
            {translators.find((t) => t.id === activeTranslator)?.name}
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
                {translators.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTranslator(t.id);
                      setShowTranslatorDropdown(false);
                      setSelectedWord(null);
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
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
        {/* Chinese panel */}
        <div className="p-8 lg:border-r border-border overflow-y-auto bg-secondary/30">
          <motion.div key={chapter.number} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <span className="text-xs font-body uppercase tracking-[0.2em] text-muted-foreground mb-4 block">
              原文 · Texto Original
            </span>
            <p className="font-chinese text-2xl lg:text-3xl leading-relaxed tracking-wider text-foreground">
              {chapter.chinese.split("").map((char, i) => {
                const isHighlighted = selectedWord && selectedWord.chinese.includes(char) && char.trim() !== "";
                return (
                  <span
                    key={i}
                    className={`transition-all duration-300 ${isHighlighted ? "bg-accent/40 text-accent-foreground rounded px-0.5" : ""}`}
                  >
                    {char}
                  </span>
                );
              })}
            </p>
          </motion.div>
        </div>

        {/* Spanish panel */}
        <div className="p-8 overflow-y-auto relative" ref={spanishRef}>
          <motion.div key={`${chapter.number}-${activeTranslator}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <span className="text-xs font-body uppercase tracking-[0.2em] text-muted-foreground mb-4 block">
              Traducción · {translators.find((t) => t.id === activeTranslator)?.name}
            </span>
            <p className="font-display text-lg lg:text-xl leading-relaxed text-foreground">
              {renderClickableText(translation)}
            </p>
            {alignments.length > 0 && (
              <p className="text-xs text-muted-foreground mt-4 font-body">
                Haz clic en las palabras resaltadas para ver la alineación
              </p>
            )}
          </motion.div>

          {/* Word popover */}
          <AnimatePresence>
            {selectedWord && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="absolute z-50 glass-panel p-4 shadow-xl w-72"
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
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-chinese text-2xl text-primary">{selectedWord.chinese}</span>
                    {selectedWord.pinyin !== "-" && (
                      <span className="text-sm text-muted-foreground ml-2 font-body">{selectedWord.pinyin}</span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedWord(null)}
                    className="text-muted-foreground hover:text-foreground text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-2 text-sm font-body">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Español:</span>
                    <span className="font-medium text-foreground">{selectedWord.spanish}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Significado:</span>
                    <span className="text-foreground">{selectedWord.meaning}</span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <span className="text-muted-foreground text-xs">Función sintáctica:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
                        {selectedWord.syntacticRole}
                      </span>
                      <span className="text-xs text-muted-foreground font-chinese">
                        {selectedWord.syntacticRoleChinese}
                      </span>
                    </div>
                  </div>
                </div>
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
