import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../Icon'
import { useNotifications } from '../../context/NotificationContext'
import { badgeText } from '../../utils/notifications'
import NotificationItem from './NotificationItem'

const PREVIEW_COUNT = 6

// Topbar bell: unread badge, and a panel with the latest notifications.
export default function NotificationBell() {
  const { notifications, unreadCount, unreadAlerts, markAllRead } = useNotifications()
  const [openedAt, setOpenedAt] = useState(null)
  const open = openedAt !== null
  const rootRef = useRef(null)
  const buttonRef = useRef(null)

  const close = () => setOpenedAt(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpenedAt(null)
    }
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpenedAt(null)
      buttonRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const alerts = unreadAlerts.length

  return (
    <div className="notif-bell" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`icon-btn ${open ? 'is-open' : ''}`}
        onClick={() => setOpenedAt(open ? null : Date.now())}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        aria-controls="notif-panel"
      >
        <Icon name="bell" size={19} />
        {unreadCount > 0 && (
          <span className={`notif-badge ${alerts ? 'notif-badge--alert' : ''}`} aria-hidden="true">
            {badgeText(unreadCount)}
          </span>
        )}
      </button>

      {open && (
        <section id="notif-panel" className="notif-panel" role="dialog" aria-label="Notifications">
          <header className="notif-panel__head">
            <div>
              <h2>Notifications</h2>
              <p className="muted">{unreadCount ? `${unreadCount} unread` : 'All caught up'}</p>
            </div>
            <button type="button" className="link-btn" onClick={markAllRead} disabled={!unreadCount}>
              Mark all as read
            </button>
          </header>

          {alerts > 0 && (
            <Link to="/delivery-status?status=failed" className="notif-alert-strip" onClick={close}>
              <Icon name="alert" size={16} />
              <span>
                <strong>{alerts} failed {alerts === 1 ? 'delivery needs' : 'deliveries need'} attention</strong>
              </span>
              <Icon name="arrowRight" size={15} />
            </Link>
          )}

          {notifications.length === 0 ? (
            <div className="notif-panel__empty">
              <span className="state-card__icon tone--primary"><Icon name="bell" size={22} /></span>
              <p className="muted">No notifications yet. Shipment updates will appear here.</p>
            </div>
          ) : (
            <ol className="notif-list">
              {notifications.slice(0, PREVIEW_COUNT).map((n) => (
                <NotificationItem key={n.id} notification={n} now={openedAt} compact onOpen={close} />
              ))}
            </ol>
          )}

          <Link to="/notifications" className="notif-panel__all" onClick={close}>
            View all notifications <Icon name="arrowRight" size={15} />
          </Link>
        </section>
      )}
    </div>
  )
}
