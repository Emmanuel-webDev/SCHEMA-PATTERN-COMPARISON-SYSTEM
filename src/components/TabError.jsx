export default function TabError({ message, onRetry }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "48px 24px",
        border: "1px solid #fecaca",
        borderRadius: 8,
        background: "#fef2f2",
      }}
    >
      <span
        style={{
          fontSize: 13,
          color: "#dc2626",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        ⚠ {message}
      </span>
      <button
        onClick={onRetry}
        style={{
          padding: "8px 18px",
          background: "#0d0d0d",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        Retry
      </button>
    </div>
  );
}
