import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react'
import * as store from '../services/notificationService'
import { createdNotification, statusNotification } from '../utils/notifications'
import { useDeliveryStatus } from './DeliveryStatusContext'
import { useShipments } from './ShipmentContext'

// Module 7: notifications. New ones are added by shipmentService when a
// shipment is created or changes status; this shares the list, the unread
// count and the read/unread actions.
const NotificationContext = createContext(null)

const SEED_DAYS = 7
const SEED_COUNT = 20
const DAY = 24 * 60 * 60 * 1000

// A fresh browser starts with the last week's shipment activity, with
// anything older than a day already read.
function seedFrom(shipments, getHistory, now) {
  return shipments
    .flatMap((s) =>
      getHistory(s)
        .filter((c) => now - c.time < SEED_DAYS * DAY)
        .map((c) =>
          c.from
            ? statusNotification({ ...s, status: c.status }, c.from, c, c.time)
            : createdNotification(s, c.time),
        ),
    )
    .sort((a, b) => b.time - a.time)
    .slice(0, SEED_COUNT)
    .map((n) => ({ ...n, read: now - n.time > DAY }))
}

export function NotificationProvider({ children }) {
  const { status, shipments } = useShipments()
  const { getHistory } = useDeliveryStatus()
  const stored = useSyncExternalStore(store.subscribeNotifications, store.getNotifications)

  useEffect(() => {
    if (status === 'success' && stored === null) store.seedNotifications(seedFrom(shipments, getHistory, Date.now()))
  }, [status, stored, shipments, getHistory])

  const value = useMemo(() => {
    const notifications = stored ?? []
    return {
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      unreadAlerts: notifications.filter((n) => !n.read && n.type === 'failed'),
      markRead: store.markRead,
      markUnread: store.markUnread,
      markAllRead: store.markAllRead,
      clearAll: store.clearNotifications,
    }
  }, [stored])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>')
  return ctx
}
