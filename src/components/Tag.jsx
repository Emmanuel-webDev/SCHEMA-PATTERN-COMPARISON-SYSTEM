export default function Tag({ text, color = "#1d4ed8" }) {
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
