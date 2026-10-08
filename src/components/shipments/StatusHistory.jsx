import Icon from '../Icon'
import StatusBadge from '../StatusBadge'
import { formatDate } from '../../utils/format'
import { STATUS } from '../../utils/shipmentStatus'

const when = (ms) => formatDate(ms, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })

// Status changes, newest first, as returned by statusHistory().
export default function StatusHistory({ changes }) {
  return (
    <ol className="status-history">
      {changes.map((c, i) => (
        <li key={c.id} className={`status-history__item tone--${STATUS[c.status].tone} ${i === 0 ? 'is-current' : ''}`}>
          <span className="status-history__dot"><Icon name={STATUS[c.status].icon} size={14} /></span>
          <div className="status-history__body">
            <div className="status-history__top">
              <StatusBadge status={c.status} />
              {c.from && <span className="muted status-history__from">from {STATUS[c.from].label}</span>}
              {i === 0 && <span className="status-history__current">Current</span>}
            </div>
            <time dateTime={new Date(c.time).toISOString()}>{when(c.time)}</time>
            {c.note && <p>{c.note}</p>}
            <span className="status-history__meta">
              {c.location && <span><Icon name="pin" size={12} />{c.location}</span>}
              <span><Icon name={c.source === 'manual' ? 'user' : 'activity'} size={12} />{c.by ?? (c.source === 'manual' ? 'Staff' : 'Automatic scan')}</span>
            </span>
          </div>
        </li>
      ))}
    </ol>
  )
}
