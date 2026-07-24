import { useState, useRef, useCallback } from "react";
import { EXAMPLES, buildOverviewPrompt, buildDetailsPrompt } from "./prompt.js";
import { parseJson, validateOverview, validateDetails } from "./validateAnalysis.js";
import { callGemini } from "./geminiClient.js";
import TypingIndicator from "./components/TypingIndicator.jsx";
import Results from "./components/Results.jsx";

export default function App() {
  const [description, setDesc] = useState("");
  const [stage, setStage] = useState("input");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [detailsError, setDetailsError] = useState("");
  const textRef = useRef(null);

  const handleExample = (ex) => {
    setDesc(ex);
    if (textRef.current) textRef.current.focus();
  };

  // Phase 2 (background): schema/patterns/assessment/roadmap + comparison.
  // Runs after the overview has already rendered, so failures here are
  // non-blocking — they surface only in the tabs that depend on this data.
  const fetchDetails = useCallback(async (desc, overview) => {
    setDetailsError("");
    try {
      const text = await callGemini(buildDetailsPrompt(desc, overview));
      const detailsData = validateDetails(parseJson(text));
      setResult((prev) => (prev ? { ...prev, ...detailsData } : prev));
    } catch (e) {
      setDetailsError(e.message || "Could not load the full analysis.");
    }
  }, []);

  const handleAnalyse = useCallback(async () => {
    const desc = description.trim();
    if (!desc || desc.length < 20) return;
    setStage("loading");
    setError("");
    setResult(null);
    setDetailsError("");

    try {
      const text = await callGemini(buildOverviewPrompt(desc));
      const overviewData = validateOverview(parseJson(text));
      setResult(overviewData);
      setStage("results");
      fetchDetails(desc, overviewData);
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
      setStage("error");
    }
  }, [description, fetchDetails]);

  const handleRetryDetails = useCallback(() => {
    if (result) fetchDetails(description.trim(), result);
  }, [result, description, fetchDetails]);

  const ready = description.trim().length >= 20;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F4F0",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#0d0d0d",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spcs-fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spcs-pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
        @keyframes spcs-spin { to { transform: rotate(360deg); } }
        textarea:focus { outline: none; }
        textarea { resize: vertical; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #F5F4F0; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px; }
        button:hover { opacity: 0.82; }
        .spcs-nav { background: #fff; border-bottom: 1px solid #e5e7eb; height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; position: sticky; top: 0; z-index: 20; }
        .spcs-main { max-width: 780px; margin: 0 auto; padding: 48px 20px 80px; }
        @media (max-width: 600px) {
          .spcs-main { padding: 28px 16px 60px; }
          .spcs-hero-headline { font-size: 28px !important; }
          .spcs-hero-sub { font-size: 13px !important; }
          .spcs-action-row { flex-direction: column !important; gap: 10px !important; }
          .spcs-action-row button { width: 100% !important; }
          .spcs-result-top { flex-direction: column !important; }
          .spcs-confidence { text-align: left !important; margin-top: 8px; }
          .spcs-compare-grid { grid-template-columns: 1fr !important; }
          .spcs-compare-grid > div:first-child { border-right: none !important; border-bottom: 1px solid #e5e7eb; }
        }
      `}</style>

      {/* Nav */}
      <nav className="spcs-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 30,
              height: 30,
              background: "#0d0d0d",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
            }}
          >
            🗄️
          </div>
          <div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "#0d0d0d",
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: -0.3,
              }}
            >
              SPCS
            </span>
            <span
              style={{
                fontSize: 11,
                color: "#9ca3af",
                marginLeft: 8,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Schema Pattern Comparison System
            </span>
          </div>
        </div>
      </nav>

      <main className="spcs-main">
        {(stage === "input" || stage === "error") && (
          <div style={{ animation: "spcs-fadeIn 0.4s ease" }}>
            {/* Hero */}
            <div style={{ marginBottom: 48 }}>
              {/* Big headline — PlayerZero style */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 16,
                    flexWrap: "wrap",
                    lineHeight: 1,
                  }}
                >
                  <h1
                    className="spcs-hero-headline"
                    style={{
                      fontSize: 52,
                      fontWeight: 900,
                      color: "#0d0d0d",
                      fontFamily: "'Space Grotesk', sans-serif",
                      letterSpacing: -2,
                      lineHeight: 1,
                    }}
                  >
                    DESCRIBE.
                  </h1>
                  <h1
                    className="spcs-hero-headline"
                    style={{
                      fontSize: 52,
                      fontWeight: 900,
                      color: "#0d0d0d",
                      fontFamily: "'Space Grotesk', sans-serif",
                      letterSpacing: -2,
                      lineHeight: 1,
                    }}
                  >
                    ANALYSE.
                  </h1>
                  <h1
                    className="spcs-hero-headline"
                    style={{
                      fontSize: 52,
                      fontWeight: 900,
                      color: "#E8341A",
                      fontFamily: "'Space Grotesk', sans-serif",
                      letterSpacing: -2,
                      lineHeight: 1,
                    }}
                  >
                    BUILD.
                  </h1>
                </div>
              </div>

              <p
                className="spcs-hero-sub"
                style={{
                  fontSize: 15,
                  color: "#6b7280",
                  lineHeight: 1.8,
                  maxWidth: 560,
                }}
              >
                Describe your project and get intelligent schema
                recommendations, design patterns, and an implementation roadmap
                — grounded in{" "}
                <strong style={{ color: "#374151" }}>
                  33 peer-reviewed works (2018–2026)
                </strong>
                .
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 24,
                  marginTop: 18,
                  flexWrap: "wrap",
                }}
              >
                {[
                  "OOADM + UML Methodology",
                  "CAP Theorem · ACID/BASE",
                  "Schema-on-Read vs Write",
                ].map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      fontFamily: "'JetBrains Mono', monospace",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 4,
                        height: 4,
                        background: "#d1d5db",
                        borderRadius: "50%",
                        display: "inline-block",
                      }}
                    />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Input box */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 14,
              }}
            >
              <textarea
                ref={textRef}
                value={description}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Describe your project in detail. For example: 'I'm building a hospital management system that tracks patients, doctors, appointments, prescriptions, and billing. It must comply with HIPAA and maintain a full audit trail...'"
                style={{
                  width: "100%",
                  minHeight: 148,
                  background: "transparent",
                  border: "none",
                  padding: "20px 22px",
                  fontSize: 14,
                  color: "#0d0d0d",
                  lineHeight: 1.8,
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <div
                className="spcs-action-row"
                style={{
                  padding: "12px 18px",
                  borderTop: "1px solid #f3f4f6",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#fafafa",
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: ready ? "#6b7280" : "#dc2626",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {description.length} chars
                  {!ready ? " · minimum 20 required" : " · ready to analyse"}
                </span>
                <button
                  onClick={handleAnalyse}
                  disabled={!ready}
                  style={{
                    padding: "10px 24px",
                    background: ready ? "#0d0d0d" : "#f3f4f6",
                    color: ready ? "#fff" : "#9ca3af",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: ready ? "pointer" : "not-allowed",
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: 0.5,
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  Analyse →
                </button>
              </div>
            </div>

            {stage === "error" && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 6,
                  padding: "12px 16px",
                  marginBottom: 14,
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: "#dc2626",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  ⚠ {error}
                </p>
              </div>
            )}

            {/* Stats bar */}
            <div
              style={{
                display: "flex",
                gap: 0,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 32,
                background: "#fff",
              }}
            >
              {[
                ["33", "Research Papers"],
                ["2018–26", "Study Period"],
                ["ACID + BASE", "Frameworks"],
                ["3", "Paradigms"],
              ].map(([val, lbl], i, arr) => (
                <div
                  key={lbl}
                  style={{
                    flex: 1,
                    padding: "14px 16px",
                    textAlign: "center",
                    borderRight:
                      i < arr.length - 1 ? "1px solid #f3f4f6" : "none",
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#0d0d0d",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {val}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#9ca3af",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      fontFamily: "'JetBrains Mono', monospace",
                      marginTop: 2,
                    }}
                  >
                    {lbl}
                  </div>
                </div>
              ))}
            </div>

            {/* Examples */}
            <div>
              <p
                style={{
                  fontSize: 10,
                  color: "#9ca3af",
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  marginBottom: 12,
                }}
              >
                Try an example
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => handleExample(ex)}
                    style={{
                      textAlign: "left",
                      padding: "13px 18px",
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 13,
                      color: "#374151",
                      lineHeight: 1.6,
                      transition: "border-color 0.15s, background 0.15s",
                      fontFamily: "'Inter', sans-serif",
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        color: "#E8341A",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      ›
                    </span>
                    <span>{ex.length > 110 ? ex.slice(0, 110) + "…" : ex}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {stage === "loading" && (
          <div style={{ animation: "spcs-fadeIn 0.3s ease" }}>
            <div
              style={{
                marginBottom: 20,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "16px 20px",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  color: "#9ca3af",
                  fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                Analysing
              </p>
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }}>
                {description.length > 120
                  ? description.slice(0, 120) + "…"
                  : description}
              </p>
            </div>
            <TypingIndicator />
          </div>
        )}

        {stage === "results" && result && (
          <Results
            data={result}
            detailsError={detailsError}
            onRetryDetails={handleRetryDetails}
            onReset={() => {
              setStage("input");
              setResult(null);
              setDesc("");
            }}
          />
        )}
      </main>
    </div>
  );
}
