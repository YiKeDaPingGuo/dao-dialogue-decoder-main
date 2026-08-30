import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, BookOpen, Brain, ChevronLeft, ChevronRight,
  X, User, LogOut, Edit, Upload, Lock, Mail
} from "lucide-react";
import HomepageChat from "@/components/HomepageChat";
import NewsCenter from "@/components/NewsCenter";
import VideoCenter from "@/components/VideoCenter";
import { newsArticles } from "@/data/news";
import { videos } from "@/data/videos";
import iconImg from "@/assets/icon.jpg";

const searchHistory = ["Capítulo 1", "Wu Wei", "道", "Naturaleza", "El Camino"];
const searchRecommended = ["Tao y Virtud", "无为而治", "Laozi", "Traducción", "Yin Yang"];

const books = [
  { img: "https://nkuquetao.oss-cn-shanghai.aliyuncs.com/book/lao_tse.png", title: "Tao Te Ching — Lao Tse", sub: "老子 · 道德经" },
  { img: "https://nkuquetao.oss-cn-shanghai.aliyuncs.com/book/j_ferrero.png", title: "El Tao Te King — J. Ferrero", sub: "费雷罗 译本" },
  { img: "https://nkuquetao.oss-cn-shanghai.aliyuncs.com/book/a_galvany.png", title: "Dao De Jing — A. Galvany", sub: "加尔瓦尼 译本" },
  { img: "https://nkuquetao.oss-cn-shanghai.aliyuncs.com/book/I_preciado.png", title: "Libro del Tao — I. Preciado", sub: "普雷夏多 译本" },
  { img: "https://nkuquetao.oss-cn-shanghai.aliyuncs.com/book/s_mitchell.png", title: "Tao Te Ching — S. Mitchell", sub: "米切尔 英译本" },
];

const Homepage = () => {
  const navigate = useNavigate();
  const heroSlides = [
    ...[...newsArticles]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((article) => ({
        id: `news-${article.id}`,
        img: article.images[0],
        title: article.title,
        sub: `新闻中心 · ${article.date}`,
        open: () => navigate(`/news/${article.id}`),
      })),
    ...videos.map((video) => ({
      id: `video-${video.id}`,
      img: video.poster,
      title: video.title,
      sub: `视频 · ${video.subtitle}`,
      open: () => window.open(video.link, "_blank", "noopener,noreferrer"),
    })),
  ];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const submitAuth = async () => {
    setIsSubmittingAuth(true);
    setAuthError("");
    try {
      const response = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Authentication failed");
      localStorage.setItem("nankaiquetao_token", data.token);
      localStorage.setItem("nankaiquetao_user", JSON.stringify(data.user));
      setDisplayName(data.user.displayName);
      setLoggedIn(true);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("nankaiquetao_user");
    const savedToken = localStorage.getItem("nankaiquetao_token");
    if (savedUser && savedToken) {
      try {
        setDisplayName(JSON.parse(savedUser).displayName || "");
        setLoggedIn(true);
      } catch {
        localStorage.removeItem("nankaiquetao_user");
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rice-paper to-bamboo rice-texture">
      {/* ===== STICKY HEADER ===== */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-y-2 px-3 py-2 sm:px-6 sm:py-0 sm:h-14">
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate("/")}>
            <img src={iconImg} alt="¿Qué TAO?" className="h-10 w-10 rounded-lg object-cover" />
            <span className="font-display text-lg sm:text-xl font-bold text-primary">¿Qué TAO?</span>
          </div>

          {/* Search */}
          <div ref={searchRef} className="relative order-3 basis-full sm:order-none sm:basis-auto sm:flex-1 w-full max-w-none sm:max-w-md sm:mx-6">
            <div className={`flex items-center border rounded-full px-4 min-h-11 sm:h-9 transition-all ${
              searchFocused ? "border-primary shadow-md ring-2 ring-primary/20" : "border-border"
            } bg-background`}>
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                className="flex-1 bg-transparent text-sm outline-none ml-2 placeholder:text-muted-foreground font-body"
                placeholder="Buscar... / 搜索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
              />
              {searchQuery && (
                <button aria-label="Limpiar búsqueda" onClick={() => setSearchQuery("")} className="-mr-2 flex min-h-11 min-w-11 items-center justify-center">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <AnimatePresence>
              {searchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full mt-2 left-0 right-0 glass-panel p-4 shadow-xl z-50"
                >
                  <div className="mb-3">
                    <p className="text-xs font-body font-medium text-foreground mb-2">
                      Historial de búsqueda
                      <span className="text-muted-foreground ml-1 font-chinese">(搜索历史记录)</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {searchHistory.map((t) => (
                        <span key={t} className="px-2.5 py-1 rounded-full bg-secondary text-xs font-body text-secondary-foreground hover:bg-accent/20 hover:text-accent-foreground cursor-pointer transition-colors">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-body font-medium text-foreground mb-2">
                      Búsquedas recomendadas
                      <span className="text-muted-foreground ml-1 font-chinese">(推荐搜索)</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {searchRecommended.map((t) => (
                        <span key={t} className="px-2.5 py-1 rounded-full bg-accent/10 text-xs font-body text-accent-foreground hover:bg-accent/25 cursor-pointer transition-colors">{t}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Nav */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button aria-label="Abrir lectura" onClick={() => navigate("/studio")} className="flex items-center gap-1.5 min-h-11 px-3 py-1.5 rounded-lg text-sm font-body hover:opacity-90 transition-colors" style={{ backgroundColor: '#711a5f', color: 'white' }}>
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">Lectura</span>
              <span className="hidden md:inline font-chinese text-[10px] opacity-70">阅读</span>
            </button>
            <button aria-label="Abrir cognición IA" onClick={() => navigate("/studio?module=cognition")} className="flex items-center gap-1.5 min-h-11 px-3 py-1.5 rounded-lg bg-accent/15 text-accent-foreground text-sm font-body hover:bg-accent/25 transition-colors">
              <Brain className="w-4 h-4" />
              <span className="hidden md:inline">Cognición IA</span>
              <span className="hidden md:inline font-chinese text-[10px] opacity-70">AI认知</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===== MAIN GRID ===== */}
      <div className="max-w-[1400px] mx-auto px-3 py-4 sm:px-6 sm:py-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* ===== LEFT MAIN ===== */}
        <main className="min-w-0 space-y-8">
          {/* CAROUSEL */}
          <section className="relative rounded-xl overflow-hidden aspect-[4/3] sm:aspect-[21/9] group">
            <AnimatePresence mode="wait">
              <motion.div key={heroSlides[currentSlide].id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0 cursor-pointer" role="link" tabIndex={0} onClick={heroSlides[currentSlide].open} onKeyDown={(event) => event.key === "Enter" && heroSlides[currentSlide].open()}>
                <img src={heroSlides[currentSlide].img} alt={heroSlides[currentSlide].title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
                  <h2 className="font-display text-xl sm:text-2xl md:text-3xl text-primary-foreground font-bold">{heroSlides[currentSlide].title}</h2>
                  <p className="font-chinese text-sm text-primary-foreground/80 mt-1">{heroSlides[currentSlide].sub}</p>
                </div>
              </motion.div>
            </AnimatePresence>
            <button aria-label="Diapositiva anterior" onClick={() => setCurrentSlide((p) => (p - 1 + heroSlides.length) % heroSlides.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-background/60 backdrop-blur flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-background/80">
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <button aria-label="Siguiente diapositiva" onClick={() => setCurrentSlide((p) => (p + 1) % heroSlides.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-background/60 backdrop-blur flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-background/80">
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
            <div className="absolute bottom-3 right-6 flex gap-1.5">
              {heroSlides.map((_, i) => (
                <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? "bg-primary w-5" : "bg-primary-foreground/50"}`} />
              ))}
            </div>
          </section>

          {/* BOOKS */}
          <section>
            <h3 className="font-display text-lg text-foreground mb-1">Obras Clásicas</h3>
            <p className="font-chinese text-xs text-muted-foreground mb-4">经典著作</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {books.map((book) => (
                <div key={book.title} className="cursor-default select-none group/book">
                  <div className="aspect-[3/4] rounded-lg overflow-hidden border border-border shadow-sm">
                    <img src={book.img} alt={book.title} className="w-full h-full object-cover" />
                  </div>
                  <p className="font-body text-sm text-foreground mt-2 leading-tight line-clamp-2">{book.title}</p>
                  <p className="font-chinese text-xs text-muted-foreground mt-0.5">{book.sub}</p>
                </div>
              ))}
            </div>
          </section>

          <NewsCenter />

          <VideoCenter />

        </main>

        {/* ===== RIGHT SIDEBAR ===== */}
        <aside>
          <div className="space-y-4 lg:sticky lg:top-20">
            {/* User Panel */}
            <div className="glass-panel p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-primary" />
                <h4 className="font-body text-sm font-medium text-foreground">Panel de Usuario</h4>
              </div>
              <p className="font-chinese text-xs text-muted-foreground mb-3">用户面板</p>

              {!loggedIn ? (
                <div className="space-y-2.5">
                  {authMode === "register" && (
                    <div>
                      <label className="font-body text-xs text-foreground mb-1 block">Nombre público</label>
                      <div className="flex items-center border border-border rounded-lg px-3 h-9 bg-background">
                        <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="flex-1 bg-transparent text-sm outline-none font-body" placeholder="Tu nombre" />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="font-body text-xs text-foreground mb-1 block">
                      Cuenta <span className="font-chinese text-muted-foreground">(账号)</span>
                    </label>
                    <div className="flex items-center border border-border rounded-lg px-3 h-9 bg-background">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                      <input value={email} onChange={(event) => setEmail(event.target.value)} className="flex-1 bg-transparent text-sm outline-none font-body placeholder:text-muted-foreground" placeholder="correo@ejemplo.com" />
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-xs text-foreground mb-1 block">
                      Contraseña <span className="font-chinese text-muted-foreground">(密码)</span>
                    </label>
                    <div className="flex items-center border border-border rounded-lg px-3 h-9 bg-background">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                      <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="flex-1 bg-transparent text-sm outline-none font-body placeholder:text-muted-foreground" placeholder="至少 8 个字符" />
                    </div>
                  </div>
                  <button
                    onClick={submitAuth}
                    disabled={isSubmittingAuth}
                    className="w-full py-2 rounded-lg text-sm font-body hover:opacity-90 transition-colors" style={{ backgroundColor: '#711a5f', color: 'white' }}
                  >
                    {isSubmittingAuth ? "…" : authMode === "login" ? "Iniciar sesión · 登录" : "Crear cuenta · 注册"}
                  </button>
                  {authError && <p className="text-xs text-destructive">{authError}</p>}
                  <button onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }} className="w-full text-xs text-primary">
                    {authMode === "login" ? "Crear una cuenta · 注册" : "Ya tengo una cuenta · 登录"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border border-border">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-body text-sm text-foreground font-medium">{displayName || "Usuario"}</p>
                        <button className="text-muted-foreground hover:text-accent transition-colors"><Edit className="w-3 h-3" /></button>
                      </div>
                      <p className="font-chinese text-xs text-muted-foreground">昵称</p>
                    </div>
                  </div>
                  <button className="w-full py-1.5 rounded-lg border border-border text-sm font-body text-muted-foreground hover:border-accent hover:text-accent-foreground transition-colors flex items-center justify-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Subir avatar · 上传头像
                  </button>
                  <button
                    onClick={() => { localStorage.removeItem("nankaiquetao_token"); localStorage.removeItem("nankaiquetao_user"); setLoggedIn(false); }}
                    className="w-full py-1.5 rounded-lg border border-destructive/30 text-destructive text-sm font-body hover:bg-destructive/10 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Cerrar sesión · 退出
                  </button>
                </div>
              )}
            </div>

            {/* AI Chat */}
            <HomepageChat />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Homepage;
