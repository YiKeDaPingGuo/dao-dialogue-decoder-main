import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ArrowLeft } from "lucide-react";
import { newsArticles, ossNewsContentUrl, renderNewsContent } from "@/data/news";

const NewsArticle = () => {
  const navigate = useNavigate();
  const { articleId } = useParams();
  const article = newsArticles.find((item) => item.id === Number(articleId));
  const [content, setContent] = useState("");
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!article) return;

    const controller = new AbortController();
    setContent("");
    setLoadError(false);

    const urls = [
      article.contentUrl,
      `/api/news/${article.id}`,
      ossNewsContentUrl(article.id),
    ];

    const load = async () => {
      let lastError: unknown = null;
      for (const url of urls) {
        try {
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) {
            lastError = new Error(`HTTP ${response.status}`);
            continue;
          }
          const text = await response.text();
          if (!text.trim() || text.trim().startsWith("<")) {
            lastError = new Error("Empty or HTML response");
            continue;
          }
          setContent(text);
          return;
        } catch (error) {
          if ((error as { name?: string }).name === "AbortError") return;
          lastError = error;
        }
      }
      if (lastError) setLoadError(true);
    };

    load();
    return () => controller.abort();
  }, [article]);

  if (!article) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-muted-foreground">未找到该新闻。</p>
        <button onClick={() => navigate("/")} className="mt-4 text-primary">返回首页</button>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-rice-paper to-bamboo rice-texture">
      <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <button
          onClick={() => navigate("/")}
          className="mb-6 flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al inicio · 返回首页
        </button>
        <div className="glass-panel p-5 sm:p-8">
          <p className="text-sm text-muted-foreground">{article.date}</p>
          <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">{article.title}</h1>
          <div className="prose prose-base mt-8 max-w-none font-chinese text-[17px] tracking-[0.025em] text-foreground prose-headings:font-display prose-headings:text-foreground prose-p:my-0 prose-p:mb-8 prose-p:indent-[2em] prose-p:leading-10">
            {content ? (
              <ReactMarkdown
                components={{
                  img: ({ src, alt }) => (
                    <figure className="not-prose relative mb-8 overflow-visible border border-gold/45 bg-silk/40 p-2 shadow-sm">
                      <span className="absolute -left-px -top-px h-5 w-5 border-l-2 border-t-2 border-alhambra" />
                      <span className="absolute -right-px -top-px h-5 w-5 border-r-2 border-t-2 border-alhambra" />
                      <span className="absolute -bottom-px -left-px h-5 w-5 border-b-2 border-l-2 border-alhambra" />
                      <span className="absolute -bottom-px -right-px h-5 w-5 border-b-2 border-r-2 border-alhambra" />
                      <span className="absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border border-gold bg-rice-paper" />
                      <img src={src} alt={alt ?? "新闻现场图片"} className="block w-full rounded-sm" />
                    </figure>
                  ),
                }}
              >
                {renderNewsContent(content, article.images)}
              </ReactMarkdown>
            ) : (
              <p className="!indent-0 text-muted-foreground">{loadError ? "新闻正文暂时无法加载，请稍后重试。" : "正在加载新闻正文…"}</p>
            )}
          </div>
        </div>
      </article>
    </main>
  );
};

export default NewsArticle;
