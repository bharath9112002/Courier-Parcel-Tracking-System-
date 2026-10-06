// Shipments API.
//
// Third-party APIs used:
// - DummyJSON (/users) supplies real names and addresses to seed the first set
//   of shipments.
// - JSONPlaceholder (/posts) handles create / update / delete. It accepts the
//   request and echoes the saved record back, but doesn't actually persist it,
//   so the echoed result is kept in localStorage.
//
// To move to a real backend (e.g. MockAPI), only this file needs to change.

import { mulberry32 } from '../data/mockData'
import { addDays, PARCEL_TYPES, SHIPMENT_TYPES, todayISO } from '../utils/shipmentOptions'
import { generateTrackingNumber } from '../utils/tracking'
import { ApiError, request } from './http'

const PEOPLE_API = 'https://dummyjson.com/users'
const WRITE_API = 'https://jsonplaceholder.typicode.com/posts'
const STORAGE_KEY = 'courier_shipments'
const SEED_COUNT = 36

export const SHIPMENT_FIELDS = [
  'trackingNumber',
  'senderName',
  'receiverName',
  'pickupAddress',
  'deliveryAddress',
  'weight',
  'parcelType',
  'shipmentType',
  'shippingDate',
  'expectedDeliveryDate',
  'status',
]

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveLocal(shipments) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shipments))
}

// Keep only known fields and coerce types, so whatever the API echoes back
// can't put unexpected data into storage.
function clean(data) {
  const out = {}
  for (const key of SHIPMENT_FIELDS) out[key] = data[key]
  out.weight = Number(data.weight)
  out.senderName = String(data.senderName).trim()
  out.receiverName = String(data.receiverName).trim()
  out.pickupAddress = String(data.pickupAddress).trim()
  out.deliveryAddress = String(data.deliveryAddress).trim()
  return out
}

const formatAddress = ({ address, city, state, postalCode }) =>
  `${address}, ${city}, ${state} ${postalCode}`

function seedStatus(rand, shippingDate, expectedDate, today) {
  if (shippingDate > today) return 'pending'
  if (shippingDate === today) return rand() < 0.6 ? 'pending' : 'in_transit'
  if (expectedDate < today) {
    const r = rand()
    if (r < 0.84) return 'delivered'
    if (r < 0.9) return 'failed'
    if (r < 0.95) return 'returned'
    return 'in_transit'
  }
  if (expectedDate === today) return rand() < 0.6 ? 'out_for_delivery' : 'delivered'
  return 'in_transit'
}

function buildSeedShipments(users) {
  const rand = mulberry32(42)
  const today = todayISO()
  const types = Object.keys(SHIPMENT_TYPES)
  const parcels = Object.keys(PARCEL_TYPES)
  const tracking = []
  const now = new Date().toISOString()

  return Array.from({ length: SEED_COUNT }, (_, i) => {
    const sender = users[i % users.length]
    const receiver = users[(i * 7 + 5) % users.length]
    const shipmentType = types[Math.floor(rand() * types.length)]
    const parcelType = parcels[Math.floor(rand() * parcels.length)]
    const shippingDate = addDays(today, 3 - Math.floor(rand() * 48))
    const expectedDeliveryDate = addDays(
      shippingDate,
      SHIPMENT_TYPES[shipmentType].days + (rand() < 0.3 ? 1 : 0),
    )
    const trackingNumber = generateTrackingNumber(shippingDate, tracking, rand)
    tracking.push(trackingNumber)

    return {
      id: crypto.randomUUID(),
      trackingNumber,
      senderName: `${sender.firstName} ${sender.lastName}`,
      receiverName: `${receiver.firstName} ${receiver.lastName}`,
      pickupAddress: formatAddress(sender.address),
      deliveryAddress: formatAddress(receiver.address),
      weight: parcelType === 'document' ? Math.round((0.1 + rand()) * 10) / 10 : Math.round((0.5 + rand() * 24) * 10) / 10,
      parcelType,
      shipmentType,
      shippingDate,
      expectedDeliveryDate,
      status: seedStatus(rand, shippingDate, expectedDeliveryDate, today),
      createdAt: now,
      updatedAt: now,
    }
  })
}

async function seedFromApi() {
  const { users } = await request(`${PEOPLE_API}?limit=40&select=firstName,lastName,address`)
  if (!users?.length) throw new ApiError('Could not load starter data from the server.')
  const seeded = buildSeedShipments(users)
  saveLocal(seeded)
  return seeded
}

// Shared so parallel first loads don't seed twice with different IDs.
let seeding = null

export async function getShipments() {
  const stored = loadLocal()
  if (stored) return stored

  seeding ??= seedFromApi().finally(() => {
    seeding = null
  })
  return seeding
}

export async function getShipment(id) {
  const shipment = (await getShipments()).find((s) => s.id === id)
  if (!shipment) throw new ApiError('Shipment not found. It may have been deleted.', 404)
  return shipment
}

export async function getTrackingNumbers() {
  return (await getShipments()).map((s) => s.trackingNumber)
}

export async function createShipment(data) {
  const all = await getShipments()
  if (all.some((s) => s.trackingNumber === data.trackingNumber)) {
    throw new ApiError('This tracking number is already in use. Generate a new one.')
  }

  const saved = await request(WRITE_API, { method: 'POST', body: clean(data) })
  const now = new Date().toISOString()
  const shipment = { ...clean(saved), id: crypto.randomUUID(), createdAt: now, updatedAt: now }
  saveLocal([shipment, ...all])
  return shipment
}

export async function updateShipment(id, data) {
  const all = await getShipments()
  const existing = all.find((s) => s.id === id)
  if (!existing) throw new ApiError('Shipment not found. It may have been deleted.', 404)

  // JSONPlaceholder only knows posts 1-100; PATCH echoes the body for any of them.
  const saved = await request(`${WRITE_API}/1`, { method: 'PATCH', body: clean(data) })
  const shipment = {
    ...existing,
    ...clean(saved),
    trackingNumber: existing.trackingNumber, // never changes after creation
    updatedAt: new Date().toISOString(),
  }
  saveLocal(all.map((s) => (s.id === id ? shipment : s)))
  return shipment
}

export async function deleteShipment(id) {
  const all = await getShipments()
  if (!all.some((s) => s.id === id)) throw new ApiError('Shipment not found. It may have been deleted.', 404)

  await request(`${WRITE_API}/1`, { method: 'DELETE' })
  saveLocal(all.filter((s) => s.id !== id))
}
