import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, logout as apiLogout, getMe, verifyTwoFactor as apiVerifyTwoFactor } from '../services/api'

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

  const applySession = (data) => {
    localStorage.setItem('isi_token', data.token)
    localStorage.setItem('isi_user', JSON.stringify(data.user))
    setUser(data.user)
    setStudent(data.student)
    return data
  }

  const login = async (credentials) => {
    const { data } = await apiLogin(credentials)
    if (data.requires_2fa) return data
    return applySession(data)
  }

  const verifyTwoFactor = async (challenge, code) => {
    const { data } = await apiVerifyTwoFactor(challenge, code)
    return applySession(data)
  }

  const logout = async () => {
    try { await apiLogout() } catch {}
    localStorage.removeItem('isi_token')
    localStorage.removeItem('isi_user')
    setUser(null)
    setStudent(null)
  }

  const refreshStudent = (newData) => setStudent(newData)

  const updateUser = (newUser) => {
    localStorage.setItem('isi_user', JSON.stringify(newUser))
    setUser(newUser)
  }

  const isAdmin        = user?.role === 'admin'
  const isCashier      = user?.role === 'cashier'
  const isStudent      = user?.role === 'student'
  const isAccueil      = user?.role === 'accueil'
  const isPedagogique  = user?.role === 'pedagogique'

  return (
    <AuthContext.Provider value={{
      user, student, loading,
      login, logout, refreshStudent, verifyTwoFactor, updateUser,
      isAdmin, isCashier, isStudent, isAccueil, isPedagogique,
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
