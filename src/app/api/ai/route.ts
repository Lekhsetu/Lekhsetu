import { NextRequest, NextResponse } from "next/server";
import { LANGUAGES } from "@/constants";

function languageName(code: string): string {
  return LANGUAGES.find(l => l.code === code)?.label ?? "English";
}

// Walk the raw string character by character and escape any literal control
// characters that appear inside JSON string values. LLMs sometimes output raw
// newlines/tabs inside strings instead of the \n/\t escape sequences.
function sanitizeJsonControlChars(raw: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (escaped) { out += c; escaped = false; continue; }
    if (c === "\\" && inString) { out += c; escaped = true; continue; }
    if (c === '"') { inString = !inString; out += c; continue; }
    if (inString) {
      if (c === "\n") { out += "\\n"; continue; }
      if (c === "\r") { out += "\\r"; continue; }
      if (c === "\t") { out += "\\t"; continue; }
      if (c.charCodeAt(0) < 32) continue; // drop other control chars
    }
    out += c;
  }
  // Some models output \uXXX (3-digit) instead of the required \uXXXX (4-digit).
  // Pad the hex part to 4 digits so JSON.parse doesn't throw.
  return out.replace(/\\u([0-9a-fA-F]{1,3})(?![0-9a-fA-F])/g, (_, h) => `\\u${h.padStart(4, "0")}`);
}

// ─── Basic per-IP rate limiting ──────────────────────────────────────────────
// In-memory only — resets on redeploy/cold start and isn't shared across
// serverless instances, but stops a single client from hammering the free
// AI providers and burning through quota.
const RATE_LIMIT = 60; // requests — raised to accommodate multi-language publish batches
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

// Fast 8B model for read-time translation — low latency, good quality for Indian languages.
async function callGroqFast(prompt: string): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a translation engine. Output only valid JSON. No explanation, no markdown." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 3000,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("GroqFast error", res.status, text);
    throw new Error(`GroqFast ${res.status}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? null;
}

// Cerebras — dedicated AI silicon, very fast 70B inference, OpenAI-compatible API.
async function callCerebras(prompt: string): Promise<string | null> {
  const key = process.env.CEREBRAS_API_KEY;
  if (!key) return null;

  const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama3.1-8b",
      messages: [
        { role: "system", content: "You are a translation engine. Output only valid JSON. No explanation, no markdown." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Cerebras error", res.status, text);
    throw new Error(`Cerebras ${res.status}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? null;
}

// Sarvam AI language codes — maps our 2-letter codes to Sarvam's BCP-47 format.
const SARVAM_LANG: Record<string, string> = {
  hi: "hi-IN", mr: "mr-IN", ta: "ta-IN", te: "te-IN",
  kn: "kn-IN", ml: "ml-IN", gu: "gu-IN", bn: "bn-IN",
  pa: "pa-IN", or: "or-IN", en: "en-IN",
};

// Translates a single text segment via Sarvam Mayura. Returns null if not configured
// or if the language pair isn't supported. Chunks long content automatically.
async function sarvamTranslateSegment(text: string, src: string, tgt: string): Promise<string | null> {
  const key = process.env.SARVAM_API_KEY;
  if (!key) return null;
  const srcCode = SARVAM_LANG[src];
  const tgtCode = SARVAM_LANG[tgt];
  if (!srcCode || !tgtCode) return null; // unsupported language pair

  // Sarvam handles up to ~1000 chars reliably — split on paragraph boundaries.
  const CHUNK = 900;
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > CHUNK) {
    const breakAt = remaining.lastIndexOf("\n\n", CHUNK);
    const cut = breakAt > 200 ? breakAt : remaining.lastIndexOf(". ", CHUNK);
    const pos = cut > 200 ? cut + 1 : CHUNK;
    chunks.push(remaining.slice(0, pos).trim());
    remaining = remaining.slice(pos).trim();
  }
  if (remaining) chunks.push(remaining);

  const translated: string[] = [];
  for (const chunk of chunks) {
    const res = await fetch("https://api.sarvam.ai/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-subscription-key": key },
      body: JSON.stringify({
        input: chunk,
        source_language_code: srcCode,
        target_language_code: tgtCode,
        speaker_gender: "Male",
        mode: "modern-colloquial",
        model: "mayura:v1",
        enable_preprocessing: false,
      }),
    });
    if (!res.ok) throw new Error(`Sarvam error ${res.status}: ${await res.text()}`);
    const json = await res.json();
    if (!json.translated_text) throw new Error("Sarvam: empty response");
    translated.push(json.translated_text);
  }
  return translated.join("\n\n");
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

// Second OpenRouter call using a different free model — avoids hitting the same upstream rate limit.
async function callOpenRouterAlt(prompt: string): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "mistralai/mistral-7b-instruct:free",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouterAlt error ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? null;
}

async function callGemini(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
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
  { name: "Cerebras", call: callCerebras },
  { name: "OpenRouter", call: callOpenRouter },
  { name: "OpenRouterAlt", call: callOpenRouterAlt },
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

  let body: { action: string; content: string; title: string; excerpt?: string; language: string; targetLanguage?: string; memoryContext?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { action, content, title = "", excerpt = "", language = "en", targetLanguage, memoryContext } = body;
  if (!content?.trim()) {
    return NextResponse.json({ error: "Invalid action or empty content" }, { status: 400 });
  }

  if (action === "translate_to") {
    if (!targetLanguage) {
      return NextResponse.json({ error: "Missing targetLanguage" }, { status: 400 });
    }
    const tgtLang = languageName(targetLanguage);
    const srcLang = languageName(language);
    const trimmedContent = content.slice(0, 4000);
    const prompt =
      `Translate the following story from ${srcLang} to ${tgtLang}.\n` +
      `Preserve the emotional tone, paragraph breaks, and meaning.\n` +
      (memoryContext ? `\n${memoryContext}\n` : "") +
      `Respond with ONLY this JSON structure (no markdown, no extra text):\n` +
      `{"title":"<translated title>","excerpt":"<translated excerpt>","content":"<translated content>"}\n\n` +
      `Title: ${title}\nExcerpt: ${excerpt}\nContent:\n${trimmedContent}`;

    // Try Sarvam first for Indian language pairs — dedicated model, best quality.
    try {
      const [tTitle, tExcerpt, tContent] = await Promise.all([
        sarvamTranslateSegment(title, language, targetLanguage),
        excerpt ? sarvamTranslateSegment(excerpt, language, targetLanguage) : Promise.resolve(""),
        sarvamTranslateSegment(trimmedContent, language, targetLanguage),
      ]);
      if (tTitle && tContent) {
        return NextResponse.json({ result: { title: tTitle, excerpt: tExcerpt ?? "", content: tContent } });
      }
    } catch (err) {
      console.error("[translate_to] Sarvam threw:", err);
    }

    const translationProviders = [
      { name: "GroqFast", call: callGroqFast },
      { name: "Cerebras", call: callCerebras },
      { name: "Groq", call: callGroq },
      { name: "OpenRouter", call: callOpenRouter },
      { name: "OpenRouterAlt", call: callOpenRouterAlt },
      { name: "Gemini", call: callGemini },
    ];

    let configured = false;
    for (const provider of translationProviders) {
      let raw: string | null;
      try {
        raw = await provider.call(prompt);
      } catch (err) {
        configured = true;
        console.error(`[translate_to] ${provider.name} threw:`, err);
        continue;
      }
      if (raw === null) continue;
      configured = true;
      try {
        // Strip markdown fences, extract the first {...} block, then sanitize
        // any literal control characters the model left unescaped inside strings.
        let cleaned = raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) cleaned = jsonMatch[0];
        cleaned = sanitizeJsonControlChars(cleaned);
        const parsed = JSON.parse(cleaned);
        if (typeof parsed.title !== "string" || typeof parsed.content !== "string") throw new Error("bad shape");
        if (typeof parsed.excerpt !== "string") parsed.excerpt = "";
        return NextResponse.json({ result: parsed });
      } catch (err) {
        console.error(`[translate_to] ${provider.name} bad JSON:`, err, "raw:", raw?.slice(0, 200));
        continue;
      }
    }
    if (!configured) return NextResponse.json({ error: "AI not configured." }, { status: 503 });
    return NextResponse.json({ error: "Translation failed — all providers unavailable." }, { status: 502 });
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
