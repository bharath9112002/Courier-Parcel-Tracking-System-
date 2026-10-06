import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from '../../hooks/useForm'
import {
  addDays,
  PARCEL_TYPES,
  SHIPMENT_TYPES,
  STATUS_OPTIONS,
  todayISO,
} from '../../utils/shipmentOptions'
import { validateShipment } from '../../utils/validation'
import Icon from '../Icon'
import TextInput from '../TextInput'

// Used by both the create and edit pages. `onSubmit` returns a promise; if it
// rejects, its message is shown at the top of the form.
export default function ShipmentForm({ mode, initialValues, onSubmit, onRegenerateTracking, cancelTo }) {
  const { values, setValues, errors, handleChange, handleBlur, validateAll } = useForm(
    initialValues,
    (v) => validateShipment(v, mode),
  )
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Suggest an expected delivery date until the user picks one themselves.
  const expectedEdited = useRef(mode === 'edit')

  const handleScheduleChange = (e) => {
    const { name, value } = e.target
    if (name === 'expectedDeliveryDate') {
      expectedEdited.current = true
      handleChange(e)
      return
    }
    setValues((prev) => {
      const next = { ...prev, [name]: value }
      if (!expectedEdited.current && next.shippingDate && SHIPMENT_TYPES[next.shipmentType]) {
        next.expectedDeliveryDate = addDays(next.shippingDate, SHIPMENT_TYPES[next.shipmentType].days)
      }
      return next
    })
  }

  const regenerate = async () => {
    const tracking = await onRegenerateTracking(values.shippingDate || todayISO())
    setValues((prev) => ({ ...prev, trackingNumber: tracking }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!validateAll()) {
      setFormError('Please fix the highlighted fields.')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(values)
    } catch (err) {
      setFormError(err.message)
      setSubmitting(false)
    }
  }

  const field = (name) => ({ name, value: values[name], onChange: handleChange, onBlur: handleBlur, error: errors[name] })

  return (
    <form className="shipment-form" onSubmit={handleSubmit} noValidate>
      {formError && <div className="alert alert--error" role="alert">{formError}</div>}

      <section className="card form-section">
        <header className="form-section__head">
          <span className="form-section__icon tone--primary"><Icon name="package" size={18} /></span>
          <div>
            <h2>Tracking number</h2>
            <p className="muted">
              {mode === 'create'
                ? 'Generated automatically. Share it with the receiver to track the parcel.'
                : 'Tracking numbers cannot be changed after a shipment is created.'}
            </p>
          </div>
        </header>
        <div className="tracking-field">
          <code className="tracking-code">{values.trackingNumber}</code>
          {mode === 'create' && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={regenerate} disabled={submitting}>
              <Icon name="undo" size={15} />
              Regenerate
            </button>
          )}
        </div>
        {errors.trackingNumber && <p className="field__error" role="alert">{errors.trackingNumber}</p>}
      </section>

      <div className="form-grid-2">
        <section className="card form-section">
          <header className="form-section__head">
            <span className="form-section__icon tone--info"><Icon name="user" size={18} /></span>
            <div>
              <h2>Sender</h2>
              <p className="muted">Who is sending, and where to pick up</p>
            </div>
          </header>
          <TextInput label="Sender name" icon="user" placeholder="e.g. Priya Sharma" autoComplete="off" {...field('senderName')} />
          <TextInput label="Pickup address" as="textarea" rows={3} placeholder="House no, street, city, state, PIN" {...field('pickupAddress')} />
        </section>

        <section className="card form-section">
          <header className="form-section__head">
            <span className="form-section__icon tone--success"><Icon name="pin" size={18} /></span>
            <div>
              <h2>Receiver</h2>
              <p className="muted">Who is receiving, and where to deliver</p>
            </div>
          </header>
          <TextInput label="Receiver name" icon="user" placeholder="e.g. Arjun Nair" autoComplete="off" {...field('receiverName')} />
          <TextInput label="Delivery address" as="textarea" rows={3} placeholder="House no, street, city, state, PIN" {...field('deliveryAddress')} />
        </section>
      </div>

      <div className="form-grid-2">
        <section className="card form-section">
          <header className="form-section__head">
            <span className="form-section__icon tone--warning"><Icon name="package" size={18} /></span>
            <div>
              <h2>Parcel</h2>
              <p className="muted">What is being shipped</p>
            </div>
          </header>
          <TextInput label="Parcel weight (kg)" icon="package" inputMode="decimal" placeholder="e.g. 2.5" {...field('weight')} />
          <TextInput label="Parcel type" as="select" {...field('parcelType')}>
            <option value="">Select parcel type</option>
            {Object.entries(PARCEL_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </TextInput>
        </section>

        <section className="card form-section">
          <header className="form-section__head">
            <span className="form-section__icon tone--violet"><Icon name="calendar" size={18} /></span>
            <div>
              <h2>Schedule &amp; status</h2>
              <p className="muted">Service level and delivery dates</p>
            </div>
          </header>
          <TextInput label="Shipment type" as="select" {...field('shipmentType')} onChange={handleScheduleChange}>
            <option value="">Select shipment type</option>
            {Object.entries(SHIPMENT_TYPES).map(([value, t]) => (
              <option key={value} value={value}>
                {t.label} ({t.days === 0 ? 'same day' : `${t.days} day${t.days > 1 ? 's' : ''}`})
              </option>
            ))}
          </TextInput>
          <div className="form-grid-2 form-grid-2--tight">
            <TextInput label="Shipping date" type="date" min={mode === 'create' ? todayISO() : undefined}
              {...field('shippingDate')} onChange={handleScheduleChange} />
            <TextInput label="Expected delivery" type="date" min={values.shippingDate || undefined}
              {...field('expectedDeliveryDate')} onChange={handleScheduleChange} />
          </div>
          <TextInput label="Delivery status" as="select" {...field('status')}>
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </TextInput>
        </section>
      </div>

      <div className="form-actions">
        <Link to={cancelTo} className="btn btn--ghost">Cancel</Link>
        <button type="submit" className="btn btn--primary btn--auto" disabled={submitting}>
          {submitting && <span className="spinner" aria-hidden="true" />}
          {submitting ? 'Saving…' : mode === 'create' ? 'Create shipment' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
