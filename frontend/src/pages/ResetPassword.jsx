import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import LightPremiumBackground from '../components/LightPremiumBackground'
import { resetPassword } from '../services/api'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm({ defaultValues: { email } })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await resetPassword({
        token,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
      })
      setDone(true)
      toast.success('Mot de passe réinitialisé !')
      setTimeout(() => navigate('/connexion', { replace: true }), 2000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lien invalide ou expiré — refaites une demande.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 relative overflow-hidden">
      <LightPremiumBackground />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="light-card p-8 shadow-xl">
          <div className="text-center mb-8">
            <img src="/isi-logo.png" alt="ISI SUPTECH" className="h-16 w-auto object-contain mx-auto mb-4 drop-shadow-sm"/>
            <h1 className="text-2xl font-black text-slate-900 flex items-center justify-center gap-2">
              <KeyRound size={22} className="text-isiblue-500"/> Nouveau mot de passe
            </h1>
            <p className="text-slate-500 text-sm mt-1">Choisissez votre nouveau mot de passe</p>
          </div>

          {!token || !email ? (
            <div className="text-center py-4">
              <p className="text-isigold-700 text-sm mb-4">Lien invalide — le token ou l'email est manquant.</p>
              <Link to="/connexion" className="text-isiblue-600 hover:text-isiblue-700 text-sm font-semibold">← Retour à la connexion</Link>
            </div>
          ) : done ? (
            <div className="text-center py-4">
              <p className="text-isiblue-600 text-sm mb-2">✓ Mot de passe réinitialisé avec succès !</p>
              <p className="text-slate-400 text-xs">Redirection vers la connexion...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <input type="hidden" {...register('email')} />
              <div>
                <label className="form-label-light">Email</label>
                <input type="email" className="form-input-light opacity-60" value={email} disabled readOnly />
              </div>

              <div>
                <label className="form-label-light">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="form-input-light pr-12"
                    placeholder="••••••••"
                    {...register('password', { required: 'Mot de passe requis', minLength: { value: 8, message: '8 caractères minimum' } })}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="form-label-light">Confirmer le mot de passe</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="form-input-light"
                  placeholder="••••••••"
                  {...register('password_confirmation', {
                    required: 'Confirmation requise',
                    validate: (v) => v === watch('password') || 'Les mots de passe ne correspondent pas',
                  })}
                />
                {errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{errors.password_confirmation.message}</p>}
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-isiblue-600 hover:bg-isiblue-700 shadow-lg shadow-isiblue-500/20 transition-colors">
                {loading ? <div className="spinner w-5 h-5" /> : 'Réinitialiser mon mot de passe'}
              </button>
            </form>
          )}

          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <Link to="/connexion" className="text-slate-400 hover:text-slate-600 text-xs transition-colors">← Retour à la connexion</Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
