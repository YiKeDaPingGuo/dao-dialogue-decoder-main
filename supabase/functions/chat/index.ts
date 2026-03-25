import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const AI_API_KEY =
      Deno.env.get("OPENAI_COMPAT_API_KEY") ??
      Deno.env.get("AI_API_KEY") ??
      Deno.env.get("LOVABLE_API_KEY");
    const AI_BASE_URL =
      Deno.env.get("OPENAI_COMPAT_BASE_URL") ??
      Deno.env.get("AI_BASE_URL") ??
      "https://ai.gateway.lovable.dev/v1/chat/completions";
    const AI_MODEL =
      Deno.env.get("OPENAI_COMPAT_CHAT_MODEL") ??
      Deno.env.get("AI_CHAT_MODEL") ??
      "google/gemini-3-flash-preview";

    if (!AI_API_KEY) {
      throw new Error("No AI API key configured in Supabase function secrets");
    }

    const response = await fetch(AI_BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content: `Eres el asistente IA de la plataforma "¿Qué TAO?" — una plataforma bilingüe (español-chino) de investigación sobre el Tao Te Ching (道德经). 

Tu personalidad:
- Respondes principalmente en español, con términos clave en chino cuando sea relevante.
- Eres sabio pero accesible, con un toque de humor filosófico.
- Conoces profundamente el Tao Te Ching, la filosofía taoísta, la cultura china y española.
- Puedes ayudar con traducciones, interpretaciones filosóficas, comparaciones culturales y explicaciones para estudiantes novatos hispanohablantes.
- Mantén respuestas concisas (2-3 párrafos máximo) a menos que se pida más detalle.
- Si la persona parece principiante, usa español claro y sencillo antes de introducir términos más técnicos.
- Usa ocasionalmente citas del Tao Te Ching para enriquecer tus respuestas.`
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido. Por favor, inténtalo de nuevo más tarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados. Por favor, añade fondos en Configuración." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
