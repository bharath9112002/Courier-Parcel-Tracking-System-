import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import Icon from '../../components/Icon'
import { ErrorState, PageLoader } from '../../components/LoadState'
import StatusBadge from '../../components/StatusBadge'
import { useCustomer, useCustomers } from '../../context/CustomerContext'
import { useShipments } from '../../context/ShipmentContext'
import { useToast } from '../../context/ToastContext'
import { formatDate, formatNumber, initials } from '../../utils/format'
import { parseISODate } from '../../utils/shipmentOptions'

const RECENT_LIMIT = 5

const shortDate = (iso) => formatDate(parseISODate(iso), { day: 'numeric', month: 'short', year: 'numeric' })

// Shipments store sender/receiver names rather than customer IDs, so they are
// matched to the customer by name.
function customerShipments(shipments, name) {
  const key = name.trim().toLowerCase()
  const sent = shipments.filter((s) => s.senderName.toLowerCase() === key)
  const received = shipments.filter((s) => s.receiverName.toLowerCase() === key)
  const all = [...new Set([...sent, ...received])].sort((a, b) => b.shippingDate.localeCompare(a.shippingDate))
  const delivered = all.filter((s) => s.status === 'delivered').length
  return { sent: sent.length, received: received.length, total: all.length, delivered, recent: all.slice(0, RECENT_LIMIT) }
}

function ShipmentHistory({ customer }) {
  const { status, shipments, error, reload } = useShipments()

  if (status === 'loading') return <PageLoader label="Loading shipments…" />
  if (status === 'error') {
    return (
      <div className="alert alert--error" role="alert">
        {error.message}{' '}
        <button type="button" className="link-btn" onClick={reload}>Try again</button>
      </div>
    )
  }

  const history = customerShipments(shipments, customer.name)
  const stats = [
    { label: 'Total shipments', value: history.total, icon: 'package', tone: 'primary' },
    { label: 'Sent', value: history.sent, icon: 'arrowRight', tone: 'info' },
    { label: 'Received', value: history.received, icon: 'pin', tone: 'success' },
    { label: 'Delivered', value: history.delivered, icon: 'check', tone: 'violet' },
  ]

  return (
    <>
      <div className="customer-stats">
        {stats.map((s) => (
          <div key={s.label} className="customer-stat">
            <span className={`route__icon tone--${s.tone}`}><Icon name={s.icon} size={18} /></span>
            <div>
              <strong>{formatNumber(s.value)}</strong>
              <span className="muted">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {history.total === 0 ? (
        <p className="muted customer-history__empty">No shipments sent or received by {customer.name} yet.</p>
      ) : (
        <ul className="customer-history">
          {history.recent.map((s) => {
            const sent = s.senderName.toLowerCase() === customer.name.toLowerCase()
            return (
              <li key={s.id}>
                <Link to={`/shipments/${s.id}`} className="customer-history__item">
                  <div>
                    <span className="tracking-link">{s.trackingNumber}</span>
                    <span className="table__sub">
                      {sent ? `To ${s.receiverName}` : `From ${s.senderName}`} · {shortDate(s.shippingDate)}
                    </span>
                  </div>
                  <StatusBadge status={s.status} />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

export default function CustomerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { status, data: c, error, reload } = useCustomer(id)
  const { deleteCustomer } = useCustomers()

  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteCustomer(id)
      toast.success(`Customer ${c.name} deleted`)
      navigate('/customers', { replace: true })
    } catch (err) {
      setDeleteError(err.message)
      setDeleting(false)
    }
  }

  if (status === 'loading') return <main className="page page--narrow"><PageLoader label="Loading customer…" /></main>
  if (status === 'error') {
    return (
      <main className="page page--narrow">
        <ErrorState error={error} onRetry={reload} backTo="/customers" noun="customer" />
      </main>
    )
  }

  return (
    <main className="page page--narrow">
      <Link to="/customers" className="back-link"><Icon name="arrowLeft" size={16} /> Customers</Link>

      <header className="details-head card">
        <div className="customer-head">
          <span className="avatar avatar--lg" aria-hidden="true">{initials(c.name)}</span>
          <div>
            <h1>{c.name}</h1>
            <p className="muted">
              <Icon name="calendar" size={14} /> Customer since {formatDate(c.createdAt, { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="details-head__actions">
          <Link to={`/customers/${id}/edit`} className="btn btn--ghost btn--sm">
            <Icon name="edit" size={15} /> Edit
          </Link>
          <button type="button" className="btn btn--danger-ghost btn--sm" onClick={() => setConfirming(true)}>
            <Icon name="trash" size={15} /> Delete
          </button>
        </div>
      </header>

      <div className="form-grid-2">
        <section className="card">
          <h2 className="card__title">Contact</h2>
          <dl className="details-list">
            <dt>Email</dt><dd><a href={`mailto:${c.email}`}>{c.email}</a></dd>
            <dt>Mobile</dt><dd><a href={`tel:+91${c.mobile}`}>{c.mobile}</a></dd>
            <dt>Last updated</dt><dd>{formatDate(c.updatedAt, { dateStyle: 'medium', timeStyle: 'short' })}</dd>
          </dl>
        </section>
        <section className="card">
          <h2 className="card__title">Address</h2>
          <dl className="details-list">
            <dt>Street</dt><dd>{c.address}</dd>
            <dt>City</dt><dd>{c.city}</dd>
            <dt>Postal code</dt><dd>{c.postalCode}</dd>
          </dl>
        </section>
      </div>

      <section className="card">
        <h2 className="card__title">Shipments</h2>
        <ShipmentHistory customer={c} />
      </section>

      {confirming && (
        <ConfirmDialog
          title="Delete customer?"
          busy={deleting}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => {
            setConfirming(false)
            setDeleteError('')
          }}
        >
          <p>
            <strong>{c.name}</strong> will be permanently deleted. Their existing shipments are kept. This
            can&apos;t be undone.
          </p>
        </ConfirmDialog>
      )}
    </main>
  )
}
