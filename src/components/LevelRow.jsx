import { levelColor } from "../colors.js";

export default function LevelRow({ label, value, last }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 0",
        borderBottom: last ? "none" : "1px solid #f3f4f6",
      }}
    >
      <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: levelColor(value),
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {value}
      </span>
    </div>
  );
}
