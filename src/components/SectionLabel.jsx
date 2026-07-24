export default function SectionLabel({ children }) {
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
