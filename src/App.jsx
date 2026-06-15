import { useState, useRef, useEffect, useCallback } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// CORS FIX: Direct browser → Gemini API calls are blocked by CORS policy.
// Solution: Run the included Express proxy server (proxy.js) on localhost:3001
// The proxy forwards requests server-side where CORS does not apply.
const GEMINI_MODEL = "gemini-2.5-flash";
const PROXY_URL    = "http://localhost:3001/gemini";

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────
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

  "whyBestFit": "3-4 sentence explanation of why this paradigm fits this specific project. Be specific about the project's characteristics.",

  "dimensionScores": {
    "structuredData": number 0-100,
    "semiStructuredData": number 0-100,
    "consistencyRequirement": number 0-100,
    "scalabilityRequirement": number 0-100,
    "governanceRequirement": number 0-100,
    "relationshipComplexity": number 0-100,
    "evolutionRequirement": number 0-100
  },

  "keyFactors": [
    "factor 1 — specific reason from the project description",
    "factor 2",
    "factor 3",
    "factor 4"
  ],

  "recommendedPatterns": [
    {
      "name": "pattern name",
      "paradigm": "Relational" | "Document" | "Warehouse",
      "reason": "one sentence why this pattern fits this specific project",
      "appliesTo": "which part of the system e.g. Orders table, User profiles collection"
    }
  ],

  "schemaStructure": {
    "description": "1-2 sentence overview of the schema design approach",
    "entities": [
      {
        "name": "EntityName",
        "type": "table" | "collection" | "view",
        "paradigm": "Relational" | "Document",
        "database": "e.g. PostgreSQL",
        "fields": [
          { "name": "field_name", "type": "data type", "note": "e.g. PRIMARY KEY, INDEXED, FOREIGN KEY ref, required, optional" }
        ],
        "patternApplied": "pattern name or null"
      }
    ]
  },

  "polyglotArchitecture": null or {
    "layers": [
      { "layer": "layer name e.g. Transactional Core", "database": "e.g. PostgreSQL", "stores": "what goes here", "pattern": "pattern name", "reason": "why" }
    ]
  },

  "riskAssessment": {
    "level": "Low" | "Medium" | "High",
    "reason": "specific risk reason for this project",
    "mitigations": ["mitigation 1", "mitigation 2"]
  },

  "governanceAssessment": {
    "auditability": "Low" | "Medium" | "High",
    "complianceReadiness": "Low" | "Medium" | "High",
    "dataLineage": "Low" | "Medium" | "High",
    "notes": "specific governance considerations for this project"
  },

  "futureReadiness": {
    "aiReadiness": "Low" | "Medium" | "High",
    "cloudReadiness": "Low" | "Medium" | "High",
    "scalabilityReadiness": "Low" | "Medium" | "High",
    "notes": "specific future considerations for this project"
  },

  "realWorldComparison": {
    "similarSystem": "e.g. Airbnb, Uber, Netflix, Amazon — the most comparable real-world system",
    "howSimilar": "one sentence on what they share architecturally",
    "theirApproach": "one sentence on what the comparable system uses"
  },

  "implementationRoadmap": [
    { "phase": 1, "title": "Phase title", "tasks": ["task 1", "task 2", "task 3"] },
    { "phase": 2, "title": "Phase title", "tasks": ["task 1", "task 2", "task 3"] },
    { "phase": 3, "title": "Phase title", "tasks": ["task 1", "task 2"] }
  ]
}

Be very specific to the user's project. Do not give generic answers. Reference actual details from their description.
`;

// ─── EXAMPLES ────────────────────────────────────────────────────────────────
const EXAMPLES = [
  "A hospital management system that tracks patients, doctors, appointments, prescriptions and billing. Must comply with HIPAA regulations and keep full audit trails of all record changes.",
  "A social media platform where users post short videos, follow each other, like and comment. Expecting rapid growth to millions of users across multiple countries.",
  "An e-commerce platform selling electronics. Needs product catalog with varied specs, cart management, order processing, payments, and sales analytics dashboard.",
  "An IoT platform that collects real-time sensor data from 50,000 factory machines — temperature, pressure, vibration readings every 5 seconds.",
  "A ride-hailing app like Uber — driver and passenger matching, real-time GPS tracking, trip history, payments, and surge pricing analytics.",
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const levelColor = (v) => v === "High" ? "#22c55e" : v === "Medium" ? "#f59e0b" : "#ef4444";
const levelIcon  = (v) => v === "High" ? "●" : v === "Medium" ? "◐" : "○";
const paradigmColor = (p) => p === "Relational" ? "#3b82f6" : p === "Document" ? "#10b981" : p === "Warehouse" ? "#6366f1" : "#8b5cf6";

function Gauge({ label, value }) {
  const c = value >= 75 ? "#22c55e" : value >= 50 ? "#3b82f6" : value >= 30 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.3 }}>
          {label.replace(/([A-Z])/g, " $1").trim().toUpperCase()}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: c, fontFamily: "monospace" }}>{value}</span>
      </div>
      <div style={{ height: 5, background: "#1e293b", borderRadius: 99 }}>
        <div style={{ height: "100%", width: `${value}%`, background: `linear-gradient(90deg, ${c}88, ${c})`, borderRadius: 99, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

function Tag({ text, color = "#3b82f6" }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", background: `${color}22`, color, padding: "3px 9px", borderRadius: 99, border: `1px solid ${color}44`, fontFamily: "monospace" }}>
      {text}
    </span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: 22, ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 3, height: 18, background: "linear-gradient(180deg,#3b82f6,#6366f1)", borderRadius: 99 }} />
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#64748b", fontFamily: "monospace" }}>{children}</span>
    </div>
  );
}

// ─── SCHEMA BLOCK ─────────────────────────────────────────────────────────────
function SchemaBlock({ entity }) {
  const [open, setOpen] = useState(true);
  const pc = paradigmColor(entity.paradigm);
  const isDoc = entity.type === "collection";

  const renderSQL = () => (
    <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.8, color: "#e2e8f0", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", overflowX: "auto" }}>
      <span style={{ color: "#6366f1" }}>CREATE TABLE</span>{" "}
      <span style={{ color: "#22c55e" }}>{entity.name}</span> {"(\n"}
      {entity.fields.map((f, i) => (
        <span key={f.name}>
          {"  "}
          <span style={{ color: "#38bdf8" }}>{f.name}</span>
          {" "}
          <span style={{ color: "#f59e0b" }}>{f.type}</span>
          {f.note ? <span style={{ color: "#475569" }}> -- {f.note}</span> : ""}
          {i < entity.fields.length - 1 ? ",\n" : "\n"}
        </span>
      ))}
      {");"}
    </pre>
  );

  const renderJSON = () => {
    const obj = {};
    entity.fields.forEach(f => {
      const sampleVal =
        f.type.includes("String") || f.type.includes("string") ? `"sample_${f.name}"` :
        f.type.includes("Number") || f.type.includes("Int") ? "0" :
        f.type.includes("Date") ? `"${new Date().toISOString().split("T")[0]}"` :
        f.type.includes("Boolean") || f.type.includes("bool") ? "true" :
        f.type.includes("Array") ? "[]" :
        f.type.includes("Object") ? "{}" : `"..."`;
      obj[f.name] = sampleVal;
    });

    return (
      <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.8, color: "#e2e8f0", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", overflowX: "auto" }}>
        {"{\n"}
        {entity.fields.map((f, i) => (
          <span key={f.name}>
            {"  "}
            <span style={{ color: "#38bdf8" }}>"{f.name}"</span>
            {": "}
            <span style={{ color: f.type.includes("String") || f.type.includes("string") ? "#a3e635" : f.type.includes("Number") || f.type.includes("Int") ? "#f59e0b" : "#94a3b8" }}>
              {obj[f.name]}
            </span>
            {f.note ? <span style={{ color: "#475569" }}>  // {f.note}</span> : ""}
            {i < entity.fields.length - 1 ? ",\n" : "\n"}
          </span>
        ))}
        {"}"}
      </pre>
    );
  };

  return (
    <div style={{ border: `1px solid ${pc}33`, borderRadius: 12, overflow: "hidden", background: "#080f1a" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: `${pc}0e`, borderBottom: open ? `1px solid ${pc}22` : "none" }}
      >
        <span style={{ fontSize: 13, fontFamily: "monospace", color: pc }}>
          {isDoc ? "{ }" : "▦"}
        </span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#f1f5f9", fontFamily: "monospace" }}>
          {entity.name}
        </span>
        <Tag text={entity.type} color={pc} />
        <Tag text={entity.database} color="#475569" />
        {entity.patternApplied && <Tag text={entity.patternApplied} color="#6366f1" />}
        <span style={{ color: "#475569", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ padding: 16 }}>
          {isDoc ? renderJSON() : renderSQL()}
        </div>
      )}
    </div>
  );
}

// ─── TYPING INDICATOR ─────────────────────────────────────────────────────────
function TypingIndicator() {
  const [dots, setDots] = useState("   ");
  const msgs = [
    "Analysing project requirements",
    "Evaluating consistency needs",
    "Scoring scalability dimensions",
    "Checking governance requirements",
    "Selecting schema patterns",
    "Designing schema structure",
    "Assessing real-world comparisons",
    "Building implementation roadmap",
  ];
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const d = setInterval(() => setDots(p => p.length >= 3 ? " " : p + "."), 400);
    const m = setInterval(() => setMsgIdx(i => (i + 1) % msgs.length), 1800);
    return () => { clearInterval(d); clearInterval(m); };
  }, []);

  return (
    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: 28, textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite` }} />
        ))}
      </div>
      <p style={{ fontSize: 15, color: "#38bdf8", fontFamily: "monospace", marginBottom: 6 }}>
        {msgs[msgIdx]}{dots}
      </p>
      <p style={{ fontSize: 12, color: "#475569", fontFamily: "monospace" }}>Gemini AI · SPCS Engine · Analysing your project</p>
    </div>
  );
}

// ─── RESULTS COMPONENT ───────────────────────────────────────────────────────
function Results({ data, onReset }) {
  const [tab, setTab] = useState("overview");
  const recColor = data.recommendation === "relational" ? "#3b82f6" : data.recommendation === "document" ? "#10b981" : "#8b5cf6";
  const recLabel = data.recommendation === "relational" ? "Relational" : data.recommendation === "document" ? "Document" : "Polyglot";

  const TABS = [
    { id: "overview",   label: "Overview"   },
    { id: "schema",     label: "Schema"     },
    { id: "patterns",   label: "Patterns"   },
    { id: "assessment", label: "Assessment" },
    { id: "roadmap",    label: "Roadmap"    },
  ];

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      {/* Header result banner */}
      <div style={{ background: `linear-gradient(135deg, ${recColor}18, ${recColor}08)`, border: `1px solid ${recColor}33`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: recColor, letterSpacing: 2, textTransform: "uppercase", fontFamily: "monospace", marginBottom: 6 }}>
              SPCS · Analysis
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>
              {data.projectName}
            </h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Tag text={data.projectType} color={recColor} />
              <Tag text={`${recLabel} Architecture`} color={recColor} />
              {data.primaryDatabase && <Tag text={data.primaryDatabase} color="#475569" />}
              {data.secondaryDatabase && <Tag text={data.secondaryDatabase} color="#475569" />}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 46, fontWeight: 900, color: recColor, lineHeight: 1, fontFamily: "monospace" }}>{data.confidence}%</div>
            <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, fontFamily: "monospace" }}>Confidence</div>
          </div>
        </div>
        <p style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.8 }}>{data.whyBestFit}</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "#0a1120", padding: 4, borderRadius: 12, border: "1px solid #1e293b" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: "9px 4px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "monospace",
              background: tab === t.id ? recColor : "transparent",
              color: tab === t.id ? "#fff" : "#475569", transition: "all 0.2s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Dimension scores */}
          <Card>
            <SectionTitle>Dimension Scores</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {Object.entries(data.dimensionScores).map(([k, v]) => <Gauge key={k} label={k} value={v} />)}
            </div>
          </Card>

          {/* Key factors */}
          <Card>
            <SectionTitle>Key Decision Factors</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.keyFactors.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: recColor, fontFamily: "monospace", minWidth: 20 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}>{f}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Real-world comparison */}
          {data.realWorldComparison && (
            <Card>
              <SectionTitle>Real-World Comparison</SectionTitle>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ fontSize: 36 }}>🌐</div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>
                    Similar to: {data.realWorldComparison.similarSystem}
                  </p>
                  <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 8 }}>{data.realWorldComparison.howSimilar}</p>
                  <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
                    <span style={{ color: "#475569" }}>Their approach: </span>{data.realWorldComparison.theirApproach}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Polyglot architecture */}
          {data.polyglotArchitecture && (
            <Card>
              <SectionTitle>Polyglot Architecture Layers</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.polyglotArchitecture.layers.map((l, i) => (
                  <div key={i} style={{ background: "#080f1a", border: "1px solid #1e293b", borderRadius: 10, padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{l.layer}</span>
                      <Tag text={l.database} color="#8b5cf6" />
                      <Tag text={l.pattern} color="#6366f1" />
                    </div>
                    <p style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Stores: <span style={{ color: "#94a3b8" }}>{l.stores}</span></p>
                    <p style={{ fontSize: 12, color: "#475569" }}>{l.reason}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── SCHEMA ── */}
      {tab === "schema" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <SectionTitle>Schema Design Overview</SectionTitle>
            <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7 }}>{data.schemaStructure.description}</p>
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.schemaStructure.entities.map(e => <SchemaBlock key={e.name} entity={e} />)}
          </div>
        </div>
      )}

      {/* ── PATTERNS ── */}
      {tab === "patterns" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card style={{ marginBottom: 4 }}>
            <SectionTitle>Recommended Schema Patterns</SectionTitle>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
              These patterns are specifically selected for your project's characteristics. Each is applied to a specific part of your system.
            </p>
          </Card>
          {data.recommendedPatterns.map((p, i) => (
            <div key={i} style={{ background: "#0f172a", border: `1px solid ${paradigmColor(p.paradigm)}33`, borderRadius: 12, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", flex: 1 }}>{p.name}</span>
                <Tag text={p.paradigm} color={paradigmColor(p.paradigm)} />
              </div>
              <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 6 }}>{p.reason}</p>
              <p style={{ fontSize: 12, color: "#475569" }}>
                Applied to: <span style={{ color: "#64748b", fontFamily: "monospace" }}>{p.appliesTo}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── ASSESSMENT ── */}
      {tab === "assessment" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Risk */}
          <Card>
            <SectionTitle>Risk Assessment</SectionTitle>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{data.riskAssessment.level === "High" ? "🔴" : data.riskAssessment.level === "Medium" ? "🟡" : "🟢"}</span>
              <div>
                <span style={{ fontSize: 16, fontWeight: 700, color: levelColor(data.riskAssessment.level) }}>{data.riskAssessment.level} Risk</span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, marginBottom: 12 }}>{data.riskAssessment.reason}</p>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, fontFamily: "monospace", marginBottom: 8 }}>Mitigations</p>
              {data.riskAssessment.mitigations.map((m, i) => (
                <p key={i} style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>→ {m}</p>
              ))}
            </div>
          </Card>

          {/* Governance */}
          <Card>
            <SectionTitle>Governance Assessment</SectionTitle>
            {[
              { label: "Auditability",         value: data.governanceAssessment.auditability },
              { label: "Compliance Readiness", value: data.governanceAssessment.complianceReadiness },
              { label: "Data Lineage",         value: data.governanceAssessment.dataLineage },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1e293b" }}>
                <span style={{ fontSize: 13, color: "#94a3b8", fontFamily: "monospace" }}>{item.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: levelColor(item.value), fontFamily: "monospace" }}>
                  {levelIcon(item.value)} {item.value}
                </span>
              </div>
            ))}
            <p style={{ fontSize: 12, color: "#475569", marginTop: 12, lineHeight: 1.6 }}>{data.governanceAssessment.notes}</p>
          </Card>

          {/* Future Readiness */}
          <Card>
            <SectionTitle>Future Readiness</SectionTitle>
            {[
              { label: "AI / ML Readiness",    value: data.futureReadiness.aiReadiness },
              { label: "Cloud Readiness",      value: data.futureReadiness.cloudReadiness },
              { label: "Scalability Readiness",value: data.futureReadiness.scalabilityReadiness },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1e293b" }}>
                <span style={{ fontSize: 13, color: "#94a3b8", fontFamily: "monospace" }}>{item.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: levelColor(item.value), fontFamily: "monospace" }}>
                  {levelIcon(item.value)} {item.value}
                </span>
              </div>
            ))}
            <p style={{ fontSize: 12, color: "#475569", marginTop: 12, lineHeight: 1.6 }}>{data.futureReadiness.notes}</p>
          </Card>
        </div>
      )}

      {/* ── ROADMAP ── */}
      {tab === "roadmap" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card style={{ marginBottom: 4 }}>
            <SectionTitle>Implementation Roadmap</SectionTitle>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
              A step-by-step implementation plan for your schema design, generated specifically for your project.
            </p>
          </Card>
          {data.implementationRoadmap.map((phase, i) => (
            <div key={i} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "12px 18px", background: "#080f1a", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: recColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0, fontFamily: "monospace" }}>
                  {phase.phase}
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{phase.title}</span>
              </div>
              <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                {phase.tasks.map((task, j) => (
                  <div key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: recColor, fontSize: 12, fontFamily: "monospace", marginTop: 2, flexShrink: 0 }}>›</span>
                    <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{task}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <button onClick={onReset}
          style={{ padding: "10px 20px", background: "transparent", color: "#475569", border: "1px solid #1e293b", borderRadius: 10, cursor: "pointer", fontSize: 13, fontFamily: "monospace" }}>
          ← New Analysis
        </button>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [description, setDesc]  = useState("");
  const [stage, setStage]       = useState("input"); // input | loading | results | error
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState("");
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
      setError(e.message || "Something went wrong. Please try again.");
      setStage("error");
    }
  }, [description]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050c18",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#f1f5f9",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        textarea:focus{outline:none;}
        textarea{resize:vertical;}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:#0a1120}
        ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:99px}
        button:hover{opacity:0.88}
        @media print{.no-print{display:none!important}body{background:white;color:black}}
      `}</style>

      {/* Nav */}
      <nav
        style={{
          background: "#080f1a",
          borderBottom: "1px solid #1e293b",
          height: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "linear-gradient(135deg,#3b82f6,#6366f1)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            🗄️
          </div>
          <div>
            <span
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: "#f1f5f9",
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: -0.3,
              }}
            >
              SPCS
            </span>
            <span
              style={{
                fontSize: 12,
                color: "#334155",
                marginLeft: 8,
                fontFamily: "monospace",
              }}
            >
              {" "}
              (Schema Pattern Comparison System){" "}
            </span>
          </div>
        </div>
      </nav>

      <main
        style={{ maxWidth: 780, margin: "0 auto", padding: "36px 18px 80px" }}
      >
        {/* ── INPUT STAGE ── */}
        {(stage === "input" || stage === "error") && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            {/* Hero */}
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: 99,
                  padding: "6px 16px",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#22c55e",
                    animation: "pulse 2s ease-in-out infinite",
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    fontFamily: "monospace",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  Powered by Gemini 2.5 Flash
                </span>
              </div>
              <h1
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  color: "#f1f5f9",
                  fontFamily: "'Space Grotesk', sans-serif",
                  letterSpacing: -0.5,
                  marginBottom: 12,
                  lineHeight: 1.15,
                }}
              >
                Describe your project.
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(90deg,#3b82f6,#8b5cf6,#10b981)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    lineHeight: 1.15
                  }}
                >
                  Get intelligent schema recommendations, design patterns, and
                  implementation guidance in seconds.
                </span>
              </h1>
              <p style={{ fontSize: 15, color: "#fafafa", lineHeight: 1.7 }}>
                📚 Grounded in{" "}
                <strong>33 peer-reviewed works (2018–2026)</strong> ·
                Methodology: <strong>OOADM + UML</strong> · Frameworks: CAP
                theorem, ACID/BASE, Schema-on-read vs Schema-on-write
              </p>
            </div>

            {/* Input box */}
            <div
              style={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 16,
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              <textarea
                ref={textRef}
                value={description}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Describe your project in detail. For example: 'I'm building a hospital management system that tracks patients, doctors, appointments, prescriptions, and billing. It must comply with HIPAA regulations and keep a full audit trail of all changes to medical records...'"
                style={{
                  width: "100%",
                  minHeight: 160,
                  background: "transparent",
                  border: "none",
                  padding: "20px 22px",
                  fontSize: 15,
                  color: "#e2e8f0",
                  lineHeight: 1.7,
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <div
                style={{
                  padding: "12px 18px",
                  borderTop: "1px solid #1e293b",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#080f1a",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: description.length < 20 ? "#ef4444" : "#475569",
                    fontFamily: "monospace",
                  }}
                >
                  {description.length} chars{" "}
                  {description.length < 20
                    ? "· minimum 20 required"
                    : "· ready"}
                </span>
                <button
                  onClick={handleAnalyse}
                  disabled={description.trim().length < 20}
                  style={{
                    padding: "10px 24px",
                    background:
                      description.trim().length >= 20
                        ? "linear-gradient(135deg,#3b82f6,#6366f1)"
                        : "#1e293b",
                    color: description.trim().length >= 20 ? "#fff" : "#334155",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor:
                      description.trim().length >= 20
                        ? "pointer"
                        : "not-allowed",
                    fontFamily: "monospace",
                    transition: "all 0.2s",
                  }}
                >
                  Analyse with AI →
                </button>
              </div>
            </div>

            {/* Error */}
            {stage === "error" && (
              <div
                style={{
                  background: "#1a0a0a",
                  border: "1px solid #ef444444",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: "#ef4444",
                    fontFamily: "monospace",
                  }}
                >
                  ⚠ Error: {error}
                </p>
              </div>
            )}

            {/* Examples */}
            <div>
              <p
                style={{
                  fontSize: 11,
                  color: "#334155",
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 10,
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
                      padding: "11px 16px",
                      background: "#080f1a",
                      border: "1px solid #1e293b",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontSize: 13,
                      color: "#64748b",
                      lineHeight: 1.5,
                      transition: "all 0.15s",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <span
                      style={{
                        color: "#3b82f6",
                        fontFamily: "monospace",
                        marginRight: 8,
                      }}
                    >
                      ›
                    </span>
                    {ex.length > 100 ? ex.slice(0, 100) + "..." : ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {stage === "loading" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div
              style={{
                marginBottom: 20,
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 12,
                padding: "14px 18px",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: "#475569",
                  fontFamily: "monospace",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Analysing
              </p>
              <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6 }}>
                {description.length > 120
                  ? description.slice(0, 120) + "..."
                  : description}
              </p>
            </div>
            <TypingIndicator />
          </div>
        )}

        {/* ── RESULTS ── */}
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
