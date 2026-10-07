import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import GuestRoute from './components/GuestRoute'
import ProtectedRoute from './components/ProtectedRoute'
import ComingSoon from './pages/ComingSoon'
import CustomerCreate from './pages/customers/CustomerCreate'
import CustomerEdit from './pages/customers/CustomerEdit'
import CustomerList from './pages/customers/CustomerList'
import CustomerProfile from './pages/customers/CustomerProfile'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'
import Register from './pages/Register'
import ShipmentCreate from './pages/shipments/ShipmentCreate'
import ShipmentDetails from './pages/shipments/ShipmentDetails'
import ShipmentEdit from './pages/shipments/ShipmentEdit'
import ShipmentList from './pages/shipments/ShipmentList'
import TrackParcel from './pages/tracking/TrackParcel'

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
          <Route path="/shipments" element={<ShipmentList />} />
          <Route path="/shipments/new" element={<ShipmentCreate />} />
          <Route path="/shipments/:id" element={<ShipmentDetails />} />
          <Route path="/shipments/:id/edit" element={<ShipmentEdit />} />
          <Route path="/tracking" element={<TrackParcel />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/new" element={<CustomerCreate />} />
          <Route path="/customers/:id" element={<CustomerProfile />} />
          <Route path="/customers/:id/edit" element={<CustomerEdit />} />
          <Route path="/reports" element={<ComingSoon title="Reports" icon="chart" />} />
          <Route path="/settings" element={<ComingSoon title="Settings" icon="settings" />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
