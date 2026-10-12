import { SHIPMENT_TYPES } from './shipmentOptions'

const DAY = 24 * 60 * 60 * 1000
const WEEK = 7 * DAY

export const REPORT_RANGES = [
  { key: '3m', label: 'Last 3 months', months: 3 },
  { key: '6m', label: 'Last 6 months', months: 6 },
  { key: '12m', label: 'Last 12 months', months: 12 },
]

export const ON_TIME_TARGET = 90

const ACTIVE = ['pending', 'picked_up', 'in_transit', 'out_for_delivery']
const NOT_DELIVERED = ['failed', 'returned']

const pctChange = (current, previous) => (previous ? ((current - previous) / previous) * 100 : null)
const pct = (part, whole) => (whole ? (part / whole) * 100 : 0)

// Delivered on or before the promised time.
const isOnTime = (s) => s.status === 'delivered' && s.deliveredAt <= s.due

export function summarize(list) {
  let delivered = 0
  let onTime = 0
  let notDelivered = 0
  let cancelled = 0
  let active = 0
  let outForDelivery = 0
  let deliveryTime = 0
  for (const s of list) {
    if (s.status === 'delivered') {
      delivered++
      if (isOnTime(s)) onTime++
      deliveryTime += s.deliveredAt - s.createdAt
    } else if (NOT_DELIVERED.includes(s.status)) notDelivered++
    else if (s.status === 'cancelled') cancelled++
    else if (ACTIVE.includes(s.status)) {
      active++
      if (s.status === 'out_for_delivery') outForDelivery++
    }
  }
  const late = delivered - onTime
  return {
    total: list.length,
    delivered,
    onTime,
    late,
    notDelivered,
    cancelled,
    active,
    outForDelivery,
    // Of shipments that reached an outcome (delivered, failed or returned).
    finished: delivered + notDelivered,
    successRate: pct(delivered, delivered + notDelivered),
    onTimeRate: pct(onTime, delivered),
    avgDays: delivered ? deliveryTime / delivered / DAY : 0,
  }
}

function monthStart(now, monthsBack) {
  const d = new Date(now)
  return new Date(d.getFullYear(), d.getMonth() - monthsBack, 1).getTime()
}

const monthLabel = (ms) => new Date(ms).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })

// Everything on the reports page for one date range, plus the same figures
// for the equally long period before it (for the deltas).
export function computeReport({ shipments, customers }, rangeKey, now = Date.now()) {
  const range = REPORT_RANGES.find((r) => r.key === rangeKey) ?? REPORT_RANGES[0]
  const start = monthStart(now, range.months - 1)
  const prevStart = start - (now - start)

  const current = shipments.filter((s) => s.createdAt >= start && s.createdAt < now)
  const previous = shipments.filter((s) => s.createdAt >= prevStart && s.createdAt < start)
  const summary = summarize(current)
  const before = summarize(previous)

  // Monthly report: one row per calendar month, the current one partial.
  const months = Array.from({ length: range.months }, (_, i) => {
    const from = monthStart(now, range.months - 1 - i)
    const to = Math.min(monthStart(now, range.months - 2 - i), now)
    return {
      key: from,
      label: monthLabel(from),
      partial: to === now,
      ...summarize(current.filter((s) => s.createdAt >= from && s.createdAt < to)),
    }
  })

  // Weekly trend: 7-day windows ending now, so no week is half empty.
  const weekCount = Math.ceil((now - start) / WEEK)
  const weeks = Array.from({ length: weekCount }, (_, i) => {
    const to = now - (weekCount - 1 - i) * WEEK
    const from = to - WEEK
    return {
      key: from,
      from,
      to,
      booked: shipments.filter((s) => s.createdAt >= from && s.createdAt < to).length,
      delivered: shipments.filter((s) => s.deliveredAt && s.deliveredAt >= from && s.deliveredAt < to).length,
    }
  })

  // Delivery performance per service, over shipments that reached an outcome.
  const services = Object.entries(SHIPMENT_TYPES).map(([key, t]) => ({
    key,
    label: t.label,
    promisedDays: t.days,
    ...summarize(current.filter((s) => s.service === key)),
  }))

  // Top customers by shipments booked.
  const byCustomer = new Map()
  for (const s of current) byCustomer.set(s.customerId, [...(byCustomer.get(s.customerId) ?? []), s])
  const customerById = new Map(customers.map((c) => [c.id, c]))
  const topCustomers = [...byCustomer.entries()]
    .map(([id, list]) => {
      const sum = summarize(list)
      return { ...customerById.get(id), shipments: list.length, delivered: sum.delivered, successRate: sum.successRate, share: pct(list.length, current.length) }
    })
    .sort((a, b) => b.shipments - a.shipments)
    .slice(0, 8)

  return {
    range,
    start,
    summary,
    deltas: {
      total: pctChange(summary.total, before.total),
      delivered: pctChange(summary.delivered, before.delivered),
      onTimePoints: before.delivered ? summary.onTimeRate - before.onTimeRate : null,
    },
    months,
    weeks,
    services,
    topCustomers,
    activeCustomers: byCustomer.size,
  }
}

// Monthly report as CSV, for download.
export function monthlyCsv(months) {
  const head = ['Month', 'Booked', 'Delivered', 'On time', 'Late', 'Failed/returned', 'Cancelled', 'In progress', 'Success rate %', 'On-time rate %', 'Avg delivery days']
  const rows = months.map((m) => [
    m.label + (m.partial ? ' (to date)' : ''),
    m.total, m.delivered, m.onTime, m.late, m.notDelivered, m.cancelled, m.active,
    m.successRate.toFixed(1), m.onTimeRate.toFixed(1), m.avgDays.toFixed(2),
  ])
  return [head, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
}
