# SPCS — Schema Pattern Comparison System

Describe a software project in plain English and get back an AI-generated database
architecture recommendation: relational vs. document vs. polyglot, dimension scores,
recommended schema patterns, a sample schema (SQL or JSON depending on paradigm), risk
and governance assessment, and a phased implementation roadmap. Results can be exported
as a PDF report.

Built with React + Vite, powered by Gemini 2.5 Flash.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and set your key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

## Running locally

Gemini's API blocks direct browser calls (CORS), so requests go through a small
server-side proxy. Run both of these in separate terminals:

```
node proxy.cjs   # proxy server on http://localhost:3001
npm run dev      # Vite dev server (talks to the proxy via /api/gemini)
```

## Production (Vercel)

`vercel.json` rewrites `/api/*` to the serverless function in `api/gemini.js`, which
does the same job as `proxy.cjs` but as a Vercel function. Set `GEMINI_API_KEY` as an
environment variable in the Vercel project settings — it's never exposed to the browser.

## Other scripts

- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run preview` — preview the production build locally
