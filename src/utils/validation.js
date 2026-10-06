import { PARCEL_TYPES, SHIPMENT_TYPES, todayISO } from './shipmentOptions'
import { STATUS } from './shipmentStatus'
import { TRACKING_PATTERN } from './tracking'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PERSON_NAME_RE = /^[a-zA-Z][a-zA-Z\s.'-]*$/
const MAX_WEIGHT_KG = 500
const PHONE_RE = /^[6-9]\d{9}$/
const PIN_CODE_RE = /^[1-9]\d{5}$/
const CITY_RE = /^[a-zA-Z][a-zA-Z\s.-]*$/

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

function validatePersonName(value, who) {
  const name = value.trim()
  if (!name) return `${who} name is required`
  if (name.length < 3) return `${who} name must be at least 3 characters`
  if (!PERSON_NAME_RE.test(name)) return `${who} name can contain only letters, spaces, . ' -`
  return ''
}

function validateAddress(value, which) {
  const address = value.trim()
  if (!address) return `${which} address is required`
  if (address.length < 10) return `Enter the full ${which.toLowerCase()} address (at least 10 characters)`
  return ''
}

// `mode` is 'create' or 'edit'. Past shipping dates are only allowed when editing.
export function validateShipment(values, mode = 'create') {
  const errors = {}

  if (!TRACKING_PATTERN.test(values.trackingNumber)) errors.trackingNumber = 'Invalid tracking number'

  const senderError = validatePersonName(values.senderName, 'Sender')
  if (senderError) errors.senderName = senderError
  const receiverError = validatePersonName(values.receiverName, 'Receiver')
  if (receiverError) errors.receiverName = receiverError

  const pickupError = validateAddress(values.pickupAddress, 'Pickup')
  if (pickupError) errors.pickupAddress = pickupError
  const deliveryError = validateAddress(values.deliveryAddress, 'Delivery')
  if (deliveryError) errors.deliveryAddress = deliveryError
  else if (values.deliveryAddress.trim().toLowerCase() === values.pickupAddress.trim().toLowerCase()) {
    errors.deliveryAddress = 'Delivery address must be different from the pickup address'
  }

  const weight = String(values.weight).trim()
  if (!weight) errors.weight = 'Parcel weight is required'
  else if (!/^\d+(\.\d{1,2})?$/.test(weight)) errors.weight = 'Enter a number with up to 2 decimals'
  else if (Number(weight) <= 0) errors.weight = 'Weight must be greater than 0'
  else if (Number(weight) > MAX_WEIGHT_KG) errors.weight = `Maximum weight is ${MAX_WEIGHT_KG} kg`

  if (!PARCEL_TYPES[values.parcelType]) errors.parcelType = 'Select a parcel type'
  if (!SHIPMENT_TYPES[values.shipmentType]) errors.shipmentType = 'Select a shipment type'
  if (!STATUS[values.status]) errors.status = 'Select a delivery status'

  if (!values.shippingDate) errors.shippingDate = 'Shipping date is required'
  else if (mode === 'create' && values.shippingDate < todayISO()) {
    errors.shippingDate = 'Shipping date cannot be in the past'
  }

  if (!values.expectedDeliveryDate) errors.expectedDeliveryDate = 'Expected delivery date is required'
  else if (values.shippingDate && values.expectedDeliveryDate < values.shippingDate) {
    errors.expectedDeliveryDate = 'Expected delivery cannot be before the shipping date'
  }

  return errors
}

export function validateCustomer(values) {
  const errors = {}

  const nameError = validatePersonName(values.name, 'Customer')
  if (nameError) errors.name = nameError
  else if (values.name.trim().length > 60) errors.name = 'Customer name must be at most 60 characters'

  const emailError = validateEmail(values.email)
  if (emailError) errors.email = emailError

  const mobile = values.mobile.replace(/\s+/g, '')
  if (!mobile) errors.mobile = 'Mobile number is required'
  else if (!PHONE_RE.test(mobile)) errors.mobile = 'Enter a valid 10-digit mobile number'

  const address = values.address.trim()
  if (!address) errors.address = 'Address is required'
  else if (address.length < 5) errors.address = 'Enter the full address (at least 5 characters)'
  else if (address.length > 200) errors.address = 'Address must be at most 200 characters'

  const city = values.city.trim()
  if (!city) errors.city = 'City is required'
  else if (city.length < 2) errors.city = 'City must be at least 2 characters'
  else if (!CITY_RE.test(city)) errors.city = 'City can contain only letters, spaces, . -'

  const postalCode = values.postalCode.trim()
  if (!postalCode) errors.postalCode = 'Postal code is required'
  else if (!PIN_CODE_RE.test(postalCode)) errors.postalCode = 'Enter a valid 6-digit PIN code'

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
