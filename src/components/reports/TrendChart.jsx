import { useState } from 'react'
import { useElementWidth } from '../../hooks/useElementWidth'
import { formatDate, formatNumber } from '../../utils/format'
import { compact, niceTicks, tipBeside } from './chartUtils'

const HEIGHT = 260
const M = { top: 14, right: 48, bottom: 30, left: 44 }
const LABEL_GAP = 16

const day = (ms) => formatDate(ms - 1, { day: 'numeric', month: 'short' })

// Weekly line chart. A crosshair snaps to the nearest week and the tooltip
// lists every series; arrow keys move it when the chart has focus.
// series: [{ key, label, color }], points: [{ key, from, to, [series.key]: n }]
export default function TrendChart({ series, points }) {
  const [ref, width] = useElementWidth()
  const [active, setActive] = useState(null)

  const plotW = Math.max(width - M.left - M.right, 10)
  const plotH = HEIGHT - M.top - M.bottom
  const ticks = niceTicks(Math.max(...points.flatMap((p) => series.map((s) => p[s.key]))))
  const top = ticks[ticks.length - 1]
  const x = (i) => M.left + (points.length > 1 ? (i / (points.length - 1)) * plotW : plotW / 2)
  const y = (v) => M.top + plotH - (v / top) * plotH
  const line = (key) => points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p[key])}`).join('')
  const first = series[0].key
  const area = `${line(first)}L${x(points.length - 1)},${y(0)}L${x(0)},${y(0)}Z`

  const every = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(plotW / 90))))
  const xTicks = points.map((_, i) => i).filter((i) => (points.length - 1 - i) % every === 0)

  // End labels only when they don't collide; the legend and tooltip cover the rest.
  const last = points.length - 1
  const ends = series.map((s) => y(points[last][s.key]))
  const labelEnds = ends.every((a, i) => ends.every((b, j) => i === j || Math.abs(a - b) >= LABEL_GAP))

  const pick = (clientX, rect) => {
    const i = Math.round(((clientX - rect.left - M.left) / plotW) * (points.length - 1))
    setActive(Math.max(0, Math.min(last, i)))
  }

  const onKeyDown = (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, Home: -Infinity, End: Infinity }[e.key]
    if (step === undefined) return
    e.preventDefault()
    setActive((i) => Math.max(0, Math.min(last, (i ?? last) + step)))
  }


  return (
    <div className="chart" ref={ref}>
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        tabIndex={0}
        aria-label={`Weekly trend, ${points.length} weeks. ${series
          .map((s) => `${s.label}: ${formatNumber(points[last][s.key])} in the latest week`)
          .join('. ')}. Use the arrow keys to read each week.`}
        onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive(last)}
        onBlur={() => setActive(null)}
        onKeyDown={onKeyDown}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line className={t ? 'chart__grid' : 'chart__axis'} x1={M.left} x2={M.left + plotW} y1={y(t)} y2={y(t)} />
            <text className="chart__tick" x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end">{compact(t)}</text>
          </g>
        ))}
        {xTicks.map((i) => (
          <text key={i} className="chart__tick" x={x(i)} y={HEIGHT - 8} textAnchor={i === last ? 'end' : i === 0 ? 'start' : 'middle'}>
            {day(points[i].to)}
          </text>
        ))}

        <path d={area} className="chart__area" style={{ '--c': series[0].color }} />
        {series.map((s) => (
          <path key={s.key} d={line(s.key)} className="chart__line" style={{ '--c': s.color }} />
        ))}

        {active != null && <line className="chart__crosshair" x1={x(active)} x2={x(active)} y1={M.top} y2={M.top + plotH} />}
        {series.map((s) => {
          const i = active ?? last
          return <circle key={s.key} className="chart__dot" cx={x(i)} cy={y(points[i][s.key])} r="4" style={{ '--c': s.color }} />
        })}
        {labelEnds &&
          series.map((s, k) => (
            <text key={s.key} className="chart__end-label" x={x(last) + 9} y={ends[k]} dy="0.32em">
              {formatNumber(points[last][s.key])}
            </text>
          ))}
      </svg>

      {active != null && (
        <div className="chart-tip" style={tipBeside(x(active), width)} aria-hidden="true">
          <span className="chart-tip__title">Week to {day(points[active].to)}</span>
          {series.map((s) => (
            <span key={s.key} className="chart-tip__row">
              <span className="chart-tip__key" style={{ '--c': s.color }} />
              <strong>{formatNumber(points[active][s.key])}</strong> {s.label.toLowerCase()}
            </span>
          ))}
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {active != null && `Week to ${day(points[active].to)}: ${series.map((s) => `${points[active][s.key]} ${s.label.toLowerCase()}`).join(', ')}`}
      </p>
    </div>
  )
}
