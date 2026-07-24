import Tag from "./Tag.jsx";
import { SqlFields, JsonFields } from "./SchemaFields.jsx";

export default function SchemaComparisonBlock({ entity }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <div
        style={{
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
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
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
        }}
        className="spcs-compare-grid"
      >
        <div style={{ borderRight: "1px solid #e5e7eb" }}>
          <div
            style={{
              padding: "10px 18px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            <Tag text="Relational" color="#1d4ed8" />
            <Tag text={entity.relational.database} color="#6b7280" />
          </div>
          <SqlFields name={entity.name} fields={entity.relational.fields} />
        </div>
        <div>
          <div
            style={{
              padding: "10px 18px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            <Tag text="Document" color="#059669" />
            <Tag text={entity.document.database} color="#6b7280" />
          </div>
          <JsonFields fields={entity.document.fields} />
        </div>
      </div>

      <div style={{ padding: "16px 18px" }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#9ca3af",
            textTransform: "uppercase",
            letterSpacing: 1.5,
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 10,
          }}
        >
          Where they diverge
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {entity.divergencePoints.map((d, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #f3f4f6",
                borderRadius: 6,
                padding: "10px 14px",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                {d.aspect}
              </p>
              <p style={{ fontSize: 12, color: "#1d4ed8", marginBottom: 4 }}>
                <span style={{ color: "#6b7280", fontWeight: 600 }}>Relational: </span>
                {d.relationalApproach}
              </p>
              <p style={{ fontSize: 12, color: "#059669" }}>
                <span style={{ color: "#6b7280", fontWeight: 600 }}>Document: </span>
                {d.documentApproach}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
