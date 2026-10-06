// Status is never shown by colour alone: every status has an icon and a label.
export const STATUS = {
  pending: { label: 'Pending', tone: 'warning', icon: 'clock', verb: 'booked, awaiting pickup' },
  in_transit: { label: 'In transit', tone: 'info', icon: 'truck', verb: 'is in transit' },
  out_for_delivery: { label: 'Out for delivery', tone: 'primary', icon: 'pin', verb: 'is out for delivery' },
  delivered: { label: 'Delivered', tone: 'success', icon: 'check', verb: 'was delivered' },
  failed: { label: 'Failed', tone: 'danger', icon: 'x', verb: 'delivery attempt failed' },
  returned: { label: 'Returned', tone: 'neutral', icon: 'undo', verb: 'was returned to sender' },
}
