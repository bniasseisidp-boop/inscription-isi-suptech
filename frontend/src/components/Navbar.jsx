import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogOut, User, LayoutDashboard } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [isDark, setIsDark] = useState(() => localStorage.getItem('isi_theme') === 'dark')

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Sync with Landing theme toggle
  useEffect(() => {
    const onStorage = () => setIsDark(localStorage.getItem('isi_theme') === 'dark')
    window.addEventListener('storage', onStorage)
    // Also poll every 300ms since same-tab changes don't trigger 'storage'
    const interval = setInterval(() => {
      setIsDark(localStorage.getItem('isi_theme') === 'dark')
    }, 300)
    return () => { window.removeEventListener('storage', onStorage); clearInterval(interval) }
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const dashboardPath = {
    admin:   '/admin',
    student: '/student',
    cashier: '/caisse',
    accueil: '/accueil',
  }[user?.role] || '/'

  // Theme-aware classes
  const navBg = isDark
    ? scrolled ? 'bg-space-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl' : 'bg-transparent'
    : scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-lg'    : 'bg-white/60 backdrop-blur-sm'

  const textColor    = isDark ? 'text-white'          : 'text-slate-800'
  const textSubColor = isDark ? 'text-white/70'       : 'text-slate-600'
  const subLabel     = isDark ? 'text-brand-400'      : 'text-brand-600'
  const hoverColor   = isDark ? 'hover:text-white'    : 'hover:text-brand-600'
  const mobileMenuBg = isDark ? 'bg-space-800/98 border-white/10' : 'bg-white border-slate-200'
  const userPill     = isDark ? 'bg-white/5 border-white/10'     : 'bg-slate-100 border-slate-200'
  const logoutColor  = isDark ? 'text-red-400 hover:text-red-300 hover:bg-red-500/5' : 'text-red-500 hover:text-red-600 hover:bg-red-50'
  const connBtn      = isDark ? 'border-white/30 text-white hover:bg-white/10'       : 'border-slate-300 text-slate-700 hover:bg-slate-100'

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/isi-logo.png"
            alt="ISI SUPTECH"
            className="h-10 w-auto object-contain"
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          <div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 items-center justify-center shadow-lg hidden"
          >
            <span className="text-white font-black text-sm">ISI</span>
          </div>
          <div>
            <div className={`font-bold text-lg leading-tight ${textColor}`}>ISI SUPTECH</div>
            <div className={`text-xs leading-tight font-medium ${subLabel}`}>Groupe ISI</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          {!user ? (
            <>
              <Link to="/#filieres" className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${textSubColor} ${hoverColor}`}>
                FiliÃ¨res
              </Link>
              <Link to="/#campus" className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${textSubColor} ${hoverColor}`}>
                Campus
              </Link>
              <Link to="/connexion" className={`border font-semibold px-4 py-2 rounded-xl text-sm transition-all ${connBtn}`}>
                Connexion
              </Link>
              <Link to="/pre-inscription" className="btn-primary text-sm py-2 px-5">
                S'inscrire
              </Link>
            </>
          ) : (
            <>
              <Link to={dashboardPath} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${textSubColor} ${hoverColor}`}>
                <LayoutDashboard size={16} /> Tableau de bord
              </Link>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${userPill}`}>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center">
                  <User size={14} className="text-white" />
                </div>
                <span className={`text-sm font-medium ${textColor}`}>{user.name}</span>
              </div>
              <button onClick={handleLogout} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${logoutColor}`}>
                <LogOut size={16} /> DÃ©connexion
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setOpen(!open)} className={`md:hidden p-2 ${textColor}`}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden backdrop-blur-xl border-t ${mobileMenuBg}`}
          >
            <div className="px-4 py-4 flex flex-col gap-2">
              {!user ? (
                <>
                  <Link to="/connexion" onClick={() => setOpen(false)} className={`border font-semibold py-2.5 px-4 rounded-xl text-sm text-center transition-all ${connBtn}`}>
                    Connexion
                  </Link>
                  <Link to="/pre-inscription" onClick={() => setOpen(false)} className="btn-primary text-center">
                    S'inscrire
                  </Link>
                </>
              ) : (
                <>
                  <Link to={dashboardPath} onClick={() => setOpen(false)} className="btn-secondary text-center">
                    Tableau de bord
                  </Link>
                  <button onClick={handleLogout} className={`py-2 text-sm transition-colors ${logoutColor}`}>
                    DÃ©connexion
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
