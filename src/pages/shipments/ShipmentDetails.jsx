import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import Icon from '../../components/Icon'
import { ErrorState, PageLoader } from '../../components/LoadState'
import DeliveryProgress from '../../components/shipments/DeliveryProgress'
import StatusHistory from '../../components/shipments/StatusHistory'
import StatusUpdateDialog from '../../components/shipments/StatusUpdateDialog'
import StatusBadge from '../../components/StatusBadge'
import { useDeliveryStatus } from '../../context/DeliveryStatusContext'
import { useShipment, useShipments } from '../../context/ShipmentContext'
import { useToast } from '../../context/ToastContext'
import { useTracking } from '../../context/TrackingContext'
import { formatDate } from '../../utils/format'
import { daysBetween, PARCEL_TYPES, parseISODate, SHIPMENT_TYPES, todayISO } from '../../utils/shipmentOptions'
import { isFinal, STATUS } from '../../utils/shipmentStatus'

const longDate = (iso) =>
  formatDate(parseISODate(iso), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

const shortStamp = (ms) => formatDate(ms, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

function deliveryNote(s) {
  if (s.status === 'delivered') return { text: 'Delivered', tone: 'success' }
  if (s.status === 'failed') return { text: 'Re-attempt pending', tone: STATUS.failed.tone }
  if (s.status === 'returned') return { text: 'Back with sender', tone: STATUS.returned.tone }
  if (s.status === 'cancelled') return { text: 'Will not be delivered', tone: STATUS.cancelled.tone }
  const days = daysBetween(todayISO(), s.expectedDeliveryDate)
  if (days < 0) return { text: `Overdue by ${-days} day${days === -1 ? '' : 's'}`, tone: 'danger' }
  if (days === 0) return { text: 'Due today', tone: 'warning' }
  return { text: `Due in ${days} day${days === 1 ? '' : 's'}`, tone: 'info' }
}

export default function ShipmentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { status, data: s, error, reload } = useShipment(id)
  const { deleteShipment } = useShipments()
  const { getTracking } = useTracking()
  const { getHistory } = useDeliveryStatus()
  const [updating, setUpdating] = useState(false)

  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteShipment(id)
      toast.success(`Shipment ${s.trackingNumber} deleted`)
      navigate('/shipments', { replace: true })
    } catch (err) {
      setDeleteError(err.message)
      setDeleting(false)
    }
  }

  const handleStatusSaved = (updated) => {
    setUpdating(false)
    toast.success(`${updated.trackingNumber} marked as ${STATUS[updated.status].label.toLowerCase()}`)
  }

  const copyTracking = async () => {
    try {
      await navigator.clipboard.writeText(s.trackingNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  if (status === 'loading') return <main className="page page--narrow"><PageLoader label="Loading shipment…" /></main>
  if (status === 'error') {
    return (
      <main className="page page--narrow">
        <ErrorState error={error} onRetry={reload} backTo="/shipments" />
      </main>
    )
  }

  const note = deliveryNote(s)
  const tracking = getTracking(s)
  const changes = getHistory(s)

  return (
    <main className="page page--narrow">
      <Link to="/shipments" className="back-link"><Icon name="arrowLeft" size={16} /> Shipments</Link>

      <header className="details-head card">
        <div className="details-head__main">
          <span className="details-head__label">Tracking number</span>
          <div className="details-head__tracking">
            <h1>{s.trackingNumber}</h1>
            <button type="button" className="icon-btn icon-btn--sm" onClick={copyTracking}
              aria-label="Copy tracking number" title={copied ? 'Copied!' : 'Copy'}>
              <Icon name={copied ? 'check' : 'copy'} size={15} />
            </button>
          </div>
          <div className="details-head__meta">
            <StatusBadge status={s.status} />
            <span className={`badge badge--${note.tone}`}><Icon name="clock" size={13} />{note.text}</span>
          </div>
        </div>
        <div className="details-head__actions">
          <button type="button" className="btn btn--outline btn--sm" onClick={() => setUpdating(true)}
            disabled={isFinal(s.status)} title={isFinal(s.status) ? `${STATUS[s.status].label} is a final status` : undefined}>
            <Icon name="activity" size={15} /> Update status
          </button>
          <Link to={`/tracking?ids=${s.trackingNumber}`} className="btn btn--ghost btn--sm">
            <Icon name="pin" size={15} /> Track
          </Link>
          <Link to={`/shipments/${id}/edit`} className="btn btn--ghost btn--sm">
            <Icon name="edit" size={15} /> Edit
          </Link>
          <button type="button" className="btn btn--danger-ghost btn--sm" onClick={() => setConfirming(true)}>
            <Icon name="trash" size={15} /> Delete
          </button>
        </div>
      </header>

      <section className="card">
        <h2 className="card__title">Delivery progress</h2>
        <DeliveryProgress status={s.status} times={tracking.milestones} formatTime={shortStamp} />
      </section>

      <section className="card route">
        <div className="route__stop">
          <span className="route__icon tone--info"><Icon name="package" size={18} /></span>
          <div>
            <span className="details-label">Sender · Pickup</span>
            <strong>{s.senderName}</strong>
            <p>{s.pickupAddress}</p>
          </div>
        </div>
        <div className="route__line" aria-hidden="true" />
        <div className="route__stop">
          <span className="route__icon tone--success"><Icon name="pin" size={18} /></span>
          <div>
            <span className="details-label">Receiver · Delivery</span>
            <strong>{s.receiverName}</strong>
            <p>{s.deliveryAddress}</p>
          </div>
        </div>
      </section>

      <div className="form-grid-2">
        <section className="card">
          <h2 className="card__title">Parcel</h2>
          <dl className="details-list">
            <dt>Parcel type</dt><dd>{PARCEL_TYPES[s.parcelType]}</dd>
            <dt>Weight</dt><dd>{s.weight} kg</dd>
            <dt>Shipment type</dt><dd>{SHIPMENT_TYPES[s.shipmentType]?.label}</dd>
          </dl>
        </section>
        <section className="card">
          <h2 className="card__title">Schedule</h2>
          <dl className="details-list">
            <dt>Shipping date</dt><dd>{longDate(s.shippingDate)}</dd>
            <dt>Expected delivery</dt><dd>{longDate(s.expectedDeliveryDate)}</dd>
            <dt>Last updated</dt><dd>{formatDate(s.updatedAt, { dateStyle: 'medium', timeStyle: 'short' })}</dd>
          </dl>
        </section>
      </div>

      <section className="card">
        <div className="card__head">
          <div>
            <h2>Status history</h2>
            <p className="muted">
              {changes.length} status change{changes.length === 1 ? '' : 's'}, newest first
            </p>
          </div>
        </div>
        <StatusHistory changes={changes} />
      </section>

      {updating && (
        <StatusUpdateDialog
          shipment={s}
          location={tracking.events[0].location}
          onSaved={handleStatusSaved}
          onCancel={() => setUpdating(false)}
        />
      )}

      {confirming && (
        <ConfirmDialog
          title="Delete shipment?"
          busy={deleting}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => {
            setConfirming(false)
            setDeleteError('')
          }}
        >
          <p>
            Shipment <strong>{s.trackingNumber}</strong> will be permanently deleted. This can&apos;t be undone.
          </p>
        </ConfirmDialog>
      )}
    </main>
  )
}
