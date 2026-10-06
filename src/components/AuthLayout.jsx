import Icon from './Icon'

const FEATURES = [
  { icon: 'truck', title: 'Same-day delivery', text: 'Pickups in under 60 minutes across the city.' },
  { icon: 'pin', title: 'Live tracking', text: 'Follow every parcel in real time, door to door.' },
  { icon: 'shield', title: 'Insured shipments', text: 'Every package is protected up to ₹50,000.' },
]

export default function AuthLayout({ icon = 'user', title, subtitle, children, footer }) {
  return (
    <main className="auth">
      <section className="auth__brand">
        <div className="auth__blob auth__blob--1" aria-hidden="true" />
        <div className="auth__blob auth__blob--2" aria-hidden="true" />

        <div className="brand brand--light">
          <span className="brand__mark"><Icon name="truck" size={22} /></span>
          <span className="brand__name">Courier</span>
        </div>

        <div className="auth__pitch">
          <h2>
            Deliver anything,
            <br />
            <span>anywhere, faster.</span>
          </h2>
          <p>Book shipments, track parcels and manage every delivery from one simple dashboard.</p>

          <ul className="features">
            {FEATURES.map((f) => (
              <li key={f.title}>
                <span className="features__icon"><Icon name={f.icon} size={20} /></span>
                <div>
                  <strong>{f.title}</strong>
                  <span>{f.text}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="stats">
          <div><strong>2M+</strong><span>Parcels delivered</span></div>
          <div><strong>150+</strong><span>Cities covered</span></div>
          <div><strong>4.9★</strong><span>Customer rating</span></div>
        </div>
      </section>

      <section className="auth__panel">
        <div className="auth__card">
          <header className="auth__header">
            <span className="auth__badge"><Icon name={icon} size={22} /></span>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </header>
          {children}
          {footer && <footer className="auth__footer">{footer}</footer>}
        </div>
      </section>
    </main>
  )
}
