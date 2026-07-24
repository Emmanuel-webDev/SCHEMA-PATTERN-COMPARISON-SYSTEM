export default function TabLoading({ label = "Generating…" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "48px 24px",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        background: "#fff",
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          border: "2px solid #e5e7eb",
          borderTopColor: "#E8341A",
          animation: "spcs-spin 0.8s linear infinite",
        }}
      />
      <span
        style={{
          fontSize: 13,
          color: "#9ca3af",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {label}
      </span>
    </div>
  );
}
