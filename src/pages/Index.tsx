import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import MirrorBookshelf from "@/components/MirrorBookshelf";
import CognitionEngine from "@/components/CognitionEngine";
import EnlightenmentReport from "@/components/EnlightenmentReport";
import ElCaminoDelTao from "@/components/ElCaminoDelTao";
import { BookOpen, Brain, Sparkles, Home, Map } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeModule, setActiveModule] = useState<"reader" | "cognition">("reader");

  useEffect(() => {
    if (searchParams.get("module") === "cognition") {
      setActiveModule("cognition");
    }
  }, [searchParams]);
  const [reportOpen, setReportOpen] = useState(false);
  const [caminoOpen, setCaminoOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background rice-texture">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-background/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <Home className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="font-chinese text-xl text-primary">道德經</span>
          <div className="h-5 w-px bg-border" />
          <span className="font-display text-sm text-foreground tracking-wide">
            ¿Qué TAO? · Corpus Bilingüe
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* El Camino del Tao */}
          <button
            onClick={() => setCaminoOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-sm font-body"
          >
            <Map className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline text-foreground">El Camino</span>
            <span className="hidden sm:inline font-chinese text-xs text-muted-foreground">闯关修道</span>
          </button>

          {/* Enlightenment button */}
          <button
            onClick={() => setReportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/20 text-accent-foreground hover:bg-accent/30 transition-colors text-sm font-body gold-glow"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="hidden sm:inline">Informe de Iluminación</span>
          </button>

          {/* Module toggle */}
          <div className="flex bg-secondary rounded-lg p-0.5">
            <button
              onClick={() => setActiveModule("reader")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-body transition-all ${
                activeModule === "reader"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Lectura</span>
            </button>
            <button
              onClick={() => setActiveModule("cognition")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-body transition-all ${
                activeModule === "cognition"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Cognición IA</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <motion.div
          key={activeModule}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          {activeModule === "reader" ? <MirrorBookshelf /> : <CognitionEngine />}
        </motion.div>
      </main>

      {/* Modals */}
      <EnlightenmentReport isOpen={reportOpen} onClose={() => setReportOpen(false)} />
      <ElCaminoDelTao isOpen={caminoOpen} onClose={() => setCaminoOpen(false)} />
    </div>
  );
};

export default Index;
