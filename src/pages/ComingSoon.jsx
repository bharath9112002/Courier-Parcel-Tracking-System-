import { Link } from 'react-router-dom'
import Icon from '../components/Icon'

// Placeholder for sections that later modules will build out.
export default function ComingSoon({ title, icon = 'package' }) {
  return (
    <main className="page">
      <section className="card coming-soon">
        <span className="coming-soon__icon"><Icon name={icon} size={30} /></span>
        <h1>{title}</h1>
        <p className="muted">This section is coming in a later module.</p>
        <Link to="/dashboard" className="btn btn--ghost btn--auto">Back to dashboard</Link>
      </section>
    </main>
  )
}
