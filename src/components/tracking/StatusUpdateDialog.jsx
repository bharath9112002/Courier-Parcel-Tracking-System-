import { useEffect, useRef, useState } from 'react'
import Icon from '../Icon'
import TextInput from '../TextInput'
import { useAuth } from '../../context/AuthContext'
import { updateParcelStatus } from '../../services/trackingService'
import { STATUS_OPTIONS } from '../../utils/shipmentOptions'

// The usual next step, offered as the default choice.
const NEXT = {
  pending: 'in_transit',
  in_transit: 'out_for_delivery',
  out_for_delivery: 'delivered',
  failed: 'out_for_delivery',
  delivered: 'returned',
  returned: 'in_transit',
}

export default function StatusUpdateDialog({ shipment, location, onSaved, onCancel }) {
  const { user } = useAuth()
  const [values, setValues] = useState({ status: NEXT[shipment.status], location, note: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const firstRef = useRef(null)

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

  const change = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      onSaved(await updateParcelStatus(shipment, values, user))
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
          <span className="route__icon tone--primary"><Icon name="truck" size={18} /></span>
          <div>
            <h2 id="status-title">Update parcel status</h2>
            <p className="muted">{shipment.trackingNumber}</p>
          </div>
        </div>

        <TextInput label="New status" name="status" as="select" value={values.status} onChange={change} ref={firstRef}>
          {STATUS_OPTIONS.filter((o) => o.value !== shipment.status).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </TextInput>
        <TextInput label="Location" name="location" icon="pin" value={values.location} onChange={change}
          placeholder="Where is the parcel now?" maxLength={80} />
        <TextInput label="Note (optional)" name="note" as="textarea" rows={3} value={values.note} onChange={change}
          placeholder="E.g. Handed to delivery agent" maxLength={160} />

        {error && <div className="alert alert--error" role="alert">{error}</div>}
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy && <span className="spinner" aria-hidden="true" />}
            {busy ? 'Saving…' : 'Save update'}
          </button>
        </div>
      </form>
    </div>
  )
}
