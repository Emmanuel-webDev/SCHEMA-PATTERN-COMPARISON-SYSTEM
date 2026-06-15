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

// Health check
app.get("/", (req, res) => {
  res.json({ status: "SPCS Gemini Proxy running", port: PORT });
});

// Main proxy route
app.post("/gemini", async (req, res) => {
  const {model, contents, generationConfig } = req.body;

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
    console.error("Proxy error:", err.message);
    return res.status(500).json({ error: "Proxy failed: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log("\n SPCS Gemini Proxy on http://localhost:" + PORT);
  console.log("  POST /gemini  =>  Gemini 2.5 Flash\n");
});
