import { useState } from 'react'
import FormField from './FormField'
import Icon from './Icon'

export default function PasswordInput({ label, name, error, children, ...inputProps }) {
  const [visible, setVisible] = useState(false)

  return (
    <FormField label={label} name={name} error={error}>
      <div className="input input--password">
        <Icon name="lock" size={18} className="input__icon" />
        <input
          id={name}
          name={name}
          type={visible ? 'text' : 'password'}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          {...inputProps}
        />
        <button
          type="button"
          className="input__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
        </button>
      </div>
      {children}
    </FormField>
  )
}
