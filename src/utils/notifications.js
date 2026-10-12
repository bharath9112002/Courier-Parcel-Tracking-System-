import { SHIPMENT_TYPES } from './shipmentOptions'
import { STATUS } from './shipmentStatus'

// Each kind of notification has an icon, a tone and a label, like statuses do.
// Failed deliveries are alerts: they need someone to act on them.
export const NOTIFICATION_TYPES = {
  created: { label: 'Shipment created', plural: 'Created', icon: 'package', tone: 'primary' },
  status: { label: 'Status update', plural: 'Status updates', icon: 'activity', tone: 'info' },
  delivered: { label: 'Delivered', plural: 'Delivered', icon: 'check', tone: 'success' },
  failed: { label: 'Failed delivery', plural: 'Failed alerts', icon: 'alert', tone: 'danger', alert: true },
}

// Badge text for an unread count.
export const badgeText = (count) => (count > 99 ? '99+' : String(count))

const typeForStatus = (status) => (status === 'delivered' || status === 'failed' ? status : 'status')

const formatDay = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

// Notifications keep a copy of the text, so they still read correctly after
// the shipment is edited or deleted.
export function createdNotification(s, time) {
  const service = SHIPMENT_TYPES[s.shipmentType]?.label ?? 'Standard'
  return {
    type: 'created',
    shipmentId: s.id,
    trackingNumber: s.trackingNumber,
    status: s.status,
    title: `New shipment ${s.trackingNumber}`,
    message: `${s.senderName} → ${s.receiverName}. ${service} delivery, expected ${formatDay(s.expectedDeliveryDate)}.`,
    time,
  }
}

// { by, location, note } is the change recorded in the status log.
export function statusNotification(s, from, { by = '', location = '', note = '' } = {}, time) {
  const type = typeForStatus(s.status)
  const where = location ? ` at ${location}` : ''
  const messages = {
    delivered: `Handed over to ${s.receiverName}${where}.`,
    failed: `${note || 'The delivery attempt could not be completed.'} Re-attempt delivery or return it to the sender.`,
    status: `Moved from ${STATUS[from]?.label.toLowerCase() ?? 'previous status'} to ${STATUS[s.status].label.toLowerCase()}${where}.${note ? ` ${note}` : ''}`,
  }
  const titles = {
    delivered: `${s.trackingNumber} delivered`,
    failed: `Delivery failed for ${s.trackingNumber}`,
    status: `${s.trackingNumber} ${STATUS[s.status].verb}`,
  }
  return {
    type,
    shipmentId: s.id,
    trackingNumber: s.trackingNumber,
    status: s.status,
    from,
    by,
    title: titles[type],
    message: messages[type],
    time,
  }
}

// "Today", "Yesterday" or a date, for grouping the history.
export function dayLabel(ms, now = Date.now()) {
  const day = (t) => new Date(t).setHours(0, 0, 0, 0)
  const diff = Math.round((day(now) - day(ms)) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return new Date(ms).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}
