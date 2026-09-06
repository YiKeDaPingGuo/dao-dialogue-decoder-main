import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, ImagePlus, Volume2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { sendChat } from "@/lib/chatApi";
import { useAuth } from "@/hooks/useAuth";
import { analyzeImage, fileToDataUrl } from "@/lib/visionApi";
import { useSpeaker, detectLang } from "@/lib/speech";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  { text: "¿Qué es el Tao?", icon: "🌊" },
  { text: "Explica Wu Wei (无为)", icon: "☯️" },
  { text: "Recomiéndame un capítulo", icon: "📖" },
];

const HOMEPAGE_SYSTEM_PROMPT = `Eres el guía de bienvenida de "¿Qué TAO?", una plataforma intercultural dedicada al Tao Te Ching y a su recepción en el mundo hispanohablante.
Responde en el idioma de la pregunta; si no está claro, usa español accesible y añade entre paréntesis los conceptos chinos esenciales.
Ayuda a principiantes a comprender filosofía taoísta, traducción, historia y cultura chino-hispana. Sé cálido, claro y conciso.
Cuando cites o atribuyas una frase al Tao Te Ching, indica el capítulo si lo conoces con seguridad; si existen traducciones divergentes, explícalo y no inventes citas.
Distingue entre el sentido histórico del texto y sus aplicaciones contemporáneas. Ofrece preguntas o lecturas siguientes cuando sean útiles.
No presentes interpretaciones filosóficas como consejo médico, legal o financiero profesional.`;

const HomepageChat = () => {
  const { loggedIn } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { speakingId, play } = useSpeaker();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (allMessages: Msg[]) => {
    setIsLoading(true);
    try {
      const content = await sendChat(allMessages, HOMEPAGE_SYSTEM_PROMPT);
      setMessages((prev) => [...prev, { role: "assistant", content }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error instanceof Error
            ? `Lo siento, el asistente no está disponible ahora. ${error.message}`
            : "Lo siento, el asistente no está disponible ahora.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
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

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 允许重复选择同一文件
    if (!file || isLoading) return;
    setMessages((prev) => [...prev, { role: "user", content: "🖼️ Imagen enviada / 已发送图片" }]);
    setIsLoading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const content = await analyzeImage(dataUrl, { lang: "es" });
      setMessages((prev) => [...prev, { role: "assistant", content }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? `No pude analizar la imagen. ${error.message}`
              : "No pude analizar la imagen.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel p-4 flex flex-col" style={{ height: 420 }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🤖</span>
        <h4 className="font-body text-sm font-medium text-foreground">¿Qué TAO?</h4>
      </div>
      <p className="font-chinese text-xs text-muted-foreground mb-3">智能问答助手</p>
      {!loggedIn && (
        <p className="mb-3 rounded-lg bg-secondary/70 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          El asistente real requiere cuenta. / 未登录仅显示演示回复，请先注册登录。
        </p>
      )}

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
                    <div>
                      <div className="prose prose-xs prose-stone max-w-none [&_p]:mb-1 [&_p]:mt-0 [&_li]:my-0">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                      <button
                        type="button"
                        aria-label="Leer en voz alta"
                        title="朗读 · Leer"
                        onClick={() => play(`msg-${i}`, m.content, { lang: detectLang(m.content) })}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-primary"
                      >
                        <Volume2 className={`h-3.5 w-3.5 ${speakingId === `msg-${i}` ? "text-primary animate-pulse" : ""}`} />
                        Leer
                      </button>
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
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImage}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          aria-label="Analizar imagen"
          title="上传图片解析 · Analizar imagen"
          className="min-h-11 min-w-11 p-2 rounded-lg bg-secondary text-foreground hover:bg-accent transition-colors disabled:opacity-50"
        >
          <ImagePlus className="w-3.5 h-3.5" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Pregunta algo..."
          disabled={isLoading}
          className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-base sm:text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring/30 disabled:opacity-50"
        />
        <button
          onClick={() => send()}
          disabled={isLoading || !input.trim()}
          className="min-h-11 min-w-11 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default HomepageChat;
