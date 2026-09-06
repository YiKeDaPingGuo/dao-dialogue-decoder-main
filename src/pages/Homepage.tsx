import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, BookOpen, Brain, ChevronLeft, ChevronRight, X
} from "lucide-react";
import HomepageChat from "@/components/HomepageChat";
import NewsCenter from "@/components/NewsCenter";
import VideoCenter from "@/components/VideoCenter";
import AuthPanel from "@/components/AuthPanel";
import { newsArticles } from "@/data/news";
import { videos } from "@/data/videos";
import iconImg from "@/assets/app-icon.png";

const searchHistory = ["Capítulo 1", "Wu Wei", "道", "Naturaleza", "El Camino"];
const searchRecommended = ["Tao y Virtud", "无为而治", "Laozi", "Traducción", "Yin Yang"];

const books = [
  {
    img: "https://nkuquetao.oss-cn-shanghai.aliyuncs.com/book/arsovska_lib.png",
    title: "Dao De Jing — L. Arsovska",
    sub: "阿尔索夫斯卡 译本 · 2023",
    href: "/studio",
  },
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
      open: () => navigate(`/videos/${video.id}`),
    })),
  ];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
                <div
                  key={book.title}
                  role={book.href ? "link" : undefined}
                  tabIndex={book.href ? 0 : undefined}
                  onClick={() => book.href && navigate(book.href)}
                  onKeyDown={(e) => {
                    if (book.href && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      navigate(book.href);
                    }
                  }}
                  className={`select-none group/book ${book.href ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div className="aspect-[3/4] rounded-lg overflow-hidden border border-border shadow-sm">
                    <img
                      src={book.img}
                      alt={book.title}
                      className={`w-full h-full object-cover transition-transform duration-300 ${
                        book.href ? "group-hover/book:scale-105" : ""
                      }`}
                    />
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
            <AuthPanel />
            <HomepageChat />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Homepage;
