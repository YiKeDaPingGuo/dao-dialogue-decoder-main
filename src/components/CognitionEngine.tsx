import { useState } from "react";
import { motion } from "framer-motion";
import KnowledgeGraph from "./KnowledgeGraph";
import PabellonChat from "./PabellonChat";

const CognitionEngine = () => {
  const [activeTab, setActiveTab] = useState<"graph" | "chat">("graph");

  const tabs = [
    { key: "graph" as const, label: "Grafo de Conocimiento", icon: "🕸️" },
    { key: "chat" as const, label: "Pabellón de la Gran Simplicidad", icon: "🏛️" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            aria-label={tab.label}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 min-w-[88px] px-2 sm:px-4 py-3.5 text-sm font-body transition-all duration-300 relative ${
              activeTab === tab.key
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            <span className="text-xs sm:text-sm whitespace-nowrap">{tab.label}</span>
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
      <div className="min-h-[560px] flex-1 overflow-hidden lg:min-h-0">
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

      </div>
    </div>
  );
};

export default CognitionEngine;
