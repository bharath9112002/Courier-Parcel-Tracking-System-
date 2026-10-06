import Icon from '../Icon'
import { formatNumber } from '../../utils/format'

function toneFor(rate, target) {
  if (rate >= target) return 'success'
  if (rate >= target - 5) return 'warning'
  return 'danger'
}

export default function SuccessRateCard({ rate, delivered, failed, returned, deltaPoints, target }) {
  const tone = toneFor(rate, target)
  const up = deltaPoints >= 0

  return (
    <section className="card success-card">
      <header className="card__head">
        <div>
          <h2>Delivery success rate</h2>
          <p className="muted">Completed shipments, last 30 days</p>
        </div>
        <span className={`badge badge--${tone}`}>
          <Icon name={tone === 'success' ? 'check' : 'clock'} size={14} />
          {tone === 'success' ? 'On target' : 'Below target'}
        </span>
      </header>

      <div className="success-card__figure">
        <span className="success-card__value">{rate.toFixed(1)}%</span>
        <span className={`delta ${up ? 'delta--good' : 'delta--bad'}`}>
          <Icon name={up ? 'trendUp' : 'trendDown'} size={14} />
          {up ? '+' : ''}
          {deltaPoints.toFixed(1)} pts<span className="delta__label">vs last week</span>
        </span>
      </div>

      <div
        className={`meter meter--${tone}`}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Number(rate.toFixed(1))}
        aria-label="Delivery success rate"
      >
        <div className="meter__fill" style={{ width: `${rate}%` }} />
        <div className="meter__target" style={{ left: `${target}%` }}>
          <span>Target {target}%</span>
        </div>
      </div>

      <dl className="success-card__breakdown">
        <div>
          <dt><Icon name="check" size={14} /> Delivered</dt>
          <dd>{formatNumber(delivered)}</dd>
        </div>
        <div>
          <dt><Icon name="x" size={14} /> Failed</dt>
          <dd>{formatNumber(failed)}</dd>
        </div>
        <div>
          <dt><Icon name="undo" size={14} /> Returned</dt>
          <dd>{formatNumber(returned)}</dd>
        </div>
      </dl>
    </section>
  )
}
