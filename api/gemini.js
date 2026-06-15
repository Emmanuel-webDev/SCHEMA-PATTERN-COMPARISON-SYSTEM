import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/", async (req, res) => {
  const { model, contents, generationConfig } = req.body;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig,
        }),
      },
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

export default app;
