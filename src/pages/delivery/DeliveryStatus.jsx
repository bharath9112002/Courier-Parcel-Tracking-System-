import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../../components/Icon'
import { ErrorState, PageLoader } from '../../components/LoadState'
import Pagination from '../../components/Pagination'
import StatusBadge from '../../components/StatusBadge'
import StatusUpdateDialog from '../../components/shipments/StatusUpdateDialog'
import { useDeliveryStatus } from '../../context/DeliveryStatusContext'
import { useShipments } from '../../context/ShipmentContext'
import { useToast } from '../../context/ToastContext'
import { formatNumber, timeAgo } from '../../utils/format'
import { isFinal, nextStatuses, STATUS } from '../../utils/shipmentStatus'

const RECENT_LIMIT = 8
const STATUS_KEYS = Object.keys(STATUS)

function StatusTiles({ counts, total, active, onSelect }) {
  return (
    <div className="status-tiles" role="group" aria-label="Filter by status">
      <button type="button" className={`status-tile tone--neutral ${active === 'all' ? 'is-active' : ''}`}
        aria-pressed={active === 'all'} onClick={() => onSelect('all')}>
        <span className="status-tile__icon"><Icon name="grid" size={18} /></span>
        <strong>{formatNumber(total)}</strong>
        <span>All shipments</span>
      </button>
      {STATUS_KEYS.map((key) => (
        <button key={key} type="button" className={`status-tile tone--${STATUS[key].tone} ${active === key ? 'is-active' : ''}`}
          aria-pressed={active === key} onClick={() => onSelect(key)}>
          <span className="status-tile__icon"><Icon name={STATUS[key].icon} size={18} /></span>
          <strong>{formatNumber(counts[key] ?? 0)}</strong>
          <span>{STATUS[key].label}</span>
        </button>
      ))}
    </div>
  )
}

function RecentChanges({ changes, now }) {
  if (!changes.length) return <p className="muted">No status changes yet.</p>
  return (
    <ol className="recent-changes">
      {changes.map((c) => (
        <li key={`${c.shipment.id}-${c.id}`}>
          <span className={`activity__icon tone--${STATUS[c.status].tone}`}><Icon name={STATUS[c.status].icon} size={15} /></span>
          <div>
            <Link to={`/shipments/${c.shipment.id}`} className="tracking-link">{c.shipment.trackingNumber}</Link>
            <p>
              <StatusBadge status={c.status} />
              <span>from {STATUS[c.from].label}</span>
            </p>
            <span className="table__sub">{c.by ? `${c.by} · ` : ''}{timeAgo(c.time, now)}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}

function StatusGuide() {
  return (
    <ul className="status-guide">
      {STATUS_KEYS.map((key) => (
        <li key={key}>
          <StatusBadge status={key} />
          <p className="muted">{STATUS[key].description}</p>
          <span className="status-guide__next">
            {isFinal(key) ? (
              'Final status'
            ) : (
              <>Next: {nextStatuses(key).map((n) => STATUS[n].label).join(' or ')}</>
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function DeliveryStatus() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const filter = STATUS[params.get('status')] ? params.get('status') : 'all'
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [updating, setUpdating] = useState(null)
  const { shipments } = useShipments()
  const { status, error, reload, counts, getHistory, recentChanges } = useDeliveryStatus()

  const [now] = useState(Date.now)

  if (status === 'loading') return <main className="page"><PageLoader label="Loading shipments…" /></main>
  if (status === 'error') return <main className="page"><ErrorState error={error} onRetry={reload} /></main>

  const rows = shipments.map((s) => ({ shipment: s, history: getHistory(s) }))
  const needle = query.trim().toLowerCase()
  const filtered = rows
    .filter(({ shipment: s }) => filter === 'all' || s.status === filter)
    .filter(({ shipment: s }) =>
      !needle || [s.trackingNumber, s.senderName, s.receiverName].some((v) => v.toLowerCase().includes(needle)),
    )
    .sort((a, b) => (b.history[0]?.time ?? 0) - (a.history[0]?.time ?? 0))
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const recent = recentChanges(RECENT_LIMIT)

  const selectFilter = (key) => {
    setPage(1)
    setParams(key === 'all' ? {} : { status: key }, { replace: true })
  }

  const handleSaved = (updated) => {
    setUpdating(null)
    toast.success(`${updated.trackingNumber} marked as ${STATUS[updated.status].label.toLowerCase()}`)
  }

  return (
    <main className="page">
      <header className="page__head">
        <div>
          <h1>Delivery status</h1>
          <p className="muted">See where every shipment stands and move it to its next status</p>
        </div>
      </header>

      <StatusTiles counts={counts} total={rows.length} active={filter} onSelect={selectFilter} />

      <div className="delivery-grid">
        <section className="card table-card">
          <div className="delivery-toolbar">
            <h2>{filter === 'all' ? 'All shipments' : STATUS[filter].label}</h2>
            <label className="toolbar__search">
              <Icon name="search" size={17} />
              <input
                type="search"
                placeholder="Tracking no., sender or receiver"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                aria-label="Search shipments"
              />
            </label>
          </div>

          {filtered.length === 0 ? (
            <div className="empty">
              <span className="state-card__icon tone--primary"><Icon name="search" size={26} /></span>
              <h2>No matching shipments</h2>
              <p className="muted">
                {needle ? 'Try a different search term.' : `No shipments are ${STATUS[filter]?.label.toLowerCase()} right now.`}
              </p>
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tracking no.</th>
                      <th>Receiver</th>
                      <th>Status</th>
                      <th>Last change</th>
                      <th className="table__actions-col"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map(({ shipment: s, history }) => (
                      <tr key={s.id}>
                        <td data-label="Tracking no.">
                          <Link to={`/shipments/${s.id}`} className="tracking-link">{s.trackingNumber}</Link>
                          <span className="table__sub">From {s.senderName}</span>
                        </td>
                        <td data-label="Receiver">{s.receiverName}</td>
                        <td data-label="Status"><StatusBadge status={s.status} /></td>
                        <td data-label="Last change">{history[0] ? timeAgo(history[0].time, now) : '—'}</td>
                        <td className="delivery-action">
                          {isFinal(s.status) ? (
                            <span className="muted status-final"><Icon name="check" size={14} />Final</span>
                          ) : (
                            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setUpdating({ shipment: s, history })}>
                              <Icon name="activity" size={15} /> Update
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={currentPage}
                pageSize={pageSize}
                total={filtered.length}
                onPageChange={setPage}
                onPageSizeChange={(n) => {
                  setPageSize(n)
                  setPage(1)
                }}
              />
            </>
          )}
        </section>

        <section className="card">
          <div className="card__head">
            <div>
              <h2>Recent status changes</h2>
              <p className="muted">Across all shipments</p>
            </div>
          </div>
          <RecentChanges changes={recent} now={now} />
        </section>
      </div>

      <section className="card status-guide-card">
        <div className="card__head">
          <div>
            <h2>Status guide</h2>
            <p className="muted">What each badge means and where a shipment can go next</p>
          </div>
        </div>
        <StatusGuide />
      </section>

      {updating && (
        <StatusUpdateDialog
          shipment={updating.shipment}
          location={updating.history[0]?.location ?? ''}
          onSaved={handleSaved}
          onCancel={() => setUpdating(null)}
        />
      )}
    </main>
  )
}
