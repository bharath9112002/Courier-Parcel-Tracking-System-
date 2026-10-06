import { passwordStrength } from '../utils/validation'

const LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']

export default function PasswordStrength({ password }) {
  const score = passwordStrength(password)
  if (!password) return null

  return (
    <div className={`strength strength--${score}`}>
      <div className="strength__bars">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={i <= score ? 'is-filled' : ''} />
        ))}
      </div>
      <span className="strength__label">{LABELS[score]}</span>
    </div>
  )
}
