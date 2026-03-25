import { useState } from "react";
import { motion } from "framer-motion";
import KnowledgeGraph from "./KnowledgeGraph";
import PabellonChat from "./PabellonChat";
import { Play, Film } from "lucide-react";

const videoStyles = [
  { id: "ink", name: "Taoist Ink · 水墨", description: "Pintura china con tinta y agua" },
  { id: "royal", name: "Spanish Royal · Barroco", description: "Estilo cortesano español" },
  { id: "magical", name: "LatAm Magical Realism", description: "Realismo mágico latinoamericano" },
];

const CognitionEngine = () => {
  const [activeTab, setActiveTab] = useState<"graph" | "chat" | "video">("graph");
  const [selectedStyle, setSelectedStyle] = useState("ink");

  const tabs = [
    { key: "graph" as const, label: "Grafo de Conocimiento", icon: "🕸️" },
    { key: "chat" as const, label: "大道至简阁", icon: "🏛️" },
    { key: "video" as const, label: "Vídeo Generativo", icon: "🎬" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-3.5 text-sm font-body transition-all duration-300 relative ${
              activeTab === tab.key
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
            {activeTab === tab.key && (
              <motion.div
                layoutId="cogTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "graph" && (
          <motion.div
            key="graph"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full p-4"
          >
            <KnowledgeGraph />
          </motion.div>
        )}

        {activeTab === "chat" && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full"
          >
            <PabellonChat />
          </motion.div>
        )}

        {activeTab === "video" && (
          <motion.div
            key="video"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full p-6 flex flex-col"
          >
            <h3 className="font-display text-lg text-foreground mb-4">
              Anclas de Vídeo Generativo
            </h3>

            {/* Style selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {videoStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-4 rounded-lg border text-left transition-all duration-300 ${
                    selectedStyle === style.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className="text-sm font-medium font-body text-foreground block">
                    {style.name}
                  </span>
                  <span className="text-xs text-muted-foreground font-body">
                    {style.description}
                  </span>
                </button>
              ))}
            </div>

            {/* Mock player */}
            <div className="flex-1 bg-foreground/5 rounded-xl flex flex-col items-center justify-center min-h-[200px] border border-border">
              <Film className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground font-body mb-4">
                Capítulo 1 · Estilo: {videoStyles.find((s) => s.id === selectedStyle)?.name}
              </p>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-body hover:bg-primary/90 transition-colors">
                <Play className="w-4 h-4" />
                Generar Vídeo
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CognitionEngine;
