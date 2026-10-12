import { Link } from 'react-router-dom'
import Icon from '../Icon'
import { useNotifications } from '../../context/NotificationContext'
import { useShipments } from '../../context/ShipmentContext'
import { NOTIFICATION_TYPES } from '../../utils/notifications'
import { formatDate, timeAgo } from '../../utils/format'

// One notification. Opening it marks it read. `compact` is the topbar
// dropdown; the full page adds the read/unread toggle and who made the change.
export default function NotificationItem({ notification: n, now, compact = false, onOpen }) {
  const { markRead, markUnread } = useNotifications()
  const { findShipment } = useShipments()
  const type = NOTIFICATION_TYPES[n.type] ?? NOTIFICATION_TYPES.status
  // The shipment may have been deleted since.
  const linked = Boolean(findShipment(n.shipmentId))

  const open = () => {
    markRead(n.id)
    onOpen?.()
  }

  return (
    <li className={`notif tone--${type.tone} ${n.read ? '' : 'is-unread'} ${type.alert ? 'is-alert' : ''} ${compact ? 'notif--compact' : ''}`}>
      <span className="notif__icon"><Icon name={type.icon} size={compact ? 15 : 17} /></span>
      <div className="notif__body">
        <div className="notif__top">
          <span className="notif__type">{type.label}</span>
          <time dateTime={new Date(n.time).toISOString()} title={formatDate(n.time, { dateStyle: 'medium', timeStyle: 'short' })}>
            {timeAgo(n.time, now)}
          </time>
        </div>
        {linked ? (
          <Link to={`/shipments/${n.shipmentId}`} className="notif__title" onClick={open}>{n.title}</Link>
        ) : (
          <strong className="notif__title">{n.title}</strong>
        )}
        <p className="notif__msg">{n.message}</p>
        {!compact && n.by && <span className="notif__by"><Icon name="user" size={12} /> {n.by}</span>}
      </div>
      {!n.read && <span className="notif__dot"><span className="sr-only">Unread</span></span>}
      {!compact && (
        <button
          type="button"
          className="icon-btn icon-btn--sm notif__toggle"
          onClick={() => (n.read ? markUnread(n.id) : markRead(n.id))}
          aria-label={n.read ? `Mark "${n.title}" as unread` : `Mark "${n.title}" as read`}
          title={n.read ? 'Mark as unread' : 'Mark as read'}
        >
          <Icon name={n.read ? 'mail' : 'check'} size={15} />
        </button>
      )}
    </li>
  )
}
