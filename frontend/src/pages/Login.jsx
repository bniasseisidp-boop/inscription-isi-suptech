import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn, GraduationCap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import AnimatedBackground from '../components/AnimatedBackground'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  // Redirect if already logged in
  const ROLE_PATHS = { admin: '/admin', student: '/student', cashier: '/caisse', accueil: '/accueil', pedagogique: '/pedagogique' }

  if (user) {
    const path = ROLE_PATHS[user.role] || '/'
    navigate(path, { replace: true })
    return null
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const result = await login(data)
      const path = ROLE_PATHS[result.user.role] || '/'
      toast.success(`Bienvenue, ${result.user.name} !`)
      navigate(path, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-space-950 flex items-center justify-center px-4 relative">
      <AnimatedBackground />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card */}
        <div className="glass-card p-8 neon-border">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-brand-500/30 animate-pulse-glow">
              <span className="text-white font-black text-xl">ISI</span>
            </div>
            <h1 className="text-2xl font-black text-white">Connexion</h1>
            <p className="text-white/50 text-sm mt-1">Accédez à votre espace ISI SUPTECH</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="form-label">Adresse email</label>
              <input
                type="email"
                className="form-input"
                placeholder="vous@example.com"
                {...register('email', { required: 'Email requis', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email invalide' } })}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="form-label">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="form-input pr-12"
                  placeholder="••••••••"
                  {...register('password', { required: 'Mot de passe requis' })}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? <div className="spinner w-5 h-5" /> : <><LogIn size={18} /> Se connecter</>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/40 text-sm">
              Pas encore inscrit ?{' '}
              <Link to="/pre-inscription" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                Faire une pré-inscription
              </Link>
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 text-center">
            <Link to="/" className="text-white/30 hover:text-white/60 text-xs transition-colors">← Retour à l'accueil</Link>
          </div>
        </div>

        <div className="text-center mt-6 text-white/20 text-xs">
          Développé par <span className="text-brand-400/60 font-semibold">Multi Brain Tech</span>
        </div>
      </motion.div>
    </div>
  )
}
