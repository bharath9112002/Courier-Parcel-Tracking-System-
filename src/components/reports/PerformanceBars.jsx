import { formatNumber } from '../../utils/format'
import { OUTCOMES } from './chartUtils'

// A % label goes inside a segment only when it fits.
const INSIDE_MIN = 13

const days = (n) => `${n.toFixed(1)} d`

function Row({ row, strong }) {
  const parts = OUTCOMES.map((o) => ({ ...o, value: row[o.key], share: row.finished ? (row[o.key] / row.finished) * 100 : 0 }))
  return (
    <li className={`perf__row ${strong ? 'perf__row--total' : ''}`}>
      <div className="perf__name">
        <strong>{row.label}</strong>
        <span className="muted">{formatNumber(row.finished)} completed</span>
      </div>
      <div className="perf__bar">
        {parts.filter((p) => p.value > 0).map((p) => (
          <span
            key={p.key}
            className={`perf__seg perf__seg--${p.key}`}
            style={{ flexGrow: p.share, '--c': p.color }}
            tabIndex={0}
            aria-label={`${row.label}, ${p.label.toLowerCase()}: ${formatNumber(p.value)} (${p.share.toFixed(1)}%)`}
            data-tip={`${p.label}: ${formatNumber(p.value)} · ${p.share.toFixed(1)}%`}
          >
            {p.share >= INSIDE_MIN && <span aria-hidden="true">{Math.round(p.share)}%</span>}
          </span>
        ))}
      </div>
      <div className="perf__figures">
        <strong>{row.onTimeRate.toFixed(1)}%</strong>
        <span className="muted">
          avg {days(row.avgDays)}
          {row.promisedDays != null && <> · {row.promisedDays ? `${row.promisedDays} d promised` : 'same day'}</>}
        </span>
      </div>
    </li>
  )
}

export default function PerformanceBars({ total, services }) {
  return (
    <ol className="perf">
      <li className="perf__head" aria-hidden="true">
        <span>Service</span>
        <span>Outcome of completed shipments</span>
        <span>On time</span>
      </li>
      <Row row={{ ...total, label: 'All services' }} strong />
      {services.map((s) => <Row key={s.key} row={s} />)}
    </ol>
  )
}
