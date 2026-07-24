import { useState, useEffect } from "react";

const MESSAGES = [
  "Analysing project requirements",
  "Evaluating consistency needs",
  "Scoring scalability dimensions",
  "Selecting schema patterns",
  "Designing schema structure",
  "Building implementation roadmap",
];

export default function TypingIndicator() {
  const [dots, setDots] = useState("");
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    const d = setInterval(
      () => setDots((p) => (p.length >= 3 ? "" : p + ".")),
      400,
    );
    const m = setInterval(() => setMsgIdx((i) => (i + 1) % MESSAGES.length), 1800);
    return () => {
      clearInterval(d);
      clearInterval(m);
    };
  }, []);
  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 24px",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 6,
          marginBottom: 24,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#E8341A",
              animation: `spcs-pulse 1.2s ${i * 0.2}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
      <p
        style={{
          fontSize: 15,
          color: "#0d0d0d",
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: 8,
        }}
      >
        {MESSAGES[msgIdx]}
        {dots}
      </p>
      <p
        style={{
          fontSize: 12,
          color: "#9ca3af",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        SPCS Engine · AI Analysis in progress
      </p>
    </div>
  );
}
