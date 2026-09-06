import { authHeaders, getAuthToken } from "@/lib/auth";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const httpsFallbackApiUrl = "https://47.100.116.121/api/chat";
const httpFallbackApiUrl = "http://47.100.116.121/api/chat";

export const GUEST_CHAT_REPLY = `Este es un mensaje de demostración: el asistente real solo está disponible después de registrarte e iniciar sesión.

这是一条演示回复：请先注册并登录后，才能使用真实的 AI 问答。`;

const requestChat = async (
  url: string,
  messages: ChatMessage[],
  systemPrompt: string,
) => {
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ messages, systemPrompt }),
  });
  const responseText = await response.text();
  let data: { content?: string; error?: string } | null = null;

  try {
    data = JSON.parse(responseText);
  } catch {
    if (!response.ok) throw new Error(`API 请求失败（HTTP ${response.status}）`);
    throw new Error("聊天接口没有返回 JSON，请确认 /api/chat 已正确代理到后端");
  }

  if (!response.ok) throw new Error(data?.error || `API 请求失败（HTTP ${response.status}）`);
  if (!data?.content) throw new Error("AI 没有返回有效内容");
  return data.content;
};

export const sendChat = async (messages: ChatMessage[], systemPrompt: string) => {
  if (!getAuthToken()) {
    await new Promise((resolve) => window.setTimeout(resolve, 400));
    return GUEST_CHAT_REPLY;
  }

  try {
    return await requestChat("/api/chat", messages, systemPrompt);
  } catch (error) {
    const host = window.location.hostname;
    if (host === "47.100.116.121" || host.endsWith("nkuquetao.asia")) throw error;
    try {
      return await requestChat(httpsFallbackApiUrl, messages, systemPrompt);
    } catch {
      return await requestChat(httpFallbackApiUrl, messages, systemPrompt);
    }
  }
};
