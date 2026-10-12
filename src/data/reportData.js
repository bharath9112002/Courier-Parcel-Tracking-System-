// Dummy data for the reports. Two years of shipments from a fixed seed, so the
// figures are stable across reloads, dated relative to "now" so the latest
// month is always the current one. Volume grows over the year, peaks in the
// festive season (Oct-Nov) and dips at weekends; on-time delivery improves.

import { mulberry32, startOfDay } from './mockData'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
// Two years, so a 12-month report can be compared with the 12 months before it.
export const REPORT_MONTHS = 24

const FIRST_NAMES = [
  'Aarav', 'Priya', 'Rahul', 'Ananya', 'Vikram', 'Sneha', 'Arjun', 'Kavya', 'Rohan', 'Meera',
  'Karthik', 'Divya', 'Siddharth', 'Lakshmi', 'Aditya', 'Pooja', 'Nikhil', 'Isha', 'Varun', 'Nandini',
]
const LAST_NAMES = ['Sharma', 'Iyer', 'Patel', 'Reddy', 'Nair', 'Gupta', 'Menon', 'Rao', 'Singh', 'Kumar', 'Das', 'Joshi']
const CITIES = ['Chennai', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Kolkata', 'Pune', 'Coimbatore', 'Kochi', 'Jaipur']

// Share of bookings and promised transit days per service.
const SERVICES = [
  ['standard', 0.5, 4],
  ['express', 0.3, 2],
  ['overnight', 0.12, 1],
  ['same_day', 0.08, 0],
]
// Seasonal volume by month (Jan = 0).
const SEASON = [0.9, 0.92, 1, 1, 0.97, 0.95, 1, 1.02, 1.08, 1.32, 1.38, 1.15]

const pick = (rand, list) => list[Math.floor(rand() * list.length)]

function pickWeighted(rand, cumulative, items) {
  const r = rand() * cumulative[cumulative.length - 1]
  return items[cumulative.findIndex((c) => r < c)]
}

export const reportStart = (now) => {
  const d = new Date(now)
  return new Date(d.getFullYear(), d.getMonth() - REPORT_MONTHS, 1).getTime()
}

export function generateReportData(now = Date.now()) {
  const rand = mulberry32(8080)
  const start = reportStart(now)
  const span = now - start

  // A few customers send most of the parcels.
  const customers = Array.from({ length: 70 }, (_, i) => ({
    id: `C${2001 + i}`,
    name: `${pick(rand, FIRST_NAMES)} ${pick(rand, LAST_NAMES)}`,
    city: pick(rand, CITIES),
    weight: 1 / (i + 1) ** 0.7,
  }))
  const customerCum = []
  customers.reduce((sum, c) => (customerCum.push(sum + c.weight), sum + c.weight), 0)
  const serviceCum = []
  SERVICES.reduce((sum, s) => (serviceCum.push(sum + s[1]), sum + s[1]), 0)

  const shipments = []
  for (let day = startOfDay(start); day < now; day += DAY) {
    const date = new Date(day)
    const weekend = date.getDay() === 0 || date.getDay() === 6
    const progress = (day - start) / span
    const hours = Math.min(24, (now - day) / HOUR)
    const expected = (weekend ? 11 : 20) * (0.8 + 0.4 * progress) * SEASON[date.getMonth()] * (hours / 24)
    const count = Math.max(0, Math.round(expected * (0.8 + rand() * 0.4)))

    for (let i = 0; i < count; i++) {
      const createdAt = day + rand() * hours * HOUR
      const customer = pickWeighted(rand, customerCum, customers)
      const [service, , promisedDays] = pickWeighted(rand, serviceCum, SERVICES)
      const due = startOfDay(createdAt) + promisedDays * DAY + 20 * HOUR
      const onTimeChance = 0.82 + 0.1 * progress
      const r = rand()

      let status
      let deliveredAt = null
      if (r < 0.02) status = 'cancelled'
      else if (r < 0.05) status = 'failed'
      else if (r < 0.07) status = 'returned'
      else {
        const late = rand() > onTimeChance
        deliveredAt = late ? due + (2 + rand() * 50) * HOUR : due - rand() * Math.max(4, promisedDays * 16) * HOUR
        deliveredAt = Math.max(deliveredAt, createdAt + 3 * HOUR)
        status = 'delivered'
      }

      // Not finished yet: where it would be on its way now.
      const settlesAt = deliveredAt ?? createdAt + (promisedDays + 1) * DAY
      if (settlesAt > now) {
        const part = (now - createdAt) / (settlesAt - createdAt)
        status = part < 0.15 ? 'pending' : part < 0.35 ? 'picked_up' : part < 0.85 ? 'in_transit' : 'out_for_delivery'
        deliveredAt = null
      }

      shipments.push({
        id: `R${shipments.length + 1}`,
        customerId: customer.id,
        service,
        promisedDays,
        createdAt,
        due,
        deliveredAt,
        status,
      })
    }
  }

  return { customers: customers.map(({ id, name, city }) => ({ id, name, city })), shipments }
}
