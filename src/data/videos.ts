const ossVideoBaseUrl = "https://nkuquetao.oss-cn-shanghai.aliyuncs.com/video";

export type SiteVideo = {
  id: string;
  title: string;
  subtitle: string;
  poster: string;
  src: string;
};

export const videos: SiteVideo[] = [
  {
    id: "heritage",
    title: "故里寻踪，问道鹿邑",
    subtitle: "南开大学赴鹿邑暑期实践 · 文旅融合篇",
    poster: `${ossVideoBaseUrl}/wenlvronghe.png`,
    src: `${ossVideoBaseUrl}/%E6%95%85%E9%87%8C%E5%AF%BB%E8%B8%AA%2C%E9%97%AE%E9%81%93%E9%B9%BF%E9%82%91%E2%80%94%E2%80%94%E5%8D%97%E5%BC%80%E5%A4%A7%E5%AD%A6%E8%B5%B4%E9%B9%BF%E9%82%91%E6%9A%91%E6%9C%9F%E5%AE%9E%E8%B7%B5%E6%96%87%E6%97%85%E8%9E%8D%E5%90%88%E7%AF%87.mp4`,
  },
  {
    id: "craft",
    title: "指尖守艺，田间悟道",
    subtitle: "南开大学赴鹿邑暑期实践 · 乡土非遗篇",
    poster: `${ossVideoBaseUrl}/xiangtufeiyi.png`,
    src: `${ossVideoBaseUrl}/%E6%8C%87%E5%B0%96%E5%AE%88%E8%89%BA%2C%E7%94%B0%E9%97%B4%E6%82%9F%E9%81%93%E2%80%94%E2%80%94%E5%8D%97%E5%BC%80%E5%A4%A7%E5%AD%A6%E8%B5%B4%E9%B9%BF%E9%82%91%E6%9A%91%E6%9C%9F%E5%AE%9E%E8%B7%B5%E4%B9%A1%E5%9C%9F%E9%9D%9E%E9%81%97%E7%AF%87.mp4`,
  },
  {
    id: "industry",
    title: "溯源老子千年文脉，聚力实业时代新声",
    subtitle: "南开大学赴鹿邑暑期实践 · 实业问道篇",
    poster: `${ossVideoBaseUrl}/shiyewendao.png`,
    src: `${ossVideoBaseUrl}/%E6%BA%AF%E6%BA%90%E8%80%81%E5%AD%90%E5%8D%83%E5%B9%B4%E6%96%87%E8%84%89%2C%E8%81%9A%E5%8A%9B%E5%AE%9E%E4%B8%9A%E6%97%B6%E4%BB%A3%E6%96%B0%E5%A3%B0%E2%80%94%E2%80%94%E5%8D%97%E5%BC%80%E5%A4%A7%E5%AD%A6%E8%B5%B4%E9%B9%BF%E9%82%91%E6%9A%91%E6%9C%9F%E5%AE%9E%E5%AE%9E%E8%B7%B5%E5%AE%9E%E4%B8%9A%E9%97%AE%E9%81%93%E7%AF%87.mp4`,
  },
];

export const getVideoById = (id?: string) => videos.find((video) => video.id === id);
