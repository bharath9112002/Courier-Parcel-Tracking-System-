import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from './Icon'

const NAV = [
  { to: '/dashboard', icon: 'grid', label: 'Dashboard' },
  { to: '/shipments', icon: 'package', label: 'Shipments' },
  { to: '/tracking', icon: 'pin', label: 'Track parcel' },
  { to: '/delivery-status', icon: 'activity', label: 'Delivery status' },
  { to: '/customers', icon: 'users', label: 'Customers' },
  { to: '/reports', icon: 'chart', label: 'Reports' },
]
const NAV_BOTTOM = [
  { to: '/profile', icon: 'user', label: 'Profile' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
]

function NavItems({ items, onNavigate }) {
  return items.map((item) => (
    <NavLink key={item.to} to={item.to} className="nav__link" onClick={onNavigate}>
      <Icon name={item.icon} size={19} />
      {item.label}
    </NavLink>
  ))
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={`shell ${menuOpen ? 'shell--menu-open' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar__top">
          <div className="brand">
            <span className="brand__mark"><Icon name="truck" size={20} /></span>
            <span className="brand__name">Courier</span>
          </div>
          <button type="button" className="icon-btn sidebar__close" onClick={closeMenu} aria-label="Close menu">
            <Icon name="x" size={20} />
          </button>
        </div>

        <nav className="nav" aria-label="Main">
          <span className="nav__heading">Menu</span>
          <NavItems items={NAV} onNavigate={closeMenu} />
          <span className="nav__heading">Account</span>
          <NavItems items={NAV_BOTTOM} onNavigate={closeMenu} />
        </nav>

        <button type="button" className="nav__link nav__logout" onClick={handleLogout}>
          <Icon name="logout" size={19} />
          Log out
        </button>
      </aside>
      <div className="shell__scrim" onClick={closeMenu} aria-hidden="true" />

      <div className="shell__main">
        <header className="topbar">
          <button type="button" className="icon-btn topbar__menu" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Icon name="menu" size={20} />
          </button>

          <label className="topbar__search">
            <Icon name="search" size={17} />
            <input type="search" placeholder="Search tracking ID, customer…" aria-label="Search" />
          </label>

          <div className="topbar__user">
            <button type="button" className="icon-btn" aria-label="Notifications">
              <Icon name="bell" size={19} />
              <span className="icon-btn__dot" />
            </button>
            <div className="topbar__who">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
            <span className="avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  )
}
