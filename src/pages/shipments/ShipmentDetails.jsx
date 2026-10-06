import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import Icon from '../../components/Icon'
import { ErrorState, PageLoader } from '../../components/LoadState'
import StatusBadge from '../../components/StatusBadge'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { deleteShipment, getShipment } from '../../services/shipmentService'
import { formatDate } from '../../utils/format'
import { daysBetween, PARCEL_TYPES, parseISODate, SHIPMENT_TYPES, todayISO } from '../../utils/shipmentOptions'
import { STATUS } from '../../utils/shipmentStatus'

const STEPS = ['pending', 'in_transit', 'out_for_delivery', 'delivered']

const longDate = (iso) =>
  formatDate(parseISODate(iso), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

function deliveryNote(s) {
  if (s.status === 'delivered') return { text: 'Delivered', tone: 'success' }
  if (s.status === 'failed' || s.status === 'returned') return { text: STATUS[s.status].label, tone: 'danger' }
  const days = daysBetween(todayISO(), s.expectedDeliveryDate)
  if (days < 0) return { text: `Overdue by ${-days} day${days === -1 ? '' : 's'}`, tone: 'danger' }
  if (days === 0) return { text: 'Due today', tone: 'warning' }
  return { text: `Due in ${days} day${days === 1 ? '' : 's'}`, tone: 'info' }
}

function Progress({ status }) {
  const problem = status === 'failed' || status === 'returned'
  // A failed/returned parcel had at least gone out for delivery.
  const reached = problem ? STEPS.indexOf('out_for_delivery') : STEPS.indexOf(status)

  return (
    <ol className="progress">
      {STEPS.map((step, i) => {
        const state = i < reached ? 'done' : i === reached ? (problem ? 'done' : 'current') : 'todo'
        return (
          <li key={step} className={`progress__step is-${state}`}>
            <span className="progress__dot"><Icon name={state === 'todo' ? STATUS[step].icon : 'check'} size={14} /></span>
            <span className="progress__label">{STATUS[step].label}</span>
          </li>
        )
      })}
      {problem && (
        <li className="progress__step is-problem">
          <span className="progress__dot"><Icon name={STATUS[status].icon} size={14} /></span>
          <span className="progress__label">{STATUS[status].label}</span>
        </li>
      )}
    </ol>
  )
}

export default function ShipmentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { status, data: s, error, reload } = useAsync(() => getShipment(id), [id])

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
        <Progress status={s.status} />
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
