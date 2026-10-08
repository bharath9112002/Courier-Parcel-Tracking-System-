import { useEffect, useRef, useState } from 'react'
import Icon from '../Icon'
import StatusBadge from '../StatusBadge'
import TextInput from '../TextInput'
import { useDeliveryStatus } from '../../context/DeliveryStatusContext'
import { nextStatuses, REASON_REQUIRED, STATUS } from '../../utils/shipmentStatus'

const REASON_EXAMPLE = {
  failed: 'E.g. Receiver not available at the address',
  cancelled: 'E.g. Sender asked to cancel the booking',
}

// Only the statuses the shipment can move to next are offered; the usual next
// step is picked by default.
export default function StatusUpdateDialog({ shipment, location = '', onSaved, onCancel }) {
  const { updateStatus } = useDeliveryStatus()
  const options = nextStatuses(shipment.status)
  const [values, setValues] = useState({ status: options[0], location, note: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [noteError, setNoteError] = useState('')
  const firstRef = useRef(null)

  const needsReason = REASON_REQUIRED.includes(values.status)

  useEffect(() => {
    firstRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onCancel])

  const change = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }))
    setNoteError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (needsReason && !values.note.trim()) {
      setNoteError(`Say why the shipment is ${STATUS[values.status].label.toLowerCase()}.`)
      return
    }
    setBusy(true)
    setError('')
    try {
      onSaved(await updateStatus(shipment, values))
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="modal" onClick={() => !busy && onCancel()}>
      <form
        className="modal__box modal__box--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        noValidate
      >
        <div className="modal__head">
          <span className="route__icon tone--primary"><Icon name="activity" size={18} /></span>
          <div>
            <h2 id="status-title">Update delivery status</h2>
            <p className="muted">{shipment.trackingNumber}</p>
          </div>
        </div>

        <div className="status-now">
          <span className="muted">Current status</span>
          <StatusBadge status={shipment.status} />
        </div>

        <fieldset className="status-options">
          <legend>Move to</legend>
          {options.map((value, i) => (
            <label key={value} className={`status-option ${values.status === value ? 'is-selected' : ''}`}>
              <input
                ref={i === 0 ? firstRef : undefined}
                type="radio"
                name="status"
                value={value}
                checked={values.status === value}
                onChange={change}
              />
              <span className="status-option__body">
                <StatusBadge status={value} />
                <span className="muted">{STATUS[value].description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <TextInput label="Location (optional)" name="location" icon="pin" value={values.location} onChange={change}
          placeholder="Where is the parcel now?" maxLength={80} />
        <TextInput
          label={needsReason ? 'Reason' : 'Note (optional)'}
          name="note"
          as="textarea"
          rows={3}
          value={values.note}
          onChange={change}
          error={noteError}
          placeholder={REASON_EXAMPLE[values.status] ?? 'E.g. Handed to delivery agent'}
          maxLength={160}
        />

        {error && <div className="alert alert--error" role="alert">{error}</div>}
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy && <span className="spinner" aria-hidden="true" />}
            {busy ? 'Saving…' : 'Save status'}
          </button>
        </div>
      </form>
    </div>
  )
}
