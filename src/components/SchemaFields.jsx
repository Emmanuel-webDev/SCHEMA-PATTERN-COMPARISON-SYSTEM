const PRE_STYLE = {
  margin: 0,
  fontSize: 12,
  lineHeight: 1.9,
  color: "#1f2937",
  fontFamily: "'JetBrains Mono', monospace",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  overflowX: "auto",
  padding: "16px 20px",
  background: "#f9fafb",
};

export function SqlFields({ name, fields }) {
  return (
    <pre style={PRE_STYLE}>
      <span style={{ color: "#7c3aed" }}>CREATE TABLE</span>{" "}
      <span style={{ color: "#16a34a" }}>{name}</span> {"(\n"}
      {fields.map((f, i) => (
        <span key={f.name}>
          {"  "}
          <span style={{ color: "#1d4ed8" }}>{f.name}</span>{" "}
          <span style={{ color: "#d97706" }}>{f.type}</span>
          {f.note ? <span style={{ color: "#9ca3af" }}> -- {f.note}</span> : ""}
          {i < fields.length - 1 ? ",\n" : "\n"}
        </span>
      ))}
      {");"}
    </pre>
  );
}

export function JsonFields({ fields }) {
  const obj = {};
  fields.forEach((f) => {
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
    <pre style={PRE_STYLE}>
      {"{\n"}
      {fields.map((f, i) => (
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
          {f.note ? <span style={{ color: "#9ca3af" }}> // {f.note}</span> : ""}
          {i < fields.length - 1 ? ",\n" : "\n"}
        </span>
      ))}
      {"}"}
    </pre>
  );
}
