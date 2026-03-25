import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:8080", "http://localhost:5173"],
  })
);

app.use(express.json());

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

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Chat API running at http://localhost:${port}`);
});