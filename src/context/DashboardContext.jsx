import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { generateMockData } from '../data/mockData'
import { computeDashboardStats, recentActivities } from '../utils/dashboardStats'

// Module 2: dashboard. Figures come from mock data, as a snapshot so they
// don't shift while being read; refresh() takes a new one.
const DashboardContext = createContext(null)

function takeSnapshot() {
  const now = Date.now()
  const data = generateMockData(now)
  return { now, stats: computeDashboardStats(data, now), activities: recentActivities(data.shipments) }
}

export function DashboardProvider({ children }) {
  const [snapshot, setSnapshot] = useState(takeSnapshot)
  const refresh = useCallback(() => setSnapshot(takeSnapshot()), [])
  const value = useMemo(() => ({ ...snapshot, refresh }), [snapshot, refresh])

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used inside <DashboardProvider>')
  return ctx
}
