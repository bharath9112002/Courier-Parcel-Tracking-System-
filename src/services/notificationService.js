// Notifications, newest first:
// { id, type, shipmentId, trackingNumber, status, from, by, title, message, time, read }.
//
// Kept in localStorage like the status log. shipmentService adds one whenever a
// shipment is created or its status changes, so every page that changes a
// shipment produces them. Components subscribe to changes (also from other
// tabs) through useSyncExternalStore.

import { createdNotification, statusNotification } from '../utils/notifications'

const KEY = 'courier_notifications'
// Only recent history is kept.
export const NOTIFICATION_LIMIT = 50

const listeners = new Set()
let cachedRaw
let cachedList = null

// The same array is returned until storage changes, as useSyncExternalStore
// requires. null means notifications were never set up in this browser.
export function getNotifications() {
  let raw = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    // Storage blocked: behave as empty.
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw
    try {
      cachedList = raw ? JSON.parse(raw) : null
    } catch {
      cachedList = null
    }
  }
  return cachedList
}

function save(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, NOTIFICATION_LIMIT)))
  } catch {
    // Storage full or blocked: the notification is lost, nothing else breaks.
  }
  listeners.forEach((listener) => listener())
}

export function subscribeNotifications(listener) {
  listeners.add(listener)
  const onStorage = (e) => {
    if (e.key === KEY || e.key === null) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function add(notification) {
  const entry = { id: crypto.randomUUID(), time: Date.now(), read: false, ...notification }
  save([entry, ...(getNotifications() ?? [])].sort((a, b) => b.time - a.time))
  return entry
}

export const notifyShipmentCreated = (shipment) =>
  add(createdNotification(shipment, Date.parse(shipment.createdAt) || Date.now()))

export const notifyStatusChange = (shipment, from, change) =>
  add(statusNotification(shipment, from, change, Date.parse(shipment.updatedAt) || Date.now()))

// Starting history for a fresh browser; ignored once notifications exist.
export function seedNotifications(list) {
  if (getNotifications() !== null) return
  save(list.map((n) => ({ id: crypto.randomUUID(), read: false, ...n })).sort((a, b) => b.time - a.time))
}

const update = (fn) => save((getNotifications() ?? []).map(fn))

export const markRead = (id) => update((n) => (n.id === id && !n.read ? { ...n, read: true } : n))
export const markUnread = (id) => update((n) => (n.id === id && n.read ? { ...n, read: false } : n))
export const markAllRead = () => update((n) => (n.read ? n : { ...n, read: true }))
export const clearNotifications = () => save([])
