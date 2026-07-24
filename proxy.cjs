/**
 * SPCS Gemini Proxy Server
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS:
 *   Browsers block direct calls to the Gemini API due to CORS policy.
 *   This tiny Express server runs locally and forwards requests server-side.
 *
 * SETUP (one time):
 *   npm install express cors node-fetch
 *
 * RUN:
 *   node proxy.js
 *
 * Then run your React app with:  npm run dev
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config(); 
const key = process.env.GEMINI_API_KEY;

const app = express();
const PORT = 3001;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
    ],
  }),
);
app.use(express.json({ limit: "2mb" }));

// Best-effort in-memory rate limiter — fine here since this is one long-lived
// local process (unlike the Vercel function, which has no shared state across instances).
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

// Health check
app.get("/", (req, res) => {
  res.json({ status: "SPCS Gemini Proxy running", port: PORT });
});

// Main proxy route
app.post("/gemini", async (req, res) => {
  if (isRateLimited(req.ip)) {
    return res.status(429).json({ error: "Too many requests, please slow down." });
  }

  const { model, contents, generationConfig } = req.body;

  if (!model || !contents) {
    return res.status(400).json({ error: "Request must include `model` and `contents`." });
  }

  if (!key) {
    return res.status(400).json({ error: "No API key provided" });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  try {
    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents, generationConfig }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      const msg = data?.error?.message || "Gemini error " + geminiRes.status;
      return res.status(geminiRes.status).json({ error: msg });
    }

    return res.json(data);
  } catch (err) {
    // Network-level failures (ECONNRESET, timeouts, DNS errors) throw with the
    // full request URL in err.message — which contains the API key as a query
    // param. Never forward that to the client; log it server-side only.
    console.error("Proxy error:", err.message);
    return res.status(502).json({ error: "Network error — please check your connection and try again." });
  }
});

app.listen(PORT, () => {
  console.log("\n SPCS Gemini Proxy on http://localhost:" + PORT);
  console.log("  POST /gemini  =>  Gemini 2.5 Flash\n");
});
