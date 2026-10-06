import Icon from './Icon'
import { STATUS } from '../utils/shipmentStatus'

export default function StatusBadge({ status }) {
  const s = STATUS[status] ?? STATUS.pending
  return (
    <span className={`badge badge--${s.tone}`}>
      <Icon name={s.icon} size={13} />
      {s.label}
    </span>
  )
}
