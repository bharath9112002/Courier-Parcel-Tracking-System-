import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { ApiError } from '../services/http'
import { statusHistory } from '../services/trackingService'
import { statusChangeError } from '../utils/shipmentStatus'
import { useAuth } from './AuthContext'
import { useShipments } from './ShipmentContext'

// Module 6: delivery status. Applies the status rules when a shipment's status
// is updated, and provides each shipment's status history and the counts per
// status.
const DeliveryStatusContext = createContext(null)

export function DeliveryStatusProvider({ children }) {
  const { user } = useAuth()
  const { status, error, reload, shipments, updateShipment } = useShipments()
  // History is rebuilt only when a shipment changes (new object per change).
  const [cache] = useState(() => new WeakMap())

  const getHistory = useCallback(
    (shipment) => {
      if (!cache.has(shipment)) cache.set(shipment, statusHistory(shipment))
      return cache.get(shipment)
    },
    [cache],
  )

  const value = useMemo(() => {
    const counts = {}
    for (const s of shipments) counts[s.status] = (counts[s.status] ?? 0) + 1

    return {
      status,
      error,
      reload,
      counts,
      getHistory,

      // Latest status changes across all shipments, newest first.
      recentChanges: (limit) =>
        shipments
          .flatMap((shipment) => getHistory(shipment).filter((c) => c.from).map((c) => ({ ...c, shipment })))
          .sort((a, b) => b.time - a.time)
          .slice(0, limit),

      updateStatus: async (shipment, { status: next, location = '', note = '' }) => {
        const problem = statusChangeError(shipment.status, next, note)
        if (problem) throw new ApiError(problem)
        return updateShipment(
          shipment.id,
          { ...shipment, status: next },
          { by: user?.name ?? 'Staff', location: location.trim(), note: note.trim() },
        )
      },
    }
  }, [status, error, reload, shipments, getHistory, updateShipment, user])

  return <DeliveryStatusContext.Provider value={value}>{children}</DeliveryStatusContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useDeliveryStatus() {
  const ctx = useContext(DeliveryStatusContext)
  if (!ctx) throw new Error('useDeliveryStatus must be used inside <DeliveryStatusProvider>')
  return ctx
}
