import FormField from './FormField'
import Icon from './Icon'

// `as` can be 'input' (default), 'textarea' or 'select' (pass <option>s as children).
export default function TextInput({ label, name, error, icon, as: Tag = 'input', children, ...inputProps }) {
  return (
    <FormField label={label} name={name} error={error}>
      <div className={`input input--${Tag} ${icon ? '' : 'input--no-icon'}`}>
        {icon && <Icon name={icon} size={18} className="input__icon" />}
        <Tag
          id={name}
          name={name}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          {...inputProps}
        >
          {children}
        </Tag>
      </div>
    </FormField>
  )
}
