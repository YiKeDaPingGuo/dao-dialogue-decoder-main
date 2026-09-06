import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import { mkdirSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const databasePath = resolve(process.env.SQLITE_PATH || "./data/nankaiquetao.db");
const jwtSecret = process.env.AUTH_JWT_SECRET;

mkdirSync(dirname(databasePath), { recursive: true });
const avatarsDir = resolve(dirname(databasePath), "avatars");
mkdirSync(avatarsDir, { recursive: true });
const db = new Database(databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS video_likes (
    user_id INTEGER NOT NULL,
    video_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, video_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS video_favorites (
    user_id INTEGER NOT NULL,
    video_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, video_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS video_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    video_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS video_danmaku (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    video_id TEXT NOT NULL,
    content TEXT NOT NULL,
    time_sec REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS video_comment_likes (
    user_id INTEGER NOT NULL,
    comment_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, comment_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES video_comments(id) ON DELETE CASCADE
  );
`);

const ensureColumn = (table, column, definition) => {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all().map((item) => item.name);
  if (!columns.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  }
};

ensureColumn("users", "username", "username TEXT");
ensureColumn("users", "avatar_url", "avatar_url TEXT");
ensureColumn("video_comments", "parent_id", "parent_id INTEGER");
ensureColumn("video_danmaku", "color", "color TEXT NOT NULL DEFAULT '#ffffff'");
ensureColumn("video_danmaku", "mode", "mode TEXT NOT NULL DEFAULT 'scroll'");
db.exec(`
  UPDATE users SET username = email WHERE username IS NULL OR username = '';
  CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username);
`);

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = (process.env.CORS_ORIGINS ||
        "http://localhost:8080,http://localhost:5173,http://47.100.116.121,https://47.100.116.121,http://nkuquetao.asia,https://nkuquetao.asia,http://www.nkuquetao.asia,https://www.nkuquetao.asia")
        .split(",")
        .map((value) => value.trim());
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "8mb" }));
app.use("/api/avatars", express.static(avatarsDir));

const signUser = (user) =>
  jwt.sign(
    { sub: user.id, username: user.username, displayName: user.display_name || user.displayName },
    jwtSecret,
    { expiresIn: "7d" }
  );

const USERNAME_PATTERN = /^[a-zA-Z0-9_\u4e00-\u9fff]{3,20}$/;
const DANMAKU_MODES = new Set(["scroll", "top", "bottom"]);
const DANMAKU_COLORS = new Set(["#ffffff", "#ffe082", "#81c784", "#64b5f6", "#ef9a9a", "#f48fb1"]);

const requireAuth = (req, res, next) => {
  if (!jwtSecret) {
    return res.status(500).json({ error: "AUTH_JWT_SECRET is not configured" });
  }

  const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ error: "Session expired or invalid" });
  }
};

const optionalAuth = (req, _res, next) => {
  const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (token && jwtSecret) {
    try {
      req.user = jwt.verify(token, jwtSecret);
    } catch {
      req.user = null;
    }
  }
  next();
};

const readUser = (id) =>
  db
    .prepare(
      `SELECT id, username, display_name AS displayName, avatar_url AS avatarUrl, created_at AS createdAt
       FROM users WHERE id = ?`
    )
    .get(id);

const saveAvatar = (userId, dataUrl) => {
  const match = String(dataUrl || "").match(/^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) {
    throw new Error("Avatar must be a PNG, JPEG or WebP image");
  }
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > 800000) {
    throw new Error("Avatar must be smaller than 800KB");
  }
  const ext = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
  for (const file of readdirSync(avatarsDir)) {
    if (file.startsWith(`${userId}.`)) unlinkSync(join(avatarsDir, file));
  }
  const filename = `${userId}.${ext}`;
  writeFileSync(join(avatarsDir, filename), buffer);
  return `/api/avatars/${filename}`;
};

app.post("/api/auth/register", async (req, res) => {
  const username = String(req.body?.username || req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const displayName = String(req.body?.displayName || username).trim();

  if (!jwtSecret) {
    return res.status(500).json({ error: "AUTH_JWT_SECRET is not configured" });
  }
  if (!USERNAME_PATTERN.test(username)) {
    return res.status(400).json({ error: "Username must contain 3 to 20 letters, numbers or underscores" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must contain at least 8 characters" });
  }
  if (!displayName || displayName.length > 40) {
    return res.status(400).json({ error: "Display name must contain 1 to 40 characters" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = db
      .prepare("INSERT INTO users (email, username, password_hash, display_name) VALUES (?, ?, ?, ?)")
      .run(username, username, passwordHash, displayName);
    const user = readUser(result.lastInsertRowid);
    return res.status(201).json({ token: signUser({ ...user, display_name: user.displayName }), user });
  } catch (error) {
    if (String(error).includes("UNIQUE constraint failed")) {
      return res.status(409).json({ error: "This username is already taken" });
    }
    return res.status(500).json({ error: "Unable to create account" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const username = String(req.body?.username || req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const record = db
    .prepare("SELECT * FROM users WHERE lower(username) = ? OR lower(email) = ?")
    .get(username, username);

  if (!jwtSecret) {
    return res.status(500).json({ error: "AUTH_JWT_SECRET is not configured" });
  }
  if (!record || !(await bcrypt.compare(password, record.password_hash))) {
    return res.status(401).json({ error: "Incorrect username or password" });
  }

  const user = readUser(record.id);
  return res.json({ token: signUser(record), user });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  const user = readUser(req.user.sub);
  if (!user) {
    return res.status(401).json({ error: "Account not found" });
  }
  return res.json({ user });
});

app.patch("/api/auth/profile", requireAuth, (req, res) => {
  const user = readUser(req.user.sub);
  if (!user) {
    return res.status(401).json({ error: "Account not found" });
  }

  const displayName = req.body?.displayName != null ? String(req.body.displayName).trim() : user.displayName;
  if (!displayName || displayName.length > 40) {
    return res.status(400).json({ error: "Display name must contain 1 to 40 characters" });
  }

  let avatarUrl = user.avatarUrl;
  if (req.body?.avatar) {
    try {
      avatarUrl = saveAvatar(req.user.sub, req.body.avatar);
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Invalid avatar" });
    }
  }

  db.prepare("UPDATE users SET display_name = ?, avatar_url = ? WHERE id = ?").run(displayName, avatarUrl, req.user.sub);
  const updated = readUser(req.user.sub);
  return res.json({ user: updated, token: signUser({ ...updated, display_name: updated.displayName }) });
});

const nestComments = (rows) => {
  const byId = new Map();
  rows.forEach((row) => {
    byId.set(row.id, {
      id: row.id,
      content: row.content,
      createdAt: row.createdAt,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
      likes: row.likes,
      liked: Boolean(row.liked),
      parentId: row.parentId,
      replies: [],
    });
  });
  const roots = [];
  rows.forEach((row) => {
    const item = byId.get(row.id);
    if (row.parentId && byId.has(row.parentId)) {
      byId.get(row.parentId).replies.push(item);
    } else {
      roots.push(item);
    }
  });
  roots.sort((a, b) => b.id - a.id);
  roots.forEach((item) => item.replies.sort((a, b) => a.id - b.id));
  return roots;
};

const getVideoSummary = (videoId, userId) => {
  const likes = db.prepare("SELECT COUNT(*) AS count FROM video_likes WHERE video_id = ?").get(videoId).count;
  const favorites = db.prepare("SELECT COUNT(*) AS count FROM video_favorites WHERE video_id = ?").get(videoId).count;
  const commentRows = db
    .prepare(
      `SELECT video_comments.id, video_comments.content, video_comments.created_at AS createdAt,
              video_comments.parent_id AS parentId,
              users.display_name AS displayName, users.avatar_url AS avatarUrl,
              (SELECT COUNT(*) FROM video_comment_likes WHERE comment_id = video_comments.id) AS likes,
              CASE WHEN ? IS NOT NULL AND EXISTS (
                SELECT 1 FROM video_comment_likes
                WHERE comment_id = video_comments.id AND user_id = ?
              ) THEN 1 ELSE 0 END AS liked
       FROM video_comments
       JOIN users ON users.id = video_comments.user_id
       WHERE video_comments.video_id = ?
       ORDER BY video_comments.id ASC
       LIMIT 300`
    )
    .all(userId || null, userId || null, videoId);
  const liked = userId
    ? Boolean(db.prepare("SELECT 1 FROM video_likes WHERE user_id = ? AND video_id = ?").get(userId, videoId))
    : false;
  const favorited = userId
    ? Boolean(db.prepare("SELECT 1 FROM video_favorites WHERE user_id = ? AND video_id = ?").get(userId, videoId))
    : false;

  const danmaku = db
    .prepare(
      `SELECT video_danmaku.id, video_danmaku.content, video_danmaku.time_sec AS timeSec,
              video_danmaku.color, video_danmaku.mode,
              video_danmaku.created_at AS createdAt, users.display_name AS displayName
       FROM video_danmaku
       JOIN users ON users.id = video_danmaku.user_id
       WHERE video_danmaku.video_id = ?
       ORDER BY video_danmaku.time_sec ASC, video_danmaku.id ASC
       LIMIT 500`
    )
    .all(videoId);

  const comments = nestComments(commentRows);
  const commentCount = commentRows.length;

  return { likes, favorites, liked, favorited, comments, commentCount, danmaku, sharePath: `/videos/${videoId}` };
};

app.get("/api/videos/:videoId", optionalAuth, (req, res) => {
  return res.json(getVideoSummary(req.params.videoId, req.user?.sub));
});

app.post("/api/videos/:videoId/like", requireAuth, (req, res) => {
  const { videoId } = req.params;
  const existing = db.prepare("SELECT 1 FROM video_likes WHERE user_id = ? AND video_id = ?").get(req.user.sub, videoId);
  if (existing) {
    db.prepare("DELETE FROM video_likes WHERE user_id = ? AND video_id = ?").run(req.user.sub, videoId);
  } else {
    db.prepare("INSERT INTO video_likes (user_id, video_id) VALUES (?, ?)").run(req.user.sub, videoId);
  }
  return res.json(getVideoSummary(videoId, req.user.sub));
});

app.post("/api/videos/:videoId/favorite", requireAuth, (req, res) => {
  const { videoId } = req.params;
  const existing = db.prepare("SELECT 1 FROM video_favorites WHERE user_id = ? AND video_id = ?").get(req.user.sub, videoId);
  if (existing) {
    db.prepare("DELETE FROM video_favorites WHERE user_id = ? AND video_id = ?").run(req.user.sub, videoId);
  } else {
    db.prepare("INSERT INTO video_favorites (user_id, video_id) VALUES (?, ?)").run(req.user.sub, videoId);
  }
  return res.json(getVideoSummary(videoId, req.user.sub));
});

app.post("/api/videos/:videoId/comments", requireAuth, (req, res) => {
  const content = String(req.body?.content || "").trim();
  const videoId = req.params.videoId;
  let parentId = req.body?.parentId ? Number(req.body.parentId) : null;
  if (!content || content.length > 500) {
    return res.status(400).json({ error: "Comment must contain 1 to 500 characters" });
  }
  if (parentId) {
    const parent = db.prepare("SELECT id, parent_id AS parentId, video_id AS videoId FROM video_comments WHERE id = ?").get(parentId);
    if (!parent || parent.videoId !== videoId) {
      return res.status(400).json({ error: "Comment to reply was not found" });
    }
    if (parent.parentId) parentId = parent.parentId;
  } else {
    parentId = null;
  }
  db.prepare("INSERT INTO video_comments (user_id, video_id, content, parent_id) VALUES (?, ?, ?, ?)").run(
    req.user.sub,
    videoId,
    content,
    parentId
  );
  return res.status(201).json(getVideoSummary(videoId, req.user.sub));
});

app.post("/api/videos/:videoId/comments/:commentId/like", requireAuth, (req, res) => {
  const commentId = Number(req.params.commentId);
  const comment = db.prepare("SELECT id FROM video_comments WHERE id = ? AND video_id = ?").get(commentId, req.params.videoId);
  if (!comment) {
    return res.status(404).json({ error: "Comment not found" });
  }
  const existing = db
    .prepare("SELECT 1 FROM video_comment_likes WHERE user_id = ? AND comment_id = ?")
    .get(req.user.sub, commentId);
  if (existing) {
    db.prepare("DELETE FROM video_comment_likes WHERE user_id = ? AND comment_id = ?").run(req.user.sub, commentId);
  } else {
    db.prepare("INSERT INTO video_comment_likes (user_id, comment_id) VALUES (?, ?)").run(req.user.sub, commentId);
  }
  return res.json(getVideoSummary(req.params.videoId, req.user.sub));
});

app.post("/api/videos/:videoId/danmaku", requireAuth, (req, res) => {
  const content = String(req.body?.content || "").trim();
  const timeSec = Number(req.body?.timeSec);
  const color = String(req.body?.color || "#ffffff").toLowerCase();
  const mode = String(req.body?.mode || "scroll");
  if (!content || content.length > 40) {
    return res.status(400).json({ error: "Danmaku must contain 1 to 40 characters" });
  }
  if (!Number.isFinite(timeSec) || timeSec < 0) {
    return res.status(400).json({ error: "Invalid danmaku timestamp" });
  }
  if (!DANMAKU_COLORS.has(color) || !DANMAKU_MODES.has(mode)) {
    return res.status(400).json({ error: "Invalid danmaku color or position" });
  }
  db.prepare(
    "INSERT INTO video_danmaku (user_id, video_id, content, time_sec, color, mode) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(req.user.sub, req.params.videoId, content, Math.round(timeSec * 10) / 10, color, mode);
  return res.status(201).json(getVideoSummary(req.params.videoId, req.user.sub));
});

const resolveChatCompletionsUrl = (baseUrl) => {
  const trimmed = String(baseUrl || "").trim().replace(/\/+$/, "");
  if (/\/chat\/completions$/i.test(trimmed)) return trimmed;
  if (/\/v1$/i.test(trimmed)) return `${trimmed}/chat/completions`;
  return `${trimmed}/v1/chat/completions`;
};

const parseAiJson = (text) => {
  const trimmed = String(text || "").trim();
  if (!trimmed) throw new Error("AI gateway returned an empty response");
  if (trimmed.startsWith("<") || /^<!doctype/i.test(trimmed)) {
    throw new Error("AI gateway returned HTML instead of JSON. Check AI_BASE_URL.");
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error("AI gateway returned a non-JSON response");
  }
};

app.post("/api/chat", requireAuth, async (req, res) => {
  try {
    const { messages = [], systemPrompt } = req.body ?? {};

    const apiKey = process.env.AI_API_KEY;
    const baseUrl = process.env.AI_BASE_URL;
    const model = process.env.AI_CHAT_MODEL;

    if (!apiKey || !baseUrl || !model) {
      return res.status(500).json({
        error: "Missing AI_API_KEY / AI_BASE_URL / AI_CHAT_MODEL",
      });
    }

    const finalMessages = [
      {
        role: "system",
        content:
          systemPrompt ||
          `Eres el asistente IA de la plataforma "¿Qué TAO?".
Responde principalmente en español.
Si la persona es principiante, usa lenguaje claro y sencillo.
Puedes explicar Tao Te Ching, traducción, filosofía taoísta y cultura chino-hispana.`,
      },
      ...messages,
    ];

    const response = await fetch(resolveChatCompletionsUrl(baseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: finalMessages,
        stream: false,
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      const parsedError = (() => {
        try {
          const payload = JSON.parse(text);
          return payload?.error?.message || payload?.error || payload?.message;
        } catch {
          return null;
        }
      })();
      return res.status(response.status).json({
        error: parsedError || text.slice(0, 300) || "AI request failed",
      });
    }

    const data = parseAiJson(text);
    const content =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      "No response from model.";

    return res.json({ content });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 把 OpenAI 兼容 base URL 解析到具体子路径 (audio/speech 等)
const resolveOpenAiEndpoint = (baseUrl, path) => {
  let t = String(baseUrl || "").trim().replace(/\/+$/, "");
  t = t.replace(/\/chat\/completions$/i, "");
  if (/\/v1$/i.test(t)) return `${t}/${path}`;
  return `${t}/v1/${path}`;
};

// ---------------------------------------------------------------------------
// 语音合成 TTS
//  1) 若配置 DASHSCOPE_API_KEY -> 阿里云百炼 CosyVoice (返回音频 URL)
//  2) 否则若配置 AI_TTS_MODEL   -> 复用现有 OpenAI 兼容网关 /v1/audio/speech
//  3) 都没有 -> 503, 前端退回浏览器语音
// 统一返回 { audioUrl }, 前端直接播放
// ---------------------------------------------------------------------------
app.post("/api/tts", requireAuth, async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    if (!text) return res.status(400).json({ error: "Falta el texto a leer" });
    if (text.length > 2000) {
      return res.status(400).json({ error: "El texto supera el límite de 2000 caracteres" });
    }

    const lang = String(req.body?.lang || "zh").toLowerCase(); // "zh" | "es"
    const rawRate = Number(req.body?.rate);
    const rate = Number.isFinite(rawRate) ? Math.min(2, Math.max(0.5, rawRate)) : 1.0;

    const dashKey = process.env.DASHSCOPE_API_KEY;

    // ---- 提供方 1: 阿里云百炼 CosyVoice ----
    if (dashKey) {
      const ttsUrl =
        process.env.DASHSCOPE_TTS_URL ||
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";
      const model = process.env.DASHSCOPE_TTS_MODEL || "cosyvoice-v3-flash";
      const defaultVoice = process.env.DASHSCOPE_TTS_VOICE || "longxiaochun";
      const voice =
        String(req.body?.voice || "").trim() ||
        (lang === "es"
          ? process.env.DASHSCOPE_TTS_VOICE_ES || defaultVoice
          : process.env.DASHSCOPE_TTS_VOICE_ZH || defaultVoice);

      const response = await fetch(ttsUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${dashKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, input: { text, voice, format: "mp3", rate } }),
      });
      const raw = await response.text();
      let data = null;
      try {
        data = JSON.parse(raw);
      } catch {
        return res.status(502).json({ error: "TTS gateway devolvió una respuesta no JSON" });
      }
      if (!response.ok) {
        return res.status(response.status).json({
          error: data?.message || data?.code || "Fallo en la síntesis de voz",
        });
      }
      const audioUrl = data?.output?.audio?.url;
      if (!audioUrl) {
        return res.status(502).json({ error: "TTS no devolvió URL de audio" });
      }
      return res.json({ audioUrl, expiresAt: data?.output?.audio?.expires_at });
    }

    // ---- 提供方 2: 现有 OpenAI 兼容网关 /v1/audio/speech ----
    const ttsModel = process.env.AI_TTS_MODEL;
    const baseUrl = process.env.AI_BASE_URL;
    const apiKey = process.env.AI_API_KEY;
    if (ttsModel && baseUrl && apiKey) {
      const voice = String(req.body?.voice || "").trim() || process.env.AI_TTS_VOICE || "alloy";
      const response = await fetch(resolveOpenAiEndpoint(baseUrl, "audio/speech"), {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ttsModel,
          input: text,
          voice,
          response_format: "mp3",
          speed: rate,
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        let msg = errText.slice(0, 300);
        try {
          const j = JSON.parse(errText);
          msg = j?.error?.message || j?.message || msg;
        } catch {
          /* keep raw */
        }
        return res.status(response.status).json({ error: msg || "Fallo en la síntesis de voz" });
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      const dataUrl = `data:audio/mpeg;base64,${buffer.toString("base64")}`;
      return res.json({ audioUrl: dataUrl });
    }

    return res.status(503).json({
      error: "TTS no configurado (define DASHSCOPE_API_KEY o AI_TTS_MODEL)",
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Error desconocido en TTS",
    });
  }
});

// ---------------------------------------------------------------------------
// 图片理解 (Qwen-VL 或现有多模态网关, 都走 OpenAI 兼容 chat/completions)
//  1) 若配置 DASHSCOPE_API_KEY -> 百炼 qwen-vl-plus
//  2) 否则复用现有 AI_API_KEY/AI_BASE_URL + (AI_VISION_MODEL || AI_CHAT_MODEL)
// body: { image: dataURL|http, prompt?, lang? }
// ---------------------------------------------------------------------------
app.post("/api/vision", requireAuth, async (req, res) => {
  try {
    const image = String(req.body?.image || "").trim();
    if (!image || !/^(data:image\/|https?:\/\/)/i.test(image)) {
      return res.status(400).json({ error: "Imagen inválida (usa data URL o http/https)" });
    }

    const lang = String(req.body?.lang || "es").toLowerCase();
    const prompt =
      String(req.body?.prompt || "").trim() ||
      (lang === "zh"
        ? "请用中文描述并解读这张图片的内容，如果与《道德经》、书法、山水或中国文化相关请特别说明。"
        : "Describe e interpreta esta imagen en español. Si se relaciona con el Tao Te Ching, la caligrafía, el paisajismo o la cultura china, explícalo.");

    const dashKey = process.env.DASHSCOPE_API_KEY;
    let visionUrl;
    let apiKey;
    let model;
    if (dashKey) {
      visionUrl =
        process.env.DASHSCOPE_VISION_URL ||
        "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
      apiKey = dashKey;
      model = process.env.DASHSCOPE_VISION_MODEL || "qwen-vl-plus";
    } else {
      apiKey = process.env.AI_API_KEY;
      const baseUrl = process.env.AI_BASE_URL;
      model = process.env.AI_VISION_MODEL || process.env.AI_CHAT_MODEL;
      if (!apiKey || !baseUrl || !model) {
        return res.status(503).json({
          error: "Visión no configurada (define DASHSCOPE_API_KEY o AI_VISION_MODEL)",
        });
      }
      visionUrl = resolveChatCompletionsUrl(baseUrl);
    }

    const response = await fetch(visionUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: image } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    const raw = await response.text();
    let data = null;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: "Vision gateway devolvió una respuesta no JSON" });
    }
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || data?.message || "Fallo al analizar la imagen",
      });
    }

    const content = data?.choices?.[0]?.message?.content;
    const text = Array.isArray(content)
      ? content.map((c) => (typeof c === "string" ? c : c?.text || "")).join("")
      : content;

    if (!text) return res.status(502).json({ error: "El modelo no devolvió descripción" });
    return res.json({ content: text });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Error desconocido en visión",
    });
  }
});

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});