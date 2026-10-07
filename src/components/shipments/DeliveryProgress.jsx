import Icon from '../Icon'
import { STATUS } from '../../utils/shipmentStatus'

const STEPS = ['pending', 'in_transit', 'out_for_delivery', 'delivered']

// `times` (optional) maps each step to when it was reached, shown under its label.
export default function DeliveryProgress({ status, times, formatTime }) {
  const problem = status === 'failed' || status === 'returned'
  // A failed/returned parcel had at least gone out for delivery.
  const reached = problem ? STEPS.indexOf('out_for_delivery') : STEPS.indexOf(status)

  return (
    <ol className="progress">
      {STEPS.map((step, i) => {
        const state = i < reached ? 'done' : i === reached ? (problem ? 'done' : 'current') : 'todo'
        const time = state !== 'todo' && times?.[step]
        return (
          <li key={step} className={`progress__step is-${state}`}>
            <span className="progress__dot"><Icon name={state === 'todo' ? STATUS[step].icon : 'check'} size={14} /></span>
            <span className="progress__label">{STATUS[step].label}</span>
            {times && <span className="progress__time">{time ? formatTime(time) : state === 'todo' ? 'Pending' : '—'}</span>}
          </li>
        )
      })}
      {problem && (
        <li className="progress__step is-problem">
          <span className="progress__dot"><Icon name={STATUS[status].icon} size={14} /></span>
          <span className="progress__label">{STATUS[status].label}</span>
          {times && <span className="progress__time">{formatTime(times[status])}</span>}
        </li>
      )}
    </ol>
  )
}
