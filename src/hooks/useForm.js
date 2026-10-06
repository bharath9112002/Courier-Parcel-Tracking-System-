import { useState } from 'react'

// Tracks values, touched fields and errors. Errors show for a field once it
// has been blurred, and for every field after a submit attempt.
export function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues)
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const errors = validate(values)
  const visibleErrors = Object.fromEntries(
    Object.entries(errors).filter(([field]) => submitted || touched[field]),
  )

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target
    setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
  }

  // Returns true when the form is valid.
  const validateAll = () => {
    setSubmitted(true)
    return Object.keys(errors).length === 0
  }

  const reset = () => {
    setValues(initialValues)
    setTouched({})
    setSubmitted(false)
  }

  return { values, setValues, errors: visibleErrors, handleChange, handleBlur, validateAll, reset }
}
