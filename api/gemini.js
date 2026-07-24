// Best-effort in-memory rate limiter. Note: on Vercel this only limits requests
// within a single warm serverless instance — it resets on cold starts and isn't
// shared across concurrent instances, so it's not a hard global cap. Still raises
// the bar for casual abuse at zero infra cost.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;
const requestLog = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests, please slow down." });
  }

  const { model, contents, generationConfig } = req.body;

  if (!model || !contents) {
    return res.status(400).json({ error: "Request must include `model` and `contents`." });
  }

  try {

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      return res.status(500).json({ error: "API key not set" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents, generationConfig }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.error?.message || "Gemini error " + response.status;
      return res.status(response.status).json({ error: msg });
    }

    res.json(data);
  } catch (err) {
    // Network-level failures (ECONNRESET, timeouts, DNS errors) throw with the
    // full request URL in err.message — which contains the API key as a query
    // param. Never forward that to the client; log it server-side only.
    console.error("Proxy error:", err.message);
    res.status(502).json({ error: "Network error — please check your connection and try again." });
  }
}
