import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  { text: "¿Qué es el Tao?", icon: "🌊" },
  { text: "Explica Wu Wei (无为)", icon: "☯️" },
  { text: "Recomiéndame un capítulo", icon: "📖" },
];

const MOCK_REPLIES = [
  "El Tao no es una regla rígida, sino una forma de armonizar con el flujo natural de las cosas. Para empezar: observa, simplifica y evita forzar.",
  "Wu Wei (无为) no significa 'no hacer nada'; significa actuar sin violencia interior, sin fricción innecesaria y con buena lectura del contexto.",
  "Si eres principiante, te recomiendo comenzar por el Capítulo 1 y 2: ahí verás las bases de *dao* (道), nombre (名), ser (有) y no-ser (无).",
  "Una forma práctica de estudiar: 1) lee una frase corta, 2) compárala en dos traducciones, 3) formula tu propia interpretación en español sencillo.",
];

const HomepageChat = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const pickMockReply = (text: string) => {
    const normalized = text.toLowerCase();
    if (normalized.includes("wu wei") || normalized.includes("无为")) {
      return "Wu Wei (无为) es 'acción sin imposición': menos control obsesivo, más precisión y oportunidad. No es pasividad, es eficacia serena.";
    }
    if (normalized.includes("cap") || normalized.includes("capítulo") || normalized.includes("recom")) {
      return "Para novatos hispanohablantes: empieza por Cap. 1 (道与名), luego Cap. 2 (有无相生). Son la mejor puerta de entrada conceptual.";
    }
    if (normalized.includes("tao") || normalized.includes("dao")) {
      return "Piensa el Tao como un principio de coherencia con la realidad: cuando dejas de forzar, muchas decisiones se vuelven más claras.";
    }
    return MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)];
  };

  const streamChat = async (allMessages: Msg[]) => {
    setIsLoading(true);

    const lastUser = allMessages.filter((m) => m.role === "user").at(-1)?.content ?? "";
    const mock = pickMockReply(lastUser);

    await new Promise((resolve) => setTimeout(resolve, 450));
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: mock,
      },
    ]);

    setIsLoading(false);
  };

  const send = (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    const userMsg: Msg = { role: "user", content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    streamChat(newMessages);
  };

  return (
    <div className="glass-panel p-4 flex flex-col" style={{ height: 420 }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🤖</span>
        <h4 className="font-body text-sm font-medium text-foreground">¿Qué TAO?</h4>
      </div>
      <p className="font-chinese text-xs text-muted-foreground mb-3">智能问答助手</p>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1" style={{ minHeight: 0 }}>
        {messages.length === 0 ? (
          <div className="text-center py-4">
            <p className="font-body text-sm text-foreground mb-1">¡Hola! ¿Qué TAO?</p>
            <p className="font-chinese text-xs text-muted-foreground mb-4">你好！今天想聊点什么"道"？</p>
            <div className="space-y-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => send(s.text)}
                  className="w-full py-2 px-3 rounded-lg border border-border text-xs font-body text-foreground hover:border-primary hover:text-primary transition-colors text-left flex items-center gap-2"
                >
                  <span>{s.icon}</span> {s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-3 py-2 text-xs font-body leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/70 text-foreground"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-xs prose-stone max-w-none [&_p]:mb-1 [&_p]:mt-0 [&_li]:my-0">
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
                <div className="bg-secondary/70 rounded-xl px-3 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Pregunta algo..."
          disabled={isLoading}
          className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring/30 disabled:opacity-50"
        />
        <button
          onClick={() => send()}
          disabled={isLoading || !input.trim()}
          className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default HomepageChat;
