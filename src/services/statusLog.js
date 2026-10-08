// Every status change made in the app, per shipment, oldest first:
// { id, from, status, time, by, location, note }.
// Kept in localStorage next to the shipments. The key predates this module
// (it held the tracking page's updates), so earlier entries carry over.

const KEY = 'courier_tracking_updates'

function readAll() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(all) {
  localStorage.setItem(KEY, JSON.stringify(all))
}

export const getStatusLog = (shipmentId) => readAll()[shipmentId] ?? []

export function appendStatusLog(shipmentId, entry) {
  const all = readAll()
  const logged = { id: crypto.randomUUID(), time: Date.now(), location: '', note: '', ...entry }
  writeAll({ ...all, [shipmentId]: [...(all[shipmentId] ?? []), logged] })
  return logged
}

export function removeStatusLog(shipmentId) {
  const all = readAll()
  if (!(shipmentId in all)) return
  delete all[shipmentId]
  writeAll(all)
}
