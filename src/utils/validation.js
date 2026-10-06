const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^[6-9]\d{9}$/

export function validateEmail(email) {
  if (!email.trim()) return 'Email is required'
  if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address'
  return ''
}

export function validateLogin({ email, password }) {
  const errors = {}
  const emailError = validateEmail(email)
  if (emailError) errors.email = emailError
  if (!password) errors.password = 'Password is required'
  return errors
}

export function validateRegister({ name, email, phone, password, confirmPassword, terms }) {
  const errors = {}

  if (!name.trim()) errors.name = 'Full name is required'
  else if (name.trim().length < 3) errors.name = 'Name must be at least 3 characters'
  else if (!/^[a-zA-Z\s.]+$/.test(name.trim())) errors.name = 'Name can contain only letters and spaces'

  const emailError = validateEmail(email)
  if (emailError) errors.email = emailError

  if (!phone.trim()) errors.phone = 'Phone number is required'
  else if (!PHONE_RE.test(phone.trim())) errors.phone = 'Enter a valid 10-digit mobile number'

  if (!password) errors.password = 'Password is required'
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters'
  else if (!/[A-Z]/.test(password)) errors.password = 'Include at least one uppercase letter'
  else if (!/[a-z]/.test(password)) errors.password = 'Include at least one lowercase letter'
  else if (!/\d/.test(password)) errors.password = 'Include at least one number'
  else if (!/[^A-Za-z0-9]/.test(password)) errors.password = 'Include at least one special character'

  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password'
  else if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match'

  if (!terms) errors.terms = 'You must accept the terms to continue'

  return errors
}

export function validateForgotPassword({ email }) {
  const errors = {}
  const emailError = validateEmail(email)
  if (emailError) errors.email = emailError
  return errors
}

// 0-4 score used by the strength meter on the register page.
export function passwordStrength(password) {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}
