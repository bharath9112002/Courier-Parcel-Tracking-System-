// Status is never shown by colour alone: every status has an icon and a label.
// Each status has its own tone, so badges can be told apart at a glance.
export const STATUS = {
  pending: {
    label: 'Pending',
    tone: 'warning',
    icon: 'clock',
    verb: 'booked, awaiting pickup',
    description: 'Booked and waiting for the courier to collect it.',
  },
  picked_up: {
    label: 'Picked up',
    tone: 'teal',
    icon: 'package',
    verb: 'was picked up',
    description: 'Collected from the sender, on its way to the sorting facility.',
  },
  in_transit: {
    label: 'In transit',
    tone: 'info',
    icon: 'truck',
    verb: 'is in transit',
    description: 'Moving between facilities towards the destination city.',
  },
  out_for_delivery: {
    label: 'Out for delivery',
    tone: 'primary',
    icon: 'pin',
    verb: 'is out for delivery',
    description: 'With a delivery agent on the local route.',
  },
  delivered: {
    label: 'Delivered',
    tone: 'success',
    icon: 'check',
    verb: 'was delivered',
    description: 'Handed over to the receiver.',
  },
  failed: {
    label: 'Failed delivery',
    tone: 'danger',
    icon: 'alert',
    verb: 'delivery attempt failed',
    description: 'Delivery was attempted but could not be completed.',
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'slate',
    icon: 'ban',
    verb: 'was cancelled',
    description: 'Called off before it left the origin city.',
  },
  returned: {
    label: 'Returned',
    tone: 'pink',
    icon: 'undo',
    verb: 'was returned to sender',
    description: 'Sent back to the sender after failed delivery.',
  },
}

// The order a parcel normally moves through, for the progress tracker.
export const STATUS_FLOW = ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered']

// Where a parcel can go next from each status. The first entry is the usual
// next step. Delivered, cancelled and returned are final.
export const TRANSITIONS = {
  pending: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'cancelled'],
  in_transit: ['out_for_delivery'],
  out_for_delivery: ['delivered', 'failed'],
  failed: ['out_for_delivery', 'returned'],
  delivered: [],
  cancelled: [],
  returned: [],
}

// These need a reason, so the history explains what went wrong.
export const REASON_REQUIRED = ['failed', 'cancelled']

export const nextStatuses = (status) => TRANSITIONS[status] ?? []
export const isFinal = (status) => nextStatuses(status).length === 0
export const canTransition = (from, to) => nextStatuses(from).includes(to)

// Returns an error message when a status change isn't allowed, or null.
export function statusChangeError(from, to, note = '') {
  if (!canTransition(from, to)) {
    return `A ${STATUS[from].label.toLowerCase()} shipment can't be marked as ${STATUS[to].label.toLowerCase()}.`
  }
  if (REASON_REQUIRED.includes(to) && !note.trim()) return 'Add a reason for this status.'
  return null
}
