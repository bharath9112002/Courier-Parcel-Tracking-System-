import Icon from '../Icon'
import { STATUS, STATUS_FLOW } from '../../utils/shipmentStatus'

// The last normal step reached before a parcel left the usual flow.
function stepBeforeProblem(status, times) {
  if (status === 'cancelled') return times?.picked_up ? 'picked_up' : 'pending'
  return 'out_for_delivery' // failed / returned: it had gone out for delivery
}

// `times` (optional) maps each status to when it was reached, shown under its label.
export default function DeliveryProgress({ status, times, formatTime }) {
  const problem = !STATUS_FLOW.includes(status)
  const reached = STATUS_FLOW.indexOf(problem ? stepBeforeProblem(status, times) : status)
  // A cancelled parcel never reaches the later steps, so they aren't shown.
  const steps = status === 'cancelled' ? STATUS_FLOW.slice(0, reached + 1) : STATUS_FLOW

  return (
    <ol className="progress">
      {steps.map((step, i) => {
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
        <li className={`progress__step is-problem tone--${STATUS[status].tone}`}>
          <span className="progress__dot"><Icon name={STATUS[status].icon} size={14} /></span>
          <span className="progress__label">{STATUS[status].label}</span>
          {times && <span className="progress__time">{times[status] ? formatTime(times[status]) : '—'}</span>}
        </li>
      )}
    </ol>
  )
}
