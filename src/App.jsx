import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import GuestRoute from './components/GuestRoute'
import ProtectedRoute from './components/ProtectedRoute'
import ComingSoon from './pages/ComingSoon'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'
import Register from './pages/Register'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/shipments" element={<ComingSoon title="Shipments" icon="package" />} />
          <Route path="/shipments/new" element={<ComingSoon title="Create shipment" icon="plus" />} />
          <Route path="/tracking" element={<ComingSoon title="Track parcel" icon="pin" />} />
          <Route path="/customers" element={<ComingSoon title="Customers" icon="users" />} />
          <Route path="/customers/new" element={<ComingSoon title="Add customer" icon="users" />} />
          <Route path="/reports" element={<ComingSoon title="Reports" icon="chart" />} />
          <Route path="/settings" element={<ComingSoon title="Settings" icon="settings" />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
