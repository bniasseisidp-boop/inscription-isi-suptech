import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { User, Mail, Phone, MapPin, Globe, Lock, Eye, EyeOff, Upload, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react'
import AnimatedBackground from '../components/AnimatedBackground'
import Navbar from '../components/Navbar'
import { submitPreInscription, getFilieres } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const STEPS = ['IdentitÃ©', 'Naissance & Adresse', 'Formation', 'SÃ©curitÃ©']

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${
            i < current  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' :
            i === current ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30 animate-pulse-glow' :
                           'bg-white/10 text-white/40'
          }`}>
            {i < current ? <CheckCircle size={18} /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-12 sm:w-20 transition-all duration-500 ${i < current ? 'bg-green-500' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function PhotoDropzone({ onFile, preview }) {
  const onDrop = useCallback((files) => { if (files[0]) onFile(files[0]) }, [onFile])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1, maxSize: 2097152,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
        isDragActive ? 'border-brand-400 bg-brand-500/10' : 'border-white/20 hover:border-brand-400/50 hover:bg-white/5'
      }`}
    >
      <input {...getInputProps()} />
      {preview ? (
        <div className="flex flex-col items-center gap-3">
          <img src={preview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-brand-500" />
          <p className="text-brand-400 text-sm">Cliquez pour changer</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-white/50">
          <Upload size={32} className="text-brand-400/60" />
          <div>
            <p className="font-medium text-white/70">Photo (optionnelle)</p>
            <p className="text-xs mt-1">JPG, PNG â€” max 2 Mo</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PreInscription() {
  const navigate = useNavigate()
  const { login: authLogin } = useAuth()
  const [step, setStep]         = useState(0)
  const [filieres, setFilieres] = useState([])
  const [licenses, setLicenses] = useState([])
  const [photo, setPhoto]       = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [showPwd, setShowPwd]   = useState(false)
  const [showPwd2, setShowPwd2] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]         = useState(false)

  const { register, handleSubmit, watch, trigger, setValue, formState: { errors } } = useForm({ mode: 'onBlur' })
  const selectedFiliere = watch('filiere_id')

  useEffect(() => {
    getFilieres()
      .then(({ data }) => setFilieres(data))
      .catch(() => setFilieres(DEMO_FILIERES))
  }, [])

  useEffect(() => {
    if (!selectedFiliere) { setLicenses([]); return }
    const f = filieres.find((f) => String(f.id) === String(selectedFiliere))
    setLicenses(f?.licenses || [])
    setValue('license_id', '')
  }, [selectedFiliere, filieres, setValue])

  const handlePhotoFile = (file) => {
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const stepFields = [
    ['nom', 'prenom', 'email', 'telephone', 'sexe'],
    ['date_naissance', 'lieu_naissance', 'adresse', 'nationalite', 'pays_residence'],
    ['filiere_id', 'license_id'],
    ['mot_de_passe', 'mot_de_passe_confirmation'],
  ]

  const next = async () => {
    const valid = await trigger(stepFields[step])
    if (valid) setStep((s) => s + 1)
  }
  const prev = () => setStep((s) => s - 1)

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => formData.append(k, v))
      if (photo) formData.append('photo', photo)
      formData.append('mot_de_passe_confirmation', data.mot_de_passe_confirmation)

      const { data: result } = await submitPreInscription(formData)

      localStorage.setItem('isi_token', result.token)
      setDone(true)
    } catch (err) {
      const errs = err.response?.data?.errors
      if (errs) Object.values(errs).flat().forEach((m) => toast.error(m))
      else toast.error(err.response?.data?.message || 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-space-950 relative flex items-center justify-center px-4">
        <AnimatedBackground />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-12 text-center max-w-lg relative z-10 neon-border"
        >
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: 3 }} className="text-8xl mb-6">ðŸŽ‰</motion.div>
          <h2 className="text-3xl font-black text-white mb-4">PrÃ©-inscription envoyÃ©e !</h2>
          <p className="text-white/60 mb-2">Votre dossier a Ã©tÃ© soumis avec succÃ¨s.</p>
          <p className="text-white/50 text-sm mb-8">Vous allez recevoir un email de confirmation. Notre Ã©quipe examinera votre candidature sous 48h.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/student')} className="btn-primary">AccÃ©der Ã  mon espace</button>
            <button onClick={() => navigate('/')} className="btn-secondary">Retour Ã  l'accueil</button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-space-950 relative">
      <AnimatedBackground />
      <Navbar />

      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="text-4xl font-black text-white">PrÃ©-Inscription</h1>
            <p className="text-white/50 mt-2">ISI SUPTECH â€” AnnÃ©e acadÃ©mique {new Date().getFullYear()}-{new Date().getFullYear()+1}</p>
          </motion.div>

          <StepIndicator current={step} total={STEPS.length} />

          <div className="glass-card p-8 neon-border">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-brand-600 text-white text-sm flex items-center justify-center font-black">{step + 1}</span>
              {STEPS[step]}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* â”€â”€ STEP 0: IdentitÃ© â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                  {step === 0 && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Nom *</label>
                          <input className="form-input" placeholder="DIALLO" {...register('nom', { required: 'Nom requis' })} />
                          {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom.message}</p>}
                        </div>
                        <div>
                          <label className="form-label">PrÃ©nom *</label>
                          <input className="form-input" placeholder="Moussa" {...register('prenom', { required: 'PrÃ©nom requis' })} />
                          {errors.prenom && <p className="text-red-400 text-xs mt-1">{errors.prenom.message}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="form-label">Adresse Email *</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                          <input className="form-input pl-10" type="email" placeholder="vous@email.com" {...register('email', { required: 'Email requis', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email invalide' } })} />
                        </div>
                        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                      </div>

                      <div>
                        <label className="form-label">TÃ©lÃ©phone *</label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                          <input className="form-input pl-10" type="tel" placeholder="+221 77 000 00 00" {...register('telephone', { required: 'TÃ©lÃ©phone requis' })} />
                        </div>
                        {errors.telephone && <p className="text-red-400 text-xs mt-1">{errors.telephone.message}</p>}
                      </div>

                      <div>
                        <label className="form-label">Sexe *</label>
                        <select className="form-input" {...register('sexe', { required: 'Sexe requis' })}>
                          <option value="">-- SÃ©lectionner --</option>
                          <option value="M">Masculin</option>
                          <option value="F">FÃ©minin</option>
                        </select>
                        {errors.sexe && <p className="text-red-400 text-xs mt-1">{errors.sexe.message}</p>}
                      </div>

                      <PhotoDropzone onFile={handlePhotoFile} preview={photoPreview} />
                    </div>
                  )}

                  {/* â”€â”€ STEP 1: Naissance & Adresse â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                  {step === 1 && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Date de naissance *</label>
                          <input className="form-input" type="date" {...register('date_naissance', { required: 'Date requise' })} />
                          {errors.date_naissance && <p className="text-red-400 text-xs mt-1">{errors.date_naissance.message}</p>}
                        </div>
                        <div>
                          <label className="form-label">Lieu de naissance *</label>
                          <input className="form-input" placeholder="Dakar" {...register('lieu_naissance', { required: 'Lieu requis' })} />
                          {errors.lieu_naissance && <p className="text-red-400 text-xs mt-1">{errors.lieu_naissance.message}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="form-label">Adresse *</label>
                        <div className="relative">
                          <MapPin size={16} className="absolute left-4 top-4 text-white/30" />
                          <input className="form-input pl-10" placeholder="Votre adresse complÃ¨te" {...register('adresse', { required: 'Adresse requise' })} />
                        </div>
                        {errors.adresse && <p className="text-red-400 text-xs mt-1">{errors.adresse.message}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">NationalitÃ© *</label>
                          <div className="relative">
                            <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                            <input className="form-input pl-10" placeholder="SÃ©nÃ©galaise" {...register('nationalite', { required: 'NationalitÃ© requise' })} />
                          </div>
                          {errors.nationalite && <p className="text-red-400 text-xs mt-1">{errors.nationalite.message}</p>}
                        </div>
                        <div>
                          <label className="form-label">Pays de rÃ©sidence *</label>
                          <input className="form-input" placeholder="SÃ©nÃ©gal" {...register('pays_residence', { required: 'Pays requis' })} />
                          {errors.pays_residence && <p className="text-red-400 text-xs mt-1">{errors.pays_residence.message}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* â”€â”€ STEP 2: Formation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                  {step === 2 && (
                    <div className="space-y-5">
                      <div>
                        <label className="form-label">FiliÃ¨re souhaitÃ©e *</label>
                        <select className="form-input" {...register('filiere_id', { required: 'FiliÃ¨re requise' })}>
                          <option value="">-- Choisir une filiÃ¨re --</option>
                          {filieres.map((f) => (
                            <option key={f.id} value={f.id}>{f.nom}</option>
                          ))}
                        </select>
                        {errors.filiere_id && <p className="text-red-400 text-xs mt-1">{errors.filiere_id.message}</p>}
                      </div>

                      {licenses.length > 0 && (
                        <div>
                          <label className="form-label">Niveau / Licence *</label>
                          <select className="form-input" {...register('license_id', { required: 'Niveau requis' })}>
                            <option value="">-- Choisir le niveau --</option>
                            {licenses.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.nom} â€” {Number(l.frais_inscription).toLocaleString()} FCFA inscription
                              </option>
                            ))}
                          </select>
                          {errors.license_id && <p className="text-red-400 text-xs mt-1">{errors.license_id.message}</p>}
                        </div>
                      )}

                      {selectedFiliere && licenses.length === 0 && (
                        <div className="glass-card p-4 text-center text-white/50 text-sm">
                          Chargement des niveaux...
                        </div>
                      )}

                      <div className="glass-card p-4 text-sm text-white/60 leading-relaxed">
                        <p className="text-brand-400 font-semibold mb-2">â„¹ï¸ Processus d'inscription</p>
                        <p>Votre candidature sera examinÃ©e par notre Ã©quipe pÃ©dagogique. Vous recevrez une rÃ©ponse par email sous 48h. En cas d'acceptation, un lien de paiement Wave vous sera envoyÃ©.</p>
                      </div>
                    </div>
                  )}

                  {/* â”€â”€ STEP 3: Mot de passe â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                  {step === 3 && (
                    <div className="space-y-5">
                      <div className="glass-card p-4 text-sm text-white/60 mb-2">
                        <p className="text-brand-400 font-semibold mb-1">ðŸ” CrÃ©ez votre espace Ã©tudiant</p>
                        <p>Ce mot de passe vous permettra de vous connecter pour suivre l'Ã©tat de votre candidature et accÃ©der Ã  votre espace Ã©tudiant.</p>
                      </div>

                      <div>
                        <label className="form-label">Mot de passe *</label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                          <input
                            className="form-input pl-10 pr-12"
                            type={showPwd ? 'text' : 'password'}
                            placeholder="Minimum 8 caractÃ¨res"
                            {...register('mot_de_passe', { required: 'Mot de passe requis', minLength: { value: 8, message: 'Minimum 8 caractÃ¨res' } })}
                          />
                          <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {errors.mot_de_passe && <p className="text-red-400 text-xs mt-1">{errors.mot_de_passe.message}</p>}
                      </div>

                      <div>
                        <label className="form-label">Confirmer le mot de passe *</label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                          <input
                            className="form-input pl-10 pr-12"
                            type={showPwd2 ? 'text' : 'password'}
                            placeholder="RÃ©pÃ©tez le mot de passe"
                            {...register('mot_de_passe_confirmation', {
                              required: 'Confirmation requise',
                              validate: (v) => v === watch('mot_de_passe') || 'Les mots de passe ne correspondent pas',
                            })}
                          />
                          <button type="button" onClick={() => setShowPwd2(!showPwd2)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                            {showPwd2 ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {errors.mot_de_passe_confirmation && <p className="text-red-400 text-xs mt-1">{errors.mot_de_passe_confirmation.message}</p>}
                      </div>

                      <div className="text-xs text-white/40 text-center">
                        En soumettant ce formulaire, vous acceptez les conditions d'utilisation de la plateforme ISI SUPTECH.
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                <button type="button" onClick={prev} disabled={step === 0} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${step === 0 ? 'opacity-0 pointer-events-none' : 'btn-secondary'}`}>
                  <ChevronLeft size={16} /> PrÃ©cÃ©dent
                </button>

                {step < STEPS.length - 1 ? (
                  <button type="button" onClick={next} className="btn-primary flex items-center gap-2">
                    Suivant <ChevronRight size={16} />
                  </button>
                ) : (
                  <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2 px-8">
                    {submitting ? <div className="spinner w-5 h-5" /> : <><CheckCircle size={18} /> Soumettre ma candidature</>}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

const DEMO_FILIERES = [
  { id: 1, nom: 'Informatique', code: 'INFO', licenses: [{ id: 1, nom: 'Licence 1', frais_inscription: 150000 }, { id: 2, nom: 'Licence 2', frais_inscription: 150000 }] },
  { id: 2, nom: 'RÃ©seaux', code: 'RT', licenses: [{ id: 3, nom: 'Licence 1', frais_inscription: 150000 }] },
]
