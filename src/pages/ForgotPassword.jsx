import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import Icon from '../components/Icon'
import TextInput from '../components/TextInput'
import { useForm } from '../hooks/useForm'
import { validateForgotPassword } from '../utils/validation'

// UI only: there is no backend, so no email is actually sent.
export default function ForgotPassword() {
  const { values, errors, handleChange, handleBlur, validateAll, reset } = useForm(
    { email: '' },
    validateForgotPassword,
  )
  const [sentTo, setSentTo] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateAll()) return

    setLoading(true)
    setTimeout(() => {
      setSentTo(values.email.trim())
      setLoading(false)
    }, 800)
  }

  const tryAgain = () => {
    setSentTo('')
    reset()
  }

  return (
    <AuthLayout
      icon={sentTo ? 'mail' : 'key'}
      title={sentTo ? 'Check your email' : 'Forgot password?'}
      subtitle={
        sentTo
          ? undefined
          : "Enter your registered email and we'll send you a link to reset your password"
      }
      footer={<Link to="/login">← Back to login</Link>}
    >
      {sentTo ? (
        <div className="reset-sent">
          <div className="reset-sent__icon"><Icon name="check" size={30} /></div>
          <p>
            If an account exists for <strong>{sentTo}</strong>, you&apos;ll receive a password reset
            link shortly.
          </p>
          <button type="button" className="btn btn--ghost" onClick={tryAgain}>
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
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
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
