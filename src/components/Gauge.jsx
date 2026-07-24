export default function Gauge({ label, value }) {
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
