import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { useAuth } from '../context/AuthContext'

const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="dashboard">
      <nav className="topbar">
        <div className="brand">
          <span className="brand__mark"><Icon name="truck" size={20} /></span>
          <span className="brand__name">Courier</span>
        </div>
        <div className="topbar__user">
          <div className="topbar__who">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          <span className="avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={handleLogout}>
            <Icon name="logout" size={16} />
            Log out
          </button>
        </div>
      </nav>

      <main className="dashboard__content">
        <section className="hero-card">
          <h1>Hello, {user.name.split(' ')[0]} 👋</h1>
          <p>You are signed in. This page is only visible to logged-in users.</p>
        </section>

        <section className="card">
          <h2>Your profile</h2>
          <dl className="profile">
            <dt>Name</dt>
            <dd>{user.name}</dd>
            <dt>Email</dt>
            <dd>{user.email}</dd>
            <dt>Phone</dt>
            <dd>{user.phone}</dd>
            <dt>Member since</dt>
            <dd>{formatDate(user.createdAt)}</dd>
            <dt>Last login</dt>
            <dd>{formatDate(user.lastLoginAt)}</dd>
          </dl>
        </section>
      </main>
    </div>
  )
}
