import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../../components/Icon'
import { ErrorState, PageLoader } from '../../components/LoadState'
import ShipmentForm from '../../components/shipments/ShipmentForm'
import { useAuth } from '../../context/AuthContext'
import { useShipment, useShipments } from '../../context/ShipmentContext'
import { useToast } from '../../context/ToastContext'

export default function ShipmentEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const { status, data: shipment, error, reload } = useShipment(id)
  const { updateShipment } = useShipments()

  const handleSubmit = async (values) => {
    const updated = await updateShipment(id, values, { by: user.name, note: 'Changed from the Edit shipment form' })
    toast.success(`Shipment ${updated.trackingNumber} updated`)
    navigate(`/shipments/${id}`, { replace: true })
  }

  return (
    <main className="page page--narrow">
      <Link to={`/shipments/${id}`} className="back-link"><Icon name="arrowLeft" size={16} /> Shipment details</Link>
      <header className="page__head">
        <div>
          <h1>Edit shipment</h1>
          <p className="muted">{shipment ? shipment.trackingNumber : 'Update the shipment details.'}</p>
        </div>
      </header>

      {status === 'loading' && <PageLoader label="Loading shipment…" />}
      {status === 'error' && <ErrorState error={error} onRetry={reload} backTo="/shipments" />}
      {status === 'success' && (
        <ShipmentForm
          mode="edit"
          initialValues={{ ...shipment, weight: String(shipment.weight) }}
          onSubmit={handleSubmit}
          cancelTo={`/shipments/${id}`}
        />
      )}
    </main>
  )
}
