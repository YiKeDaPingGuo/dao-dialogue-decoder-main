import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { newsArticles } from "@/data/news";

const newsIcon = "https://nkuquetao.oss-cn-shanghai.aliyuncs.com/image/hotpot.png?x-oss-process=image/resize,m_fill,w_30,h_30";

const NewsCenter = () => {
  const navigate = useNavigate();

  return (
    <section aria-labelledby="news-heading">
      <h3 id="news-heading" className="font-display text-lg text-foreground mb-1">
        Centro de Noticias
      </h3>
      <p className="font-chinese text-xs text-muted-foreground mb-4">新闻中心</p>

      <div className="overflow-hidden rounded-xl border border-border bg-background/70">
        {newsArticles.map((article) => (
          <button
            key={article.id}
            type="button"
            onClick={() => navigate(`/news/${article.id}`)}
            className="flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-secondary/60 sm:px-4"
          >
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center overflow-hidden rounded-lg">
              <img src={newsIcon} alt="" className="h-[30px] w-[30px] rounded-lg object-cover" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-body text-sm font-medium text-foreground">{article.title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{article.date}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
    </section>
  );
};

export default NewsCenter;
