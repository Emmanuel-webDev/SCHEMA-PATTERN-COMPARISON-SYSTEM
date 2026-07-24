export default function Card({ children, style }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "24px 28px",
        background: "#fff",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
