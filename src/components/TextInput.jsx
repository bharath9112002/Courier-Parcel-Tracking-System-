import FormField from './FormField'
import Icon from './Icon'

export default function TextInput({ label, name, error, icon, ...inputProps }) {
  return (
    <FormField label={label} name={name} error={error}>
      <div className="input">
        {icon && <Icon name={icon} size={18} className="input__icon" />}
        <input
          id={name}
          name={name}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          {...inputProps}
        />
      </div>
    </FormField>
  )
}
