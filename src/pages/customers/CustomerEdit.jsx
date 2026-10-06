import { Link, useNavigate, useParams } from 'react-router-dom'
import CustomerForm from '../../components/customers/CustomerForm'
import Icon from '../../components/Icon'
import { ErrorState, PageLoader } from '../../components/LoadState'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { getCustomer, updateCustomer } from '../../services/customerService'

export default function CustomerEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { status, data: customer, error, reload } = useAsync(() => getCustomer(id), [id])

  const handleSubmit = async (values) => {
    const updated = await updateCustomer(id, values)
    toast.success(`Customer ${updated.name} updated`)
    navigate(`/customers/${id}`, { replace: true })
  }

  return (
    <main className="page page--narrow">
      <Link to={`/customers/${id}`} className="back-link"><Icon name="arrowLeft" size={16} /> Customer profile</Link>
      <header className="page__head">
        <div>
          <h1>Edit customer</h1>
          <p className="muted">{customer ? customer.name : 'Update the customer details.'}</p>
        </div>
      </header>

      {status === 'loading' && <PageLoader label="Loading customer…" />}
      {status === 'error' && <ErrorState error={error} onRetry={reload} backTo="/customers" noun="customer" />}
      {status === 'success' && (
        <CustomerForm mode="edit" initialValues={customer} onSubmit={handleSubmit} cancelTo={`/customers/${id}`} />
      )}
    </main>
  )
}
