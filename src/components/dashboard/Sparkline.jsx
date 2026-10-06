import { useState } from 'react'
import { formatDate } from '../../utils/format'

const W = 120
const H = 36
const PAD = 4

// 14-day trend line. Hovering a day shows its value; the latest day is accented.
export default function Sparkline({ data, unit }) {
  const [active, setActive] = useState(null)
  const max = Math.max(...data.map((d) => d.value), 1)
  const step = (W - PAD * 2) / (data.length - 1)
  const points = data.map((d, i) => [PAD + i * step, H - PAD - (d.value / max) * (H - PAD * 2)])
  const last = points[points.length - 1]
  const shown = active ?? data.length - 1

  return (
    <div className="sparkline" onMouseLeave={() => setActive(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img"
        aria-label={`Last ${data.length} days, from ${data[0].value} to ${data[data.length - 1].value} ${unit}`}>
        <polyline className="sparkline__line" points={points.map((p) => p.join(',')).join(' ')} />
        {active != null && (
          <line className="sparkline__cursor" x1={points[active][0]} x2={points[active][0]} y1="0" y2={H} />
        )}
        {data.map((d, i) => (
          <rect key={d.date} x={points[i][0] - step / 2} y="0" width={step} height={H}
            fill="transparent" onMouseEnter={() => setActive(i)} />
        ))}
      </svg>
      <span className="sparkline__dot" style={{
        left: `${((active != null ? points[active][0] : last[0]) / W) * 100}%`,
        top: `${((active != null ? points[active][1] : last[1]) / H) * 100}%`,
      }} />
      <span className="sparkline__tip" aria-live="polite">
        {formatDate(data[shown].date, { day: 'numeric', month: 'short' })} · {data[shown].value} {unit}
      </span>
    </div>
  )
}
