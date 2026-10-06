// Customers API.
//
// Third-party APIs used:
// - DummyJSON (/users) supplies real names, emails and street addresses to
//   seed the first set of customers. It's the same 40 people the shipment
//   seed uses, so seeded customers show up as senders/receivers of shipments.
// - JSONPlaceholder (/users) handles create / update / delete. It accepts the
//   request and echoes the saved record back, but doesn't actually persist it,
//   so the echoed result is kept in localStorage.
//
// To move to a real backend (e.g. MockAPI), only this file needs to change.

import { mulberry32 } from '../data/mockData'
import { ApiError, request } from './http'

const PEOPLE_API = 'https://dummyjson.com/users'
const WRITE_API = 'https://jsonplaceholder.typicode.com/users'
const STORAGE_KEY = 'courier_customers'
const DAY = 24 * 60 * 60 * 1000

export const CUSTOMER_FIELDS = ['name', 'email', 'mobile', 'address', 'city', 'postalCode']

// City + first three digits of its PIN code, for seed data.
const SEED_CITIES = [
  ['Chennai', '600'], ['Bengaluru', '560'], ['Mumbai', '400'], ['Delhi', '110'],
  ['Hyderabad', '500'], ['Kolkata', '700'], ['Pune', '411'], ['Coimbatore', '641'],
  ['Kochi', '682'], ['Ahmedabad', '380'], ['Jaipur', '302'], ['Madurai', '625'],
]

const NOT_FOUND = 'Customer not found. It may have been deleted.'

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveLocal(customers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers))
}

// Keep only known fields and normalise them, so whatever the API echoes back
// can't put unexpected data into storage.
function clean(data) {
  return {
    name: String(data.name).trim().replace(/\s+/g, ' '),
    email: String(data.email).trim().toLowerCase(),
    mobile: String(data.mobile).replace(/\s+/g, ''),
    address: String(data.address).trim(),
    city: String(data.city).trim().replace(/\s+/g, ' '),
    postalCode: String(data.postalCode).trim(),
  }
}

// Email and mobile number must be unique across customers.
function assertUnique(all, data, exceptId) {
  const others = all.filter((c) => c.id !== exceptId)
  if (others.some((c) => c.email === data.email)) {
    throw new ApiError('Another customer already uses this email address.')
  }
  if (others.some((c) => c.mobile === data.mobile)) {
    throw new ApiError('Another customer already uses this mobile number.')
  }
}

function buildSeedCustomers(users) {
  const rand = mulberry32(7)
  const now = Date.now()
  const mobiles = new Set()

  return users.map((u) => {
    let mobile
    do {
      mobile = String(6 + Math.floor(rand() * 4)) + String(Math.floor(rand() * 1e9)).padStart(9, '0')
    } while (mobiles.has(mobile))
    mobiles.add(mobile)

    const [city, pin] = SEED_CITIES[Math.floor(rand() * SEED_CITIES.length)]
    const createdAt = new Date(now - Math.floor(rand() * 365) * DAY - Math.floor(rand() * DAY)).toISOString()

    return {
      id: crypto.randomUUID(),
      name: `${u.firstName} ${u.lastName}`,
      email: u.email.toLowerCase(),
      mobile,
      address: u.address.address,
      city,
      postalCode: `${pin}0${String(1 + Math.floor(rand() * 98)).padStart(2, '0')}`,
      createdAt,
      updatedAt: createdAt,
    }
  })
}

async function seedFromApi() {
  const { users } = await request(`${PEOPLE_API}?limit=40&select=firstName,lastName,email,address`)
  if (!users?.length) throw new ApiError('Could not load starter data from the server.')
  const seeded = buildSeedCustomers(users)
  saveLocal(seeded)
  return seeded
}

// Shared so parallel first loads don't seed twice with different IDs.
let seeding = null

export async function getCustomers() {
  const stored = loadLocal()
  if (stored) return stored

  seeding ??= seedFromApi().finally(() => {
    seeding = null
  })
  return seeding
}

export async function getCustomer(id) {
  const customer = (await getCustomers()).find((c) => c.id === id)
  if (!customer) throw new ApiError(NOT_FOUND, 404)
  return customer
}

export async function createCustomer(data) {
  const all = await getCustomers()
  assertUnique(all, clean(data))

  const saved = await request(WRITE_API, { method: 'POST', body: clean(data) })
  const now = new Date().toISOString()
  const customer = { ...clean(saved), id: crypto.randomUUID(), createdAt: now, updatedAt: now }
  saveLocal([customer, ...all])
  return customer
}

export async function updateCustomer(id, data) {
  const all = await getCustomers()
  const existing = all.find((c) => c.id === id)
  if (!existing) throw new ApiError(NOT_FOUND, 404)
  assertUnique(all, clean(data), id)

  // JSONPlaceholder only knows users 1-10; PATCH echoes the body for any of them.
  const saved = await request(`${WRITE_API}/1`, { method: 'PATCH', body: clean(data) })
  const customer = { ...existing, ...clean(saved), updatedAt: new Date().toISOString() }
  saveLocal(all.map((c) => (c.id === id ? customer : c)))
  return customer
}

export async function deleteCustomer(id) {
  const all = await getCustomers()
  if (!all.some((c) => c.id === id)) throw new ApiError(NOT_FOUND, 404)

  await request(`${WRITE_API}/1`, { method: 'DELETE' })
  saveLocal(all.filter((c) => c.id !== id))
}
