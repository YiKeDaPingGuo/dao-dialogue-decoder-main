import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, Send, Share2 } from "lucide-react";
import { getVideoById } from "@/data/videos";
import { authHeaders } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import AuthPanel from "@/components/AuthPanel";
import UserAvatar from "@/components/UserAvatar";

type VideoComment = {
  id: number;
  content: string;
  createdAt: string;
  displayName: string;
  avatarUrl?: string | null;
  likes: number;
  liked: boolean;
  replies: VideoComment[];
};

type DanmakuMode = "scroll" | "top" | "bottom";

type VideoDanmaku = {
  id: number;
  content: string;
  timeSec: number;
  color?: string;
  mode?: DanmakuMode;
  displayName: string;
};

type FlyingDanmaku = {
  key: string;
  content: string;
  color: string;
  mode: DanmakuMode;
  top: number;
  duration: number;
};

type VideoSummary = {
  likes: number;
  liked: boolean;
  comments: VideoComment[];
  commentCount?: number;
  danmaku: VideoDanmaku[];
};

const LOGIN_HINT = "Inicia sesión para interactuar. / 请先登录后再点赞、评论或发送弹幕。";
const DANMAKU_COLORS = [
  { value: "#ffffff", label: "Blanco · 白" },
  { value: "#ffe082", label: "Oro · 金" },
  { value: "#81c784", label: "Jade · 绿" },
  { value: "#64b5f6", label: "Cielo · 蓝" },
  { value: "#ef9a9a", label: "Rojo · 红" },
  { value: "#f48fb1", label: "Rosa · 粉" },
];

const copyText = async (text: string) => {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fallback below */
    }
  }
  const field = document.createElement("textarea");
  field.value = text;
  field.readOnly = true;
  Object.assign(field.style, {
    position: "fixed",
    top: "8px",
    left: "8px",
    width: "1px",
    height: "1px",
    padding: "0",
    border: "0",
    opacity: "0.01",
  });
  document.body.appendChild(field);
  field.focus();
  field.select();
  field.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(field);
  return ok;
};

const applySummary = (data: Partial<VideoSummary>): VideoSummary => ({
  likes: data.likes || 0,
  liked: Boolean(data.liked),
  comments: data.comments || [],
  commentCount: data.commentCount,
  danmaku: data.danmaku || [],
});

const VideoPage = () => {
  const navigate = useNavigate();
  const { videoId } = useParams();
  const video = getVideoById(videoId);
  const { loggedIn } = useAuth();
  const playerRef = useRef<HTMLVideoElement>(null);
  const firedDanmaku = useRef(new Set<number>());
  const shareTimer = useRef<number>();
  const [summary, setSummary] = useState<VideoSummary>({ likes: 0, liked: false, comments: [], danmaku: [] });
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<VideoComment | null>(null);
  const [danmakuText, setDanmakuText] = useState("");
  const [danmakuColor, setDanmakuColor] = useState("#ffffff");
  const [danmakuMode, setDanmakuMode] = useState<DanmakuMode>("scroll");
  const [hint, setHint] = useState("");
  const [shareNotice, setShareNotice] = useState("");
  const [flying, setFlying] = useState<FlyingDanmaku[]>([]);
  const [showDanmaku, setShowDanmaku] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadSummary = async () => {
    if (!video) return;
    const response = await fetch(`/api/videos/${video.id}`, { headers: authHeaders() });
    if (!response.ok) return;
    setSummary(applySummary(await response.json()));
  };

  useEffect(() => {
    firedDanmaku.current.clear();
    setFlying([]);
    void loadSummary();
  }, [video?.id, loggedIn]);

  const spawnDanmaku = (item: VideoDanmaku) => {
    if (firedDanmaku.current.has(item.id)) return;
    firedDanmaku.current.add(item.id);
    const mode = item.mode || "scroll";
    const flyingItem: FlyingDanmaku = {
      key: `${item.id}-${Date.now()}`,
      content: item.content,
      color: item.color || "#ffffff",
      mode,
      top: mode === "top" ? 8 : mode === "bottom" ? 82 : 12 + Math.random() * 58,
      duration: mode === "scroll" ? 7 + Math.random() * 4 : 4.5,
    };
    setFlying((prev) => [...prev.slice(-28), flyingItem]);
    window.setTimeout(() => {
      setFlying((prev) => prev.filter((entry) => entry.key !== flyingItem.key));
    }, flyingItem.duration * 1000);
  };

  const onTimeUpdate = () => {
    const current = playerRef.current?.currentTime || 0;
    if (!showDanmaku) return;
    summary.danmaku.forEach((item) => {
      if (Math.abs(item.timeSec - current) < 0.45) spawnDanmaku(item);
    });
  };

  const postJson = async (path: string, body?: object) => {
    if (!loggedIn) return false;
    setBusy(true);
    setHint("");
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      setSummary(applySummary(data));
      return true;
    } catch (error) {
      setHint(error instanceof Error ? error.message : "Request failed");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const toggleLike = () => {
    if (!video) return;
    void postJson(`/api/videos/${video.id}/like`);
  };

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!video || !comment.trim()) return;
    const ok = await postJson(`/api/videos/${video.id}/comments`, {
      content: comment.trim(),
      parentId: replyTo?.id,
    });
    if (ok) {
      setComment("");
      setReplyTo(null);
    }
  };

  const submitDanmaku = async (event: FormEvent) => {
    event.preventDefault();
    if (!video || !danmakuText.trim()) return;
    const timeSec = playerRef.current?.currentTime || 0;
    const content = danmakuText.trim();
    const ok = await postJson(`/api/videos/${video.id}/danmaku`, {
      content,
      timeSec,
      color: danmakuColor,
      mode: danmakuMode,
    });
    if (ok) {
      setDanmakuText("");
      spawnDanmaku({ id: Date.now(), content, timeSec, color: danmakuColor, mode: danmakuMode, displayName: "" });
    }
  };

  const copyShareLink = async () => {
    if (!video) return;
    const url = `${window.location.origin}/videos/${video.id}`;
    const copied = await copyText(url);
    const message = copied
      ? "Enlace copiado al portapapeles. / 分享链接已复制到剪贴板"
      : "No se pudo copiar. / 复制失败，请再试一次";
    setShareNotice(message);
    if (shareTimer.current) window.clearTimeout(shareTimer.current);
    shareTimer.current = window.setTimeout(() => setShareNotice(""), 2500);
  };

  const commentCount = useMemo(
    () => summary.commentCount ?? summary.comments.reduce((total, item) => total + 1 + item.replies.length, 0),
    [summary],
  );

  const renderComment = (item: VideoComment, isReply = false) => (
    <div key={item.id} className={isReply ? "ml-10 border-l border-border pl-3" : "border-b border-border pb-3 last:border-0"}>
      <div className="flex gap-2">
        <UserAvatar name={item.displayName} src={item.avatarUrl} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{item.displayName}</p>
          <p className="text-[11px] text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
          <p className="mt-1 text-sm text-foreground">{item.content}</p>
          <div className="mt-1 flex gap-3">
            <button
              onClick={() => video && postJson(`/api/videos/${video.id}/comments/${item.id}/like`)}
              className={`flex items-center gap-1 text-xs ${item.liked ? "text-primary" : "text-muted-foreground"}`}
            >
              <Heart className={`h-3 w-3 ${item.liked ? "fill-current" : ""}`} /> {item.likes}
            </button>
            <button onClick={() => setReplyTo(item)} className="text-xs text-muted-foreground hover:text-primary">
              Responder · 回复
            </button>
          </div>
        </div>
      </div>
      {item.replies?.length > 0 && <div className="mt-3 space-y-3">{item.replies.map((reply) => renderComment(reply, true))}</div>}
    </div>
  );

  if (!video) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-muted-foreground">未找到该视频。 / Vídeo no encontrado.</p>
        <button onClick={() => navigate("/")} className="mt-4 text-primary">返回首页</button>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-rice-paper to-bamboo rice-texture">
      {shareNotice && (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-[200] flex justify-center px-4">
          <p className="rounded-lg bg-foreground/90 px-4 py-2 text-center text-sm text-primary-foreground shadow-lg">
            {shareNotice}
          </p>
        </div>
      )}
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_300px] sm:px-6">
        <section>
          <button
            onClick={() => navigate("/")}
            className="mb-4 flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al inicio · 返回首页
          </button>
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">{video.title}</h1>
          <p className="mt-1 font-chinese text-sm text-muted-foreground">{video.subtitle}</p>

          <div className="relative mt-4 overflow-hidden rounded-xl border border-border bg-foreground">
            <video
              ref={playerRef}
              className="aspect-video w-full bg-black"
              controls
              playsInline
              poster={video.poster}
              src={video.src}
              onTimeUpdate={onTimeUpdate}
              onSeeked={() => {
                firedDanmaku.current.clear();
              }}
            />
            {showDanmaku &&
              flying.map((item) => (
                <span
                  key={item.key}
                  className={`pointer-events-none absolute whitespace-nowrap text-sm font-body drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${
                    item.mode === "scroll" ? "" : "left-1/2 -translate-x-1/2"
                  }`}
                  style={{
                    color: item.color,
                    top: `${item.top}%`,
                    animation:
                      item.mode === "scroll"
                        ? `danmaku-fly ${item.duration}s linear forwards`
                        : `danmaku-hold ${item.duration}s ease forwards`,
                  }}
                >
                  {item.content}
                </span>
              ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={toggleLike}
              disabled={busy}
              className={`flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm ${
                summary.liked ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"
              }`}
            >
              <Heart className={`h-4 w-4 ${summary.liked ? "fill-current" : ""}`} />
              {summary.likes} Me gusta · 点赞
            </button>
            <span className="flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" /> {commentCount} Comentarios · 评论
            </span>
            <button onClick={copyShareLink} className="flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-foreground">
              <Share2 className="h-4 w-4" /> Compartir · 分享
            </button>
            <button
              onClick={() => setShowDanmaku((value) => !value)}
              className="min-h-11 rounded-lg border border-border px-3 text-sm text-foreground"
            >
              {showDanmaku ? "Ocultar danmu · 关闭弹幕" : "Mostrar danmu · 打开弹幕"}
            </button>
          </div>

          <form onSubmit={submitDanmaku} className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              <select
                value={danmakuMode}
                onChange={(event) => setDanmakuMode(event.target.value as DanmakuMode)}
                className="min-h-11 rounded-lg border border-border bg-background px-2 text-sm"
              >
                <option value="scroll">Fluir · 流动</option>
                <option value="top">Arriba · 置顶</option>
                <option value="bottom">Abajo · 置底</option>
              </select>
              <div className="flex items-center gap-1 rounded-lg border border-border px-2">
                {DANMAKU_COLORS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    title={item.label}
                    onClick={() => setDanmakuColor(item.value)}
                    className={`h-5 w-5 rounded-full border ${danmakuColor === item.value ? "ring-2 ring-primary" : "border-border"}`}
                    style={{ backgroundColor: item.value }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <input
                value={danmakuText}
                onChange={(event) => setDanmakuText(event.target.value)}
                maxLength={40}
                placeholder="Enviar danmu / 发弹幕…"
                className="min-h-11 flex-1 rounded-lg border border-border bg-background px-3 text-sm"
              />
              <button type="submit" disabled={busy || !danmakuText.trim()} className="min-h-11 min-w-11 rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
                <Send className="mx-auto h-4 w-4" />
              </button>
            </div>
          </form>

          {hint && <p className="mt-2 text-xs text-destructive">{hint}</p>}
          {!loggedIn && <p className="mt-2 text-xs text-muted-foreground">{LOGIN_HINT}</p>}

          <div className="glass-panel mt-6 p-4">
            <h2 className="font-body text-sm font-medium">Comentarios · 评论</h2>
            <form onSubmit={submitComment} className="mt-3 space-y-2">
              {replyTo && (
                <div className="flex items-center justify-between rounded-lg bg-secondary/70 px-3 py-1.5 text-xs text-muted-foreground">
                  <span>Responder a {replyTo.displayName} · 回复 {replyTo.displayName}</span>
                  <button type="button" onClick={() => setReplyTo(null)}>Cancelar · 取消</button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  maxLength={500}
                  placeholder="Escribe un comentario / 写下你的感想…"
                  className="min-h-11 flex-1 rounded-lg border border-border bg-background px-3 text-sm"
                />
                <button type="submit" disabled={busy || !comment.trim()} className="min-h-11 rounded-lg bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50">
                  Publicar · 发布
                </button>
              </div>
            </form>
            <div className="mt-4 space-y-3">
              {summary.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay comentarios. / 还没有评论。</p>
              ) : (
                summary.comments.map((item) => renderComment(item))
              )}
            </div>
          </div>
        </section>
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <AuthPanel />
        </aside>
      </div>
    </main>
  );
};

export default VideoPage;
