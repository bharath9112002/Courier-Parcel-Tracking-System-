import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import Icon from '../../components/Icon'
import { ErrorState } from '../../components/LoadState'
import Pagination from '../../components/Pagination'
import { useCustomers } from '../../context/CustomerContext'
import { useToast } from '../../context/ToastContext'
import { formatDate, initials } from '../../utils/format'

const DEFAULTS = { q: '', city: 'all', sort: 'newest', page: '1', size: '10' }
const SEARCH_FIELDS = ['name', 'email', 'mobile', 'address', 'city', 'postalCode']

const SORTS = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  name_asc: (a, b) => a.name.localeCompare(b.name),
  name_desc: (a, b) => b.name.localeCompare(a.name),
}

const readFilters = (params) =>
  Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, params.get(k) ?? DEFAULTS[k]]))

function matches(customer, { q, city }) {
  if (city !== 'all' && customer.city !== city) return false
  if (!q) return true
  const needle = q.toLowerCase().replace(/\s+/g, ' ')
  return SEARCH_FIELDS.some((f) => customer[f].toLowerCase().includes(needle))
}

function SkeletonRows({ rows }) {
  return Array.from({ length: rows }, (_, i) => (
    <tr key={i} className="skeleton-row" aria-hidden="true">
      {Array.from({ length: 5 }, (_, j) => <td key={j}><span className="skeleton" /></td>)}
    </tr>
  ))
}

export default function CustomerList() {
  const navigate = useNavigate()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const { status: loadStatus, customers, error, reload, deleteCustomer } = useCustomers()

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

  const cities = useMemo(
    () => (customers ? [...new Set(customers.map((c) => c.city))].sort((a, b) => a.localeCompare(b)) : []),
    [customers],
  )

  const filtered = useMemo(() => {
    if (!customers) return []
    return customers.filter((c) => matches(c, filters)).sort(SORTS[filters.sort] ?? SORTS.newest)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, filters.q, filters.city, filters.sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const hasFilters = filters.q || filters.city !== 'all'

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
      await deleteCustomer(toDelete.id)
      toast.success(`Customer ${toDelete.name} deleted`)
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
          <h1>Customers</h1>
          <p className="muted">
            {loadStatus === 'success' ? `${customers.length} customers in total` : 'Add, search and manage customers'}
          </p>
        </div>
        <Link to="/customers/new" className="btn btn--primary btn--auto">
          <Icon name="plus" size={18} />
          Add customer
        </Link>
      </header>

      <section className="card toolbar" aria-label="Search and filters">
        <label className="toolbar__search">
          <Icon name="search" size={17} />
          <input
            type="search"
            placeholder="Search name, email, mobile, city or PIN"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            aria-label="Search customers"
          />
        </label>

        <div className="toolbar__filters">
          <label className="select">
            <span>City</span>
            <select value={filters.city} onChange={(e) => setFilters({ city: e.target.value })}>
              <option value="all">All cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="select">
            <span>Sort</span>
            <select value={filters.sort} onChange={(e) => setFilters({ sort: e.target.value })}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
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
        <ErrorState error={error} onRetry={reload} noun="customer" />
      ) : (
        <section className="card table-card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Mobile</th>
                  <th>City</th>
                  <th>Added</th>
                  <th className="table__actions-col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {loadStatus === 'loading' && <SkeletonRows rows={pageSize > 10 ? 10 : pageSize} />}

                {loadStatus === 'success' && pageItems.map((c) => (
                  <tr key={c.id} className="table__row" onClick={() => navigate(`/customers/${c.id}`)}>
                    <td data-label="Customer">
                      <div className="customer-cell">
                        <span className="avatar avatar--sm" aria-hidden="true">{initials(c.name)}</span>
                        <div>
                          <Link to={`/customers/${c.id}`} className="table__main customer-link" onClick={(e) => e.stopPropagation()}>
                            {c.name}
                          </Link>
                          <span className="table__sub">{c.email}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Mobile">{c.mobile}</td>
                    <td data-label="City">
                      <span className="table__main">{c.city}</span>
                      <span className="table__sub">{c.postalCode}</span>
                    </td>
                    <td data-label="Added">{formatDate(c.createdAt)}</td>
                    <td className="table__actions" onClick={(e) => e.stopPropagation()}>
                      <Link to={`/customers/${c.id}`} className="icon-btn icon-btn--sm" aria-label={`View ${c.name}`} title="View">
                        <Icon name="eye" size={16} />
                      </Link>
                      <Link to={`/customers/${c.id}/edit`} className="icon-btn icon-btn--sm" aria-label={`Edit ${c.name}`} title="Edit">
                        <Icon name="edit" size={16} />
                      </Link>
                      <button type="button" className="icon-btn icon-btn--sm icon-btn--danger" onClick={() => setToDelete(c)}
                        aria-label={`Delete ${c.name}`} title="Delete">
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
              <span className="state-card__icon tone--primary"><Icon name={hasFilters ? 'search' : 'users'} size={26} /></span>
              <h2>{hasFilters ? 'No matching customers' : 'No customers yet'}</h2>
              <p className="muted">
                {hasFilters ? 'Try a different search term or clear the filters.' : 'Add your first customer to get started.'}
              </p>
              {hasFilters ? (
                <button type="button" className="btn btn--ghost btn--auto" onClick={clearFilters}>Clear filters</button>
              ) : (
                <Link to="/customers/new" className="btn btn--primary btn--auto">Add customer</Link>
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
          title="Delete customer?"
          busy={deleting}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={closeDelete}
        >
          <p>
            <strong>{toDelete.name}</strong> ({toDelete.email}) will be permanently deleted. Their existing
            shipments are kept. This can&apos;t be undone.
          </p>
        </ConfirmDialog>
      )}
    </main>
  )
}
