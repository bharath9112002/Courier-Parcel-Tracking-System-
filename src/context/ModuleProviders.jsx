import { CustomerProvider } from './CustomerContext'
import { DashboardProvider } from './DashboardContext'
import { DeliveryStatusProvider } from './DeliveryStatusContext'
import { NotificationProvider } from './NotificationContext'
import { ShipmentProvider } from './ShipmentContext'
import { TrackingProvider } from './TrackingContext'

// Data for each module of the signed-in app. Mounted inside ProtectedRoute, so
// it loads after sign-in and is dropped on logout. Tracking and delivery
// status read from shipments, so they sit inside ShipmentProvider.
// Notifications seed from the status history, so they sit innermost.
export default function ModuleProviders({ children }) {
  return (
    <DashboardProvider>
      <ShipmentProvider>
        <CustomerProvider>
          <TrackingProvider>
            <DeliveryStatusProvider>
              <NotificationProvider>{children}</NotificationProvider>
            </DeliveryStatusProvider>
          </TrackingProvider>
        </CustomerProvider>
      </ShipmentProvider>
    </DashboardProvider>
  )
}
