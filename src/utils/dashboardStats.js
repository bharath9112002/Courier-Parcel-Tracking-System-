import { startOfDay } from '../data/mockData'

const DAY = 24 * 60 * 60 * 1000
const TREND_DAYS = 14

const IN_TRANSIT = ['in_transit', 'out_for_delivery']
const FINISHED = ['delivered', 'failed', 'returned']

const pctChange = (current, previous) =>
  previous === 0 ? null : ((current - previous) / previous) * 100

function successRate(shipments) {
  const finished = shipments.filter((s) => FINISHED.includes(s.status))
  const delivered = finished.filter((s) => s.status === 'delivered').length
  return {
    rate: finished.length ? (delivered / finished.length) * 100 : 0,
    delivered,
    failed: finished.filter((s) => s.status === 'failed').length,
    returned: finished.filter((s) => s.status === 'returned').length,
  }
}

// Counts per day for the last TREND_DAYS days, oldest first.
function dailySeries(shipments, today, dateOf) {
  return Array.from({ length: TREND_DAYS }, (_, i) => {
    const start = today - (TREND_DAYS - 1 - i) * DAY
    const end = start + DAY
    return {
      date: start,
      value: shipments.filter((s) => {
        const t = dateOf(s)
        return t != null && t >= start && t < end
      }).length,
    }
  })
}

const sumLast = (series, n, skip = 0) =>
  series.slice(series.length - n - skip, series.length - skip).reduce((a, p) => a + p.value, 0)

export function computeDashboardStats({ shipments, customers }, now = Date.now()) {
  const today = startOfDay(now)
  const weekAgo = now - 7 * DAY

  const createdSeries = dailySeries(shipments, today, (s) => s.createdAt)
  const deliveredSeries = dailySeries(shipments, today, (s) =>
    s.status === 'delivered' ? s.updatedAt : null,
  )

  // Today vs. yesterday up to the same time of day, so mornings aren't unfairly low.
  const todayCount = shipments.filter((s) => s.createdAt >= today).length
  const yesterdaySameTime = shipments.filter(
    (s) => s.createdAt >= today - DAY && s.createdAt < now - DAY,
  ).length

  const last30 = successRate(shipments.filter((s) => s.createdAt >= now - 30 * DAY))
  const thisWeek = successRate(shipments.filter((s) => s.createdAt >= weekAgo))
  const lastWeek = successRate(
    shipments.filter((s) => s.createdAt >= weekAgo - 7 * DAY && s.createdAt < weekAgo),
  )

  const activeCustomers = customers.filter((c) => c.joinedAt <= now)

  return {
    totalShipments: {
      value: shipments.length,
      delta: pctChange(sumLast(createdSeries, 7), sumLast(createdSeries, 7, 7)),
      trend: createdSeries,
    },
    inTransit: {
      value: shipments.filter((s) => IN_TRANSIT.includes(s.status)).length,
      outForDelivery: shipments.filter((s) => s.status === 'out_for_delivery').length,
    },
    delivered: {
      value: shipments.filter((s) => s.status === 'delivered').length,
      delta: pctChange(sumLast(deliveredSeries, 7), sumLast(deliveredSeries, 7, 7)),
      trend: deliveredSeries,
    },
    pending: {
      value: shipments.filter((s) => s.status === 'pending').length,
    },
    customers: {
      value: activeCustomers.length,
      newThisWeek: activeCustomers.filter((c) => c.joinedAt >= weekAgo).length,
    },
    today: {
      value: todayCount,
      delta: pctChange(todayCount, yesterdaySameTime),
      trend: createdSeries,
    },
    successRate: {
      ...last30,
      deltaPoints: thisWeek.rate - lastWeek.rate,
      target: 95,
    },
  }
}

export function recentActivities(shipments, limit = 8) {
  return [...shipments]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit)
}
