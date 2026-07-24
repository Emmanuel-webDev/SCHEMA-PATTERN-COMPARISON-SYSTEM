import { useState } from "react";
import Tag from "./Tag.jsx";
import Gauge from "./Gauge.jsx";
import Card from "./Card.jsx";
import SectionLabel from "./SectionLabel.jsx";
import LevelRow from "./LevelRow.jsx";
import SchemaBlock from "./SchemaBlock.jsx";
import SchemaComparisonBlock from "./SchemaComparisonBlock.jsx";
import RadarChart from "./RadarChart.jsx";
import TabLoading from "./TabLoading.jsx";
import TabError from "./TabError.jsx";
import { paradigmColor } from "../colors.js";
import { downloadReportPdf } from "../pdf/generateReportPdf.js";

export default function Results({ data, onReset, detailsError, onRetryDetails }) {
  const [tab, setTab] = useState("overview");
  const [pdfError, setPdfError] = useState("");
  const hasDetails = Boolean(data.schemaStructure);
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
    { id: "compare", label: "Compare" },
    { id: "patterns", label: "Patterns" },
    { id: "assessment", label: "Assessment" },
    { id: "roadmap", label: "Roadmap" },
  ];

  const handleDownloadPdf = () => {
    setPdfError("");
    try {
      downloadReportPdf(data);
    } catch {
      setPdfError("Could not generate the PDF. Please try again.");
    }
  };

  return (
    <div style={{ animation: "spcs-fadeIn 0.4s ease" }}>
      {/* Result banner */}
      <Card style={{ padding: "28px 32px", marginBottom: 24 }}>
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
      </Card>

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
          <Card>
            <SectionLabel>Dimension Scores</SectionLabel>
            <RadarChart scores={data.dimensionScores} />
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
              {Object.entries(data.dimensionScores).map(([k, v]) => (
                <Gauge key={k} label={k} value={v} />
              ))}
            </div>
          </Card>
          <Card>
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
          </Card>
          {data.realWorldComparison && (
            <Card>
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
            </Card>
          )}
          {data.polyglotArchitecture && (
            <Card>
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
            </Card>
          )}
        </div>
      )}

      {/* SCHEMA */}
      {tab === "schema" &&
        (hasDetails ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <SectionLabel>Schema Design Overview</SectionLabel>
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8 }}>
                {data.schemaStructure.description}
              </p>
            </Card>
            {data.schemaStructure.entities.map((e) => (
              <SchemaBlock key={e.name} entity={e} />
            ))}
          </div>
        ) : detailsError ? (
          <TabError message={detailsError} onRetry={onRetryDetails} />
        ) : (
          <TabLoading label="Designing schema structure…" />
        ))}

      {/* COMPARE */}
      {tab === "compare" &&
        (hasDetails ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <SectionLabel>Side-by-Side Schema Comparison</SectionLabel>
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8 }}>
                {data.schemaComparison.description}
              </p>
            </Card>
            {data.schemaComparison.entities.map((e) => (
              <SchemaComparisonBlock key={e.name} entity={e} />
            ))}
          </div>
        ) : detailsError ? (
          <TabError message={detailsError} onRetry={onRetryDetails} />
        ) : (
          <TabLoading label="Building schema comparison…" />
        ))}

      {/* PATTERNS */}
      {tab === "patterns" &&
        (hasDetails ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card>
              <SectionLabel>Recommended Schema Patterns</SectionLabel>
              <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>
                These patterns are specifically selected for your project's
                characteristics.
              </p>
            </Card>
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
        ) : detailsError ? (
          <TabError message={detailsError} onRetry={onRetryDetails} />
        ) : (
          <TabLoading label="Selecting schema patterns…" />
        ))}

      {/* ASSESSMENT */}
      {tab === "assessment" &&
        (hasDetails ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
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
                  color:
                    data.riskAssessment.level === "High"
                      ? "#dc2626"
                      : data.riskAssessment.level === "Medium"
                        ? "#d97706"
                        : "#16a34a",
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
          </Card>
          <Card>
            <SectionLabel>Governance Assessment</SectionLabel>
            <LevelRow label="Auditability" value={data.governanceAssessment.auditability} />
            <LevelRow
              label="Compliance Readiness"
              value={data.governanceAssessment.complianceReadiness}
            />
            <LevelRow label="Data Lineage" value={data.governanceAssessment.dataLineage} />
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
          </Card>
          <Card>
            <SectionLabel>Future Readiness</SectionLabel>
            <LevelRow label="AI / ML Readiness" value={data.futureReadiness.aiReadiness} />
            <LevelRow label="Cloud Readiness" value={data.futureReadiness.cloudReadiness} />
            <LevelRow
              label="Scalability Readiness"
              value={data.futureReadiness.scalabilityReadiness}
            />
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
          </Card>
        </div>
        ) : detailsError ? (
          <TabError message={detailsError} onRetry={onRetryDetails} />
        ) : (
          <TabLoading label="Scoring risk & governance…" />
        ))}

      {/* ROADMAP */}
      {tab === "roadmap" &&
        (hasDetails ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <SectionLabel>Implementation Roadmap</SectionLabel>
            <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>
              A step-by-step implementation plan generated specifically for your
              project.
            </p>
          </Card>
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
        ) : detailsError ? (
          <TabError message={detailsError} onRetry={onRetryDetails} />
        ) : (
          <TabLoading label="Building implementation roadmap…" />
        ))}

      <div
        style={{
          marginTop: 32,
          paddingTop: 24,
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <button
          onClick={handleDownloadPdf}
          disabled={!hasDetails}
          style={{
            padding: "10px 22px",
            background: hasDetails ? "#0d0d0d" : "#f3f4f6",
            color: hasDetails ? "#fff" : "#9ca3af",
            border: hasDetails ? "1px solid #0d0d0d" : "1px solid #e5e7eb",
            borderRadius: 6,
            cursor: hasDetails ? "pointer" : "not-allowed",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            transition: "all 0.15s",
          }}
        >
          {hasDetails ? "Download PDF ↓" : "Preparing report…"}
        </button>
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
        {pdfError && (
          <span
            style={{
              fontSize: 12,
              color: "#dc2626",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ⚠ {pdfError}
          </span>
        )}
      </div>
    </div>
  );
}
