// Parcel tracking.
//
// There is no carrier API behind this app, so scan events are dummy data built
// from each shipment's dates and status. They are generated from a seed taken
// from the tracking number, so a parcel always shows the same history.
//
// Status changes made from the tracking page are real: the shipment is saved
// through shipmentService and the change is logged here as a tracking update,
// kept in localStorage alongside the shipments.

import { mulberry32 } from '../data/mockData'
import { addDays, daysBetween, parseISODate, SHIPMENT_TYPES, toISODate, todayISO } from '../utils/shipmentOptions'
import { STATUS } from '../utils/shipmentStatus'
import { TRACKING_PATTERN } from '../utils/tracking'
import { getShipments, updateShipment } from './shipmentService'

const UPDATES_KEY = 'courier_tracking_updates'
const RECENT_KEY = 'courier_recent_tracking'
const RECENT_LIMIT = 6
export const MAX_TRACK = 10

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

export const MILESTONES = ['pending', 'in_transit', 'out_for_delivery', 'delivered']

// ---------- Search ----------

// Accepts numbers separated by commas, spaces or new lines, in any case.
export function parseTrackingInput(text) {
  const tokens = text.toUpperCase().split(/[\s,;]+/).filter(Boolean)
  const unique = [...new Set(tokens)]
  return {
    valid: unique.filter((t) => TRACKING_PATTERN.test(t)),
    invalid: unique.filter((t) => !TRACKING_PATTERN.test(t)),
  }
}

export async function findByTrackingNumbers(numbers) {
  const all = await getShipments()
  const byNumber = new Map(all.map((s) => [s.trackingNumber, s]))
  return numbers.map((number) => ({ number, shipment: byNumber.get(number) ?? null }))
}

// A few parcels in different states, so there is something to try on a fresh install.
export async function getSampleTrackingNumbers() {
  const all = await getShipments()
  return ['in_transit', 'out_for_delivery', 'delivered', 'failed']
    .map((status) => all.find((s) => s.status === status))
    .filter(Boolean)
    .map((s) => s.trackingNumber)
}

// ---------- Recent searches (per browser) ----------

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: tracking still works, it just isn't remembered.
  }
}

export const getRecentSearches = () => read(RECENT_KEY, [])

export function addRecentSearches(numbers) {
  const next = [...numbers, ...getRecentSearches().filter((n) => !numbers.includes(n))].slice(0, RECENT_LIMIT)
  write(RECENT_KEY, next)
  return next
}

export function clearRecentSearches() {
  write(RECENT_KEY, [])
  return []
}

// ---------- Manual status updates ----------

const getAllUpdates = () => read(UPDATES_KEY, {})

export const getUpdates = (shipmentId) => getAllUpdates()[shipmentId] ?? []

export async function updateParcelStatus(shipment, { status, location, note }, user) {
  const saved = await updateShipment(shipment.id, { ...shipment, status })
  const update = {
    id: crypto.randomUUID(),
    from: shipment.status,
    status,
    location: location.trim(),
    note: note.trim(),
    by: user?.name ?? 'Staff',
    time: Date.now(),
  }
  const all = getAllUpdates()
  write(UPDATES_KEY, { ...all, [shipment.id]: [...(all[shipment.id] ?? []), update] })
  return saved
}

// ---------- Dummy scan events ----------

function hashSeed(text) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

// "1745 Main St, Phoenix, Arizona 85001" -> "Phoenix". Falls back to the last
// part without digits for addresses typed in other shapes.
export function cityFrom(address) {
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 3) return parts[parts.length - 2]
  const last = (parts[parts.length - 1] ?? '').replace(/\d+/g, '').trim()
  return last || 'Unknown'
}

const at = (iso, hours, minutes = 0) => {
  const d = parseISODate(iso)
  d.setHours(hours, minutes, 0, 0)
  return d.getTime()
}

// `count` times spread across [from, to], in order, with a little jitter.
function spread(rand, count, from, to) {
  const step = (to - from) / (count + 1)
  return Array.from({ length: count }, (_, i) => from + step * (i + 1) + (rand() - 0.5) * step * 0.6)
}

function stopsFor(s, rand) {
  const origin = cityFrom(s.pickupAddress)
  const dest = cityFrom(s.deliveryAddress)
  const hubCode = `HB-${String(1 + Math.floor(rand() * 24)).padStart(2, '0')}`
  const longHaul = (SHIPMENT_TYPES[s.shipmentType]?.days ?? 2) >= 2
  return {
    origin,
    dest,
    sender: { name: `Sender · ${origin}`, short: 'Sender', place: origin },
    originHub: { name: `${origin} Sorting Facility`, short: 'Sorting facility', place: origin },
    regionalHub: longHaul ? { name: `Regional Hub ${hubCode}`, short: 'Regional hub', place: hubCode } : null,
    destHub: { name: `${dest} Delivery Center`, short: 'Delivery center', place: dest },
    receiver: { name: `Receiver · ${dest}`, short: 'Receiver', place: dest },
  }
}

const FAIL_REASONS = [
  'Receiver not available at the address',
  'Address incomplete. Courier could not locate the premises',
  'Premises closed at the time of delivery',
  'Receiver refused to accept the parcel',
]

// Builds the auto-generated scan history for a shipment, as it would look at `now`.
function generateEvents(s, now) {
  const rand = mulberry32(hashSeed(s.trackingNumber))
  const stops = stopsFor(s, rand)
  const today = todayISO()
  const events = []
  const add = (code, time, title, location, detail) =>
    events.push({ id: `${code}-${events.length}`, code, time, title, location, detail, source: 'system' })

  const booked = Math.min(at(s.shippingDate, 9, Math.floor(rand() * 50)), Date.parse(s.createdAt) || Infinity, now)
  const service = SHIPMENT_TYPES[s.shipmentType]?.label.toLowerCase() ?? 'standard'
  add('booked', booked, 'Shipment booked', stops.sender.name, `Label created for ${service} delivery`)
  if (s.status === 'pending') return { events, stops }

  // Out-for-delivery day: the expected date, unless that is still ahead.
  const lastDay = s.expectedDeliveryDate < today ? s.expectedDeliveryDate : today
  const outForDelivery = Math.min(at(lastDay, 8, 20 + Math.floor(rand() * 40)), now)
  let pickup = Math.max(booked + 30 * MINUTE, at(s.shippingDate, 11, Math.floor(rand() * 60)))
  if (pickup >= outForDelivery) pickup = outForDelivery - 4 * HOUR
  if (pickup > now) pickup = Math.max(booked, now - 20 * MINUTE)

  const transit = [
    ['arrived_hub', 'Arrived at sorting facility', stops.originHub.name, 'Parcel scanned in and sorted'],
    ['departed_hub', 'Departed sorting facility', stops.originHub.name, `Dispatched towards ${stops.dest}`],
    ...(stops.regionalHub
      ? [
          ['arrived_hub', 'Arrived at regional hub', stops.regionalHub.name, 'Parcel scanned in for line-haul'],
          ['departed_hub', 'Departed regional hub', stops.regionalHub.name, `In transit to ${stops.destHub.name}`],
        ]
      : []),
    ['arrived_dest', 'Arrived at delivery center', stops.destHub.name, 'Parcel ready for last-mile delivery'],
  ]

  add('picked_up', Math.min(pickup, now), 'Picked up', stops.sender.name, 'Collected from sender by courier')

  // Still in transit: only show the scans that would have happened by now,
  // in proportion to how much of the journey has passed.
  let shown = transit.length
  if (s.status === 'in_transit') {
    const deliveryMorning = at(s.expectedDeliveryDate, 8)
    const share = deliveryMorning > pickup ? (now - pickup) / (deliveryMorning - pickup) : 1
    shown = Math.max(1, Math.min(transit.length, Math.ceil(share * transit.length)))
    // Not every scan should be at the destination before the parcel goes out.
    if (s.expectedDeliveryDate >= today) shown = Math.min(shown, transit.length - 1)
  }
  const transitEnd = s.status === 'in_transit' ? Math.min(now, at(s.expectedDeliveryDate, 6)) : outForDelivery - 45 * MINUTE
  const times = spread(rand, transit.length, pickup, Math.max(transitEnd, pickup + transit.length * HOUR))
  transit.slice(0, shown).forEach(([code, title, location, detail], i) => {
    add(code, Math.min(times[i], now), title, location, detail)
  })
  if (s.status === 'in_transit') return { events, stops }

  add('out_for_delivery', outForDelivery, 'Out for delivery', stops.destHub.name, 'With delivery agent on the local route')
  if (s.status === 'out_for_delivery') return { events, stops }

  const attempt = Math.min(outForDelivery + (2 + rand() * 5) * HOUR, now)
  if (s.status === 'delivered') {
    add('delivered', attempt, 'Delivered', stops.receiver.name, `Received by ${s.receiverName}`)
    return { events, stops }
  }

  const reason = FAIL_REASONS[Math.floor(rand() * FAIL_REASONS.length)]
  add('failed', attempt, 'Delivery attempt failed', stops.receiver.name, reason)
  if (s.status === 'failed') {
    add('held', Math.min(attempt + 2 * HOUR, now), 'Held at delivery center', stops.destHub.name, 'Awaiting re-attempt or receiver instructions')
    return { events, stops }
  }

  // returned
  const returnStart = Math.min(at(addDays(lastDay, 1), 10), now)
  add('return_started', Math.min(Math.max(returnStart, attempt + HOUR), now), 'Return to sender initiated', stops.destHub.name, 'Undeliverable after attempt')
  add('returned', Math.min(Math.max(at(addDays(lastDay, 3), 15), returnStart + 2 * HOUR), now), 'Returned to sender', stops.sender.name, `Handed back to ${s.senderName}`)
  return { events, stops }
}

const STATUS_EVENT = {
  pending: 'booked',
  in_transit: 'departed_hub',
  out_for_delivery: 'out_for_delivery',
  delivered: 'delivered',
  failed: 'failed',
  returned: 'returned',
}

// Full history, newest first: generated scans up to the first manual update,
// then each manual update. A status changed from the Edit Shipment form (with
// no update logged here) is shown as one final entry.
export function buildTracking(s, now = Date.now()) {
  const updates = getUpdates(s.id)
  const base = updates.length ? { ...s, status: updates[0].from } : s
  const generated = generateEvents(base, updates.length ? updates[0].time : now)
  const events = [...generated.events]

  for (const u of updates) {
    events.push({
      id: u.id,
      code: STATUS_EVENT[u.status],
      time: u.time,
      title: `Status updated: ${STATUS[u.status].label}`,
      location: u.location || events[events.length - 1].location,
      detail: u.note,
      by: u.by,
      source: 'manual',
    })
  }

  const lastStatus = updates.length ? updates[updates.length - 1].status : s.status
  if (lastStatus !== s.status) {
    const time = Math.max(Date.parse(s.updatedAt) || now, events[events.length - 1].time)
    events.push({
      id: 'edited',
      code: STATUS_EVENT[s.status],
      time,
      title: `Status updated: ${STATUS[s.status].label}`,
      location: events[events.length - 1].location,
      detail: 'Changed from the shipment record',
      source: 'manual',
    })
  }

  events.sort((a, b) => b.time - a.time)
  return {
    events,
    stops: generated.stops,
    location: currentLocation(s, events, generated.stops),
    estimate: deliveryEstimate(s, events),
    milestones: milestoneTimes(s, events),
  }
}

// ---------- Derived views ----------

function currentLocation(s, events, stops) {
  const last = events[0]
  const route = [stops.sender, stops.originHub, stops.regionalHub, stops.destHub, stops.receiver].filter(Boolean)
  const indexOf = (name) => route.findIndex((r) => r.name === name)

  // Manual updates may name a place that isn't on the route, so position the
  // parcel by the latest scan that is.
  let index = Math.max(0, indexOf(events.find((e) => indexOf(e.location) >= 0)?.location))
  let moving = false
  let label = last.location
  let detail = `Last scan: ${last.title.toLowerCase()}`

  if (s.status === 'pending') {
    label = `With sender in ${stops.origin}`
    detail = 'Waiting to be picked up'
  } else if (s.status === 'delivered') {
    index = route.length - 1
    label = s.deliveryAddress
    detail = `Delivered to ${s.receiverName}`
  } else if (s.status === 'returned') {
    index = 0
    label = s.pickupAddress
    detail = `Returned to ${s.senderName}`
  } else if (s.status === 'out_for_delivery') {
    index = route.length - 1
    moving = true
    label = `On the way to ${s.receiverName}`
    detail = `Left ${stops.destHub.name}`
  } else if (last.code === 'departed_hub' || last.code === 'picked_up') {
    moving = true
    const next = route[Math.min(index + 1, route.length - 1)]
    label = `In transit to ${next.name}`
    detail = `Left ${last.location}`
    index += 1
  }

  return { label, detail, time: last.time, route, index, moving, problem: s.status === 'failed' }
}

function deliveryEstimate(s, events) {
  const today = todayISO()
  const final = events.find((e) => e.code === 'delivered' || e.code === 'returned')

  if (s.status === 'delivered') {
    return { kind: 'done', date: final?.time ?? parseISODate(s.expectedDeliveryDate), label: 'Delivered on', note: deliveredNote(s, final), tone: 'success' }
  }
  if (s.status === 'returned') {
    return { kind: 'done', date: final?.time ?? Date.now(), label: 'Returned on', note: 'Parcel is back with the sender', tone: 'neutral' }
  }
  if (s.status === 'failed') {
    return { kind: 'date', date: parseISODate(addDays(today, 1)), label: 'Next attempt', note: 'Delivery will be re-attempted on the next working day', tone: 'danger' }
  }

  const days = daysBetween(today, s.expectedDeliveryDate)
  if (days < 0) {
    return {
      kind: 'date',
      date: parseISODate(addDays(today, 1)),
      label: 'Revised estimate',
      note: `Delayed. Originally due ${parseISODate(s.expectedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
      tone: 'danger',
      days: 1,
    }
  }
  return {
    kind: 'date',
    date: parseISODate(s.expectedDeliveryDate),
    label: 'Estimated delivery',
    note: days === 0 ? 'Arriving today, by 8 PM' : `Arriving in ${days} day${days === 1 ? '' : 's'}`,
    tone: days === 0 ? 'warning' : 'info',
    days,
  }
}

function deliveredNote(s, final) {
  if (!final) return 'Delivered'
  const late = daysBetween(s.expectedDeliveryDate, toISODate(final.time))
  if (late > 0) return `${late} day${late === 1 ? '' : 's'} later than expected`
  if (late < 0) return `${-late} day${late === -1 ? '' : 's'} ahead of schedule`
  return 'On time'
}

// When each milestone was first reached (oldest scan), or null.
function milestoneTimes(s, events) {
  const oldestFirst = [...events].reverse()
  const first = (codes) => oldestFirst.find((e) => codes.includes(e.code))?.time ?? null
  return {
    pending: first(['booked']),
    in_transit: first(['picked_up', 'arrived_hub', 'departed_hub', 'arrived_dest']),
    out_for_delivery: first(['out_for_delivery']),
    delivered: first(['delivered']),
    failed: first(['failed']),
    returned: first(['returned']),
  }
}
