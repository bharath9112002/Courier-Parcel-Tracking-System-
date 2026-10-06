import Icon from './Icon'

// Page numbers with ellipses: 1 … 4 5 6 … 12
function pageWindow(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, page - 1, page, page + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(`gap-${p}`)
    out.push(p)
  })
  return out
}

export default function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <nav className="pagination" aria-label="Pagination">
      <p className="pagination__info">
        Showing <strong>{from}–{to}</strong> of <strong>{total}</strong>
      </p>

      <div className="pagination__pages">
        <button type="button" className="page-btn" onClick={() => onPageChange(page - 1)}
          disabled={page <= 1} aria-label="Previous page">
          <Icon name="arrowLeft" size={16} />
        </button>
        {pageWindow(page, totalPages).map((p) =>
          typeof p === 'string' ? (
            <span key={p} className="page-gap">…</span>
          ) : (
            <button key={p} type="button" className={`page-btn ${p === page ? 'is-active' : ''}`}
              onClick={() => onPageChange(p)} aria-current={p === page ? 'page' : undefined}>
              {p}
            </button>
          ),
        )}
        <button type="button" className="page-btn" onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages} aria-label="Next page">
          <Icon name="arrowRight" size={16} />
        </button>
      </div>

      <label className="pagination__size">
        Rows
        <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
          {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
    </nav>
  )
}
