import { createContext, useContext, useMemo } from 'react'
import { useAsync } from '../hooks/useAsync'
import { ApiError } from '../services/http'
import * as api from '../services/customerService'

// Module 4: customers. Loaded once after sign-in and shared by every page.
const CustomerContext = createContext(null)

const NOT_FOUND = 'Customer not found. It may have been deleted.'

export function CustomerProvider({ children }) {
  const { status, data, error, reload, setData } = useAsync(api.getCustomers, [])

  const value = useMemo(() => {
    const customers = data ?? []
    return {
      status,
      error,
      reload,
      customers,
      findCustomer: (id) => customers.find((c) => c.id === id) ?? null,

      createCustomer: async (values) => {
        const saved = await api.createCustomer(values)
        setData((list) => [saved, ...list])
        return saved
      },
      updateCustomer: async (id, values) => {
        const saved = await api.updateCustomer(id, values)
        setData((list) => list.map((c) => (c.id === id ? saved : c)))
        return saved
      },
      deleteCustomer: async (id) => {
        await api.deleteCustomer(id)
        setData((list) => list.filter((c) => c.id !== id))
      },
    }
  }, [status, error, reload, data, setData])

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useCustomers() {
  const ctx = useContext(CustomerContext)
  if (!ctx) throw new Error('useCustomers must be used inside <CustomerProvider>')
  return ctx
}

// One customer by id, in the same { status, data, error, reload } shape as useAsync.
// eslint-disable-next-line react/only-export-components
export function useCustomer(id) {
  const { status, error, reload, findCustomer } = useCustomers()
  if (status !== 'success') return { status, data: null, error, reload }
  const customer = findCustomer(id)
  return customer
    ? { status, data: customer, error: null, reload }
    : { status: 'error', data: null, error: new ApiError(NOT_FOUND, 404), reload }
}
