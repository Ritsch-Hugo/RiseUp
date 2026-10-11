const WIDTH = 318
const HEIGHT = 90
const PAD_X = 4

/** Courbe de progression ; une seule valeur = un point centré. */
export function LineChart({ values, label }: { values: number[]; label: string }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = (max - min) * 0.2 || 1
  const lo = min - pad
  const hi = max + pad
  const pts = values.map((v, i) => [
    values.length === 1 ? WIDTH / 2 : PAD_X + (i * (WIDTH - 2 * PAD_X)) / (values.length - 1),
    HEIGHT - 6 - ((v - lo) / (hi - lo)) * (HEIGHT - 12),
  ])
  const line = pts.map(([x, y]) => `${x!.toFixed(1)},${y!.toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]!
  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={label}
    >
      {[22.5, 45, 67.5].map((y) => (
        <line key={y} x1={0} x2={WIDTH} y1={y} y2={y} stroke="var(--card-2)" strokeWidth={1} />
      ))}
      {pts.length > 1 && (
        <>
          <polygon
            points={`${line} ${WIDTH - PAD_X},${HEIGHT} ${PAD_X},${HEIGHT}`}
            fill="var(--accent)"
            fillOpacity={0.14}
          />
          <polyline
            points={line}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      <circle cx={last[0]} cy={last[1]} r={4.5} fill="var(--accent)" />
    </svg>
  )
}
