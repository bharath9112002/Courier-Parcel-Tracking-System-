import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from '../../hooks/useForm'
import { validateCustomer } from '../../utils/validation'
import Icon from '../Icon'
import TextInput from '../TextInput'

// Fields that only accept digits; anything else typed or pasted is dropped.
const DIGITS_ONLY = { mobile: 10, postalCode: 6 }

// Used by both the create and edit pages. `onSubmit` returns a promise; if it
// rejects, its message is shown at the top of the form.
export default function CustomerForm({ mode, initialValues, onSubmit, cancelTo }) {
  const { values, setValues, errors, handleChange, handleBlur, validateAll } = useForm(initialValues, validateCustomer)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleDigitsChange = (e) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, DIGITS_ONLY[name]) }))
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

  const field = (name) => ({
    name,
    value: values[name],
    onChange: DIGITS_ONLY[name] ? handleDigitsChange : handleChange,
    onBlur: handleBlur,
    error: errors[name],
  })

  return (
    <form className="customer-form" onSubmit={handleSubmit} noValidate>
      {formError && <div className="alert alert--error" role="alert">{formError}</div>}

      <div className="form-grid-2">
        <section className="card form-section">
          <header className="form-section__head">
            <span className="form-section__icon tone--info"><Icon name="user" size={18} /></span>
            <div>
              <h2>Contact details</h2>
              <p className="muted">Who the customer is and how to reach them</p>
            </div>
          </header>
          <TextInput label="Customer name" icon="user" placeholder="e.g. Priya Sharma" autoComplete="off" {...field('name')} />
          <TextInput label="Email" type="email" icon="mail" placeholder="e.g. priya@example.com" autoComplete="off" {...field('email')} />
          <TextInput label="Mobile number" type="tel" icon="phone" inputMode="numeric" placeholder="10-digit mobile number"
            autoComplete="off" {...field('mobile')} />
        </section>

        <section className="card form-section">
          <header className="form-section__head">
            <span className="form-section__icon tone--success"><Icon name="pin" size={18} /></span>
            <div>
              <h2>Address</h2>
              <p className="muted">Used for pickups and deliveries</p>
            </div>
          </header>
          <TextInput label="Address" as="textarea" rows={3} placeholder="House no, street, area" {...field('address')} />
          <div className="form-grid-2 form-grid-2--tight">
            <TextInput label="City" placeholder="e.g. Chennai" autoComplete="off" {...field('city')} />
            <TextInput label="Postal code" inputMode="numeric" placeholder="6-digit PIN" autoComplete="off" {...field('postalCode')} />
          </div>
        </section>
      </div>

      <div className="form-actions">
        <Link to={cancelTo} className="btn btn--ghost">Cancel</Link>
        <button type="submit" className="btn btn--primary btn--auto" disabled={submitting}>
          {submitting && <span className="spinner" aria-hidden="true" />}
          {submitting ? 'Saving…' : mode === 'create' ? 'Add customer' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
