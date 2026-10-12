import { formatNumber, initials } from '../../utils/format'

// Ranked bars, one colour: the length is the comparison, the number is at the tip.
export default function TopCustomers({ customers }) {
  const max = Math.max(...customers.map((c) => c.shipments), 1)
  return (
    <ol className="top-customers">
      {customers.map((c, i) => (
        <li key={c.id}>
          <span className="top-customers__rank">{i + 1}</span>
          <span className="avatar avatar--sm" aria-hidden="true">{initials(c.name)}</span>
          <div className="top-customers__body">
            <div className="top-customers__name">
              <strong>{c.name}</strong>
              <span className="muted">{c.city} · {c.share.toFixed(1)}% of shipments · {c.successRate.toFixed(0)}% delivered</span>
            </div>
            <div className="top-customers__track">
              <span className="top-customers__bar" style={{ width: `${(c.shipments / max) * 100}%` }} />
              <span className="top-customers__value">{formatNumber(c.shipments)}</span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
