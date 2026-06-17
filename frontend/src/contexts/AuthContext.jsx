import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, logout as apiLogout, getMe } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('isi_token')
    if (token) {
      getMe()
        .then(({ data }) => {
          setUser(data.user)
          setStudent(data.student)
        })
        .catch(() => {
          localStorage.removeItem('isi_token')
          localStorage.removeItem('isi_user')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (credentials) => {
    const { data } = await apiLogin(credentials)
    localStorage.setItem('isi_token', data.token)
    localStorage.setItem('isi_user', JSON.stringify(data.user))
    setUser(data.user)
    setStudent(data.student)
    return data
  }

  const logout = async () => {
    try { await apiLogout() } catch {}
    localStorage.removeItem('isi_token')
    localStorage.removeItem('isi_user')
    setUser(null)
    setStudent(null)
  }

  const refreshStudent = (newData) => setStudent(newData)

  const isAdmin    = user?.role === 'admin'
  const isCashier  = user?.role === 'cashier'
  const isStudent  = user?.role === 'student'
  const isAccueil  = user?.role === 'accueil'

  return (
    <AuthContext.Provider value={{
      user, student, loading,
      login, logout, refreshStudent,
      isAdmin, isCashier, isStudent, isAccueil,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
