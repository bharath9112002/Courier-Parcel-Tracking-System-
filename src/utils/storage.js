const USERS_KEY = 'courier_users'
const CURRENT_USER_KEY = 'courier_current_user'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export const DEMO_CREDENTIALS = { email: 'demo@courier.com', password: 'Demo@123' }

const DEMO_USER = {
  id: 'demo-user',
  name: 'Demo User',
  email: DEMO_CREDENTIALS.email,
  phone: '9876543210',
  // SHA-256 of DEMO_CREDENTIALS.password
  passwordHash: 'ff96673205dc722320598ebf8f88325b2ac56922d5a2164b5765868274bc0d73',
  createdAt: '2026-01-01T00:00:00.000Z',
}

// The demo account is always available, even on a fresh browser.
export function getUsers() {
  const users = read(USERS_KEY, [])
  if (users.some((u) => u.email === DEMO_USER.email)) return users
  const seeded = [DEMO_USER, ...users]
  write(USERS_KEY, seeded)
  return seeded
}
export const saveUsers = (users) => write(USERS_KEY, users)

export const getCurrentUser = () => read(CURRENT_USER_KEY, null)
export const setCurrentUser = (user) => write(CURRENT_USER_KEY, user)
export const clearCurrentUser = () => localStorage.removeItem(CURRENT_USER_KEY)

// Static app with no backend: hash passwords so they aren't kept as plain text.
export async function hashPassword(password) {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
