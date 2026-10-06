export default function FormField({ label, name, error, children }) {
  return (
    <div className={`field ${error ? 'field--error' : ''}`}>
      <label htmlFor={name}>{label}</label>
      {children}
      {error && (
        <p className="field__error" id={`${name}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
