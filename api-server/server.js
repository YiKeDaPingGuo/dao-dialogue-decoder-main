import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const databasePath = resolve(process.env.SQLITE_PATH || "./data/nankaiquetao.db");
const jwtSecret = process.env.AUTH_JWT_SECRET;

mkdirSync(dirname(databasePath), { recursive: true });
const db = new Database(databasePath);
db.pragma("journal_mode = WAL");
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
`);

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = (process.env.CORS_ORIGINS ||
        "http://localhost:8080,http://localhost:5173,http://47.100.116.121,http://nkuquetao.asia,http://www.nkuquetao.asia")
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

app.use(express.json());

const signUser = (user) =>
  jwt.sign(
    { sub: user.id, email: user.email, displayName: user.display_name },
    jwtSecret,
    { expiresIn: "7d" }
  );

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
    .prepare("SELECT id, email, display_name AS displayName, created_at AS createdAt FROM users WHERE id = ?")
    .get(id);

app.post("/api/auth/register", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const displayName = String(req.body?.displayName || email.split("@")[0] || "").trim();

  if (!jwtSecret) {
    return res.status(500).json({ error: "AUTH_JWT_SECRET is not configured" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address" });
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
      .prepare("INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)")
      .run(email, passwordHash, displayName);
    const user = readUser(result.lastInsertRowid);
    return res.status(201).json({ token: signUser({ ...user, display_name: user.displayName }), user });
  } catch (error) {
    if (String(error).includes("UNIQUE constraint failed")) {
      return res.status(409).json({ error: "An account already exists for this email" });
    }
    return res.status(500).json({ error: "Unable to create account" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const record = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!jwtSecret) {
    return res.status(500).json({ error: "AUTH_JWT_SECRET is not configured" });
  }
  if (!record || !(await bcrypt.compare(password, record.password_hash))) {
    return res.status(401).json({ error: "Incorrect email or password" });
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

const getVideoSummary = (videoId, userId) => {
  const likes = db.prepare("SELECT COUNT(*) AS count FROM video_likes WHERE video_id = ?").get(videoId).count;
  const favorites = db.prepare("SELECT COUNT(*) AS count FROM video_favorites WHERE video_id = ?").get(videoId).count;
  const comments = db
    .prepare(
      `SELECT video_comments.id, video_comments.content, video_comments.created_at AS createdAt,
              users.display_name AS displayName
       FROM video_comments
       JOIN users ON users.id = video_comments.user_id
       WHERE video_comments.video_id = ?
       ORDER BY video_comments.id DESC
       LIMIT 100`
    )
    .all(videoId);
  const liked = userId
    ? Boolean(db.prepare("SELECT 1 FROM video_likes WHERE user_id = ? AND video_id = ?").get(userId, videoId))
    : false;
  const favorited = userId
    ? Boolean(db.prepare("SELECT 1 FROM video_favorites WHERE user_id = ? AND video_id = ?").get(userId, videoId))
    : false;

  return { likes, favorites, liked, favorited, comments };
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
  if (!content || content.length > 500) {
    return res.status(400).json({ error: "Comment must contain 1 to 500 characters" });
  }
  db.prepare("INSERT INTO video_comments (user_id, video_id, content) VALUES (?, ?, ?)").run(
    req.user.sub,
    req.params.videoId,
    content
  );
  return res.status(201).json(getVideoSummary(req.params.videoId, req.user.sub));
});

app.post("/api/chat", async (req, res) => {
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

    const response = await fetch(baseUrl, {
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

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: text || "AI request failed",
      });
    }

    const data = await response.json();
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

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});