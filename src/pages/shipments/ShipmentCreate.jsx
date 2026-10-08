import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../components/Icon'
import { ErrorState, PageLoader } from '../../components/LoadState'
import ShipmentForm from '../../components/shipments/ShipmentForm'
import { useShipments } from '../../context/ShipmentContext'
import { useToast } from '../../context/ToastContext'
import { addDays, SHIPMENT_TYPES, todayISO } from '../../utils/shipmentOptions'
import { generateTrackingNumber } from '../../utils/tracking'

export default function ShipmentCreate() {
  const navigate = useNavigate()
  const toast = useToast()
  // Existing tracking numbers are loaded first so a new one is never a duplicate.
  const { status, error, reload, trackingNumbers: existing, createShipment } = useShipments()

  const regenerateTracking = async (shippingDate) => generateTrackingNumber(shippingDate, existing)

  const handleSubmit = async (values) => {
    const shipment = await createShipment(values)
    toast.success(`Shipment ${shipment.trackingNumber} created`)
    navigate(`/shipments/${shipment.id}`, { replace: true })
  }

  const today = todayISO()

  return (
    <main className="page page--narrow">
      <Link to="/shipments" className="back-link"><Icon name="arrowLeft" size={16} /> Shipments</Link>
      <header className="page__head">
        <div>
          <h1>Create shipment</h1>
          <p className="muted">Fill in the sender, receiver and parcel details.</p>
        </div>
      </header>

      {status === 'loading' && <PageLoader label="Preparing form…" />}
      {status === 'error' && <ErrorState error={error} onRetry={reload} backTo="/shipments" />}
      {status === 'success' && (
        <ShipmentForm
          mode="create"
          initialValues={{
            trackingNumber: generateTrackingNumber(today, existing),
            senderName: '',
            receiverName: '',
            pickupAddress: '',
            deliveryAddress: '',
            weight: '',
            parcelType: '',
            shipmentType: 'standard',
            shippingDate: today,
            expectedDeliveryDate: addDays(today, SHIPMENT_TYPES.standard.days),
            status: 'pending',
          }}
          onRegenerateTracking={regenerateTracking}
          onSubmit={handleSubmit}
          cancelTo="/shipments"
        />
      )}
    </main>
  )
}
