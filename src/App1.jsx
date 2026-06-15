import { useState, useRef, useEffect, useCallback } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// CORS FIX: Direct browser → Gemini API calls are blocked by CORS policy.
// Solution: Run the included Express proxy server (proxy.js) on localhost:3001
// The proxy forwards requests server-side where CORS does not apply.
const GEMINI_MODEL = "gemini-2.5-flash";
const PROXY_URL    = "http://localhost:3001/gemini";

const EXAMPLES = [
  "A hospital management system that tracks patients, doctors, appointments, prescriptions and billing. Must comply with HIPAA regulations and keep full audit trails of all record changes.",
  "A social media platform where users post short videos, follow each other, like and comment. Expecting rapid growth to millions of users across multiple countries.",
  "An e-commerce platform selling electronics. Needs product catalog with varied specs, cart management, order processing, payments, and sales analytics dashboard.",
  "An IoT platform that collects real-time sensor data from 50,000 factory machines — temperature, pressure, vibration readings every 5 seconds.",
  "A ride-hailing app like Uber — driver and passenger matching, real-time GPS tracking, trip history, payments, and surge pricing analytics.",
];

const buildPrompt = (description) => `
You are the Schema Pattern Comparison System (SPCS) — an expert database architect AI grounded in 33 peer-reviewed studies (2018–2026) on relational and document-based schema design patterns.

A user has described their project. Analyse it and respond ONLY with a valid JSON object — no markdown fences, no explanation outside the JSON.

User's project description:
"""
${description}
"""

Respond with this exact JSON structure:
{
  "projectName": "short name for this project (3-5 words)",
  "projectType": "category e.g. E-commerce, Healthcare, IoT, Banking, Social Media, Analytics, etc.",
  "recommendation": "relational" | "document" | "polyglot",
  "confidence": number between 60 and 99,
  "primaryDatabase": "e.g. PostgreSQL, MongoDB, MySQL, etc.",
  "secondaryDatabase": "only if polyglot, else null",
  "warehouseDatabase": "only if analytics needed, else null",
  "whyBestFit": "3-4 sentence explanation of why this paradigm fits this specific project.",
  "dimensionScores": {
    "structuredData": number 0-100,
    "semiStructuredData": number 0-100,
    "consistencyRequirement": number 0-100,
    "scalabilityRequirement": number 0-100,
    "governanceRequirement": number 0-100,
    "relationshipComplexity": number 0-100,
    "evolutionRequirement": number 0-100
  },
  "keyFactors": ["factor 1","factor 2","factor 3","factor 4"],
  "recommendedPatterns": [
    { "name": "pattern name", "paradigm": "Relational"|"Document"|"Warehouse", "reason": "one sentence", "appliesTo": "which part" }
  ],
  "schemaStructure": {
    "description": "1-2 sentence overview",
    "entities": [
      { "name": "EntityName", "type": "table"|"collection"|"view", "paradigm": "Relational"|"Document", "database": "e.g. PostgreSQL", "fields": [{ "name": "field_name", "type": "data type", "note": "e.g. PRIMARY KEY" }], "patternApplied": "pattern name or null" }
    ]
  },
  "polyglotArchitecture": null or { "layers": [{ "layer": "layer name", "database": "db", "stores": "what", "pattern": "pattern", "reason": "why" }] },
  "riskAssessment": { "level": "Low"|"Medium"|"High", "reason": "specific reason", "mitigations": ["m1","m2"] },
  "governanceAssessment": { "auditability": "Low"|"Medium"|"High", "complianceReadiness": "Low"|"Medium"|"High", "dataLineage": "Low"|"Medium"|"High", "notes": "specific notes" },
  "futureReadiness": { "aiReadiness": "Low"|"Medium"|"High", "cloudReadiness": "Low"|"Medium"|"High", "scalabilityReadiness": "Low"|"Medium"|"High", "notes": "specific notes" },
  "realWorldComparison": { "similarSystem": "e.g. Airbnb", "howSimilar": "one sentence", "theirApproach": "one sentence" },
  "implementationRoadmap": [
    { "phase": 1, "title": "Phase title", "tasks": ["task 1","task 2","task 3"] },
    { "phase": 2, "title": "Phase title", "tasks": ["task 1","task 2","task 3"] },
    { "phase": 3, "title": "Phase title", "tasks": ["task 1","task 2"] }
  ]
}

Be very specific to the user's project. Do not give generic answers.
`;

const levelColor = (v) =>
  v === "High" ? "#16a34a" : v === "Medium" ? "#d97706" : "#dc2626";
const paradigmColor = (p) =>
  p === "Relational"
    ? "#1d4ed8"
    : p === "Document"
      ? "#059669"
      : p === "Warehouse"
        ? "#7c3aed"
        : "#475569";

function Tag({ text, color = "#1d4ed8" }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1,
        textTransform: "uppercase",
        background: `${color}12`,
        color,
        padding: "3px 10px",
        borderRadius: 4,
        border: `1px solid ${color}30`,
        fontFamily: "'JetBrains Mono', monospace",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

function Gauge({ label, value }) {
  const c =
    value >= 75
      ? "#16a34a"
      : value >= 50
        ? "#1d4ed8"
        : value >= 30
          ? "#d97706"
          : "#dc2626";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "#6b7280",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: 0.5,
          }}
        >
          {label
            .replace(/([A-Z])/g, " $1")
            .trim()
            .toUpperCase()}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: c,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {value}
        </span>
      </div>
      <div style={{ height: 4, background: "#e5e7eb", borderRadius: 2 }}>
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: c,
            borderRadius: 2,
            transition: "width 1s ease",
          }}
        />
      </div>
    </div>
  );
}

function SchemaBlock({ entity }) {
  const [open, setOpen] = useState(true);
  const pc = paradigmColor(entity.paradigm);
  const isDoc = entity.type === "collection";

  const renderSQL = () => (
    <pre
      style={{
        margin: 0,
        fontSize: 12,
        lineHeight: 1.9,
        color: "#1f2937",
        fontFamily: "'JetBrains Mono', monospace",
        overflowX: "auto",
        padding: "16px 20px",
        background: "#f9fafb",
      }}
    >
      <span style={{ color: "#7c3aed" }}>CREATE TABLE</span>{" "}
      <span style={{ color: "#16a34a" }}>{entity.name}</span> {"(\n"}
      {entity.fields.map((f, i) => (
        <span key={f.name}>
          {"  "}
          <span style={{ color: "#1d4ed8" }}>{f.name}</span>{" "}
          <span style={{ color: "#d97706" }}>{f.type}</span>
          {f.note ? <span style={{ color: "#9ca3af" }}> -- {f.note}</span> : ""}
          {i < entity.fields.length - 1 ? ",\n" : "\n"}
        </span>
      ))}
      {");"}
    </pre>
  );

  const renderJSON = () => {
    const obj = {};
    entity.fields.forEach((f) => {
      const sampleVal =
        f.type.includes("String") || f.type.includes("string")
          ? `"sample_${f.name}"`
          : f.type.includes("Number") || f.type.includes("Int")
            ? "0"
            : f.type.includes("Date")
              ? `"${new Date().toISOString().split("T")[0]}"`
              : f.type.includes("Boolean") || f.type.includes("bool")
                ? "true"
                : f.type.includes("Array")
                  ? "[]"
                  : f.type.includes("Object")
                    ? "{}"
                    : `"..."`;
      obj[f.name] = sampleVal;
    });
    return (
      <pre
        style={{
          margin: 0,
          fontSize: 12,
          lineHeight: 1.9,
          color: "#1f2937",
          fontFamily: "'JetBrains Mono', monospace",
          overflowX: "auto",
          padding: "16px 20px",
          background: "#f9fafb",
        }}
      >
        {"{\n"}
        {entity.fields.map((f, i) => (
          <span key={f.name}>
            {"  "}
            <span style={{ color: "#1d4ed8" }}>"{f.name}"</span>
            {": "}
            <span
              style={{
                color:
                  f.type.includes("String") || f.type.includes("string")
                    ? "#16a34a"
                    : f.type.includes("Number") || f.type.includes("Int")
                      ? "#d97706"
                      : "#6b7280",
              }}
            >
              {obj[f.name]}
            </span>
            {f.note ? (
              <span style={{ color: "#9ca3af" }}> // {f.note}</span>
            ) : (
              ""
            )}
            {i < entity.fields.length - 1 ? ",\n" : "\n"}
          </span>
        ))}
        {"}"}
      </pre>
    );
  };

  return (
    <div
      style={{
        border: `1px solid ${pc}25`,
        borderRadius: 6,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          background: `${pc}06`,
          borderBottom: open ? `1px solid ${pc}15` : "none",
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            color: pc,
          }}
        >
          {isDoc ? "{ }" : "▦"}
        </span>
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 700,
            color: "#0d0d0d",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {entity.name}
        </span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Tag text={entity.type} color={pc} />
          <Tag text={entity.database} color="#6b7280" />
          {entity.patternApplied && (
            <Tag text={entity.patternApplied} color="#7c3aed" />
          )}
        </div>
        <span style={{ color: "#9ca3af", fontSize: 11, marginLeft: 4 }}>
          {open ? "▲" : "▼"}
        </span>
      </div>
      {open && (isDoc ? renderJSON() : renderSQL())}
    </div>
  );
}

function TypingIndicator() {
  const [dots, setDots] = useState("");
  const msgs = [
    "Analysing project requirements",
    "Evaluating consistency needs",
    "Scoring scalability dimensions",
    "Selecting schema patterns",
    "Designing schema structure",
    "Building implementation roadmap",
  ];
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    const d = setInterval(
      () => setDots((p) => (p.length >= 3 ? "" : p + ".")),
      400,
    );
    const m = setInterval(() => setMsgIdx((i) => (i + 1) % msgs.length), 1800);
    return () => {
      clearInterval(d);
      clearInterval(m);
    };
  }, []);
  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 24px",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 6,
          marginBottom: 24,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#E8341A",
              animation: `spcs-pulse 1.2s ${i * 0.2}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
      <p
        style={{
          fontSize: 15,
          color: "#0d0d0d",
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: 8,
        }}
      >
        {msgs[msgIdx]}
        {dots}
      </p>
      <p
        style={{
          fontSize: 12,
          color: "#9ca3af",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        SPCS Engine · AI Analysis in progress
      </p>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 20,
      }}
    >
      <div style={{ width: 20, height: 1, background: "#0d0d0d" }} />
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 2.5,
          textTransform: "uppercase",
          color: "#6b7280",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {children}
      </span>
    </div>
  );
}

function Results({ data, onReset }) {
  const [tab, setTab] = useState("overview");
  const recColor =
    data.recommendation === "relational"
      ? "#1d4ed8"
      : data.recommendation === "document"
        ? "#059669"
        : "#7c3aed";
  const recLabel =
    data.recommendation === "relational"
      ? "Relational"
      : data.recommendation === "document"
        ? "Document"
        : "Polyglot";

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "schema", label: "Schema" },
    { id: "patterns", label: "Patterns" },
    { id: "assessment", label: "Assessment" },
    { id: "roadmap", label: "Roadmap" },
  ];

  return (
    <div style={{ animation: "spcs-fadeIn 0.4s ease" }}>
      {/* Result banner */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "28px 32px",
          marginBottom: 24,
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#9ca3af",
                letterSpacing: 2,
                textTransform: "uppercase",
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: 8,
              }}
            >
              SPCS · Analysis Complete
            </p>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#0d0d0d",
                marginBottom: 12,
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: -0.5,
              }}
            >
              {data.projectName}
            </h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Tag text={data.projectType} color={recColor} />
              <Tag text={`${recLabel} Architecture`} color={recColor} />
              {data.primaryDatabase && (
                <Tag text={data.primaryDatabase} color="#6b7280" />
              )}
              {data.secondaryDatabase && (
                <Tag text={data.secondaryDatabase} color="#6b7280" />
              )}
            </div>
          </div>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div
              style={{
                fontSize: 52,
                fontWeight: 900,
                color: recColor,
                lineHeight: 1,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {data.confidence}%
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontFamily: "'JetBrains Mono', monospace",
                marginTop: 4,
              }}
            >
              Confidence
            </div>
          </div>
        </div>
        <p
          style={{
            fontSize: 14,
            color: "#374151",
            lineHeight: 1.8,
            borderTop: "1px solid #f3f4f6",
            paddingTop: 16,
          }}
        >
          {data.whyBestFit}
        </p>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 24,
          borderBottom: "1px solid #e5e7eb",
          overflowX: "auto",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 20px",
              border: "none",
              borderBottom:
                tab === t.id ? `2px solid #0d0d0d` : "2px solid transparent",
              background: "transparent",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: tab === t.id ? "#0d0d0d" : "#9ca3af",
              fontFamily: "'Inter', sans-serif",
              marginBottom: -1,
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "24px 28px",
              background: "#fff",
            }}
          >
            <SectionLabel>Dimension Scores</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {Object.entries(data.dimensionScores).map(([k, v]) => (
                <Gauge key={k} label={k} value={v} />
              ))}
            </div>
          </div>
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "24px 28px",
              background: "#fff",
            }}
          >
            <SectionLabel>Key Decision Factors</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.keyFactors.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                    paddingBottom: 12,
                    borderBottom:
                      i < data.keyFactors.length - 1
                        ? "1px solid #f3f4f6"
                        : "none",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#9ca3af",
                      fontFamily: "'JetBrains Mono', monospace",
                      minWidth: 22,
                      paddingTop: 2,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p
                    style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }}
                  >
                    {f}
                  </p>
                </div>
              ))}
            </div>
          </div>
          {data.realWorldComparison && (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "24px 28px",
                background: "#fff",
              }}
            >
              <SectionLabel>Real-World Comparison</SectionLabel>
              <div
                style={{ display: "flex", gap: 16, alignItems: "flex-start" }}
              >
                <div style={{ fontSize: 32, flexShrink: 0 }}>🌐</div>
                <div>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#0d0d0d",
                      marginBottom: 6,
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    Similar to {data.realWorldComparison.similarSystem}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#6b7280",
                      lineHeight: 1.7,
                      marginBottom: 8,
                    }}
                  >
                    {data.realWorldComparison.howSimilar}
                  </p>
                  <p
                    style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.7 }}
                  >
                    <span style={{ fontWeight: 600, color: "#6b7280" }}>
                      Their approach:{" "}
                    </span>
                    {data.realWorldComparison.theirApproach}
                  </p>
                </div>
              </div>
            </div>
          )}
          {data.polyglotArchitecture && (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "24px 28px",
                background: "#fff",
              }}
            >
              <SectionLabel>Polyglot Architecture Layers</SectionLabel>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {data.polyglotArchitecture.layers.map((l, i) => (
                  <div
                    key={i}
                    style={{
                      border: "1px solid #f3f4f6",
                      borderRadius: 6,
                      padding: "14px 18px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0d0d0d",
                        }}
                      >
                        {l.layer}
                      </span>
                      <Tag text={l.database} color="#7c3aed" />
                      <Tag text={l.pattern} color="#6b7280" />
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        marginBottom: 4,
                      }}
                    >
                      Stores:{" "}
                      <span style={{ color: "#374151" }}>{l.stores}</span>
                    </p>
                    <p style={{ fontSize: 12, color: "#9ca3af" }}>{l.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SCHEMA */}
      {tab === "schema" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "24px 28px",
              background: "#fff",
            }}
          >
            <SectionLabel>Schema Design Overview</SectionLabel>
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8 }}>
              {data.schemaStructure.description}
            </p>
          </div>
          {data.schemaStructure.entities.map((e) => (
            <SchemaBlock key={e.name} entity={e} />
          ))}
        </div>
      )}

      {/* PATTERNS */}
      {tab === "patterns" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "24px 28px",
              background: "#fff",
            }}
          >
            <SectionLabel>Recommended Schema Patterns</SectionLabel>
            <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>
              These patterns are specifically selected for your project's
              characteristics.
            </p>
          </div>
          {data.recommendedPatterns.map((p, i) => (
            <div
              key={i}
              style={{
                border: `1px solid ${paradigmColor(p.paradigm)}20`,
                borderRadius: 8,
                padding: "18px 22px",
                background: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#0d0d0d",
                    flex: 1,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {p.name}
                </span>
                <Tag text={p.paradigm} color={paradigmColor(p.paradigm)} />
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "#374151",
                  lineHeight: 1.7,
                  marginBottom: 6,
                }}
              >
                {p.reason}
              </p>
              <p style={{ fontSize: 12, color: "#9ca3af" }}>
                Applied to:{" "}
                <span
                  style={{
                    color: "#6b7280",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {p.appliesTo}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ASSESSMENT */}
      {tab === "assessment" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "24px 28px",
              background: "#fff",
            }}
          >
            <SectionLabel>Risk Assessment</SectionLabel>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 28 }}>
                {data.riskAssessment.level === "High"
                  ? "🔴"
                  : data.riskAssessment.level === "Medium"
                    ? "🟡"
                    : "🟢"}
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: levelColor(data.riskAssessment.level),
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {data.riskAssessment.level} Risk
              </span>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "#374151",
                lineHeight: 1.8,
                marginBottom: 16,
              }}
            >
              {data.riskAssessment.reason}
            </p>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: 10,
              }}
            >
              Mitigations
            </p>
            {data.riskAssessment.mitigations.map((m, i) => (
              <p
                key={i}
                style={{
                  fontSize: 13,
                  color: "#374151",
                  marginBottom: 8,
                  paddingLeft: 16,
                  borderLeft: "2px solid #e5e7eb",
                }}
              >
                {m}
              </p>
            ))}
          </div>
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "24px 28px",
              background: "#fff",
            }}
          >
            <SectionLabel>Governance Assessment</SectionLabel>
            {[
              {
                label: "Auditability",
                value: data.governanceAssessment.auditability,
              },
              {
                label: "Compliance Readiness",
                value: data.governanceAssessment.complianceReadiness,
              },
              {
                label: "Data Lineage",
                value: data.governanceAssessment.dataLineage,
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <span style={{ fontSize: 13, color: "#374151" }}>
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: levelColor(item.value),
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                marginTop: 14,
                lineHeight: 1.7,
              }}
            >
              {data.governanceAssessment.notes}
            </p>
          </div>
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "24px 28px",
              background: "#fff",
            }}
          >
            <SectionLabel>Future Readiness</SectionLabel>
            {[
              {
                label: "AI / ML Readiness",
                value: data.futureReadiness.aiReadiness,
              },
              {
                label: "Cloud Readiness",
                value: data.futureReadiness.cloudReadiness,
              },
              {
                label: "Scalability Readiness",
                value: data.futureReadiness.scalabilityReadiness,
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <span style={{ fontSize: 13, color: "#374151" }}>
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: levelColor(item.value),
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                marginTop: 14,
                lineHeight: 1.7,
              }}
            >
              {data.futureReadiness.notes}
            </p>
          </div>
        </div>
      )}

      {/* ROADMAP */}
      {tab === "roadmap" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "24px 28px",
              background: "#fff",
            }}
          >
            <SectionLabel>Implementation Roadmap</SectionLabel>
            <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>
              A step-by-step implementation plan generated specifically for your
              project.
            </p>
          </div>
          {data.implementationRoadmap.map((phase, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                overflow: "hidden",
                background: "#fff",
              }}
            >
              <div
                style={{
                  padding: "14px 22px",
                  background: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#0d0d0d",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#fff",
                    flexShrink: 0,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {phase.phase}
                </div>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#0d0d0d",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {phase.title}
                </span>
              </div>
              <div
                style={{
                  padding: "16px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {phase.tasks.map((task, j) => (
                  <div
                    key={j}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        color: "#E8341A",
                        fontSize: 14,
                        fontWeight: 700,
                        marginTop: 1,
                        flexShrink: 0,
                      }}
                    >
                      ›
                    </span>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#374151",
                        lineHeight: 1.7,
                      }}
                    >
                      {task}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 32,
          paddingTop: 24,
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <button
          onClick={onReset}
          style={{
            padding: "10px 22px",
            background: "transparent",
            color: "#6b7280",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            transition: "all 0.15s",
          }}
        >
          ← New Analysis
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [description, setDesc] = useState("");
  const [stage, setStage] = useState("input");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const textRef = useRef(null);

  const handleExample = (ex) => {
    setDesc(ex);
    if (textRef.current) textRef.current.focus();
  };

  const handleAnalyse = useCallback(async () => {
    if (!description.trim() || description.trim().length < 20) return;
    setStage("loading");
    setError("");
    try {
      // Send to local proxy — avoids CORS (proxy forwards to Gemini server-side)
      const resp = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: GEMINI_MODEL,
          contents: [{ parts: [{ text: buildPrompt(description) }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error || `Server error ${resp.status}`);
      }
      const raw = await resp.json();
      const text = raw.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const clean = text.replace(/```json|```/gi, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setStage("results");
    } catch (e) {
      setError("Something went wrong. Please try again.");
      setStage("error");
    }
  }, [description]);

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
