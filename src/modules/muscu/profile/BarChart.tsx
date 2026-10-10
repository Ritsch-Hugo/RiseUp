const WIDTH = 268
const HEIGHT = 84
const STEP = 20.9
const BAR_WIDTH = 16.9

/** Barres par semaine ; la dernière (semaine en cours) est pleine, les autres estompées. */
export function BarChart({ values, label }: { values: number[]; label: string }) {
  const max = Math.max(...values, 1)
  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={label}
    >
      {values.map((v, i) => {
        const h = Math.max(4, (v / max) * HEIGHT)
        return (
          <rect
            key={i}
            x={i * STEP}
            y={HEIGHT - h}
            width={BAR_WIDTH}
            height={h}
            rx={3}
            fill="var(--accent)"
            fillOpacity={i === values.length - 1 ? 1 : 0.4}
          />
        )
      })}
    </svg>
  )
}
