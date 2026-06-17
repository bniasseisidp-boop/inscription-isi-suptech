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

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
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

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-navy-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-navy-950/50'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img src="/isi-logo.png" alt="ISI SUPTECH" className="h-10 w-auto object-contain" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 items-center justify-center shadow-lg shadow-brand-500/30 hidden">
            <span className="text-white font-black text-sm">ISI</span>
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-tight">ISI SUPTECH</div>
            <div className="text-brand-400 text-xs leading-tight font-medium">Groupe ISI</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          {!user ? (
            <>
              <Link to="/#filieres" className="text-white/70 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium">Filières</Link>
              <Link to="/#campus" className="text-white/70 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium">Campus</Link>
              <Link to="/connexion" className="btn-secondary text-sm py-2 px-4">Connexion</Link>
              <Link to="/pre-inscription" className="btn-primary text-sm py-2 px-5">
                S'inscrire
              </Link>
            </>
          ) : (
            <>
              <Link to={dashboardPath} className="flex items-center gap-2 text-white/80 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                <LayoutDashboard size={16} />
                Tableau de bord
              </Link>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center">
                  <User size={14} className="text-white" />
                </div>
                <span className="text-white/80 text-sm font-medium">{user.name}</span>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 px-3 py-2 rounded-lg transition-colors text-sm">
                <LogOut size={16} />
                Déconnexion
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-white p-2">
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
            className="md:hidden bg-navy-800/98 backdrop-blur-xl border-t border-white/10"
          >
            <div className="px-4 py-4 flex flex-col gap-2">
              {!user ? (
                <>
                  <Link to="/connexion" onClick={() => setOpen(false)} className="btn-secondary text-center">Connexion</Link>
                  <Link to="/pre-inscription" onClick={() => setOpen(false)} className="btn-primary text-center">S'inscrire</Link>
                </>
              ) : (
                <>
                  <Link to={dashboardPath} onClick={() => setOpen(false)} className="btn-secondary text-center">Tableau de bord</Link>
                  <button onClick={handleLogout} className="text-red-400 hover:text-red-300 py-2 text-sm transition-colors">Déconnexion</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
