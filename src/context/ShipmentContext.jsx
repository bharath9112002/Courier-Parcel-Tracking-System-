import { createContext, useContext, useMemo } from 'react'
import { useAsync } from '../hooks/useAsync'
import { ApiError } from '../services/http'
import * as api from '../services/shipmentService'

// Module 3: shipments. Loaded once after sign-in and shared by every page, so
// a change made on one page shows on the others straight away.
const ShipmentContext = createContext(null)

const NOT_FOUND = 'Shipment not found. It may have been deleted.'

export function ShipmentProvider({ children }) {
  const { status, data, error, reload, setData } = useAsync(api.getShipments, [])

  const value = useMemo(() => {
    const shipments = data ?? []
    const replace = (saved) => setData((list) => list.map((s) => (s.id === saved.id ? saved : s)))

    return {
      status,
      error,
      reload,
      shipments,
      trackingNumbers: shipments.map((s) => s.trackingNumber),
      findShipment: (id) => shipments.find((s) => s.id === id) ?? null,

      createShipment: async (values) => {
        const saved = await api.createShipment(values)
        setData((list) => [saved, ...list])
        return saved
      },
      // `change` is passed through for the status history (see shipmentService).
      updateShipment: async (id, values, change) => {
        const saved = await api.updateShipment(id, values, change)
        replace(saved)
        return saved
      },
      deleteShipment: async (id) => {
        await api.deleteShipment(id)
        setData((list) => list.filter((s) => s.id !== id))
      },
    }
  }, [status, error, reload, data, setData])

  return <ShipmentContext.Provider value={value}>{children}</ShipmentContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useShipments() {
  const ctx = useContext(ShipmentContext)
  if (!ctx) throw new Error('useShipments must be used inside <ShipmentProvider>')
  return ctx
}

// One shipment by id, in the same { status, data, error, reload } shape as useAsync.
// eslint-disable-next-line react/only-export-components
export function useShipment(id) {
  const { status, error, reload, findShipment } = useShipments()
  if (status !== 'success') return { status, data: null, error, reload }
  const shipment = findShipment(id)
  return shipment
    ? { status, data: shipment, error: null, reload }
    : { status: 'error', data: null, error: new ApiError(NOT_FOUND, 404), reload }
}
