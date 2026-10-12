import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from '../../components/Icon'
import ChartCard, { Legend } from '../../components/reports/ChartCard'
import MonthlyChart from '../../components/reports/MonthlyChart'
import { OUTCOMES } from '../../components/reports/chartUtils'
import PerformanceBars from '../../components/reports/PerformanceBars'
import TopCustomers from '../../components/reports/TopCustomers'
import TrendChart from '../../components/reports/TrendChart'
import { useToast } from '../../context/ToastContext'
import { generateReportData } from '../../data/reportData'
import { formatDate, formatNumber } from '../../utils/format'
import { computeReport, monthlyCsv, ON_TIME_TARGET, REPORT_RANGES } from '../../utils/reportStats'

const TREND_SERIES = [
  { key: 'booked', label: 'Booked', color: 'var(--series-1)' },
  { key: 'delivered', label: 'Delivered', color: 'var(--series-2)' },
]

function Delta({ value, unit = '%', label = 'vs previous period' }) {
  if (value == null || !Number.isFinite(value)) return <span className="stat__note">No earlier data</span>
  const up = value >= 0
  return (
    <span className={`delta ${up ? 'delta--good' : 'delta--bad'}`}>
      <Icon name={up ? 'trendUp' : 'trendDown'} size={14} />
      {up ? '+' : ''}{value.toFixed(1)}{unit}
      <span className="delta__label">{label}</span>
    </span>
  )
}

function Kpi({ label, value, icon, tone, children }) {
  return (
    <article className={`stat stat--${tone} report-kpi`}>
      <header className="stat__head">
        <span className="stat__icon"><Icon name={icon} size={20} /></span>
        <h3>{label}</h3>
      </header>
      <p className="stat__value">{value}</p>
      <div className="stat__foot">{children}</div>
    </article>
  )
}

const pct = (n) => `${n.toFixed(1)}%`

function MonthlyTable({ months, total }) {
  return (
    <table className="table report-table">
      <thead>
        <tr>
          <th>Month</th>
          <th>Booked</th>
          <th>Delivered</th>
          <th>Failed / returned</th>
          <th>Cancelled</th>
          <th>In progress</th>
          <th>Success rate</th>
          <th>On time</th>
          <th>Avg days</th>
        </tr>
      </thead>
      <tbody>
        {[...months].reverse().map((m) => (
          <tr key={m.key}>
            <td data-label="Month"><strong>{m.label}</strong>{m.partial && <span className="table__sub">Month to date</span>}</td>
            <td data-label="Booked">{formatNumber(m.total)}</td>
            <td data-label="Delivered">{formatNumber(m.delivered)}</td>
            <td data-label="Failed / returned">{formatNumber(m.notDelivered)}</td>
            <td data-label="Cancelled">{formatNumber(m.cancelled)}</td>
            <td data-label="In progress">{formatNumber(m.active)}</td>
            <td data-label="Success rate">{pct(m.successRate)}</td>
            <td data-label="On time">{pct(m.onTimeRate)}</td>
            <td data-label="Avg days">{m.avgDays.toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td data-label="Month"><strong>Total</strong></td>
          <td data-label="Booked">{formatNumber(total.total)}</td>
          <td data-label="Delivered">{formatNumber(total.delivered)}</td>
          <td data-label="Failed / returned">{formatNumber(total.notDelivered)}</td>
          <td data-label="Cancelled">{formatNumber(total.cancelled)}</td>
          <td data-label="In progress">{formatNumber(total.active)}</td>
          <td data-label="Success rate">{pct(total.successRate)}</td>
          <td data-label="On time">{pct(total.onTimeRate)}</td>
          <td data-label="Avg days">{total.avgDays.toFixed(1)}</td>
        </tr>
      </tfoot>
    </table>
  )
}

function download(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const rangeKey = REPORT_RANGES.some((r) => r.key === params.get('range')) ? params.get('range') : '6m'
  // Dummy data, generated once per visit.
  const [data] = useState(() => {
    const now = Date.now()
    return { now, ...generateReportData(now) }
  })
  const report = useMemo(() => computeReport(data, rangeKey, data.now), [data, rangeKey])
  const { summary, deltas, months, weeks, services, topCustomers, range } = report

  const period = `${formatDate(report.start, { day: 'numeric', month: 'short', year: 'numeric' })} – ${formatDate(data.now, { day: 'numeric', month: 'short', year: 'numeric' })}`

  const handleExport = () => {
    download(`monthly-shipment-report-${range.key}.csv`, monthlyCsv(months))
    toast.success('Monthly report downloaded')
  }

  return (
    <main className="page reports">
      <header className="page__head">
        <div>
          <h1>Reports</h1>
          <p className="muted">Shipment volume, delivery performance and top customers</p>
        </div>
        <span className="badge badge--neutral report-sample"><Icon name="alert" size={13} /> Sample data</span>
      </header>

      <div className="report-filters">
        <div className="segmented" role="group" aria-label="Date range">
          {REPORT_RANGES.map((r) => (
            <button key={r.key} type="button" className={r.key === range.key ? 'is-active' : ''} aria-pressed={r.key === range.key}
              onClick={() => setParams(r.key === '6m' ? {} : { range: r.key }, { replace: true })}>
              {r.key === range.key && <Icon name="check" size={14} />}
              {r.label}
            </button>
          ))}
        </div>
        <span className="report-filters__period"><Icon name="calendar" size={15} /> {period}</span>
        <button type="button" className="btn btn--ghost btn--sm btn--auto report-filters__export" onClick={handleExport}>
          <Icon name="download" size={15} /> Download CSV
        </button>
      </div>

      <section className="stats-grid report-kpis" aria-label="Key figures">
        <Kpi label="Total shipments" value={formatNumber(summary.total)} icon="package" tone="primary">
          <Delta value={deltas.total} />
        </Kpi>
        <Kpi label="Delivered parcels" value={formatNumber(summary.delivered)} icon="check" tone="success">
          <Delta value={deltas.delivered} />
        </Kpi>
        <Kpi label="Pending deliveries" value={formatNumber(summary.active)} icon="clock" tone="warning">
          <span className="stat__note">{formatNumber(summary.outForDelivery)} out for delivery now</span>
        </Kpi>
        <Kpi label="On-time delivery" value={pct(summary.onTimeRate)} icon="truck" tone="info">
          <Delta value={deltas.onTimePoints} unit=" pts" />
        </Kpi>
      </section>

      <ChartCard
        className="report-trend"
        title="Shipment trends"
        subtitle="Shipments booked and delivered each week"
        legend={<Legend items={TREND_SERIES.map((s) => ({ ...s, shape: 'line' }))} />}
        table={
          <table className="table report-table">
            <thead><tr><th>Week to</th><th>Booked</th><th>Delivered</th></tr></thead>
            <tbody>
              {[...weeks].reverse().map((w) => (
                <tr key={w.key}>
                  <td data-label="Week to">{formatDate(w.to - 1, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td data-label="Booked">{formatNumber(w.booked)}</td>
                  <td data-label="Delivered">{formatNumber(w.delivered)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      >
        <TrendChart series={TREND_SERIES} points={weeks} />
      </ChartCard>

      <div className="report-grid">
        <ChartCard
          title="Monthly shipment report"
          subtitle={`Shipments booked per month, ${range.label.toLowerCase()}`}
          table={<MonthlyTable months={months} total={summary} />}
        >
          <MonthlyChart months={months} />
        </ChartCard>

        <section className="card report-figures" aria-label="Period summary">
          <div className="card__head">
            <div>
              <h2>Delivery performance</h2>
              <p className="muted">{range.label}</p>
            </div>
          </div>
          <p className="report-hero">{pct(summary.successRate)}</p>
          <p className="muted report-hero__label">of completed shipments delivered</p>
          <p className="report-meter-label">
            <span>On-time delivery</span>
            <strong>{pct(summary.onTimeRate)}</strong>
          </p>
          <div className={`meter meter--${summary.onTimeRate >= ON_TIME_TARGET ? 'success' : 'warning'}`}
            role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(summary.onTimeRate.toFixed(1))} aria-label="On-time delivery rate">
            <div className="meter__fill" style={{ width: `${summary.onTimeRate}%` }} />
            <div className="meter__target" style={{ left: `${ON_TIME_TARGET}%` }}><span>Target {ON_TIME_TARGET}%</span></div>
          </div>
          <dl className="report-facts">
            <div><dt>Delivered</dt><dd>{formatNumber(summary.delivered)}</dd></div>
            <div><dt>Avg delivery time</dt><dd>{summary.avgDays.toFixed(1)} days</dd></div>
            <div><dt>Failed or returned</dt><dd>{formatNumber(summary.notDelivered)}</dd></div>
            <div><dt>Cancelled</dt><dd>{formatNumber(summary.cancelled)}</dd></div>
          </dl>
        </section>
      </div>

      <div className="report-grid report-grid--even">
        <ChartCard
          title="Delivery performance by service"
          subtitle="Outcome of shipments that were delivered, failed or returned"
          legend={<Legend items={OUTCOMES} />}
          table={
            <table className="table report-table">
              <thead><tr><th>Service</th><th>Completed</th><th>On time</th><th>Late</th><th>Failed / returned</th><th>On-time rate</th><th>Avg days</th></tr></thead>
              <tbody>
                {[{ ...summary, key: 'all', label: 'All services' }, ...services].map((s) => (
                  <tr key={s.key}>
                    <td data-label="Service"><strong>{s.label}</strong></td>
                    <td data-label="Completed">{formatNumber(s.finished)}</td>
                    <td data-label="On time">{formatNumber(s.onTime)}</td>
                    <td data-label="Late">{formatNumber(s.late)}</td>
                    <td data-label="Failed / returned">{formatNumber(s.notDelivered)}</td>
                    <td data-label="On-time rate">{pct(s.onTimeRate)}</td>
                    <td data-label="Avg days">{s.avgDays.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <PerformanceBars total={summary} services={services} />
        </ChartCard>

        <ChartCard title="Top customers" subtitle={`By shipments booked, ${range.label.toLowerCase()}`}>
          <TopCustomers customers={topCustomers} />
        </ChartCard>
      </div>
    </main>
  )
}
