import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { cleanStorage } from './utils/storage'
import './index.css'
import './styles/dashboard.css'
import './styles/shipments.css'
import './styles/customers.css'
import './styles/tracking.css'
import './styles/delivery-status.css'

// Before anything reads storage, so the app starts from its own data only.
cleanStorage()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
