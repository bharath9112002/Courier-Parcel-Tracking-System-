import { Link } from 'react-router-dom'
import Icon from './Icon'

// `noun` names the record in the not-found title and back link.
export function ErrorState({ error, onRetry, backTo, noun = 'shipment' }) {
  const notFound = error?.status === 404
  return (
    <section className="card state-card" role="alert">
      <span className="state-card__icon tone--danger"><Icon name={notFound ? 'search' : 'x'} size={26} /></span>
      <h2>{notFound ? `${noun[0].toUpperCase()}${noun.slice(1)} not found` : 'Something went wrong'}</h2>
      <p className="muted">{error?.message || 'Unexpected error.'}</p>
      <div className="state-card__actions">
        {backTo && <Link to={backTo} className="btn btn--ghost btn--auto">Back to {noun}s</Link>}
        {onRetry && !notFound && (
          <button type="button" className="btn btn--primary btn--auto" onClick={onRetry}>Try again</button>
        )}
      </div>
    </section>
  )
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="page-loader" role="status">
      <span className="spinner spinner--lg" aria-hidden="true" />
      {label}
    </div>
  )
}
