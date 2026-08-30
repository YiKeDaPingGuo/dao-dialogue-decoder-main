import { Play } from "lucide-react";
import { videos } from "@/data/videos";

const VideoCenter = () => {
  return (
    <section data-section="videos">
      <h3 className="font-display text-lg text-foreground mb-1">Videos Culturales</h3>
      <p className="font-chinese text-xs text-muted-foreground mb-4">文化视频</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <a key={video.id} href={video.link} target="_blank" rel="noopener noreferrer" className="group/card text-left">
            <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-foreground/10">
              <img className="h-full w-full object-cover" src={video.poster} alt={video.title} loading="lazy" />
              <div className="absolute inset-0 flex items-center justify-center bg-foreground/10 transition-colors group-hover/card:bg-foreground/20">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background/75 text-foreground transition-colors group-hover/card:bg-primary group-hover/card:text-primary-foreground">
                  <Play className="h-5 w-5 ml-0.5" />
                </span>
              </div>
            </div>
            <p className="mt-2 font-body text-sm text-foreground line-clamp-2 group-hover/card:text-primary">{video.title}</p>
            <p className="mt-0.5 font-chinese text-xs text-muted-foreground">{video.subtitle}</p>
          </a>
        ))}
      </div>
    </section>
  );
};

export default VideoCenter;
