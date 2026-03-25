import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, BookOpen, Brain, Play, ChevronLeft, ChevronRight,
  X, User, LogOut, Edit, Upload, Lock, Mail
} from "lucide-react";
import HomepageChat from "@/components/HomepageChat";
import iconImg from "@/assets/icon.jpg";
import book1 from "@/assets/book-1.jpg";
import book2 from "@/assets/book-2.jpg";
import book3 from "@/assets/book-3.jpg";
import book4 from "@/assets/book-4.png";
import book5 from "@/assets/book-5.jpg";
import roll1 from "@/assets/roll1.jpg";
import roll2 from "@/assets/roll2.jpg";
import roll3 from "@/assets/roll3.jpg";
import vid1 from "@/assets/video1.jpg";
import vid2 from "@/assets/video2.jpg";
import vid3 from "@/assets/video3.jpg";
import vid4 from "@/assets/video4.jpg";
import vid5 from "@/assets/video5.jpg";
import vid6 from "@/assets/video6.jpg";

/* ── Data ── */
const heroSlides = [
  { img: roll1, title: "Puente Cultural Sino-Hispano", sub: "中西文化之桥" },
  { img: roll2, title: "Tao Te Ching · Edición Bilingüe", sub: "道德经 · 双语典藏版" },
  { img: roll3, title: "Tradiciones Vivas", sub: "活态传承" },
];

const searchHistory = ["Capítulo 1", "Wu Wei", "道", "Naturaleza", "El Camino"];
const searchRecommended = ["Tao y Virtud", "无为而治", "Laozi", "Traducción", "Yin Yang"];

const books = [
  { img: book1, title: "Tao Te Ching — Lao Tse", sub: "老子 · 道德经" },
  { img: book2, title: "El Tao Te King — J. Ferrero", sub: "费雷罗 译本" },
  { img: book3, title: "Dao De Jing — A. Galvany", sub: "加尔瓦尼 译本" },
  { img: book4, title: "Libro del Tao — I. Preciado", sub: "普雷夏多 译本" },
  { img: book5, title: "Tao Te Ching — S. Mitchell", sub: "米切尔 英译本" },
];

const videos = [
  { title: "¡Ha llegado la cultura de artes marciales chinas en Madrid!", sub: "中国武术文化来到马德里！", img: vid1, link: "https://www.bilibili.com/video/BV1xnZcYhE4i" },
  { title: "¡Experimente la fascinación del má jiàng en español!", sub: "西语体验麻将的魅力！", img: vid2, link: "https://www.bilibili.com/video/BV1Qu411L7Fe" },
  { title: "Reconstruir el Quiosco de Zuìwēng", sub: "重建醉翁亭", img: vid3, link: "https://www.bilibili.com/video/BV1Diy8BLEmJ" },
  { title: "Teatro de Sombras Chino: revive el arte antiguo", sub: "中国皮影戏：复活古老艺术", img: vid4, link: "https://www.bilibili.com/video/BV1EF7xzcELB" },
  { title: "El Xiangsheng de Tianjin: De Prisa", sub: "天津相声：着急", img: vid5, link: "https://www.bilibili.com/video/BV1494y1b7oa" },
  { title: "El Xiangsheng de Tianjin: El Viajero", sub: "天津相声：旅行者", img: vid6, link: "https://www.bilibili.com/video/BV1B84y1Z7mU" },
];

const Homepage = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rice-paper to-bamboo rice-texture">
      {/* ===== STICKY HEADER ===== */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate("/")}>
            <img src={iconImg} alt="¿Qué TAO?" className="h-10 w-10 rounded-lg object-cover" />
            <span className="font-display text-xl font-bold text-primary">¿Qué TAO?</span>
          </div>

          {/* Search */}
          <div ref={searchRef} className="relative w-full max-w-md mx-6">
            <div className={`flex items-center border rounded-full px-4 h-9 transition-all ${
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
                <button onClick={() => setSearchQuery("")}>
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
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => navigate("/studio")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body hover:opacity-90 transition-colors" style={{ backgroundColor: '#711a5f', color: 'white' }}>
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">Lectura</span>
              <span className="hidden md:inline font-chinese text-[10px] opacity-70">阅读</span>
            </button>
            <button onClick={() => navigate("/studio?module=cognition")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/15 text-accent-foreground text-sm font-body hover:bg-accent/25 transition-colors">
              <Brain className="w-4 h-4" />
              <span className="hidden md:inline">Cognición IA</span>
              <span className="hidden md:inline font-chinese text-[10px] opacity-70">AI认知</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===== MAIN GRID ===== */}
      <div className="max-w-[1400px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* ===== LEFT MAIN ===== */}
        <main className="min-w-0 space-y-8">
          {/* CAROUSEL */}
          <section className="relative rounded-xl overflow-hidden aspect-[21/9] group">
            <AnimatePresence mode="wait">
              <motion.div key={currentSlide} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0">
                <img src={heroSlides[currentSlide].img} alt={heroSlides[currentSlide].title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <h2 className="font-display text-2xl md:text-3xl text-primary-foreground font-bold">{heroSlides[currentSlide].title}</h2>
                  <p className="font-chinese text-sm text-primary-foreground/80 mt-1">{heroSlides[currentSlide].sub}</p>
                </div>
              </motion.div>
            </AnimatePresence>
            <button onClick={() => setCurrentSlide((p) => (p - 1 + heroSlides.length) % heroSlides.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/60 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80">
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <button onClick={() => setCurrentSlide((p) => (p + 1) % heroSlides.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/60 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80">
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

          {/* VIDEOS */}
          <section data-section="videos">
            <h3 className="font-display text-lg text-foreground mb-1">Videos Culturales</h3>
            <p className="font-chinese text-xs text-muted-foreground mb-4">文化视频推荐</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <a key={video.title} href={video.link} target="_blank" rel="noopener noreferrer" className="group/card block">
                  <motion.div whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 300 }}>
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                      <img src={video.img} alt={video.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-foreground/10 group-hover/card:bg-foreground/20 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-background/70 backdrop-blur flex items-center justify-center group-hover/card:bg-primary group-hover/card:text-primary-foreground transition-colors">
                          <Play className="w-5 h-5 ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="font-body text-sm text-foreground line-clamp-2 group-hover/card:text-primary transition-colors">{video.title}</p>
                      <p className="font-chinese text-xs text-muted-foreground mt-0.5">{video.sub}</p>
                    </div>
                  </motion.div>
                </a>
              ))}
            </div>
          </section>
        </main>

        {/* ===== RIGHT SIDEBAR ===== */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            {/* User Panel */}
            <div className="glass-panel p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-primary" />
                <h4 className="font-body text-sm font-medium text-foreground">Panel de Usuario</h4>
              </div>
              <p className="font-chinese text-xs text-muted-foreground mb-3">用户面板</p>

              {!loggedIn ? (
                <div className="space-y-2.5">
                  <div>
                    <label className="font-body text-xs text-foreground mb-1 block">
                      Cuenta <span className="font-chinese text-muted-foreground">(账号)</span>
                    </label>
                    <div className="flex items-center border border-border rounded-lg px-3 h-9 bg-background">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                      <input className="flex-1 bg-transparent text-sm outline-none font-body placeholder:text-muted-foreground" placeholder="correo@ejemplo.com" />
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-xs text-foreground mb-1 block">
                      Contraseña <span className="font-chinese text-muted-foreground">(密码)</span>
                    </label>
                    <div className="flex items-center border border-border rounded-lg px-3 h-9 bg-background">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                      <input type="password" className="flex-1 bg-transparent text-sm outline-none font-body placeholder:text-muted-foreground" placeholder="••••••••" />
                    </div>
                  </div>
                  <button
                    onClick={() => setLoggedIn(true)}
                    className="w-full py-2 rounded-lg text-sm font-body hover:opacity-90 transition-colors" style={{ backgroundColor: '#711a5f', color: 'white' }}
                  >
                    Iniciar sesión · 登录
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
                        <p className="font-body text-sm text-foreground font-medium">Usuario</p>
                        <button className="text-muted-foreground hover:text-accent transition-colors"><Edit className="w-3 h-3" /></button>
                      </div>
                      <p className="font-chinese text-xs text-muted-foreground">昵称</p>
                    </div>
                  </div>
                  <button className="w-full py-1.5 rounded-lg border border-border text-sm font-body text-muted-foreground hover:border-accent hover:text-accent-foreground transition-colors flex items-center justify-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Subir avatar · 上传头像
                  </button>
                  <button
                    onClick={() => setLoggedIn(false)}
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
