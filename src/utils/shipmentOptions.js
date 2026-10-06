import { STATUS } from './shipmentStatus'

// `days` is the default transit time used to suggest an expected delivery date.
export const SHIPMENT_TYPES = {
  standard: { label: 'Standard', days: 4 },
  express: { label: 'Express', days: 2 },
  overnight: { label: 'Overnight', days: 1 },
  same_day: { label: 'Same day', days: 0 },
}

export const PARCEL_TYPES = {
  document: 'Document',
  package: 'Package',
  electronics: 'Electronics',
  clothing: 'Clothing',
  fragile: 'Fragile',
  perishable: 'Perishable',
}

export const STATUS_OPTIONS = Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }))

// Dates are stored as local "YYYY-MM-DD" strings, matching <input type="date">.
export function toISODate(date) {
  const d = new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseISODate(value) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(isoDate, days) {
  const d = parseISODate(isoDate)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export const todayISO = () => toISODate(new Date())

export function daysBetween(fromISO, toISO) {
  return Math.round((parseISODate(toISO) - parseISODate(fromISO)) / 86400000)
}
