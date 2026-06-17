import { NextRequest, NextResponse } from "next/server";
import { LANGUAGES } from "@/constants";

function languageName(code: string): string {
  return LANGUAGES.find(l => l.code === code)?.label ?? "English";
}

// ─── Basic per-IP rate limiting ──────────────────────────────────────────────
// In-memory only — resets on redeploy/cold start and isn't shared across
// serverless instances, but stops a single client from hammering the free
// AI providers and burning through quota.
const RATE_LIMIT = 20; // requests
const RATE_WINDOW_MS = 10 * 60 * 1000; // per 10 minutes
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) ?? []).filter(t => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) {
    requestLog.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return false;
}

function getClientIp(req: NextRequest): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

const PROMPTS: Record<string, (content: string, title: string, language: string) => string> = {
  improve: (content, title, language) =>
    `You are a writing editor. Improve the following story to make it more engaging, emotionally resonant, and well-structured. Keep the author's voice. Do not add fictional elements. The story is written in ${languageName(language)} — write your entire response in ${languageName(language)} only, do not translate it to any other language. Story title: "${title}"\n\nStory:\n${content}\n\nReturn only the improved story text, in ${languageName(language)}.`,

  excerpt: (content, title, language) =>
    `Write a compelling 1-2 sentence excerpt/teaser for this story that would make someone want to read it. The story is written in ${languageName(language)} — write the excerpt in ${languageName(language)} only. Story title: "${title}"\n\nStory:\n${content.slice(0, 1000)}\n\nReturn only the excerpt, in ${languageName(language)}.`,

  grammar: (content, _title, language) =>
    `Fix all grammar, spelling, and punctuation errors in the following text. The text is written in ${languageName(language)} — keep it in ${languageName(language)}, do not translate it. Keep the meaning and voice exactly the same. Return only the corrected text.\n\n${content}`,

  translate: (content, title, language) =>
    language === "en"
      ? `Translate the following story from English to Hindi. Keep the emotional tone and meaning intact. Story title: "${title}"\n\nStory:\n${content}\n\nReturn only the translated text.`
      : `Translate the following story from ${languageName(language)} to English. Keep the emotional tone and meaning intact. Story title: "${title}"\n\nStory:\n${content}\n\nReturn only the translated text.`,

  continue: (content, title, language) =>
    `You are a creative writing assistant. Continue the following story naturally for about 100-150 words, matching the author's tone, voice and style. Do not repeat or summarize what's already written. The story is written in ${languageName(language)} — continue writing in ${languageName(language)} only. Story title: "${title}"\n\nStory so far:\n${content}\n\nReturn only the continuation text.`,

  localize: (content, _title, language) =>
    `Translate the following short writing prompt into ${languageName(language)}. Keep it natural, concise, and in the same tone. Return only the translation, with no quotes or extra commentary.\n\n${content}`,

  translate_live: (content, _title, language) =>
    `Translate the following English text into natural, everyday ${languageName(language)}, written in ${languageName(language)}'s native script. Preserve the tone and punctuation. Proper nouns can stay as-is. Return only the translation — no quotes, no notes, no romanization.\n\n${content}`,
};

// ─── Free AI providers, tried in order. Each returns null if not configured ──
// (no API key set), so missing keys are silently skipped rather than erroring.

async function callGroq(prompt: string): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? null;
}

async function callOpenRouter(prompt: string): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter error ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? null;
}

async function callGemini(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

const PROVIDERS = [
  { name: "Groq", call: callGroq },
  { name: "OpenRouter", call: callOpenRouter },
  { name: "Gemini", call: callGemini },
];

async function generate(prompt: string): Promise<{ result?: string; error?: string; status?: number }> {
  let configured = false;
  let lastError = "";

  for (const provider of PROVIDERS) {
    let result: string | null;
    try {
      result = await provider.call(prompt);
    } catch (err) {
      configured = true;
      lastError = err instanceof Error ? err.message : String(err);
      continue;
    }
    if (result === null) continue; // provider not configured — skip silently
    configured = true;
    if (result.trim()) return { result: result.trim() };
  }

  if (!configured) {
    return {
      error:
        "AI not configured. Add a free API key for at least one provider to .env.local: " +
        "GROQ_API_KEY (console.groq.com), OPENROUTER_API_KEY (openrouter.ai/keys), " +
        "or GEMINI_API_KEY (aistudio.google.com).",
      status: 503,
    };
  }

  return { error: `All configured AI providers failed. ${lastError}`, status: 502 };
}

export async function POST(req: NextRequest) {
  if (isRateLimited(getClientIp(req))) {
    return NextResponse.json({ error: "Too many requests. Please wait a bit and try again." }, { status: 429 });
  }

  let body: { action: string; content: string; title: string; excerpt?: string; language: string; targetLanguage?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { action, content, title = "", excerpt = "", language = "en", targetLanguage } = body;
  if (!content?.trim()) {
    return NextResponse.json({ error: "Invalid action or empty content" }, { status: 400 });
  }

  if (action === "translate_to") {
    if (!targetLanguage) {
      return NextResponse.json({ error: "Missing targetLanguage" }, { status: 400 });
    }
    const prompt =
      `Translate the following story from ${languageName(language)} to ${languageName(targetLanguage)}. ` +
      `Keep the emotional tone, meaning, and paragraph breaks intact.\n\n` +
      `Title: ${title}\n\nExcerpt: ${excerpt}\n\nStory:\n${content.slice(0, 6000)}\n\n` +
      `Respond with ONLY valid JSON in this exact shape, with all fields translated into ${languageName(targetLanguage)} ` +
      `(no markdown code fences, no extra commentary): {"title": "...", "excerpt": "...", "content": "..."}`;

    let configured = false;
    for (const provider of PROVIDERS) {
      let raw: string | null;
      try {
        raw = await provider.call(prompt);
      } catch {
        configured = true;
        continue;
      }
      if (raw === null) continue;
      configured = true;
      try {
        const cleaned = raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
        const parsed = JSON.parse(cleaned);
        if (typeof parsed.title !== "string" || typeof parsed.content !== "string") throw new Error("bad shape");
        if (typeof parsed.excerpt !== "string") parsed.excerpt = "";
        return NextResponse.json({ result: parsed });
      } catch {
        // This provider returned bad JSON — try the next one
        continue;
      }
    }
    if (!configured) return NextResponse.json({ error: "AI not configured." }, { status: 503 });
    return NextResponse.json({ error: "All providers failed to return valid JSON for this translation." }, { status: 502 });
  }

  const promptFn = PROMPTS[action];
  if (!promptFn) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const prompt = promptFn(content.slice(0, 4000), title, language);
  const gen = await generate(prompt);
  if (gen.error) return NextResponse.json({ error: gen.error }, { status: gen.status });
  return NextResponse.json({ result: gen.result });
}
