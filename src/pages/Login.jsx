import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import Icon from '../components/Icon'
import PasswordInput from '../components/PasswordInput'
import TextInput from '../components/TextInput'
import { useAuth } from '../context/AuthContext'
import { useForm } from '../hooks/useForm'
import { DEMO_CREDENTIALS } from '../utils/storage'
import { validateLogin } from '../utils/validation'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { values, setValues, errors, handleChange, handleBlur, validateAll } = useForm(
    { email: '', password: '' },
    validateLogin,
  )
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const redirectTo = location.state?.from?.pathname || '/dashboard'
  const registeredMessage = location.state?.registered

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!validateAll()) return

    setLoading(true)
    try {
      await login(values)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setFormError(err.message)
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setFormError('')
    setValues({ ...DEMO_CREDENTIALS })
  }

  return (
    <AuthLayout
      icon="lock"
      title="Welcome back"
      subtitle="Log in to manage your shipments"
      footer={
        <>
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </>
      }
    >
      {registeredMessage && <div className="alert alert--success">{registeredMessage}</div>}
      {formError && <div className="alert alert--error" role="alert">{formError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <TextInput
          label="Email"
          name="email"
          type="email"
          icon="mail"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
        />

        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
        />

        <div className="form-row form-row--end">
          <Link to="/forgot-password" className="link-sm">Forgot password?</Link>
        </div>

        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? <span className="spinner" aria-hidden="true" /> : null}
          {loading ? 'Logging in…' : 'Log in'}
          {!loading && <Icon name="arrowRight" size={18} />}
        </button>
      </form>

      <div className="demo-creds">
        <div className="demo-creds__head">
          <span className="demo-creds__tag">Demo</span>
          <p>Try the app with this account</p>
        </div>
        <div className="demo-creds__row">
          <Icon name="mail" size={16} />
          <code>{DEMO_CREDENTIALS.email}</code>
        </div>
        <div className="demo-creds__row">
          <Icon name="key" size={16} />
          <code>{DEMO_CREDENTIALS.password}</code>
        </div>
        <button type="button" className="btn btn--outline btn--sm btn--block" onClick={fillDemo}>
          Use demo credentials
        </button>
      </div>
    </AuthLayout>
  )
}
