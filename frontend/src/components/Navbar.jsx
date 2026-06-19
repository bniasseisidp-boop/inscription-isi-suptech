import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogOut, User, LayoutDashboard, BookOpen } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [isDark, setIsDark] = useState(() => localStorage.getItem('isi_theme') === 'dark')

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const onStorage = () => setIsDark(localStorage.getItem('isi_theme') === 'dark')
    window.addEventListener('storage', onStorage)
    const interval = setInterval(() => {
      setIsDark(localStorage.getItem('isi_theme') === 'dark')
    }, 300)
    return () => { window.removeEventListener('storage', onStorage); clearInterval(interval) }
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const scrollTo = (id) => {
    setOpen(false)
    if (location.pathname === '/') {
      const el = document.getElementById(id)
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 72
        window.scrollTo({ top: y, behavior: 'smooth' })
      }
    } else {
      sessionStorage.setItem('isi_scroll_to', id)
      navigate('/')
    }
  }

  const dashboardPath = {
    admin:   '/admin',
    student: '/student',
    cashier: '/caisse',
    accueil: '/accueil',
  }[user?.role] || '/'

  const navBg = scrolled
    ? 'bg-white border-b border-slate-200 shadow-lg'
    : 'bg-white border-b border-slate-100'

  const textColor    = 'text-slate-800'
  const textSubColor = 'text-slate-600'
  const subLabel     = 'text-brand-600'
  const hoverColor   = 'hover:text-brand-600'
  const mobileMenuBg = 'bg-white border-slate-200'
  const userPill     = 'bg-slate-100 border-slate-200'
  const logoutColor  = 'text-red-500 hover:text-red-600 hover:bg-red-50'
  const connBtn      = 'border-slate-300 text-slate-700 hover:bg-slate-100'

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <img
            src="/isi-logo.png"
            alt="ISI SUPTECH"
            className="h-10 w-auto object-contain"
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 items-center justify-center shadow-lg hidden">
            <span className="text-white font-black text-sm">ISI</span>
          </div>
          <div>
            <div className={`font-bold text-lg leading-tight ${textColor}`}>ISI SUPTECH</div>
            <div className={`text-xs leading-tight font-medium ${subLabel}`}>Groupe ISI</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {!user ? (
            <>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollTo('filieres')}
                className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${textSubColor} ${hoverColor} hover:bg-white/8`}>
                Filières
              </motion.button>

              <Link to="/formations"
                className="px-4 py-2 rounded-lg transition-all text-sm font-medium flex items-center gap-1.5 text-brand-700 hover:text-brand-800 hover:bg-brand-50">
                <BookOpen size={14}/> Nos Formations
              </Link>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollTo('campus')}
                className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${textSubColor} ${hoverColor} hover:bg-white/8`}>
                Campus
              </motion.button>

              <Link to="/connexion" className={`border font-semibold px-4 py-2 rounded-xl text-sm transition-all ml-1 ${connBtn}`}>
                Connexion
              </Link>
              <Link to="/pre-inscription" className="btn-primary text-sm py-2 px-5 ml-1">
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
                <LogOut size={16} /> Déconnexion
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
                  <button onClick={() => scrollTo('filieres')}
                    className="py-2.5 px-4 rounded-xl text-sm font-medium text-left transition-all text-slate-600 hover:bg-slate-100">
                    Filières
                  </button>
                  <Link to="/formations" onClick={() => setOpen(false)}
                    className="py-2.5 px-4 rounded-xl text-sm font-bold flex items-center gap-2 text-brand-700 bg-brand-50">
                    <BookOpen size={14}/> Nos Formations
                  </Link>
                  <button onClick={() => scrollTo('campus')}
                    className="py-2.5 px-4 rounded-xl text-sm font-medium text-left transition-all text-slate-600 hover:bg-slate-100">
                    Campus
                  </button>
                  <div className="my-1 border-t border-slate-100"/>
                  <Link to="/connexion" onClick={() => setOpen(false)} className={`border font-semibold py-2.5 px-4 rounded-xl text-sm text-center transition-all border-slate-300 text-slate-700 hover:bg-slate-100`}>
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
                    Déconnexion
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
