import Icon from '../Icon'
import Sparkline from './Sparkline'
import { formatNumber } from '../../utils/format'

function Delta({ value, label, upIsGood = true }) {
  if (value == null || !Number.isFinite(value)) return null
  const up = value >= 0
  const good = up === upIsGood
  return (
    <span className={`delta ${good ? 'delta--good' : 'delta--bad'}`}>
      <Icon name={up ? 'trendUp' : 'trendDown'} size={14} />
      {up ? '+' : ''}
      {value.toFixed(1)}%<span className="delta__label">{label}</span>
    </span>
  )
}

export default function StatTile({ label, value, icon, tone, delta, deltaLabel, note, trend, trendUnit }) {
  return (
    <article className={`stat stat--${tone}`}>
      <header className="stat__head">
        <span className="stat__icon"><Icon name={icon} size={20} /></span>
        <h3>{label}</h3>
      </header>
      <p className="stat__value">{formatNumber(value)}</p>
      <div className="stat__foot">
        {delta !== undefined ? <Delta value={delta} label={deltaLabel} /> : <span className="stat__note">{note}</span>}
      </div>
      {trend && <Sparkline data={trend} unit={trendUnit} />}
    </article>
  )
}
