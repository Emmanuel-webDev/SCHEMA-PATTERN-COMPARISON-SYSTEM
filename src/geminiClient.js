import { GEMINI_MODEL, PROXY_URL } from "./prompt.js";

const REQUEST_TIMEOUT_MS = 45000;

// Shared by both the overview and details calls in the phased-loading flow —
// each phase is otherwise identical plumbing (timeout, abort, error shape).
export async function callGemini(promptText) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const resp = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 16384 },
      }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err?.error || `Server error ${resp.status}`);
    }
    const raw = await resp.json();
    return raw.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (e) {
    if (e.name === "AbortError") {
      throw new Error("Request timed out — please try again.", { cause: e });
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}
