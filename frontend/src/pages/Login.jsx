import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn, X, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import LightPremiumBackground from '../components/LightPremiumBackground'
import { forgotPassword, resendTwoFactor } from '../services/api'

function TwoFactorStep({ challenge, emailMasque, onBack, onVerified }) {
  const { verifyTwoFactor } = useAuth()
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (code.trim().length !== 6) return
    setVerifying(true)
    try {
      const data = await verifyTwoFactor(challenge, code.trim())
      onVerified(data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Code invalide ou expiré.')
    } finally {
      setVerifying(false)
    }
  }

  const resend = async () => {
    setResending(true)
    try {
      await resendTwoFactor(challenge)
      toast.success('Un nouveau code vient d\'être envoyé.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Session expirée — reconnectez-vous.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="light-card p-8 shadow-xl">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-isiblue-50 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={26} className="text-isiblue-500"/>
        </div>
        <h1 className="text-2xl font-black text-slate-900">Vérification en 2 étapes</h1>
        <p className="text-slate-500 text-sm mt-1">
          Un code à 6 chiffres a été envoyé à <span className="text-slate-800 font-semibold">{emailMasque}</span>
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <input
          type="text" inputMode="numeric" autoFocus maxLength={6}
          className="form-input-light text-center text-2xl tracking-[0.5em] font-black"
          placeholder="------"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        />
        <button type="submit" disabled={verifying || code.length !== 6}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-isiblue-600 hover:bg-isiblue-700 transition-colors disabled:opacity-50">
          {verifying ? <div className="spinner w-5 h-5"/> : 'Vérifier'}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between text-sm">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600 transition-colors">← Retour</button>
        <button onClick={resend} disabled={resending} className="text-isiblue-600 hover:text-isiblue-700 font-medium disabled:opacity-50">
          {resending ? 'Envoi...' : 'Renvoyer le code'}
        </button>
      </div>
    </div>
  )
}

function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    try {
      await forgotPassword(email.trim())
      setSent(true)
    } catch {
      toast.error('Erreur lors de l\'envoi — réessayez.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative light-card p-6 max-w-sm w-full shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X size={18}/></button>
        <h3 className="text-slate-900 font-bold text-lg mb-1">Mot de passe oublié</h3>
        {sent ? (
          <p className="text-isiblue-600 text-sm mt-3">
            Si un compte existe avec cet email, un lien de réinitialisation vient de vous être envoyé — vérifiez votre boîte mail.
          </p>
        ) : (
          <>
            <p className="text-slate-500 text-sm mb-4">Saisissez votre email, un lien de réinitialisation vous sera envoyé.</p>
            <form onSubmit={submit} className="space-y-4">
              <input
                type="email" required autoFocus
                className="form-input-light"
                placeholder="vous@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white bg-isiblue-600 hover:bg-isiblue-700 transition-colors disabled:opacity-50">
                {sending ? <div className="spinner w-4 h-4"/> : 'Envoyer le lien'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [noAccount, setNoAccount] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [twoFactor, setTwoFactor] = useState(null) // { challenge, emailMasque }

  const { register, handleSubmit, formState: { errors } } = useForm()

  // Redirect if already logged in
  const ROLE_PATHS = { admin: '/admin', super_admin: '/admin', student: '/student', cashier: '/caisse', accueil: '/accueil', pedagogique: '/pedagogique' }

  if (user) {
    const path = ROLE_PATHS[user.role] || '/'
    navigate(path, { replace: true })
    return null
  }

  const goToDashboard = (result) => {
    const path = ROLE_PATHS[result.user.role] || '/'
    toast.success(`Bienvenue, ${result.user.name} !`)
    navigate(path, { replace: true })
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      setNoAccount(false)
      const result = await login(data)
      if (result.requires_2fa) {
        setTwoFactor({ challenge: result.challenge, emailMasque: result.email_masque })
        return
      }
      goToDashboard(result)
    } catch (err) {
      const data = err.response?.data
      if (data?.no_account) {
        setNoAccount(true)
      } else {
        toast.error(data?.errors?.email?.[0] || data?.message || 'Identifiants incorrects')
      }
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
        {/* Card */}
        {twoFactor ? (
          <TwoFactorStep
            challenge={twoFactor.challenge}
            emailMasque={twoFactor.emailMasque}
            onBack={() => setTwoFactor(null)}
            onVerified={goToDashboard}
          />
        ) : (
        <div className="light-card p-8 shadow-xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <img src="/isi-logo.png" alt="ISI SUPTECH" className="h-16 w-auto object-contain mx-auto mb-4 drop-shadow-sm"/>
            <h1 className="text-2xl font-black text-slate-900">Connexion</h1>
            <p className="text-slate-500 text-sm mt-1">Accédez à votre espace ISI SUPTECH</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="form-label-light">Adresse email</label>
              <input
                type="email"
                className="form-input-light"
                placeholder="vous@example.com"
                {...register('email', { required: 'Email requis', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email invalide' } })}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="form-label-light">Mot de passe</label>
                <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-isiblue-600 hover:text-isiblue-700 font-medium mb-2">
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="form-input-light pr-12"
                  placeholder="••••••••"
                  {...register('password', { required: 'Mot de passe requis' })}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-isiblue-600 hover:bg-isiblue-700 shadow-lg shadow-isiblue-500/20 transition-colors"
            >
              {loading ? <div className="spinner w-5 h-5" /> : <><LogIn size={18} /> Se connecter</>}
            </button>
          </form>

          {noAccount && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 p-4 rounded-xl border border-isigold-300 bg-isigold-50 text-center"
            >
              <p className="text-isigold-800 text-sm font-semibold mb-1">Aucun compte avec cet email</p>
              <p className="text-slate-500 text-xs mb-3">
                Vous n'avez pas encore de compte ISI SUPTECH. Commencez par une pré-inscription en ligne.
              </p>
              <Link
                to="/pre-inscription"
                className="inline-block px-4 py-2 bg-isiblue-600 hover:bg-isiblue-700 text-white text-sm font-bold rounded-lg transition-colors"
              >
                Faire ma pré-inscription →
              </Link>
            </motion.div>
          )}

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Pas encore inscrit ?{' '}
              <Link to="/pre-inscription" className="text-isiblue-600 hover:text-isiblue-700 font-semibold transition-colors">
                Faire une pré-inscription
              </Link>
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <Link to="/" className="text-slate-400 hover:text-slate-600 text-xs transition-colors">← Retour à l'accueil</Link>
          </div>
        </div>
        )}

        <div className="text-center mt-6 text-slate-400 text-xs">
          Développé par <span className="text-isiblue-500/70 font-semibold">Multi Brain Tech</span>
        </div>
      </motion.div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  )
}
