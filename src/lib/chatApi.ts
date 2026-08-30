export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const fallbackApiUrl = "http://47.100.116.121/api/chat";

const requestChat = async (
  url: string,
  messages: ChatMessage[],
  systemPrompt: string,
) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, systemPrompt }),
  });
  const responseText = await response.text();
  let data: { content?: string; error?: string } | null = null;

  try {
    data = JSON.parse(responseText);
  } catch {
    if (!response.ok) throw new Error(`API 请求失败（HTTP ${response.status}）`);
    throw new Error("API 返回了无法识别的内容");
  }

  if (!response.ok) throw new Error(data?.error || `API 请求失败（HTTP ${response.status}）`);
  if (!data?.content) throw new Error("AI 没有返回有效内容");
  return data.content;
};

export const sendChat = async (messages: ChatMessage[], systemPrompt: string) => {
  try {
    return await requestChat("/api/chat", messages, systemPrompt);
  } catch (error) {
    const isAlreadyOnServerIp = window.location.hostname === "47.100.116.121";
    const isSecurePage = window.location.protocol === "https:";
    if (isAlreadyOnServerIp || isSecurePage) throw error;
    return requestChat(fallbackApiUrl, messages, systemPrompt);
  }
};
