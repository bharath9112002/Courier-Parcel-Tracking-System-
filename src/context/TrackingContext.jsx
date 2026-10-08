import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  addRecentSearches,
  buildTracking,
  clearRecentSearches,
  getRecentSearches,
} from '../services/trackingService'
import { useShipments } from './ShipmentContext'

// Module 5: parcel tracking. Looks parcels up in the shared shipment list and
// keeps this browser's recent searches.
const TrackingContext = createContext(null)

// Parcels in different states, offered as samples to try.
const SAMPLE_STATUSES = ['picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed']

export function TrackingProvider({ children }) {
  const { status, error, reload, shipments } = useShipments()
  const [recent, setRecent] = useState(getRecentSearches)
  // Tracking details are rebuilt only when a shipment changes (each change
  // produces a new shipment object).
  const [cache] = useState(() => new WeakMap())

  const getTracking = useCallback(
    (shipment) => {
      if (!cache.has(shipment)) cache.set(shipment, buildTracking(shipment))
      return cache.get(shipment)
    },
    [cache],
  )

  const value = useMemo(() => {
    const byNumber = new Map(shipments.map((s) => [s.trackingNumber, s]))
    return {
      status,
      error,
      reload,
      getTracking,
      // [{ number, shipment }] with shipment null when nothing matches.
      lookup: (numbers) => numbers.map((number) => ({ number, shipment: byNumber.get(number) ?? null })),
      samples: SAMPLE_STATUSES.map((st) => shipments.find((s) => s.status === st))
        .filter(Boolean)
        .map((s) => s.trackingNumber),
      recent,
      addRecent: (numbers) => setRecent(addRecentSearches(numbers)),
      clearRecent: () => setRecent(clearRecentSearches()),
    }
  }, [status, error, reload, shipments, getTracking, recent])

  return <TrackingContext.Provider value={value}>{children}</TrackingContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useTracking() {
  const ctx = useContext(TrackingContext)
  if (!ctx) throw new Error('useTracking must be used inside <TrackingProvider>')
  return ctx
}
