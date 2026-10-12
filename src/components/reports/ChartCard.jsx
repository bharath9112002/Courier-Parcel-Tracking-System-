import { useState } from 'react'
import Icon from '../Icon'

// Card around a chart, with a Chart / Table switch: the table is the
// accessible version of the chart, with every value in it.
export default function ChartCard({ title, subtitle, legend, actions, table, className = '', children }) {
  const [view, setView] = useState('chart')

  return (
    <section className={`card chart-card ${className}`}>
      <header className="card__head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        <div className="chart-card__actions">
          {actions}
          {table && (
            <div className="segmented segmented--sm" role="group" aria-label={`${title} view`}>
              {['chart', 'table'].map((v) => (
                <button key={v} type="button" className={view === v ? 'is-active' : ''} aria-pressed={view === v} onClick={() => setView(v)}>
                  <Icon name={v === 'chart' ? 'chart' : 'grid'} size={14} />
                  {v === 'chart' ? 'Chart' : 'Table'}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>
      {view === 'chart' && legend}
      {view === 'chart' ? children : <div className="table-wrap chart-table">{table}</div>}
    </section>
  )
}

// Legend keys mirror the mark: a line for lines, a square for bars.
export function Legend({ items }) {
  return (
    <ul className="chart-legend">
      {items.map((item) => (
        <li key={item.label}>
          <span className={`chart-legend__key chart-legend__key--${item.shape ?? 'rect'}`} style={{ '--key': item.color }} />
          {item.icon && <Icon name={item.icon} size={13} />}
          {item.label}
        </li>
      ))}
    </ul>
  )
}
