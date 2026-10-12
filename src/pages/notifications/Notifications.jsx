import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import Icon from '../../components/Icon'
import NotificationItem from '../../components/notifications/NotificationItem'
import { useNotifications } from '../../context/NotificationContext'
import { useToast } from '../../context/ToastContext'
import { NOTIFICATION_LIMIT } from '../../services/notificationService'
import { dayLabel, NOTIFICATION_TYPES } from '../../utils/notifications'

const FILTERS = [
  { key: 'all', label: 'All', icon: 'bell', match: () => true },
  { key: 'unread', label: 'Unread', icon: 'mail', match: (n) => !n.read },
  ...Object.entries(NOTIFICATION_TYPES).map(([key, t]) => ({
    key,
    label: t.plural,
    icon: t.icon,
    tone: t.tone,
    match: (n) => n.type === key,
  })),
]

// Consecutive notifications on the same day, as [{ label, items }].
function groupByDay(list, now) {
  const groups = []
  for (const n of list) {
    const label = dayLabel(n.time, now)
    if (groups[groups.length - 1]?.label !== label) groups.push({ label, items: [] })
    groups[groups.length - 1].items.push(n)
  }
  return groups
}

export default function Notifications() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const { notifications, unreadCount, unreadAlerts, markAllRead, clearAll } = useNotifications()
  const [confirmClear, setConfirmClear] = useState(false)
  const [now] = useState(Date.now)

  const active = FILTERS.find((f) => f.key === params.get('filter')) ?? FILTERS[0]
  const shown = notifications.filter(active.match)
  const groups = groupByDay(shown, now)

  const selectFilter = (key) => setParams(key === 'all' ? {} : { filter: key }, { replace: true })

  const handleMarkAll = () => {
    markAllRead()
    toast.success('All notifications marked as read')
  }

  const handleClear = () => {
    clearAll()
    setConfirmClear(false)
    toast.success('Notification history cleared')
  }

  return (
    <main className="page page--narrow">
      <header className="page__head">
        <div>
          <h1>Notifications</h1>
          <p className="muted">
            {unreadCount ? `${unreadCount} unread · ` : ''}Shipment updates from across the app
          </p>
        </div>
        <div className="notif-page__actions">
          <button type="button" className="btn btn--ghost btn--auto" onClick={handleMarkAll} disabled={!unreadCount}>
            <Icon name="check" size={16} /> Mark all as read
          </button>
          <button type="button" className="btn btn--outline btn--auto" onClick={() => setConfirmClear(true)} disabled={!notifications.length}>
            <Icon name="trash" size={16} /> Clear history
          </button>
        </div>
      </header>

      {unreadAlerts.length > 0 && (
        <div className="notif-alert" role="alert">
          <span className="notif-alert__icon"><Icon name="alert" size={20} /></span>
          <div>
            <strong>
              {unreadAlerts.length} failed {unreadAlerts.length === 1 ? 'delivery needs' : 'deliveries need'} attention
            </strong>
            <p>{unreadAlerts.map((n) => n.trackingNumber).join(', ')}. Re-attempt delivery or return to sender.</p>
          </div>
          <Link to="/delivery-status?status=failed" className="btn btn--danger btn--sm btn--auto">Review</Link>
        </div>
      )}

      <div className="notif-filters" role="group" aria-label="Filter notifications">
        {FILTERS.map((f) => {
          const count = notifications.filter(f.match).length
          return (
            <button
              key={f.key}
              type="button"
              className={`notif-filter ${f.tone ? `tone--${f.tone}` : ''} ${active.key === f.key ? 'is-active' : ''}`}
              aria-pressed={active.key === f.key}
              onClick={() => selectFilter(f.key)}
            >
              <Icon name={f.icon} size={15} />
              {f.label}
              <span className="notif-filter__count">{count}</span>
            </button>
          )
        })}
      </div>

      <section className="card notif-card">
        {shown.length === 0 ? (
          <div className="empty">
            <span className="state-card__icon tone--primary"><Icon name="bell" size={26} /></span>
            <h2>{notifications.length ? 'Nothing here' : 'No notifications yet'}</h2>
            <p className="muted">
              {notifications.length
                ? active.key === 'unread' ? "You're all caught up." : `No ${active.label.toLowerCase()} notifications.`
                : 'Create a shipment or update a delivery status and it will show up here.'}
            </p>
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.label} className="notif-group" aria-label={g.label}>
              <h2 className="notif-group__label">{g.label}</h2>
              <ol className="notif-list">
                {g.items.map((n) => <NotificationItem key={n.id} notification={n} now={now} />)}
              </ol>
            </section>
          ))
        )}
      </section>
      <p className="muted notif-page__note">The latest {NOTIFICATION_LIMIT} notifications are kept.</p>

      {confirmClear && (
        <ConfirmDialog title="Clear notification history?" confirmLabel="Clear history" onConfirm={handleClear} onCancel={() => setConfirmClear(false)}>
          <p>All {notifications.length} notifications will be removed. Shipments and their status history are not affected.</p>
        </ConfirmDialog>
      )}
    </main>
  )
}
