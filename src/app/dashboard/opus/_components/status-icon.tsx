// Radial status icon: a faint full "track" ring with a colored arc swept clockwise from
// the top to `fraction` of the way around. Conveys a status's position in the domain's
// ordered pipeline — e.g. 4 statuses fill a quarter/half/three-quarter/full ring. A
// "finished" status (ringFull) reaches fraction 1 and renders a complete ring.

export function StatusIcon({
  color,
  fraction,
  size = 14,
}: {
  color: string;
  fraction: number;
  size?: number;
}) {
  const f = Math.max(0, Math.min(1, fraction));
  const r = size / 2;
  const strokeW = size / 7; // ≈2px at 14px — thin ring
  const ringR = r - strokeW / 2; // inset so the stroke isn't clipped
  const C = 2 * Math.PI * ringR; // circumference

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Faint full track */}
      <circle
        cx={r}
        cy={r}
        r={ringR}
        fill="none"
        stroke={color}
        strokeOpacity={0.25}
        strokeWidth={strokeW}
      />
      {/* Colored arc swept from the top (−90°) clockwise by f * 360° */}
      {f > 0 && (
        <circle
          cx={r}
          cy={r}
          r={ringR}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={f >= 1 ? undefined : `${f * C} ${C}`}
          transform={`rotate(-90 ${r} ${r})`}
        />
      )}
    </svg>
  );
}
