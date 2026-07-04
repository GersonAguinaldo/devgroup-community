// Suggère des tags pertinents pour une publication via Lovable AI Gateway
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

  let payload: { title?: string; body?: string; availableTags?: string[] } = {};
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const title = (payload.title || "").trim().slice(0, 300);
  const content = (payload.body || "").trim().slice(0, 4000);
  const available = Array.isArray(payload.availableTags)
    ? payload.availableTags.filter((t) => typeof t === "string").slice(0, 500)
    : [];

  if (title.length < 3 && content.length < 10) {
    return new Response(JSON.stringify({ tags: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const systemPrompt = `Tu proposes 3 à 5 tags courts (1-2 mots, en minuscules, sans espace, tirets autorisés) pour classer une publication technique.
Priorise les tags existants fournis quand ils collent au contenu. Ajoute des nouveaux tags uniquement si aucun existant ne convient.
Réponds STRICTEMENT en JSON : {"tags": ["tag1","tag2",...]}. Sans commentaire, sans emoji.`;

  const userPrompt = `TITRE :\n${title || "(vide)"}\n\nCORPS :\n${content || "(vide)"}\n\nTAGS EXISTANTS (à privilégier) :\n${available.slice(0, 200).join(", ") || "(aucun)"}`;

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
      return new Response(JSON.stringify({ error: "Rate limit atteint." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (upstream.status === 402) {
      return new Response(JSON.stringify({ error: "Crédits AI épuisés." }), {
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
      parsed = {};
    }
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags
          .map((t: any) =>
            String(t)
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9-]/g, "-")
              .replace(/-+/g, "-")
              .replace(/^-|-$/g, ""),
          )
          .filter((t: string) => t && t.length <= 30)
          .slice(0, 5)
      : [];
    return new Response(JSON.stringify({ tags }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
