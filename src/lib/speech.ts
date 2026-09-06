import { useCallback, useEffect, useState } from "react";
import { authHeaders, getAuthToken } from "@/lib/auth";

export type SpeakLang = "zh" | "es";
export type SpeakOpts = { lang?: SpeakLang; rate?: number };

/** 根据文本中的中文/拉丁字符占比粗略判断朗读语言 */
export function detectLang(text: string): SpeakLang {
  const s = String(text || "");
  const cjk = (s.match(/[\u4e00-\u9fff]/g) || []).length;
  const latin = (s.match(/[a-zA-ZÁÉÍÓÚáéíóúÑñÜü]/g) || []).length;
  return cjk > latin ? "zh" : "es";
}

// 一次只播放一个音频; 切换/停止时用 token 打断进行中的序列朗读
let currentAudio: HTMLAudioElement | null = null;
let currentToken = 0;
// 当前播放 Promise 的 resolve, 停止时立即结束, 避免上层状态卡住
let finishCurrent: (() => void) | null = null;
let speakTimer: ReturnType<typeof setTimeout> | null = null;

// 会话内缓存: 同一段文本+语速+语言不重复请求百炼 (省钱)
const audioUrlCache = new Map<string, string>();

const cacheKey = (text: string, lang: SpeakLang, rate: number) => `${lang}|${rate}|${text}`;

/** 预热语音列表 (Chrome/Edge 首次 getVoices() 常为空, 需等 voiceschanged) */
function warmUpVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  const load = () => synth.getVoices();
  load();
  if (typeof synth.addEventListener === "function") {
    synth.addEventListener("voiceschanged", load, { once: true });
  } else {
    synth.onvoiceschanged = load;
  }
}
if (typeof window !== "undefined") warmUpVoices();

function pickVoice(lang: SpeakLang): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const wanted = lang === "es" ? ["es-es", "es-mx", "es-us", "es"] : ["zh-cn", "zh-tw", "zh-hk", "zh"];
  for (const code of wanted) {
    const exact = voices.find((v) => v.lang?.toLowerCase().replace("_", "-") === code);
    if (exact) return exact;
  }
  const prefix = lang === "es" ? "es" : "zh";
  return voices.find((v) => v.lang?.toLowerCase().startsWith(prefix)) ?? null;
}

/** 停止当前所有朗读 (百炼音频 + 浏览器语音) */
export function stopSpeaking() {
  currentToken += 1;
  if (speakTimer) {
    clearTimeout(speakTimer);
    speakTimer = null;
  }
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.src = "";
    } catch {
      /* noop */
    }
    currentAudio = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (finishCurrent) {
    const done = finishCurrent;
    finishCurrent = null;
    done();
  }
}

// 目前只使用浏览器内置语音合成; 需要百炼/网关 TTS 时再改为 true
const USE_BACKEND_TTS = false;

/** 向后端请求百炼 CosyVoice 合成, 返回音频 URL; 失败或未登录返回 null (走浏览器兜底) */
async function fetchDashscopeAudio(
  text: string,
  lang: SpeakLang,
  rate: number,
): Promise<string | null> {
  if (!USE_BACKEND_TTS) return null; // 只用浏览器语音
  if (!getAuthToken()) return null; // 游客直接用浏览器语音
  const key = cacheKey(text, lang, rate);
  const cached = audioUrlCache.get(key);
  if (cached) return cached;
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ text, lang, rate }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { audioUrl?: string };
    if (data?.audioUrl) {
      audioUrlCache.set(key, data.audioUrl);
      return data.audioUrl;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 浏览器内置语音合成。
 * Chrome/Edge 有两个常见坑:
 * 1) cancel() 后立刻 speak() 会被静默丢掉 → 稍等再 speak
 * 2) 首次 getVoices() 为空 → 等 voiceschanged / 仍按 lang 朗读
 */
function browserSpeak(text: string, lang: SpeakLang, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      console.warn("[speech] 当前浏览器不支持 speechSynthesis");
      resolve();
      return;
    }

    const synth = window.speechSynthesis;
    // Chrome: cancel 后立刻 speak 常无效, 留一点空隙
    speakTimer = setTimeout(() => {
      speakTimer = null;
      if (!window.speechSynthesis) {
        resolve();
        return;
      }

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang === "es" ? "es-ES" : "zh-CN";
      // 部分引擎对过低 rate 不稳定, 夹到安全区间
      utter.rate = Math.min(1.8, Math.max(0.6, rate));
      const voice = pickVoice(lang);
      if (voice) utter.voice = voice;

      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      utter.onend = done;
      utter.onerror = (e) => {
        console.warn("[speech] utterance error", e.error);
        done();
      };

      try {
        // Chrome 偶发 paused 状态导致无声: 先 resume
        if (synth.paused) synth.resume();
        synth.speak(utter);
        // 超长文本时 Chrome 可能卡住 paused; 定时 resume 一下
        const keepAlive = window.setInterval(() => {
          if (settled) {
            window.clearInterval(keepAlive);
            return;
          }
          if (synth.speaking && synth.paused) synth.resume();
          if (!synth.speaking && !synth.pending) {
            window.clearInterval(keepAlive);
            done();
          }
        }, 250);
      } catch (err) {
        console.warn("[speech] speak failed", err);
        done();
      }
    }, 80);
  });
}

/** 内部: 播放一段文本 (不预先停止, 供序列朗读复用) */
function playText(text: string, lang: SpeakLang, rate: number, token: number): Promise<void> {
  return fetchDashscopeAudio(text, lang, rate).then((url) => {
    if (token !== currentToken) return; // 已被打断
    if (!url) {
      return new Promise<void>((resolve) => {
        finishCurrent = resolve;
        browserSpeak(text, lang, rate).then(() => {
          if (finishCurrent === resolve) finishCurrent = null;
          resolve();
        });
      });
    }
    return new Promise<void>((resolve) => {
      const audio = new Audio(url);
      currentAudio = audio;
      finishCurrent = resolve;
      const done = () => {
        if (currentAudio === audio) currentAudio = null;
        if (finishCurrent === resolve) finishCurrent = null;
        resolve();
      };
      audio.onended = done;
      audio.onerror = () => {
        if (currentAudio === audio) currentAudio = null;
        // 播放失败再退回浏览器语音
        browserSpeak(text, lang, rate).then(done);
      };
      audio.play().catch(() => {
        if (currentAudio === audio) currentAudio = null;
        browserSpeak(text, lang, rate).then(done);
      });
    });
  });
}

/** 朗读一段文本 */
export async function speak(text: string, opts?: SpeakOpts): Promise<void> {
  const clean = String(text || "").trim();
  if (!clean) return;
  stopSpeaking();
  const token = currentToken;
  await playText(clean, opts?.lang ?? "zh", opts?.rate ?? 1, token);
}

/** 顺序朗读多段 (如: 先中文原句, 再西语译句) */
export async function speakSequence(
  items: Array<{ text: string; lang: SpeakLang }>,
  rate = 1,
): Promise<void> {
  stopSpeaking();
  const token = currentToken;
  for (const item of items) {
    if (token !== currentToken) break;
    const clean = String(item.text || "").trim();
    if (!clean) continue;
    await playText(clean, item.lang, rate, token);
  }
}

/**
 * React Hook: 追踪当前正在朗读的元素 id, 支持点击同一按钮切换停止。
 * play / playSequence 均为幂等切换。
 */
export function useSpeaker() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const stop = useCallback(() => {
    stopSpeaking();
    setSpeakingId(null);
  }, []);

  const play = useCallback(
    async (id: string, text: string, opts?: SpeakOpts) => {
      if (speakingId === id) {
        stop();
        return;
      }
      // 不要在这里 stopSpeaking: speak() 内部会停; 避免双重 cancel 加剧 Chrome 静默失败
      setSpeakingId(id);
      try {
        await speak(text, opts);
      } finally {
        setSpeakingId((cur) => (cur === id ? null : cur));
      }
    },
    [speakingId, stop],
  );

  const playSequence = useCallback(
    async (id: string, items: Array<{ text: string; lang: SpeakLang }>, rate = 1) => {
      if (speakingId === id) {
        stop();
        return;
      }
      setSpeakingId(id);
      try {
        await speakSequence(items, rate);
      } finally {
        setSpeakingId((cur) => (cur === id ? null : cur));
      }
    },
    [speakingId, stop],
  );

  // 组件挂载时预热语音; 卸载时停止
  useEffect(() => {
    warmUpVoices();
    return () => stopSpeaking();
  }, []);

  return { speakingId, play, playSequence, stop };
}
