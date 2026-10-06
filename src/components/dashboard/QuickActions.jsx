import { Link } from 'react-router-dom'
import Icon from '../Icon'

const ACTIONS = [
  { to: '/shipments/new', icon: 'plus', title: 'Create shipment', text: 'Book a new pickup and delivery', tone: 'primary' },
  { to: '/tracking', icon: 'search', title: 'Track parcel', text: 'Find a parcel by tracking ID', tone: 'info' },
  { to: '/customers/new', icon: 'users', title: 'Add customer', text: 'Register a new sender or receiver', tone: 'success' },
  { to: '/reports', icon: 'chart', title: 'View reports', text: 'Delivery and revenue summaries', tone: 'warning' },
]

export default function QuickActions() {
  return (
    <section>
      <h2 className="section-title">Quick actions</h2>
      <div className="quick-actions">
        {ACTIONS.map((a) => (
          <Link key={a.to} to={a.to} className={`quick-action tone--${a.tone}`}>
            <span className="quick-action__icon"><Icon name={a.icon} size={22} /></span>
            <span className="quick-action__text">
              <strong>{a.title}</strong>
              <span>{a.text}</span>
            </span>
            <Icon name="arrowRight" size={18} className="quick-action__arrow" />
          </Link>
        ))}
      </div>
    </section>
  )
}
