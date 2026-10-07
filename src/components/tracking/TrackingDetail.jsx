import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../Icon'
import DeliveryProgress from '../shipments/DeliveryProgress'
import StatusBadge from '../StatusBadge'
import StatusUpdateDialog from './StatusUpdateDialog'
import { useToast } from '../../context/ToastContext'
import { buildTracking } from '../../services/trackingService'
import { formatDate } from '../../utils/format'
import { PARCEL_TYPES, parseISODate, SHIPMENT_TYPES } from '../../utils/shipmentOptions'
import { STATUS } from '../../utils/shipmentStatus'

const EVENT_ICON = {
  booked: 'package',
  picked_up: 'truck',
  arrived_hub: 'pin',
  departed_hub: 'arrowRight',
  arrived_dest: 'pin',
  out_for_delivery: 'truck',
  delivered: 'check',
  failed: 'x',
  held: 'clock',
  return_started: 'undo',
  returned: 'undo',
}
const EVENT_TONE = { delivered: 'success', failed: 'danger', held: 'warning', return_started: 'neutral', returned: 'neutral' }

const dayLabel = (ms) => formatDate(ms, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
const timeLabel = (ms) => formatDate(ms, { hour: 'numeric', minute: '2-digit' })
const stamp = (ms) => formatDate(ms, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

function groupByDay(events) {
  const groups = []
  for (const e of events) {
    const day = dayLabel(e.time)
    if (groups[groups.length - 1]?.day !== day) groups.push({ day, events: [] })
    groups[groups.length - 1].events.push(e)
  }
  return groups
}

function RouteMap({ location }) {
  const { route, index, moving, problem } = location
  const n = route.length
  // Dots sit at the centre of equal-width columns; a moving parcel sits halfway
  // between the last stop it left and the next one.
  const pos = moving ? index - 0.5 : index
  const pct = (x) => `${((x + 0.5) / n) * 100}%`

  return (
    <div className="route-map" role="img" aria-label={`Route with ${n} stops. ${location.label}.`}>
      <div className="route-map__track" style={{ left: pct(0), right: `${(0.5 / n) * 100}%` }} />
      <div className="route-map__fill" style={{ left: pct(0), width: `${(pos / n) * 100}%` }} />
      <span className={`route-map__parcel ${problem ? 'is-problem' : ''}`} style={{ left: pct(pos) }}>
        <Icon name={problem ? 'x' : 'truck'} size={16} />
      </span>
      <ol className="route-map__stops">
        {route.map((stop, i) => (
          <li key={stop.name} className={i <= pos ? 'is-reached' : ''}>
            <span className="route-map__dot" />
            <strong>{stop.short}</strong>
            <span>{stop.place}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function History({ events }) {
  return (
    <ol className="history">
      {groupByDay(events).map((group) => (
        <li key={group.day}>
          <h3 className="history__day">{group.day}</h3>
          <ol className="history__events">
            {group.events.map((e) => (
              <li key={e.id} className={`history__event ${e === events[0] ? 'is-latest' : ''}`}>
                <time className="history__time" dateTime={new Date(e.time).toISOString()}>{timeLabel(e.time)}</time>
                <span className={`history__icon tone--${EVENT_TONE[e.code] ?? 'primary'}`}>
                  <Icon name={EVENT_ICON[e.code] ?? 'clock'} size={14} />
                </span>
                <div className="history__body">
                  <strong>{e.title}</strong>
                  <span className="history__place"><Icon name="pin" size={13} />{e.location}</span>
                  {e.detail && <p>{e.detail}</p>}
                  {e.source === 'manual' && (
                    <span className="history__by"><Icon name="user" size={12} />{e.by ? `Updated by ${e.by}` : 'Manual update'}</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  )
}

export default function TrackingDetail({ shipment: s, onUpdated }) {
  const toast = useToast()
  const [updating, setUpdating] = useState(false)
  const [copied, setCopied] = useState(false)
  // `s` is replaced after a status update, which rebuilds the history.
  const t = useMemo(() => buildTracking(s), [s])
  const { location, estimate } = t

  const copyTracking = async () => {
    try {
      await navigator.clipboard.writeText(s.trackingNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  const handleSaved = (updated) => {
    setUpdating(false)
    toast.success(`${updated.trackingNumber} marked as ${STATUS[updated.status].label.toLowerCase()}`)
    onUpdated(updated)
  }

  return (
    <div className="track-detail">
      <header className="details-head card">
        <div className="details-head__main">
          <span className="details-head__label">Tracking number</span>
          <div className="details-head__tracking">
            <h2 className="track-number">{s.trackingNumber}</h2>
            <button type="button" className="icon-btn icon-btn--sm" onClick={copyTracking}
              aria-label="Copy tracking number" title={copied ? 'Copied!' : 'Copy'}>
              <Icon name={copied ? 'check' : 'copy'} size={15} />
            </button>
          </div>
          <div className="details-head__meta">
            <StatusBadge status={s.status} />
            <span className="track-route">
              {t.stops.origin} <Icon name="arrowRight" size={14} /> {t.stops.dest}
            </span>
          </div>
        </div>
        <div className="details-head__actions">
          <Link to={`/shipments/${s.id}`} className="btn btn--ghost btn--sm">
            <Icon name="package" size={15} /> View shipment
          </Link>
          <button type="button" className="btn btn--outline btn--sm" onClick={() => setUpdating(true)}>
            <Icon name="edit" size={15} /> Update status
          </button>
        </div>
      </header>

      <div className="track-grid">
        <section className="card">
          <div className="card__head">
            <div>
              <h2>Current location</h2>
              <p className="muted">Simulated scan data</p>
            </div>
            <span className="muted track-updated"><Icon name="clock" size={13} />{stamp(location.time)}</span>
          </div>
          <div className="track-location">
            <span className={`route__icon tone--${location.problem ? 'danger' : 'primary'}`}><Icon name="pin" size={18} /></span>
            <div>
              <strong>{location.label}</strong>
              <p className="muted">{location.detail}</p>
            </div>
          </div>
          <RouteMap location={location} />
        </section>

        <section className={`card track-eta tone--${estimate.tone}`}>
          <span className="details-label">{estimate.label}</span>
          <strong className="track-eta__date">{formatDate(estimate.date, { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
          <span className="track-eta__year">{formatDate(estimate.date, { year: 'numeric' })}</span>
          <span className={`badge badge--${estimate.tone}`}><Icon name="calendar" size={13} />{estimate.note}</span>
        </section>
      </div>

      <section className="card">
        <h2 className="card__title">Shipment timeline</h2>
        <DeliveryProgress status={s.status} times={t.milestones} formatTime={stamp} />
      </section>

      <div className="track-grid track-grid--history">
        <section className="card">
          <div className="card__head">
            <div>
              <h2>Tracking history</h2>
              <p className="muted">{t.events.length} scan{t.events.length === 1 ? '' : 's'}, newest first</p>
            </div>
          </div>
          <History events={t.events} />
        </section>

        <section className="card">
          <h2 className="card__title">Shipment summary</h2>
          <dl className="details-list">
            <dt>Sender</dt><dd>{s.senderName}</dd>
            <dt>Pickup</dt><dd>{s.pickupAddress}</dd>
            <dt>Receiver</dt><dd>{s.receiverName}</dd>
            <dt>Delivery</dt><dd>{s.deliveryAddress}</dd>
            <dt>Parcel</dt><dd>{PARCEL_TYPES[s.parcelType]} · {s.weight} kg</dd>
            <dt>Service</dt><dd>{SHIPMENT_TYPES[s.shipmentType]?.label}</dd>
            <dt>Shipped on</dt><dd>{dayLabel(parseISODate(s.shippingDate))}</dd>
            <dt>Expected</dt><dd>{dayLabel(parseISODate(s.expectedDeliveryDate))}</dd>
          </dl>
        </section>
      </div>

      {updating && (
        <StatusUpdateDialog
          shipment={s}
          location={t.events[0].location}
          onSaved={handleSaved}
          onCancel={() => setUpdating(false)}
        />
      )}
    </div>
  )
}
