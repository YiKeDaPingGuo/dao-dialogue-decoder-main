import { authHeaders, getAuthToken } from "@/lib/auth";

export type VisionLang = "zh" | "es";

/** 把用户选择的图片压缩为较小的 JPEG dataURL, 避免请求体过大 */
export function fileToDataUrl(file: File, maxSize = 1280, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Imagen no válida"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/** 调用后端 /api/vision (百炼 Qwen-VL) 解析图片, 返回文本描述 */
export async function analyzeImage(
  image: string,
  opts?: { prompt?: string; lang?: VisionLang },
): Promise<string> {
  if (!getAuthToken()) {
    throw new Error("El análisis de imágenes requiere iniciar sesión / 图片解析需要先登录");
  }
  const res = await fetch("/api/vision", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ image, prompt: opts?.prompt, lang: opts?.lang ?? "es" }),
  });
  const text = await res.text();
  let data: { content?: string; error?: string } | null = null;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Fallo al analizar la imagen (HTTP ${res.status})`);
  }
  if (!res.ok) throw new Error(data?.error || `Fallo al analizar la imagen (HTTP ${res.status})`);
  if (!data?.content) throw new Error("El modelo no devolvió descripción");
  return data.content;
}
