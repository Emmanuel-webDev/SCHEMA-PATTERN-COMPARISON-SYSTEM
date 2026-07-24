import { useState } from "react";
import Tag from "./Tag.jsx";
import { SqlFields, JsonFields } from "./SchemaFields.jsx";
import { paradigmColor } from "../colors.js";

export default function SchemaBlock({ entity }) {
  const [open, setOpen] = useState(true);
  const pc = paradigmColor(entity.paradigm);
  const isDoc = entity.type === "collection";

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
      {open &&
        (isDoc ? (
          <JsonFields fields={entity.fields} />
        ) : (
          <SqlFields name={entity.name} fields={entity.fields} />
        ))}
    </div>
  );
}
