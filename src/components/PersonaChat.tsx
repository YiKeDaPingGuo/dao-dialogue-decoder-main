import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { chatPersonas } from "@/data/taoData";
import { Send } from "lucide-react";

type PersonaKey = keyof typeof chatPersonas;

interface Message {
  role: "user" | "assistant";
  content: string;
  persona?: PersonaKey;
}

const mockResponses: Record<PersonaKey, string[]> = {
  laozi: [
    "El agua no lucha, y sin embargo desgasta la piedra. Tu pregunta ya contiene la respuesta — solo necesitas dejar de buscarla.",
    "El vacío del cuenco es lo que lo hace útil. Del mismo modo, el silencio entre las palabras es donde reside el verdadero significado.",
    "Observa cómo el río no elige su camino, sino que fluye donde la tierra lo permite. Así es el Dao.",
  ],
  translator: [
    "Interesante elección léxica. Elorduy opta por 'Camino' (domesticación), mientras Preciado mantiene 'Tao' (extranjerización). Cada estrategia implica compromisos diferentes con el lector meta.",
    "La estructura sintáctica del chino clásico es fundamentalmente distinta del español. El verso 道可道 usa 道 como sustantivo y verbo simultáneamente — una ambigüedad irreproducible en español.",
    "Nota cómo 'no-acción' vs 'sin actuar' reflejan dos estrategias: nominalización vs perífrasis verbal. La primera congela el concepto, la segunda preserva su dinamismo.",
  ],
  student: [
    "¡Buena pregunta! A mí me costó mucho entender el wu wei al principio. Es como cuando intentas dormir — cuanto más lo intentas, menos funciona. 😄",
    "He estado comparando las traducciones y creo que Suárez es la más poética, pero Preciado es más fiel al original. ¿Tú qué opinas?",
    "Oye, ¿has notado que el capítulo 2 y el 3 son como dos caras de la misma moneda? Uno habla de opuestos y el otro de gobierno. ¡Todo está conectado!",
  ],
};

const PersonaChat = () => {
  const [activePersona, setActivePersona] = useState<PersonaKey>("laozi");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: chatPersonas.laozi.greeting, persona: "laozi" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    const responses = mockResponses[activePersona];
    const aiMsg: Message = {
      role: "assistant",
      content: responses[Math.floor(Math.random() * responses.length)],
      persona: activePersona,
    };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
  };

  const switchPersona = (key: PersonaKey) => {
    setActivePersona(key);
    setMessages([
      { role: "assistant", content: chatPersonas[key].greeting, persona: key },
    ]);
  };

  const personaClass = `persona-${activePersona}`;

  return (
    <div className={`flex flex-col h-full ${personaClass}`}>
      {/* Persona selector */}
      <div className="flex gap-1 p-2 bg-secondary/50 rounded-lg mx-4 mt-4">
        {(Object.entries(chatPersonas) as [PersonaKey, typeof chatPersonas.laozi][]).map(([key, persona]) => (
          <button
            key={key}
            onClick={() => switchPersona(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-body transition-all duration-300 ${
              activePersona === key
                ? "bg-background shadow-sm text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="text-lg">{persona.avatar}</span>
            <span className="hidden sm:inline">{persona.name.split(" · ")[1]}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm font-body leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "glass-panel"
                }`}
              >
                {msg.role === "assistant" && msg.persona && (
                  <span className="text-xs text-muted-foreground block mb-1">
                    {chatPersonas[msg.persona].avatar} {chatPersonas[msg.persona].name}
                  </span>
                )}
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Pregunta sobre el Tao Te Ching..."
            className="flex-1 bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <button
            onClick={handleSend}
            className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonaChat;
