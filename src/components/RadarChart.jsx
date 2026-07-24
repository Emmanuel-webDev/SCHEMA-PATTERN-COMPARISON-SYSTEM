const SIZE = 460;
const CENTER = SIZE / 2;
const MAX_RADIUS = 105;
const LABEL_OFFSET = 16;
const RINGS = [0.25, 0.5, 0.75, 1];
const ACCENT = "#E8341A";

function pointAt(angle, radius) {
  return {
    x: CENTER + radius * Math.sin(angle),
    y: CENTER - radius * Math.cos(angle),
  };
}

function polygonPoints(angles, radius) {
  return angles.map((a) => pointAt(a, radius)).map(({ x, y }) => `${x},${y}`).join(" ");
}

// Every label wraps to two lines (except single-word ones) so even the
// longest dimension names stay well inside the margin reserved around the
// plot — long one-line labels on the near-horizontal axes are what overflow
// the viewBox and get clipped by the SVG's default overflow:hidden.
function wrapLabel(text) {
  const words = text.split(" ");
  if (words.length < 2) return [text];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

export default function RadarChart({ scores }) {
  const entries = Object.entries(scores);
  const n = entries.length;
  const angles = entries.map((_, i) => (i * 2 * Math.PI) / n);

  const dataPoints = entries.map(([, value], i) => pointAt(angles[i], (value / 100) * MAX_RADIUS));
  const dataPath = dataPoints.map(({ x, y }) => `${x},${y}`).join(" ");

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
      >
        {/* grid rings */}
        {RINGS.map((r) => (
          <polygon
            key={r}
            points={polygonPoints(angles, r * MAX_RADIUS)}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        ))}

        {/* axis lines */}
        {angles.map((a, i) => {
          const { x, y } = pointAt(a, MAX_RADIUS);
          return (
            <line key={i} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="#e5e7eb" strokeWidth={1} />
          );
        })}

        {/* data area */}
        <polygon points={dataPath} fill={ACCENT} fillOpacity={0.1} stroke={ACCENT} strokeWidth={2} />

        {/* vertex markers */}
        {dataPoints.map(({ x, y }, i) => (
          <circle key={i} cx={x} cy={y} r={4} fill={ACCENT} stroke="#fff" strokeWidth={2} />
        ))}

        {/* axis labels */}
        {entries.map(([key], i) => {
          const label = key.replace(/([A-Z])/g, " $1").trim().toUpperCase();
          const lines = wrapLabel(label);
          const { x, y } = pointAt(angles[i], MAX_RADIUS + LABEL_OFFSET);
          const dx = Math.sin(angles[i]);
          const anchor = dx > 0.15 ? "start" : dx < -0.15 ? "end" : "middle";
          return (
            <text
              key={key}
              x={x}
              y={y}
              textAnchor={anchor}
              fontSize={9}
              fontFamily="'JetBrains Mono', monospace"
              fill="#9ca3af"
              letterSpacing={0.5}
            >
              {lines.map((line, li) => (
                <tspan key={li} x={x} dy={li === 0 ? 0 : 11}>
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
