// Progress-ring status icon: a colored outline circle with a pie wedge filled to
// `fraction` of the way around (starting at the top). Conveys a status's position in
// the domain's ordered pipeline — e.g. 4 statuses fill 90°/180°/270°/360°.

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
  const ringR = r - 1; // inset so the stroke isn't clipped

  // Wedge geometry: start at top (−90°), sweep clockwise by f * 360°.
  const angle = f * 2 * Math.PI;
  const endX = r + ringR * Math.sin(angle);
  const endY = r - ringR * Math.cos(angle);
  const largeArc = f > 0.5 ? 1 : 0;
  const wedge = `M ${r} ${r} L ${r} ${r - ringR} A ${ringR} ${ringR} 0 ${largeArc} 1 ${endX} ${endY} Z`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle
        cx={r}
        cy={r}
        r={ringR}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
      />
      {f >= 1 ? (
        <circle cx={r} cy={r} r={ringR} fill={color} />
      ) : f > 0 ? (
        <path d={wedge} fill={color} />
      ) : null}
    </svg>
  );
}
