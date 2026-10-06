import { Link, useNavigate } from 'react-router-dom'
import CustomerForm from '../../components/customers/CustomerForm'
import Icon from '../../components/Icon'
import { useToast } from '../../context/ToastContext'
import { createCustomer } from '../../services/customerService'

const EMPTY = { name: '', email: '', mobile: '', address: '', city: '', postalCode: '' }

export default function CustomerCreate() {
  const navigate = useNavigate()
  const toast = useToast()

  const handleSubmit = async (values) => {
    const customer = await createCustomer(values)
    toast.success(`Customer ${customer.name} added`)
    navigate(`/customers/${customer.id}`, { replace: true })
  }

  return (
    <main className="page page--narrow">
      <Link to="/customers" className="back-link"><Icon name="arrowLeft" size={16} /> Customers</Link>
      <header className="page__head">
        <div>
          <h1>Add customer</h1>
          <p className="muted">Register a new sender or receiver.</p>
        </div>
      </header>

      <CustomerForm mode="create" initialValues={EMPTY} onSubmit={handleSubmit} cancelTo="/customers" />
    </main>
  )
}
