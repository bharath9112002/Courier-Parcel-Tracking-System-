// Static mock data for the dashboard. Generated from a fixed seed so the numbers
// are stable across reloads, but dated relative to "now" so there is always
// activity for today.

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const HISTORY_DAYS = 60

const FIRST_NAMES = [
  'Aarav', 'Priya', 'Rahul', 'Ananya', 'Vikram', 'Sneha', 'Arjun', 'Kavya', 'Rohan', 'Meera',
  'Karthik', 'Divya', 'Siddharth', 'Lakshmi', 'Aditya', 'Pooja', 'Nikhil', 'Isha', 'Varun', 'Nandini',
]
const LAST_NAMES = [
  'Sharma', 'Iyer', 'Patel', 'Reddy', 'Nair', 'Gupta', 'Menon', 'Rao', 'Singh', 'Kumar',
  'Das', 'Pillai', 'Joshi', 'Mehta', 'Krishnan',
]
const CITIES = [
  'Chennai', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Kolkata', 'Pune', 'Coimbatore',
  'Kochi', 'Ahmedabad', 'Jaipur', 'Madurai',
]

export function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = (rand, list) => list[Math.floor(rand() * list.length)]

function pickStatus(rand, ageHours) {
  const r = rand()
  if (ageHours < 4) return r < 0.55 ? 'pending' : r < 0.85 ? 'picked_up' : r < 0.97 ? 'in_transit' : 'cancelled'
  if (ageHours < 24) return r < 0.3 ? 'pending' : r < 0.45 ? 'picked_up' : r < 0.85 ? 'in_transit' : 'out_for_delivery'
  if (ageHours < 72) {
    if (r < 0.12) return 'pending'
    if (r < 0.35) return 'in_transit'
    if (r < 0.5) return 'out_for_delivery'
    return r < 0.97 ? 'delivered' : 'failed'
  }
  if (r < 0.94) return 'delivered'
  if (r < 0.965) return 'failed'
  if (r < 0.975) return 'cancelled'
  if (r < 0.99) return 'returned'
  return 'in_transit'
}

export function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function generateMockData(now = Date.now()) {
  const rand = mulberry32(2026)
  const today = startOfDay(now)

  const customers = Array.from({ length: 480 }, (_, i) => ({
    id: `C${String(1001 + i)}`,
    name: `${pick(rand, FIRST_NAMES)} ${pick(rand, LAST_NAMES)}`,
    city: pick(rand, CITIES),
    // Most customers joined over the past year; a few in the last two weeks.
    joinedAt: now - (i < 30 ? rand() * 14 : 14 + rand() * 351) * DAY,
  }))

  const shipments = []
  for (let offset = HISTORY_DAYS - 1; offset >= 0; offset--) {
    const dayStart = today - offset * DAY
    const weekday = new Date(dayStart).getDay()
    const isWeekend = weekday === 0 || weekday === 6
    const hoursAvailable = offset === 0 ? (now - dayStart) / HOUR : 24
    const fullDayCount = Math.round((isWeekend ? 9 : 16) + rand() * 10)
    const count = Math.round(fullDayCount * (hoursAvailable / 24))

    for (let i = 0; i < count; i++) {
      const createdAt = dayStart + rand() * hoursAvailable * HOUR
      const ageHours = (now - createdAt) / HOUR
      const eligible = customers.filter((c) => c.joinedAt <= createdAt)
      const customer = pick(rand, eligible.length ? eligible : customers)
      const status = pickStatus(rand, ageHours)
      const updatedAt =
        status === 'pending'
          ? createdAt
          : createdAt + rand() * Math.min(ageHours, 72) * HOUR

      shipments.push({
        id: `CR${Math.floor(100000 + rand() * 900000)}`,
        customerId: customer.id,
        customerName: customer.name,
        origin: pick(rand, CITIES),
        destination: customer.city,
        status,
        createdAt,
        updatedAt,
      })
    }
  }

  return { customers, shipments }
}
