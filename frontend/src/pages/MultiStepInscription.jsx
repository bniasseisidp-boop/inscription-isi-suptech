import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import {
  User, Mail, Phone, MapPin, Globe, Lock, Eye, EyeOff,
  Upload, ChevronRight, ChevronLeft, CheckCircle, FileText,
  Sun, Moon, GraduationCap, School, AlertCircle, X, Save, Loader2
} from 'lucide-react'
import Navbar from '../components/Navbar'
import AnimatedBackground from '../components/AnimatedBackground'
import { useAuth } from '../contexts/AuthContext'
import { creerCompte, sauvegarderEtape, soumettreDossier, getFilieres, getStudentDashboard } from '../services/api'

const STEPS = ['Création Compte', 'Identité & Adresse', 'Formation', 'Documents']

// ─── Data lists ───────────────────────────────────────────────────────────────
const VILLES_SENEGAL = [
  'Dakar - Plateau', 'Dakar - Médina', 'Dakar - Biscuiterie', 'Dakar - Grand-Dakar', 'Dakar - HLM', 'Dakar - Fann / Point E', 'Dakar - Liberté', 'Dakar - Mermoz / Sacré-Cœur', 'Dakar - Ouakam', 'Dakar - Yoff', 'Dakar - Ngor / Almadies', 'Dakar - Patte d\'Oie', 'Dakar - Parcelles Assainies', 'Dakar - Grand Yoff', 'Dakar - Sicap Liberté', 'Guédiawaye', 'Pikine', 'Thiaroye', 'Keur Massar', 'Mbao', 'Rufisque', 'Bargny', 'Sébikotane', 'Thiès', 'Mbour', 'Saly Portudal', 'Joal-Fadiouth', 'Tivaouane', 'Khombole', 'Mékhé', 'Bandia', 'Kaolack', 'Nioro du Rip', 'Guinguinéo', 'Gossas', 'Saint-Louis', 'Richard Toll', 'Dagana', 'Podor', 'Diama', 'Ziguinchor', 'Bignona', 'Oussouye', 'Cap Skirring', 'Tambacounda', 'Bakel', 'Goudiry', 'Koumpentoum', 'Diourbel', 'Touba', 'Mbacké', 'Bambey', 'Louga', 'Kébémer', 'Linguère', 'Dahra', 'Fatick', 'Foundiougne', 'Sokone', 'Kolda', 'Vélingara', 'Médina Yoro Foulah', 'Matam', 'Kanel', 'Ranérou', 'Kaffrine', 'Birkelane', 'Koungheul', 'Malem-Hodar', 'Kédougou', 'Saraya', 'Salémata', 'Sédhiou', 'Bounkiling', 'Goudomp',
]

const PAYS = ['Sénégal', 'Mali', 'Guinée', 'Côte d\'Ivoire', 'France', 'Maroc', 'Cameroun', 'Gabon'] // Simplified for brevity

function StepIndicator({ current, total, isDark }) {
  const D = isDark
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center">
          <motion.div
            animate={{ scale: i === current ? 1.1 : 1 }}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${
              i < current
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                : i === current
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/40'
                  : D ? 'bg-white/10 text-white/40' : 'bg-slate-100 text-slate-400'
            }`}>
            {i < current ? <CheckCircle size={17} /> : i + 1}
          </motion.div>
          {i < total - 1 && (
            <div className={`h-0.5 w-8 sm:w-12 transition-all duration-700 ${
              i < current ? 'bg-green-500' : D ? 'bg-white/10' : 'bg-slate-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

function PhotoDropzone({ onFile, preview, isDark }) {
  const D = isDark
  const onDrop = useCallback((f) => { if (f[0]) onFile(f[0]) }, [onFile])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1, maxSize: 2097152,
  })
  return (
    <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-300 ${
      isDragActive ? 'border-brand-400 bg-brand-500/10' : D ? 'border-white/20 hover:border-brand-400/50 hover:bg-white/5' : 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/40'
    }`}>
      <input {...getInputProps()} />
      {preview ? (
        <div className="flex flex-col items-center gap-2">
          <img src={preview} alt="Photo" className="w-20 h-20 rounded-full object-cover border-2 border-brand-500 shadow-lg" />
          <p className={`text-xs font-medium ${D ? 'text-brand-400' : 'text-brand-600'}`}>Cliquer pour changer</p>
        </div>
      ) : (
        <div className={`flex flex-col items-center gap-2 ${D ? 'text-white/40' : 'text-slate-400'}`}>
          <User size={28} className={D ? 'text-brand-400/60' : 'text-brand-300'} />
          <div>
            <p className={`text-sm font-medium ${D ? 'text-white/60' : 'text-slate-500'}`}>Photo de profil (optionnelle)</p>
            <p className="text-xs mt-0.5">JPG, PNG — max 2 Mo</p>
          </div>
        </div>
      )}
    </div>
  )
}

function DocDropzone({ label, hint, file, onFile, isDark, required = true }) {
  const D = isDark
  const [err, setErr] = useState('')
  const onDrop = useCallback((accepted, rejected) => {
    setErr('')
    if (rejected.length > 0) {
      const r = rejected[0]
      if (r.errors[0]?.code === 'file-too-large') setErr('Fichier trop volumineux (max 5 Mo)')
      else setErr('Format non accepté')
      return
    }
    if (accepted[0]) onFile(accepted[0])
  }, [onFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  })

  const removeFile = (e) => { e.stopPropagation(); onFile(null) }

  return (
    <div>
      <label className={`block text-sm font-bold mb-1 ${D ? 'text-white/80' : 'text-slate-700'}`}>
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {hint && <p className={`text-xs mb-2 ${D ? 'text-white/35' : 'text-slate-400'}`}>{hint}</p>}
      <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300 ${
        file ? D ? 'border-green-500/50 bg-green-500/8' : 'border-green-400 bg-green-50' : isDragActive ? 'border-brand-400 bg-brand-500/10' : err ? D ? 'border-red-500/50 bg-red-500/8' : 'border-red-300 bg-red-50' : D ? 'border-white/15 hover:border-brand-400/50 hover:bg-white/4' : 'border-slate-200 hover:border-brand-300 hover:bg-blue-50/30'
      }`}>
        <input {...getInputProps()} />
        {file ? (
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${D ? 'bg-green-500/20' : 'bg-green-100'}`}>
              <FileText size={17} className="text-green-500" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${D ? 'text-green-300' : 'text-green-700'}`}>{file.name || 'Fichier envoyé'}</p>
            </div>
            <button type="button" onClick={removeFile} className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${D ? 'bg-white/10 hover:bg-red-500/20 text-white/40' : 'bg-slate-100 text-slate-400'}`}>
              <X size={13} />
            </button>
          </div>
        ) : (
          <div className={`flex flex-col items-center gap-1.5 ${D ? 'text-white/35' : 'text-slate-400'}`}>
            <Upload size={20} className={D ? 'text-brand-400/60' : 'text-brand-300'} />
            <p className="text-xs">Glisser-déposer ou cliquer</p>
          </div>
        )}
      </div>
      {err && <p className="text-red-400 text-xs mt-1">{err}</p>}
    </div>
  )
}

export default function MultiStepInscription() {
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(() => localStorage.getItem('isi_theme') !== 'light')
  useEffect(() => {
    const id = setInterval(() => setIsDark(localStorage.getItem('isi_theme') !== 'light'), 300)
    return () => clearInterval(id)
  }, [])
  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark'
    localStorage.setItem('isi_theme', next)
    setIsDark(!isDark)
  }
  const D = isDark

  const [step, setStep] = useState(0)
  const [filieres, setFilieres] = useState([])
  const [licenses, setLicenses] = useState([])
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [estTransfert, setEstTransfert] = useState(false)
  const [docs, setDocs] = useState({
    doc_bac: null, doc_releve_notes: null,
    doc_cin: null, doc_acte_naissance: null,
    doc_bulletin_transfert: null,
  })
  const [showPwd, setShowPwd] = useState(false)
  const [showPwd2, setShowPwd2] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  
  const { user, student, loading: authLoading } = useAuth()
  
  const [isDraftMode, setIsDraftMode] = useState(false)
  const [loadingDraft, setLoadingDraft] = useState(true)

  const { register, handleSubmit, watch, trigger, setValue, formState: { errors } } = useForm({ mode: 'onBlur' })
  const selectedFiliere = watch('filiere_id')

  useEffect(() => {
    getFilieres().then(({ data }) => setFilieres(data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (authLoading) {
      setLoadingDraft(true)
      return
    }

    if (user && student) {
      if (student.statut_inscription === 'brouillon') {
        const s = student
        
        let targetStep = 1
        if (s.telephone && s.sexe && s.date_naissance && s.lieu_naissance && s.adresse && s.nationalite && s.pays_residence) {
          targetStep = 2
          if (s.filiere_id && s.license_id) {
            targetStep = 3
          }
        }

        setIsDraftMode(true)
        setStep(targetStep)

        setValue('nom', s.nom)
        setValue('prenom', s.prenom)
        setValue('telephone', s.telephone)
        setValue('sexe', s.sexe)
        setValue('date_naissance', s.date_naissance)
        setValue('lieu_naissance', s.lieu_naissance)
        setValue('adresse', s.adresse)
        setValue('nationalite', s.nationalite)
        setValue('pays_residence', s.pays_residence)
        setValue('filiere_id', s.filiere_id)
        setValue('license_id', s.license_id)
        setEstTransfert(s.est_transfert)
        if (s.photo) setPhotoPreview(`${import.meta.env.VITE_API_URL || ''}/storage/${s.photo}`)
      } else {
        // Logged in but not draft
        setIsDraftMode(false)
      }
    } else {
      // Not logged in
      setIsDraftMode(false)
    }
    
    setLoadingDraft(false)
  }, [authLoading, user, student, setValue])

  useEffect(() => {
    if (!selectedFiliere) { setLicenses([]); return }
    const f = filieres.find(f => String(f.id) === String(selectedFiliere))
    setLicenses(f?.licenses || [])
  }, [selectedFiliere, filieres])

  const pageBg  = D ? 'bg-[#06050f]' : 'bg-gradient-to-br from-slate-50 via-indigo-50/40 to-white'
  const cardCls = D ? 'bg-white/[0.04] border border-white/[0.09] backdrop-blur-xl rounded-3xl' : 'bg-white border border-slate-200 rounded-3xl shadow-2xl shadow-slate-200/60'
  const inp = D ? 'w-full rounded-xl px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-brand-400/60 focus:outline-none transition-all' : 'w-full rounded-xl px-4 py-3 border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-brand-400 focus:outline-none transition-all shadow-sm'
  const lbl = D ? 'block text-sm font-semibold mb-1.5 text-brand-300/90' : 'block text-sm font-semibold mb-1.5 text-slate-700'
  const tx  = D ? 'text-white' : 'text-slate-900'
  const txs = D ? 'text-white/55' : 'text-slate-500'
  const errCls = 'text-red-400 text-xs mt-1 flex items-center gap-1'
  const selectCls = inp + ' appearance-none'

  const stepFields = [
    ['nom', 'prenom', 'email', 'mot_de_passe', 'mot_de_passe_confirmation'],
    ['telephone', 'sexe', 'date_naissance', 'lieu_naissance', 'adresse', 'nationalite', 'pays_residence'],
    ['filiere_id', 'license_id'],
    []
  ]

  const docsValid = () => {
    // If a document was already uploaded, the local state might be null but the backend has it. 
    // In a real scenario we'd track existing docs. For now, require re-upload if empty.
    if (!docs.doc_bac || !docs.doc_releve_notes || !docs.doc_cin || !docs.doc_acte_naissance) return false
    if (estTransfert && !docs.doc_bulletin_transfert) return false
    return true
  }

  const handleCreateAccount = async () => {
    const valid = await trigger(stepFields[0])
    if (!valid) return
    setSubmitting(true)
    try {
      const { data } = await creerCompte({
        nom: watch('nom'), prenom: watch('prenom'),
        email: watch('email'), mot_de_passe: watch('mot_de_passe'),
        mot_de_passe_confirmation: watch('mot_de_passe_confirmation')
      })
      localStorage.setItem('isi_token', data.token)
      setIsDraftMode(true)
      setStep(1)
      toast.success('Compte créé ! Vous pouvez continuer ou reprendre plus tard.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création du compte')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveProgress = async (exitAfter = false) => {
    setSaving(true)
    try {
      const fd = new FormData()
      const fields = watch()
      Object.keys(fields).forEach(k => {
        if (fields[k] !== undefined && fields[k] !== null && fields[k] !== '') {
          fd.append(k, fields[k])
        }
      })
      fd.append('est_transfert', estTransfert ? '1' : '0')
      if (photo instanceof File) fd.append('photo', photo)
      Object.entries(docs).forEach(([k, v]) => { if (v instanceof File) fd.append(k, v) })

      await sauvegarderEtape(fd)
      toast.success('Progression sauvegardée !')
      if (exitAfter) navigate('/student')
      return true
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde: ' + (err.response?.data?.message || err.message))
      return false
    } finally {
      setSaving(false)
    }
  }

  const next = async () => {
    if (step === 0) {
      await handleCreateAccount()
      return
    }
    const valid = await trigger(stepFields[step])
    if (valid) {
      const success = await handleSaveProgress(false) // auto-save on next
      if (success) {
        setStep(s => s + 1)
      }
    }
  }

  const prev = () => setStep(s => s - 1)

  const onSubmit = async () => {
    if (!docsValid()) {
      toast.error('Veuillez fournir tous les documents obligatoires')
      return
    }
    setSubmitting(true)
    try {
      // First ensure the latest documents are saved
      await handleSaveProgress(false)
      // Then submit the dossier
      await soumettreDossier()
      setDone(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Une erreur est survenue lors de la soumission')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className={`min-h-screen relative flex items-center justify-center px-4 ${pageBg}`}>
        {D && <AnimatedBackground />}
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`p-10 text-center max-w-lg w-full relative z-10 ${cardCls}`}>
          <div className="text-7xl mb-5">🎉</div>
          <h2 className={`text-3xl font-black mb-3 ${tx}`}>Dossier soumis !</h2>
          <p className={`mb-1 ${txs}`}>Votre candidature a été envoyée avec succès.</p>
          <div className="mt-6 flex justify-center">
            <button onClick={() => navigate('/student')} className="btn-primary flex items-center gap-2">
              <GraduationCap size={16} /> Mon espace étudiant
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (loadingDraft) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${pageBg}`}>
        <div className="flex flex-col items-center">
          <Loader2 className={`w-8 h-8 animate-spin mb-4 ${D ? 'text-brand-400' : 'text-brand-600'}`} />
          <p className={`text-sm font-medium ${txs}`}>Chargement de votre dossier...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen relative pb-16 ${pageBg}`}>
      {D && <AnimatedBackground />}
      <Navbar />

      <div className="relative z-10 pt-24 px-4 max-w-2xl mx-auto">
        <div className="text-center mb-7">
          <h1 className={`text-3xl sm:text-4xl font-black ${tx}`}>Dossier d'Admission</h1>
          <p className={`text-sm mt-2 ${txs}`}>Prenez le temps de bien remplir vos informations</p>
        </div>

        <StepIndicator current={step} total={STEPS.length} isDark={D} />

        {isDraftMode && step > 0 && (
          <div className="flex justify-end mb-4">
            <button onClick={() => handleSaveProgress(true)} disabled={saving} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${D ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}>
              <Save size={16} /> {saving ? 'Sauvegarde...' : 'Sauvegarder et quitter'}
            </button>
          </div>
        )}

        <motion.div className={`p-6 sm:p-9 ${cardCls}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className={`text-lg font-bold mb-6 flex items-center gap-2.5 ${tx}`}>
            <span className="w-7 h-7 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-black">
              {step + 1}
            </span>
            {STEPS[step]}
          </h2>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
              
              {/* STEP 0: Account */}
              {step === 0 && !isDraftMode && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Nom *</label>
                      <input className={inp} placeholder="DIALLO" {...register('nom', { required: 'Requis' })} />
                      {errors.nom && <p className={errCls}>{errors.nom.message}</p>}
                    </div>
                    <div>
                      <label className={lbl}>Prénom *</label>
                      <input className={inp} placeholder="Moussa" {...register('prenom', { required: 'Requis' })} />
                      {errors.prenom && <p className={errCls}>{errors.prenom.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>Email *</label>
                    <input className={inp} type="email" placeholder="vous@email.com" {...register('email', { required: 'Requis', pattern: /^\S+@\S+\.\S+$/ })} />
                    {errors.email && <p className={errCls}>{errors.email.message}</p>}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Mot de passe *</label>
                      <div className="relative">
                        <input className={inp} type={showPwd ? 'text' : 'password'} placeholder="Min. 8 car." {...register('mot_de_passe', { required: 'Requis', minLength: 8 })} />
                        <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50"><Eye size={16} /></button>
                      </div>
                      {errors.mot_de_passe && <p className={errCls}>{errors.mot_de_passe.message}</p>}
                    </div>
                    <div>
                      <label className={lbl}>Confirmer *</label>
                      <div className="relative">
                        <input className={inp} type={showPwd2 ? 'text' : 'password'} placeholder="Répéter" {...register('mot_de_passe_confirmation', { validate: v => v === watch('mot_de_passe') || 'Différent' })} />
                        <button type="button" onClick={() => setShowPwd2(!showPwd2)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50"><Eye size={16} /></button>
                      </div>
                      {errors.mot_de_passe_confirmation && <p className={errCls}>{errors.mot_de_passe_confirmation.message}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 1: Identity & Address */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Téléphone *</label>
                      <input className={inp} type="tel" placeholder="+221..." {...register('telephone', { required: 'Requis' })} />
                    </div>
                    <div>
                      <label className={lbl}>Sexe *</label>
                      <select className={selectCls} {...register('sexe', { required: 'Requis' })}>
                        <option value="">Sélectionner</option><option value="M">Masculin</option><option value="F">Féminin</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Date naissance *</label>
                      <input className={inp} type="date" {...register('date_naissance', { required: 'Requis' })} />
                    </div>
                    <div>
                      <label className={lbl}>Lieu naissance *</label>
                      <input className={inp} placeholder="Dakar" {...register('lieu_naissance', { required: 'Requis' })} />
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>Ville / Adresse *</label>
                    <select className={selectCls} {...register('adresse', { required: 'Requis' })}>
                      <option value="">-- Choisir une ville --</option>
                      {VILLES_SENEGAL.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Nationalité *</label>
                      <input className={inp} placeholder="Sénégalaise" {...register('nationalite', { required: 'Requis' })} />
                    </div>
                    <div>
                      <label className={lbl}>Pays résidence *</label>
                      <select className={selectCls} {...register('pays_residence', { required: 'Requis' })}>
                        <option value="">Sélectionner</option>
                        {PAYS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>Photo de profil (Optionnel)</label>
                    <PhotoDropzone onFile={f => { setPhoto(f); setPhotoPreview(f ? URL.createObjectURL(f) : null) }} preview={photoPreview} isDark={D} />
                  </div>
                </div>
              )}

              {/* STEP 2: Formation */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className={lbl}>Type de candidature *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setEstTransfert(false)} className={`p-4 rounded-xl border-2 text-left ${!estTransfert ? 'border-brand-500 bg-brand-500/10' : D ? 'border-white/10' : 'border-slate-200'}`}>
                        <GraduationCap className={!estTransfert ? 'text-brand-400' : 'opacity-50'} />
                        <p className={`mt-2 font-bold ${!estTransfert ? 'text-brand-400' : tx}`}>Nouveau Bachelier</p>
                      </button>
                      <button type="button" onClick={() => setEstTransfert(true)} className={`p-4 rounded-xl border-2 text-left ${estTransfert ? 'border-brand-500 bg-brand-500/10' : D ? 'border-white/10' : 'border-slate-200'}`}>
                        <School className={estTransfert ? 'text-brand-400' : 'opacity-50'} />
                        <p className={`mt-2 font-bold ${estTransfert ? 'text-brand-400' : tx}`}>Transfert</p>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>Filière souhaitée *</label>
                    <select className={selectCls} {...register('filiere_id', { required: 'Requis' })}>
                      <option value="">-- Choisir une filière --</option>
                      {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                    </select>
                  </div>
                  {licenses.length > 0 && (
                    <div>
                      <label className={lbl}>Niveau *</label>
                      <select className={selectCls} {...register('license_id', { required: 'Requis' })}>
                        <option value="">-- Choisir le niveau --</option>
                        {licenses.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Documents */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl text-sm ${D ? 'bg-white/5 border border-white/10' : 'bg-blue-50 border border-blue-200'}`}>
                    <p className="font-bold">Documents requis (PDF ou Image)</p>
                    <p className="opacity-75 text-xs">Veuillez fournir les documents ci-dessous pour finaliser votre dossier.</p>
                  </div>
                  
                  <DocDropzone label="Diplôme du Baccalauréat" file={docs.doc_bac} onFile={f => setDocs(d => ({ ...d, doc_bac: f }))} isDark={D} />
                  <DocDropzone label="Relevé de notes du Bac" file={docs.doc_releve_notes} onFile={f => setDocs(d => ({ ...d, doc_releve_notes: f }))} isDark={D} />
                  <DocDropzone label="Photocopie CIN légalisée" file={docs.doc_cin} onFile={f => setDocs(d => ({ ...d, doc_cin: f }))} isDark={D} />
                  <DocDropzone label="Acte de naissance" file={docs.doc_acte_naissance} onFile={f => setDocs(d => ({ ...d, doc_acte_naissance: f }))} isDark={D} />
                  
                  {estTransfert && (
                    <DocDropzone label="Bulletin de transfert (60 crédits)" file={docs.doc_bulletin_transfert} onFile={f => setDocs(d => ({ ...d, doc_bulletin_transfert: f }))} isDark={D} />
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          <div className={`flex justify-between mt-8 pt-6 border-t ${D ? 'border-white/10' : 'border-slate-200'}`}>
            <button type="button" onClick={prev} disabled={step === 0 || (step === 1 && isDraftMode)} className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 ${step === 0 || (step === 1 && isDraftMode) ? 'opacity-0' : D ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'}`}>
              <ChevronLeft size={16} /> Précédent
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} disabled={submitting} className="btn-primary px-6 py-2.5 flex items-center gap-2">
                {submitting ? 'Création...' : 'Suivant'} <ChevronRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={onSubmit} disabled={submitting} className="btn-primary px-8 py-2.5 flex items-center gap-2">
                {submitting ? 'Envoi...' : <><CheckCircle size={17} /> Soumettre</>}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
