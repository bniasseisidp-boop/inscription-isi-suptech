import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Landing from './pages/Landing'
import PreInscription from './pages/PreInscription'
import Login from './pages/Login'
import StudentPortal from './pages/StudentPortal'
import AdminDashboard from './pages/AdminDashboard'
import CashierDashboard from './pages/CashierDashboard'
import AccueilDashboard from './pages/AccueilDashboard'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-space-900"><div className="spinner" /></div>
  if (!user) return <Navigate to="/connexion" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/"              element={<Landing />} />
      <Route path="/pre-inscription" element={<PreInscription />} />
      <Route path="/connexion"     element={<Login />} />

      <Route path="/student/*" element={
        <ProtectedRoute roles={['student']}>
          <StudentPortal />
        </ProtectedRoute>
      } />

      <Route path="/admin/*" element={
        <ProtectedRoute roles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="/caisse/*" element={
        <ProtectedRoute roles={['cashier', 'admin']}>
          <CashierDashboard />
        </ProtectedRoute>
      } />

      <Route path="/accueil/*" element={
        <ProtectedRoute roles={['accueil', 'admin']}>
          <AccueilDashboard />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
