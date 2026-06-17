import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0d1b2a',
              color: '#e2e8f0',
              border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#0d1b2a' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#0d1b2a' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
