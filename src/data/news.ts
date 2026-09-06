export type NewsArticle = {
  id: number;
  title: string;
  date: string;
  contentUrl: string;
  images: string[];
};

const ossNewsBaseUrl = "https://nkuquetao.oss-cn-shanghai.aliyuncs.com/news/essay";
const newsAsset = (articleId: number, fileName: string) => `${ossNewsBaseUrl}/${articleId}/${fileName}`;

/** 正文优先走站点同源路径 (避免 OSS 未配 CORS 导致浏览器 fetch 失败); OSS 仅作备用 */
const localNewsContent = (articleId: number) => `/news/essay/${articleId}/${articleId}.md`;

export const newsArticles: NewsArticle[] = [
  { id: 1, title: "溯源道脉礼乐文脉：南开大学实践队探访鹿邑太清宫", date: "2026.07.25", contentUrl: localNewsContent(1), images: [newsAsset(1, "1.jpg"), newsAsset(1, "2.jpg")] },
  { id: 2, title: "调研鹿邑老学研究与文博阵地，赋能典籍出海", date: "2026.07.24", contentUrl: localNewsContent(2), images: [newsAsset(2, "1.jpg"), newsAsset(2, "2.jpg")] },
  { id: 3, title: "扎根乡野探文脉：实践队赴郑家集乡开展文化调研", date: "2026.07.26", contentUrl: localNewsContent(3), images: [newsAsset(3, "1.jpg"), newsAsset(3, "2.jpg"), newsAsset(3, "3.jpg")] },
  { id: 4, title: "译本珍藏：南开大学实践队调研老子历史博物馆", date: "2026.07.24", contentUrl: localNewsContent(4), images: [newsAsset(4, "1.jpg"), newsAsset(4, "2.jpg")] },
  { id: 5, title: "探访荣观园：调研道家文化与非遗融合实践", date: "2026.07.27", contentUrl: localNewsContent(5), images: [newsAsset(5, "1.jpg"), newsAsset(5, "2.jpg"), newsAsset(5, "3.jpg")] },
  { id: 6, title: "调研澄明食品产业园，探寻道家文化实业实践路径", date: "2026.07.27", contentUrl: localNewsContent(6), images: [newsAsset(6, "1.jpg"), newsAsset(6, "2.jpg"), newsAsset(6, "3.jpg"), newsAsset(6, "4.jpg")] },
  { id: 7, title: "走访宋河粮液：调研道家文化的酒业转化实践", date: "2026.07.28", contentUrl: localNewsContent(7), images: [newsAsset(7, "1.jpg"), newsAsset(7, "2.jpg"), newsAsset(7, "3.jpg"), newsAsset(7, "4.jpg")] },
  { id: 8, title: "河南鹿邑：品悟老子文化，共话文旅新篇", date: "2026.07.25", contentUrl: localNewsContent(8), images: [newsAsset(8, "1.jpg"), newsAsset(8, "2.jpg")] },
];

export const ossNewsContentUrl = (articleId: number) => newsAsset(articleId, `${articleId}.md`);

export const renderNewsContent = (content: string, images: string[]) =>
  content.replace(/^#{1,6}\s+.*(?:\r?\n|$)/, "").replace(/##\s*插入(\d+)\.jpg/g, (_, imageIndex: string) => {
    const image = images[Number(imageIndex) - 1];
    return image ? `\n\n![新闻现场图片](${image})\n\n` : "";
  });
