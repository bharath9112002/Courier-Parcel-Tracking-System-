import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import Icon from '../../components/Icon'
import { ErrorState } from '../../components/LoadState'
import Pagination from '../../components/Pagination'
import StatusBadge from '../../components/StatusBadge'
import { useShipments } from '../../context/ShipmentContext'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../utils/format'
import { PARCEL_TYPES, parseISODate, SHIPMENT_TYPES, STATUS_OPTIONS } from '../../utils/shipmentOptions'

const DEFAULTS = { q: '', type: 'all', status: 'all', sort: 'newest', page: '1', size: '10' }
const SEARCH_FIELDS = ['trackingNumber', 'senderName', 'receiverName', 'pickupAddress', 'deliveryAddress']

const readFilters = (params) =>
  Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, params.get(k) ?? DEFAULTS[k]]))

const shortDate = (iso) => formatDate(parseISODate(iso), { day: 'numeric', month: 'short', year: 'numeric' })

function matches(shipment, { q, type, status }) {
  if (type !== 'all' && shipment.shipmentType !== type) return false
  if (status !== 'all' && shipment.status !== status) return false
  if (!q) return true
  const needle = q.toLowerCase()
  return SEARCH_FIELDS.some((f) => shipment[f].toLowerCase().includes(needle))
}

function SkeletonRows({ rows }) {
  return Array.from({ length: rows }, (_, i) => (
    <tr key={i} className="skeleton-row" aria-hidden="true">
      {Array.from({ length: 7 }, (_, j) => <td key={j}><span className="skeleton" /></td>)}
    </tr>
  ))
}

export default function ShipmentList() {
  const navigate = useNavigate()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const { status: loadStatus, shipments, error, reload, deleteShipment } = useShipments()

  // Filters live in the URL so they survive a refresh and the back button.
  const filters = readFilters(params)
  const page = Math.max(1, Number(filters.page) || 1)
  const pageSize = Number(filters.size) || 10

  const setFilters = (changes, { resetPage = true } = {}) => {
    setParams(
      (prev) => {
        const next = { ...readFilters(prev), ...(resetPage ? { page: '1' } : {}), ...changes }
        return Object.fromEntries(Object.entries(next).filter(([k, v]) => String(v) !== DEFAULTS[k]))
      },
      { replace: true },
    )
  }

  // Debounce typing in the search box.
  const [searchText, setSearchText] = useState(filters.q)
  useEffect(() => {
    if (searchText === filters.q) return
    const t = setTimeout(() => setFilters({ q: searchText.trim() }), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText])

  const filtered = useMemo(() => {
    if (!shipments) return []
    const list = shipments.filter((s) => matches(s, filters))
    const dir = filters.sort === 'oldest' ? 1 : -1
    return list.sort(
      (a, b) => dir * (a.shippingDate.localeCompare(b.shippingDate) || a.createdAt.localeCompare(b.createdAt)),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipments, filters.q, filters.type, filters.status, filters.sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const hasFilters = filters.q || filters.type !== 'all' || filters.status !== 'all'

  // ----- delete -----
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const closeDelete = () => {
    setToDelete(null)
    setDeleteError('')
  }

  const confirmDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteShipment(toDelete.id)
      toast.success(`Shipment ${toDelete.trackingNumber} deleted`)
      closeDelete()
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const clearFilters = () => {
    setSearchText('')
    setParams({}, { replace: true })
  }

  return (
    <main className="page">
      <header className="page__head">
        <div>
          <h1>Shipments</h1>
          <p className="muted">
            {loadStatus === 'success' ? `${shipments.length} shipments in total` : 'Create, track and manage shipments'}
          </p>
        </div>
        <Link to="/shipments/new" className="btn btn--primary btn--auto">
          <Icon name="plus" size={18} />
          New shipment
        </Link>
      </header>

      <section className="card toolbar" aria-label="Search and filters">
        <label className="toolbar__search">
          <Icon name="search" size={17} />
          <input
            type="search"
            placeholder="Search tracking no., sender, receiver or address"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            aria-label="Search shipments"
          />
        </label>

        <div className="toolbar__filters">
          <label className="select">
            <span>Type</span>
            <select value={filters.type} onChange={(e) => setFilters({ type: e.target.value })}>
              <option value="all">All types</option>
              {Object.entries(SHIPMENT_TYPES).map(([v, t]) => <option key={v} value={v}>{t.label}</option>)}
            </select>
          </label>
          <label className="select">
            <span>Status</span>
            <select value={filters.status} onChange={(e) => setFilters({ status: e.target.value })}>
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
          <label className="select">
            <span>Sort</span>
            <select value={filters.sort} onChange={(e) => setFilters({ sort: e.target.value })}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
          {hasFilters && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={clearFilters}>
              <Icon name="x" size={14} />
              Clear
            </button>
          )}
        </div>
      </section>

      {loadStatus === 'error' ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <section className="card table-card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tracking no.</th>
                  <th>Sender → Receiver</th>
                  <th>Parcel</th>
                  <th>Shipping date</th>
                  <th>Expected</th>
                  <th>Status</th>
                  <th className="table__actions-col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {loadStatus === 'loading' && <SkeletonRows rows={pageSize > 10 ? 10 : pageSize} />}

                {loadStatus === 'success' && pageItems.map((s) => (
                  <tr key={s.id} className="table__row" onClick={() => navigate(`/shipments/${s.id}`)}>
                    <td data-label="Tracking no.">
                      <Link to={`/shipments/${s.id}`} className="tracking-link" onClick={(e) => e.stopPropagation()}>
                        {s.trackingNumber}
                      </Link>
                      <span className="table__sub">{SHIPMENT_TYPES[s.shipmentType]?.label}</span>
                    </td>
                    <td data-label="Sender → Receiver">
                      <span className="table__main">{s.senderName}</span>
                      <span className="table__sub">→ {s.receiverName}</span>
                    </td>
                    <td data-label="Parcel">
                      <span className="table__main">{PARCEL_TYPES[s.parcelType]}</span>
                      <span className="table__sub">{s.weight} kg</span>
                    </td>
                    <td data-label="Shipping date">{shortDate(s.shippingDate)}</td>
                    <td data-label="Expected">{shortDate(s.expectedDeliveryDate)}</td>
                    <td data-label="Status"><StatusBadge status={s.status} /></td>
                    <td className="table__actions" onClick={(e) => e.stopPropagation()}>
                      <Link to={`/shipments/${s.id}`} className="icon-btn icon-btn--sm" aria-label={`View ${s.trackingNumber}`} title="View">
                        <Icon name="eye" size={16} />
                      </Link>
                      <Link to={`/shipments/${s.id}/edit`} className="icon-btn icon-btn--sm" aria-label={`Edit ${s.trackingNumber}`} title="Edit">
                        <Icon name="edit" size={16} />
                      </Link>
                      <button type="button" className="icon-btn icon-btn--sm icon-btn--danger" onClick={() => setToDelete(s)}
                        aria-label={`Delete ${s.trackingNumber}`} title="Delete">
                        <Icon name="trash" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loadStatus === 'success' && filtered.length === 0 && (
            <div className="empty">
              <span className="state-card__icon tone--primary"><Icon name={hasFilters ? 'search' : 'package'} size={26} /></span>
              <h2>{hasFilters ? 'No matching shipments' : 'No shipments yet'}</h2>
              <p className="muted">
                {hasFilters ? 'Try a different search term or clear the filters.' : 'Create your first shipment to get started.'}
              </p>
              {hasFilters ? (
                <button type="button" className="btn btn--ghost btn--auto" onClick={clearFilters}>Clear filters</button>
              ) : (
                <Link to="/shipments/new" className="btn btn--primary btn--auto">Create shipment</Link>
              )}
            </div>
          )}

          {loadStatus === 'success' && filtered.length > 0 && (
            <Pagination
              page={currentPage}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={(p) => setFilters({ page: String(p) }, { resetPage: false })}
              onPageSizeChange={(n) => setFilters({ size: String(n) })}
            />
          )}
        </section>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete shipment?"
          busy={deleting}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={closeDelete}
        >
          <p>
            Shipment <strong>{toDelete.trackingNumber}</strong> from {toDelete.senderName} to{' '}
            {toDelete.receiverName} will be permanently deleted. This can&apos;t be undone.
          </p>
        </ConfirmDialog>
      )}
    </main>
  )
}
