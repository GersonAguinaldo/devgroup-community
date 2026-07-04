// Améliore un brouillon de question via Lovable AI Gateway
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MODEL = "google/gemini-2.5-flash";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { title?: string; body?: string; postType?: string } = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const title = (body.title || "").trim().slice(0, 300);
  const content = (body.body || "").trim().slice(0, 8000);
  const postType = body.postType || "question";

  if (title.length < 3 && content.length < 10) {
    return new Response(JSON.stringify({ error: "Contenu trop court" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const systemPrompt = `Tu es un assistant qui aide des développeurs à améliorer la clarté de leurs publications avant de les partager avec la communauté DevGroup.
Tu réponds STRICTEMENT en JSON valide, sans commentaire.
Format attendu :
{
  "improvedTitle": "titre reformulé, plus clair, en français, max 120 caractères",
  "improvedBody": "corps réécrit en markdown propre, structuré, avec blocs \`\`\` pour le code, en français",
  "suggestions": ["conseil court", "conseil court", ...]
}
Règles :
- Reformule le titre pour être précis et informatif.
- Réécris le corps en gardant l'intention, sans inventer d'information.
- Signale via "suggestions" les manques (version, message d'erreur, ce qui a été essayé, contexte, code non formaté) — max 5 items.
- Toujours en français, sans emoji.`;

  const userPrompt = `Type de publication : ${postType}\n\nTITRE :\n${title || "(vide)"}\n\nCORPS :\n${content || "(vide)"}`;

  try {
    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (upstream.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit atteint. Réessayez dans un instant." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (upstream.status === 402) {
      return new Response(JSON.stringify({ error: "Crédits AI épuisés. Contactez un administrateur." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!upstream.ok) {
      const t = await upstream.text();
      return new Response(JSON.stringify({ error: "Gateway error", details: t }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await upstream.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { improvedTitle: title, improvedBody: content, suggestions: [] };
    }
    return new Response(
      JSON.stringify({
        improvedTitle: (parsed.improvedTitle || title).toString().slice(0, 300),
        improvedBody: (parsed.improvedBody || content).toString().slice(0, 10000),
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 5).map(String) : [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
