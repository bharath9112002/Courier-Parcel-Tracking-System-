import Icon from '../Icon'
import { STATUS } from '../../utils/shipmentStatus'
import { timeAgo } from '../../utils/format'

export default function RecentActivity({ items, now }) {
  return (
    <section className="card activity">
      <header className="card__head">
        <div>
          <h2>Recent activities</h2>
          <p className="muted">Latest shipment updates</p>
        </div>
      </header>

      <ol className="activity__list">
        {items.map((s) => {
          const status = STATUS[s.status]
          return (
            <li key={`${s.id}-${s.updatedAt}`} className="activity__item">
              <span className={`activity__icon tone--${status.tone}`}>
                <Icon name={status.icon} size={16} />
              </span>
              <div className="activity__body">
                <p>
                  <strong>#{s.id}</strong> {status.verb}
                  <span className="muted"> · {s.origin} → {s.destination}</span>
                </p>
                <span className="activity__meta">
                  {s.customerName} · {timeAgo(s.updatedAt, now)}
                </span>
              </div>
              <span className={`badge badge--${status.tone}`}>{status.label}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
