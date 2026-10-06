import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/format'

const DATE_TIME = { dateStyle: 'medium', timeStyle: 'short' }

export default function Profile() {
  const { user } = useAuth()

  return (
    <main className="page">
      <header className="page__head">
        <div>
          <h1>Your profile</h1>
          <p className="muted">Account details stored for this browser.</p>
        </div>
      </header>

      <section className="card profile-card">
        <div className="profile-card__head">
          <span className="avatar avatar--lg" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
          <div>
            <h2>{user.name}</h2>
            <p className="muted">{user.email}</p>
          </div>
        </div>
        <dl className="profile">
          <dt>Name</dt>
          <dd>{user.name}</dd>
          <dt>Email</dt>
          <dd>{user.email}</dd>
          <dt>Phone</dt>
          <dd>{user.phone}</dd>
          <dt>Member since</dt>
          <dd>{formatDate(user.createdAt, DATE_TIME)}</dd>
          <dt>Last login</dt>
          <dd>{formatDate(user.lastLoginAt, DATE_TIME)}</dd>
        </dl>
      </section>
    </main>
  )
}
