import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import PasswordInput from '../components/PasswordInput'
import PasswordStrength from '../components/PasswordStrength'
import TextInput from '../components/TextInput'
import { useAuth } from '../context/AuthContext'
import { useForm } from '../hooks/useForm'
import { validateRegister } from '../utils/validation'

const INITIAL = { name: '', email: '', phone: '', password: '', confirmPassword: '', terms: false }

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const { values, errors, handleChange, handleBlur, validateAll } = useForm(INITIAL, validateRegister)
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!validateAll()) return

    setLoading(true)
    try {
      await register(values)
      navigate('/login', {
        replace: true,
        state: { registered: 'Account created successfully. Please log in.' },
      })
    } catch (err) {
      setFormError(err.message)
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      icon="user"
      title="Create your account"
      subtitle="Start shipping in a few seconds"
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      {formError && <div className="alert alert--error" role="alert">{formError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <TextInput
          label="Full name"
          name="name"
          icon="user"
          autoComplete="name"
          placeholder="John Doe"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.name}
        />

        <TextInput
          label="Email"
          name="email"
          icon="mail"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
        />

        <TextInput
          label="Phone number"
          name="phone"
          icon="phone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          autoComplete="tel-national"
          placeholder="9876543210"
          value={values.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.phone}
        />

        <PasswordInput
          label="Password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
        >
          <PasswordStrength password={values.password} />
        </PasswordInput>

        <PasswordInput
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={values.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.confirmPassword}
        />

        <div className={`field field--checkbox ${errors.terms ? 'field--error' : ''}`}>
          <label className="checkbox">
            <input
              type="checkbox"
              name="terms"
              checked={values.terms}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <span>I agree to the Terms of Service and Privacy Policy</span>
          </label>
          {errors.terms && <p className="field__error" role="alert">{errors.terms}</p>}
        </div>

        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}
