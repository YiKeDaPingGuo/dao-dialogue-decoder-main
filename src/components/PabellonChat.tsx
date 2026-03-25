import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const tabs = [
  {
    key: "negocio",
    label: "Negocio",
    sub: "生意经营道",
    icon: "💼",
    greeting: "El Gran Tao fluye por todas partes, puede ir a la izquierda o a la derecha. En los altibajos del mundo de los negocios, ¿qué cuellos de botella en la gestión has encontrado? Usemos los principios del Wu Wei y la no-competencia del *Tao Te Ching* para encontrar la forma de superarlos.",
    systemExtra: "Eres un sabio consejero de negocios inspirado en el Tao Te Ching. Aplica los principios del Wu Wei y la no-competencia para aconsejar sobre emprendimiento, estrategia empresarial y liderazgo.",
  },
  {
    key: "equipo",
    label: "Gestión de Equipos",
    sub: "团队管理道",
    icon: "👥",
    greeting: "El mejor líder es aquel cuya existencia apenas conoce la gente. Un excelente gestor es como el agua invisible. ¿Qué dificultades de colaboración enfrenta tu equipo actualmente? Déjame deducir el arte de la gestión para ti.",
    systemExtra: "Eres un experto en gestión de equipos que aplica la filosofía taoísta. 'El mejor líder es aquel cuya existencia apenas conoce la gente.' Aconseja sobre liderazgo, colaboración y resolución de conflictos.",
  },
  {
    key: "relaciones",
    label: "Relaciones Íntimas",
    sub: "亲密关系道",
    icon: "💕",
    greeting: "El cielo y la tierra duran mucho tiempo porque no viven para sí mismos. En el amor y en ser amado, ¿has sentido ataduras, ansiedad o confusión? Escucha la voz de tu corazón, juntos desataremos los nudos emocionales.",
    systemExtra: "Eres un consejero emocional sabio inspirado en el Tao. Ayuda con relaciones amorosas, familiares y de amistad usando principios de naturalidad, aceptación y fluidez.",
  },
  {
    key: "laboral",
    label: "Supervivencia Laboral",
    sub: "职场生存道",
    icon: "🏢",
    greeting: "Solo aquel que no compite, por eso nadie en el mundo puede competir con él. En el mundo laboral, se valora 'brillar suavemente sin destacar 和光同尘 '. ¿Qué desgastes interpersonales o preocupaciones por ascensos has encontrado?",
    systemExtra: "Eres un mentor de carrera que aplica la filosofía del 'brillar suavemente sin destacar' (和光同尘). Aconseja sobre política de oficina, ascensos, relaciones laborales y equilibrio vida-trabajo.",
  },
  {
    key: "educacion",
    label: "Educación Familiar",
    sub: "家庭育儿道",
    icon: "👨‍👩‍👧",
    greeting: "Dar vida sin poseer, actuar sin imponer, guiar sin dominar. Frente al crecimiento de tu hijo, ¿tienes ansiedad que te cuesta soltar? Exploremos cómo acompañar siguiendo su naturaleza innata.",
    systemExtra: "Eres un sabio consejero de crianza y educación familiar inspirado en el Tao. 'Dar vida sin poseer, actuar sin imponer, guiar sin dominar.' Aconseja sobre educación, paternidad y desarrollo infantil.",
  },
];

const PabellonChat = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: tabs[0].greeting },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const switchTab = (idx: number) => {
    setActiveTab(idx);
    setMessages([{ role: "assistant", content: tabs[idx].greeting }]);
    setInput("");
    setIsLoading(false);
  };

  const streamChat = async (allMessages: Msg[]) => {
    setIsLoading(true);
    let assistantSoFar = "";

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && assistantSoFar.startsWith(chunk.slice(0, 5) || chunk)) {
          // Update last assistant
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const tab = tabs[activeTab];
      const systemMessages = [
        {
          role: "system" as const,
          content: `Eres un sabio consejero de la plataforma "¿Qué TAO?" — Pabellón de la Gran Simplicidad (大道至简阁). ${tab.systemExtra} Responde en español con términos clave en chino. Sé empático, conciso y profundo. Usa citas del Tao Te Ching cuando sea apropiado.`,
        },
      ];

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              ...systemMessages,
              ...allMessages.map((m) => ({ role: m.role, content: m.content })),
            ],
          }),
        }
      );

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        upsert(errData.error || "Lo siento, ha ocurrido un error.");
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {}
        }
      }
    } catch {
      upsert("Error de conexión. Inténtalo más tarde.");
    }
    setIsLoading(false);
  };

  const send = () => {
    const msg = input.trim();
    if (!msg || isLoading) return;
    const userMsg: Msg = { role: "user", content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    streamChat(newMessages);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="font-display text-lg text-foreground">
          Pabellón de la Gran Simplicidad
        </h3>
        <p className="font-chinese text-xs text-muted-foreground">大道至简阁</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pb-3 overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={tab.key}
            onClick={() => switchTab(i)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body whitespace-nowrap transition-all ${
              activeTab === i
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="font-chinese text-[10px] opacity-70">{tab.sub}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 space-y-3" style={{ minHeight: 0 }}>
        <AnimatePresence mode="popLayout">
          {messages.map((m, i) => (
            <motion.div
              key={`${activeTab}-${i}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm font-body leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "glass-panel"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm prose-stone max-w-none [&_p]:mb-1.5 [&_p]:mt-0">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  m.content
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="glass-panel rounded-xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={`向${tabs[activeTab].label}问道...`}
            disabled={isLoading}
            className="flex-1 bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={isLoading || !input.trim()}
            className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PabellonChat;
