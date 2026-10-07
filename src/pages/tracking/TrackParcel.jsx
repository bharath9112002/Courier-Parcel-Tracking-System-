import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from '../../components/Icon'
import { ErrorState, PageLoader } from '../../components/LoadState'
import StatusBadge from '../../components/StatusBadge'
import TrackingDetail from '../../components/tracking/TrackingDetail'
import { useAsync } from '../../hooks/useAsync'
import {
  addRecentSearches,
  buildTracking,
  clearRecentSearches,
  findByTrackingNumbers,
  getRecentSearches,
  getSampleTrackingNumbers,
  MAX_TRACK,
  parseTrackingInput,
} from '../../services/trackingService'
import { formatDate } from '../../utils/format'
import { STATUS } from '../../utils/shipmentStatus'

function Chips({ label, numbers, onPick, onClear }) {
  if (!numbers.length) return null
  return (
    <div className="track-chips">
      <span className="muted">{label}</span>
      {numbers.map((n) => (
        <button key={n} type="button" className="track-chip" onClick={() => onPick([n])}>{n}</button>
      ))}
      {numbers.length > 1 && (
        <button type="button" className="track-chip track-chip--all" onClick={() => onPick(numbers)}>
          Track all {numbers.length}
        </button>
      )}
      {onClear && <button type="button" className="link-btn track-chips__clear" onClick={onClear}>Clear</button>}
    </div>
  )
}

function ResultCard({ result, active, onSelect }) {
  const { number, shipment: s } = result
  const t = useMemo(() => s && buildTracking(s), [s])

  if (!s) {
    return (
      <div className="track-card track-card--missing">
        <span className="track-card__number">{number}</span>
        <span className="badge badge--danger"><Icon name="search" size={13} />Not found</span>
        <p className="muted">No shipment has this tracking number.</p>
      </div>
    )
  }

  return (
    <button type="button" className={`track-card ${active ? 'is-active' : ''}`} onClick={onSelect} aria-pressed={active}>
      <span className="track-card__top">
        <span className="track-card__number">{number}</span>
        <StatusBadge status={s.status} />
      </span>
      <span className="track-card__route">{t.stops.origin} <Icon name="arrowRight" size={13} /> {t.stops.dest}</span>
      <span className="track-card__line"><Icon name="pin" size={13} />{t.location.label}</span>
      <span className="track-card__line">
        <Icon name="calendar" size={13} />
        {t.estimate.label}: {formatDate(t.estimate.date, { day: 'numeric', month: 'short' })}
      </span>
    </button>
  )
}

function StatusOverview({ results }) {
  const counts = {}
  for (const { shipment } of results) if (shipment) counts[shipment.status] = (counts[shipment.status] ?? 0) + 1
  const missing = results.filter((r) => !r.shipment).length
  return (
    <div className="track-overview">
      {Object.entries(counts).map(([status, n]) => (
        <span key={status} className={`badge badge--${STATUS[status].tone}`}>
          <Icon name={STATUS[status].icon} size={13} />{n} {STATUS[status].label.toLowerCase()}
        </span>
      ))}
      {missing > 0 && <span className="badge badge--danger"><Icon name="search" size={13} />{missing} not found</span>}
    </div>
  )
}

function Results({ numbers, active, onSelect }) {
  const { status, data: results, error, reload, setData } = useAsync(() => findByTrackingNumbers(numbers), [numbers.join()])

  if (status === 'loading') return <PageLoader label={`Tracking ${numbers.length === 1 ? 'parcel' : 'parcels'}…`} />
  if (status === 'error') return <ErrorState error={error} onRetry={reload} />

  const found = results.filter((r) => r.shipment)
  const current = found.find((r) => r.number === active) ?? found[0]
  const replace = (updated) =>
    setData((list) => list.map((r) => (r.shipment?.id === updated.id ? { ...r, shipment: updated } : r)))

  if (!found.length) {
    return (
      <section className="card state-card" role="alert">
        <span className="state-card__icon tone--danger"><Icon name="search" size={26} /></span>
        <h2>No shipment found</h2>
        <p className="muted">
          Nothing matches {results.map((r) => r.number).join(', ')}. Check the number on the shipping label and try again.
        </p>
      </section>
    )
  }

  return (
    <>
      {results.length > 1 && (
        <section className="track-multi">
          <div className="track-multi__head">
            <h2 className="section-title">Tracking {results.length} shipments</h2>
            <StatusOverview results={results} />
          </div>
          <div className="track-cards">
            {results.map((r) => (
              <ResultCard key={r.number} result={r} active={r === current} onSelect={() => onSelect(r.number)} />
            ))}
          </div>
        </section>
      )}
      <TrackingDetail key={current.number} shipment={current.shipment} onUpdated={replace} />
    </>
  )
}

export default function TrackParcel() {
  const [params, setParams] = useSearchParams()
  // Numbers live in the URL so a tracking result can be shared or bookmarked.
  const numbers = useMemo(() => parseTrackingInput(params.get('ids') ?? '').valid.slice(0, MAX_TRACK), [params])
  const active = params.get('show')

  const [text, setText] = useState(numbers.join(', '))
  // Keep the box in step with the URL when Back/Forward changes the numbers.
  const [shownIds, setShownIds] = useState(numbers.join())
  if (shownIds !== numbers.join()) {
    setShownIds(numbers.join())
    setText(numbers.join(', '))
  }
  const [inputError, setInputError] = useState('')
  const [notice, setNotice] = useState('')
  const [recent, setRecent] = useState(getRecentSearches)
  const samples = useAsync(getSampleTrackingNumbers, [])

  const track = (list) => {
    setText(list.join(', '))
    setInputError('')
    setRecent(addRecentSearches(list))
    setParams({ ids: list.join(',') })
  }

  const submit = (e) => {
    e.preventDefault()
    const { valid, invalid } = parseTrackingInput(text)
    setNotice('')
    if (!valid.length) {
      setInputError(
        invalid.length
          ? `${invalid[0]} isn't a valid tracking number. Tracking numbers look like CR261006K7M2Q.`
          : 'Enter a tracking number.',
      )
      return
    }
    if (valid.length > MAX_TRACK) {
      setInputError(`You can track up to ${MAX_TRACK} shipments at once. You entered ${valid.length}.`)
      return
    }
    if (invalid.length) setNotice(`Skipped ${invalid.length === 1 ? 'an invalid number' : `${invalid.length} invalid numbers`}: ${invalid.join(', ')}`)
    track(valid)
  }

  const select = (number) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('show', number)
      return next
    }, { replace: true })

  return (
    <main className="page page--narrow">
      <header className="page__head">
        <div>
          <h1>Track parcel</h1>
          <p className="muted">Live status, location and delivery estimate for any shipment</p>
        </div>
      </header>

      <form className="card track-search" onSubmit={submit} noValidate role="search">
        <label htmlFor="tracking-input" className="details-label">Tracking number(s)</label>
        <div className="track-search__row">
          <div className={`toolbar__search ${inputError ? 'is-invalid' : ''}`}>
            <Icon name="search" size={17} />
            <input
              id="tracking-input"
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setInputError('')
              }}
              placeholder="e.g. CR261006K7M2Q, CR261004P9X3T"
              autoComplete="off"
              spellCheck="false"
              aria-invalid={!!inputError}
              aria-describedby="tracking-hint"
            />
          </div>
          <button type="submit" className="btn btn--primary btn--auto">
            Track <Icon name="arrowRight" size={17} />
          </button>
        </div>
        {inputError ? (
          <p className="field__error" id="tracking-hint" role="alert">{inputError}</p>
        ) : (
          <p className="muted track-search__hint" id="tracking-hint">
            Track up to {MAX_TRACK} shipments at once. Separate numbers with commas or spaces.
          </p>
        )}
        {notice && <div className="alert alert--warning" role="status">{notice}</div>}

        <Chips label="Recent:" numbers={recent} onPick={track} onClear={() => setRecent(clearRecentSearches())} />
        {!numbers.length && samples.status === 'success' && (
          <Chips label="Try a sample:" numbers={samples.data} onPick={track} />
        )}
      </form>

      {numbers.length > 0 ? (
        <Results numbers={numbers} active={active} onSelect={select} />
      ) : (
        <section className="card empty">
          <span className="state-card__icon tone--primary"><Icon name="pin" size={26} /></span>
          <h2>Where&apos;s my parcel?</h2>
          <p className="muted">Enter a tracking number above to see its timeline, current location and estimated delivery.</p>
        </section>
      )}
    </main>
  )
}
