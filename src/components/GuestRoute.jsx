import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Login/register/forgot pages: signed-in users are sent to the dashboard.
export default function GuestRoute() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
