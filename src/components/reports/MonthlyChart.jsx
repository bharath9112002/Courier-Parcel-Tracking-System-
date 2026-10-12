import { useState } from 'react'
import { useElementWidth } from '../../hooks/useElementWidth'
import { formatNumber } from '../../utils/format'
import { columnPath, compact, niceTicks, tipBeside } from './chartUtils'

const HEIGHT = 250
const M = { top: 22, right: 8, bottom: 30, left: 44 }
const MAX_BAR = 24

// Shipments booked per month. The month in progress is drawn lighter. The
// busiest and latest months are labelled; hover or focus a month for details.
export default function MonthlyChart({ months }) {
  const [ref, width] = useElementWidth()
  const [active, setActive] = useState(null)

  const plotW = Math.max(width - M.left - M.right, 10)
  const plotH = HEIGHT - M.top - M.bottom
  const ticks = niceTicks(Math.max(...months.map((m) => m.total)))
  const top = ticks[ticks.length - 1]
  const band = plotW / months.length
  const barW = Math.min(MAX_BAR, band * 0.6)
  const y = (v) => M.top + plotH - (v / top) * plotH
  const peak = months.reduce((best, m, i) => (m.total > months[best].total ? i : best), 0)
  const labelled = new Set([peak, months.length - 1])
  // Every other month label when they would touch.
  const showEvery = band < 56 ? 2 : 1

  const m = active != null ? months[active] : null

  return (
    <div className="chart" ref={ref}>
      <svg width={width} height={HEIGHT} role="img" aria-label={`Shipments booked per month, ${months.length} months. Peak ${formatNumber(months[peak].total)} in ${months[peak].label}.`}>
        {ticks.map((t) => (
          <g key={t}>
            <line className={t ? 'chart__grid' : 'chart__axis'} x1={M.left} x2={M.left + plotW} y1={y(t)} y2={y(t)} />
            <text className="chart__tick" x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end">{compact(t)}</text>
          </g>
        ))}

        {months.map((mo, i) => {
          const cx = M.left + band * (i + 0.5)
          const h = Math.max(y(0) - y(mo.total), 0)
          return (
            <g
              key={mo.key}
              className={`chart__band ${active === i ? 'is-active' : ''}`}
              tabIndex={0}
              role="img"
              aria-label={`${mo.label}${mo.partial ? ', month to date' : ''}: ${mo.total} booked, ${mo.delivered} delivered`}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            >
              <rect className="chart__hit" x={M.left + band * i} y={M.top} width={band} height={plotH} />
              <path
                className={`chart__bar ${mo.partial ? 'is-partial' : ''}`}
                d={columnPath(cx - barW / 2, y(mo.total), barW, h)}
                style={{ '--c': 'var(--series-1)' }}
              />
              {labelled.has(i) && (
                <text className="chart__value" x={cx} y={y(mo.total) - 7} textAnchor="middle">{formatNumber(mo.total)}</text>
              )}
              {(i % showEvery === (months.length - 1) % showEvery) && (
                <text className="chart__tick" x={cx} y={HEIGHT - 8} textAnchor="middle">
                  {mo.label}{mo.partial ? '*' : ''}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {m && (
        <div className="chart-tip" style={{ ...tipBeside(M.left + band * (active + 0.5), width, barW / 2 + 10), top: M.top }} aria-hidden="true">
          <span className="chart-tip__title">{m.label}{m.partial ? ' (to date)' : ''}</span>
          <span className="chart-tip__row"><strong>{formatNumber(m.total)}</strong> booked</span>
          <span className="chart-tip__row"><strong>{formatNumber(m.delivered)}</strong> delivered</span>
          <span className="chart-tip__row"><strong>{m.successRate.toFixed(1)}%</strong> success rate</span>
        </div>
      )}
      {months.some((mo) => mo.partial) && <p className="chart__note">* Month to date</p>}
    </div>
  )
}
