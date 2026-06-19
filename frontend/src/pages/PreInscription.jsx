import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import {
  User, Mail, Phone, MapPin, Globe, Lock, Eye, EyeOff,
  Upload, ChevronRight, ChevronLeft, CheckCircle, FileText,
  Sun, Moon, GraduationCap, School, AlertCircle, X,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import AnimatedBackground from '../components/AnimatedBackground'
import { submitPreInscription, getFilieres } from '../services/api'

const STEPS = ['Identité', 'Naissance & Adresse', 'Formation', 'Documents', 'Sécurité']

// ─── Data lists ───────────────────────────────────────────────────────────────
const VILLES_SENEGAL = [
  // Dakar et banlieue
  'Dakar - Plateau', 'Dakar - Médina', 'Dakar - Biscuiterie', 'Dakar - Grand-Dakar',
  'Dakar - HLM', 'Dakar - Fann / Point E', 'Dakar - Liberté', 'Dakar - Mermoz / Sacré-Cœur',
  'Dakar - Ouakam', 'Dakar - Yoff', 'Dakar - Ngor / Almadies', 'Dakar - Patte d\'Oie',
  'Dakar - Parcelles Assainies', 'Dakar - Grand Yoff', 'Dakar - Sicap Liberté',
  'Guédiawaye', 'Pikine', 'Thiaroye', 'Keur Massar', 'Mbao', 'Rufisque', 'Bargny', 'Sébikotane',
  // Thiès
  'Thiès', 'Mbour', 'Saly Portudal', 'Joal-Fadiouth', 'Tivaouane', 'Khombole', 'Mékhé', 'Bandia',
  // Kaolack
  'Kaolack', 'Nioro du Rip', 'Guinguinéo', 'Gossas',
  // Saint-Louis
  'Saint-Louis', 'Richard Toll', 'Dagana', 'Podor', 'Diama',
  // Ziguinchor
  'Ziguinchor', 'Bignona', 'Oussouye', 'Cap Skirring',
  // Tambacounda
  'Tambacounda', 'Bakel', 'Goudiry', 'Koumpentoum',
  // Diourbel
  'Diourbel', 'Touba', 'Mbacké', 'Bambey',
  // Louga
  'Louga', 'Kébémer', 'Linguère', 'Dahra',
  // Fatick
  'Fatick', 'Foundiougne', 'Sokone',
  // Kolda
  'Kolda', 'Vélingara', 'Médina Yoro Foulah',
  // Matam
  'Matam', 'Kanel', 'Ranérou',
  // Kaffrine
  'Kaffrine', 'Birkelane', 'Koungheul', 'Malem-Hodar',
  // Kédougou
  'Kédougou', 'Saraya', 'Salémata',
  // Sédhiou
  'Sédhiou', 'Bounkiling', 'Goudomp',
]

const NATIONALITES = [
  'Afghane', 'Albanaise', 'Algérienne', 'Allemande', 'Américaine', 'Andorrane',
  'Angolaise', 'Antiguaise', 'Saoudienne', 'Argentine', 'Arménienne', 'Australienne',
  'Autrichienne', 'Azerbaïdjanaise', 'Bahaméenne', 'Bahreïnienne', 'Bangladaise',
  'Barbadienne', 'Bélarusse', 'Belge', 'Bélizienne', 'Béninoise', 'Bhoutanaise',
  'Bolivienne', 'Bosniaque', 'Botswanaise', 'Brésilienne', 'Brunéienne', 'Bulgare',
  'Burkinabè', 'Burundaise', 'Cambodgienne', 'Camerounaise', 'Canadienne',
  'Cap-Verdienne', 'Centrafricaine', 'Chilienne', 'Chinoise', 'Chypriote',
  'Colombienne', 'Comorienne', 'Congolaise (Brazzaville)', 'Congolaise (Kinshasa)',
  'Coréenne (Nord)', 'Coréenne (Sud)', 'Costaricaine', 'Croate', 'Cubaine',
  'Danoise', 'Djiboutienne', 'Dominicaine', 'Égyptienne', 'Émiratie',
  'Équatorienne', 'Érythréenne', 'Espagnole', 'Estonienne', 'Éthiopienne',
  'Fidjienne', 'Finlandaise', 'Française', 'Gabonaise', 'Gambienne',
  'Géorgienne', 'Ghanéenne', 'Grecque', 'Guatémaltèque', 'Guinéenne',
  'Bissau-Guinéenne', 'Équatoguinéenne', 'Guyanienne', 'Haïtienne', 'Hondurienne',
  'Hongroise', 'Indienne', 'Indonésienne', 'Irakienne', 'Iranienne',
  'Irlandaise', 'Islandaise', 'Israélienne', 'Italienne', 'Ivoirienne',
  'Jamaïcaine', 'Japonaise', 'Jordanienne', 'Kazakhstanaise', 'Kényane',
  'Kirghize', 'Koweïtienne', 'Laotienne', 'Lesothane', 'Lettone',
  'Libanaise', 'Libérienne', 'Libyenne', 'Lituanienne', 'Luxembourgeoise',
  'Malgache', 'Malaisienne', 'Malawienne', 'Maldivienne', 'Malienne',
  'Maltaise', 'Marocaine', 'Mauritanienne', 'Mauricienne', 'Mexicaine',
  'Moldave', 'Monégasque', 'Mongole', 'Monténégrine', 'Mozambicaine',
  'Namibienne', 'Népalaise', 'Nicaraguayenne', 'Nigérienne', 'Nigériane',
  'Norvégienne', 'Néo-Zélandaise', 'Omanaise', 'Ougandaise', 'Ouzbèke',
  'Pakistanaise', 'Palestinienne', 'Panaméenne', 'Paraguayenne', 'Néerlandaise',
  'Péruvienne', 'Philippine', 'Polonaise', 'Portugaise', 'Qatarienne',
  'Roumaine', 'Russe', 'Rwandaise', 'Salvadorienne', 'São-Toméenne',
  'Sénégalaise', 'Serbe', 'Sierra-Léonaise', 'Singapourienne', 'Slovaque',
  'Slovène', 'Somalienne', 'Soudanaise', 'Sri-Lankaise', 'Sud-Africaine',
  'Sud-Soudanaise', 'Suédoise', 'Suisse', 'Syrienne', 'Tadjike',
  'Tanzanienne', 'Tchadienne', 'Tchèque', 'Thaïlandaise', 'Togolaise',
  'Trinidadienne', 'Tunisienne', 'Turque', 'Ukrainienne', 'Uruguayenne',
  'Vénézuélienne', 'Vietnamienne', 'Yéménite', 'Zambienne', 'Zimbabwéenne',
]

const PAYS = [
  'Afghanistan', 'Albanie', 'Algérie', 'Allemagne', 'Andorre', 'Angola',
  'Antigua-et-Barbuda', 'Arabie Saoudite', 'Argentine', 'Arménie', 'Australie',
  'Autriche', 'Azerbaïdjan', 'Bahamas', 'Bahreïn', 'Bangladesh', 'Barbade',
  'Bélarus', 'Belgique', 'Belize', 'Bénin', 'Bhoutan', 'Bolivie',
  'Bosnie-Herzégovine', 'Botswana', 'Brésil', 'Brunéi', 'Bulgarie',
  'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodge', 'Cameroun',
  'Canada', 'Centrafrique', 'Chili', 'Chine', 'Chypre', 'Colombie',
  'Comores', 'Congo (Brazzaville)', 'Congo (Kinshasa)', 'Corée du Nord',
  'Corée du Sud', 'Costa Rica', 'Côte d\'Ivoire', 'Croatie', 'Cuba',
  'Danemark', 'Djibouti', 'Dominique', 'Égypte', 'Émirats arabes unis',
  'Équateur', 'Érythrée', 'Espagne', 'Estonie', 'Éthiopie',
  'Fidji', 'Finlande', 'France', 'Gabon', 'Gambie', 'Géorgie',
  'Ghana', 'Grèce', 'Grenade', 'Guatemala', 'Guinée', 'Guinée-Bissau',
  'Guinée équatoriale', 'Guyana', 'Haïti', 'Honduras', 'Hongrie',
  'Inde', 'Indonésie', 'Irak', 'Iran', 'Irlande', 'Islande',
  'Israël', 'Italie', 'Jamaïque', 'Japon', 'Jordanie',
  'Kazakhstan', 'Kenya', 'Kirghizistan', 'Kiribati', 'Kosovo',
  'Koweït', 'Laos', 'Lesotho', 'Lettonie', 'Liban', 'Liberia',
  'Libye', 'Liechtenstein', 'Lituanie', 'Luxembourg', 'Madagascar',
  'Malaisie', 'Malawi', 'Maldives', 'Mali', 'Malte', 'Maroc',
  'Mauritanie', 'Maurice', 'Mexique', 'Moldavie', 'Monaco',
  'Mongolie', 'Monténégro', 'Mozambique', 'Namibie', 'Népal',
  'Nicaragua', 'Niger', 'Nigeria', 'Norvège', 'Nouvelle-Zélande',
  'Oman', 'Ouganda', 'Ouzbékistan', 'Pakistan', 'Palestine',
  'Panama', 'Papouasie-Nouvelle-Guinée', 'Paraguay', 'Pays-Bas',
  'Pérou', 'Philippines', 'Pologne', 'Portugal', 'Qatar',
  'République dominicaine', 'République tchèque', 'Roumanie',
  'Royaume-Uni', 'Russie', 'Rwanda', 'Saint-Kitts-et-Nevis',
  'Saint-Lucia', 'Salvador', 'Samoa', 'São Tomé-et-Príncipe',
  'Sénégal', 'Serbie', 'Seychelles', 'Sierra Leone', 'Singapour',
  'Slovaquie', 'Slovénie', 'Somalie', 'Soudan', 'Soudan du Sud',
  'Sri Lanka', 'Suède', 'Suisse', 'Suriname', 'Syrie',
  'Tadjikistan', 'Tanzanie', 'Tchad', 'Thaïlande', 'Timor-Leste',
  'Togo', 'Tonga', 'Trinité-et-Tobago', 'Tunisie', 'Turkménistan',
  'Turquie', 'Ukraine', 'Uruguay', 'Vanuatu', 'Venezuela',
  'Viêt Nam', 'Yémen', 'Zambie', 'Zimbabwe',
]

// ─── Step indicator ───────────────────────────────────────────────────────────
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
            <div className={`h-0.5 w-10 sm:w-14 transition-all duration-700 ${
              i < current
                ? 'bg-green-500'
                : D ? 'bg-white/10' : 'bg-slate-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Photo dropzone ───────────────────────────────────────────────────────────
function PhotoDropzone({ onFile, preview, isDark }) {
  const D = isDark
  const onDrop = useCallback((f) => { if (f[0]) onFile(f[0]) }, [onFile])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1, maxSize: 2097152,
  })
  return (
    <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-300 ${
      isDragActive
        ? 'border-brand-400 bg-brand-500/10'
        : D ? 'border-white/20 hover:border-brand-400/50 hover:bg-white/5' : 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/40'
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

// ─── Document dropzone ────────────────────────────────────────────────────────
function DocDropzone({ label, hint, file, onFile, isDark, required = true }) {
  const D = isDark
  const [err, setErr] = useState('')
  const onDrop = useCallback((accepted, rejected) => {
    setErr('')
    if (rejected.length > 0) {
      const r = rejected[0]
      if (r.errors[0]?.code === 'file-too-large') setErr('Fichier trop volumineux (max 5 Mo)')
      else setErr('Format non accepté (PDF, JPG, PNG uniquement)')
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
        file
          ? D ? 'border-green-500/50 bg-green-500/8' : 'border-green-400 bg-green-50'
          : isDragActive
            ? 'border-brand-400 bg-brand-500/10'
            : err
              ? D ? 'border-red-500/50 bg-red-500/8' : 'border-red-300 bg-red-50'
              : D ? 'border-white/15 hover:border-brand-400/50 hover:bg-white/4' : 'border-slate-200 hover:border-brand-300 hover:bg-blue-50/30'
      }`}>
        <input {...getInputProps()} />
        {file ? (
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${D ? 'bg-green-500/20' : 'bg-green-100'}`}>
              <FileText size={17} className="text-green-500" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${D ? 'text-green-300' : 'text-green-700'}`}>{file.name}</p>
              <p className={`text-xs ${D ? 'text-white/35' : 'text-slate-400'}`}>{(file.size / 1024).toFixed(0)} Ko</p>
            </div>
            <button type="button" onClick={removeFile} className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${D ? 'bg-white/10 hover:bg-red-500/20 text-white/40 hover:text-red-400' : 'bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500'}`}>
              <X size={13} />
            </button>
          </div>
        ) : (
          <div className={`flex flex-col items-center gap-1.5 ${D ? 'text-white/35' : 'text-slate-400'}`}>
            <Upload size={20} className={D ? 'text-brand-400/60' : 'text-brand-300'} />
            <p className={`text-xs ${D ? 'text-white/45' : 'text-slate-500'}`}>
              {isDragActive ? 'Déposez le fichier ici' : 'Glisser-déposer ou cliquer'}
            </p>
            <p className="text-[11px]">PDF, JPG, PNG — max 5 Mo</p>
          </div>
        )}
      </div>
      {err && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} /> {err}</p>}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const DEMO_FILIERES = [
  { id: 1, nom: 'Informatique & Systèmes', code: 'INFO', licenses: [{ id: 1, nom: 'Licence 1', frais_inscription: 150000 }, { id: 2, nom: 'Licence 2', frais_inscription: 150000 }, { id: 3, nom: 'Licence 3', frais_inscription: 150000 }] },
  { id: 2, nom: 'Réseaux & Télécommunications', code: 'RT', licenses: [{ id: 4, nom: 'Licence 1', frais_inscription: 150000 }] },
  { id: 3, nom: 'Intelligence Artificielle', code: 'IA', licenses: [{ id: 5, nom: 'Master 1', frais_inscription: 200000 }] },
]

export default function PreInscription() {
  const navigate = useNavigate()

  // ── Theme ──────────────────────────────────────────────────────────────────
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

  // ── Form state ─────────────────────────────────────────────────────────────
  const [step, setStep]             = useState(0)
  const [filieres, setFilieres]     = useState([])
  const [licenses, setLicenses]     = useState([])
  const [photo, setPhoto]           = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [estTransfert, setEstTransfert] = useState(false)
  const [docs, setDocs]             = useState({
    doc_bac: null, doc_releve_notes: null,
    doc_cin: null, doc_acte_naissance: null,
    doc_bulletin_transfert: null,
  })
  const [showPwd, setShowPwd]   = useState(false)
  const [showPwd2, setShowPwd2] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]         = useState(false)

  const { register, handleSubmit, watch, trigger, setValue, formState: { errors } } = useForm({ mode: 'onBlur' })
  const selectedFiliere = watch('filiere_id')

  useEffect(() => {
    getFilieres().then(({ data }) => setFilieres(data)).catch(() => setFilieres(DEMO_FILIERES))
  }, [])

  useEffect(() => {
    if (!selectedFiliere) { setLicenses([]); return }
    const f = filieres.find(f => String(f.id) === String(selectedFiliere))
    setLicenses(f?.licenses || [])
    setValue('license_id', '')
  }, [selectedFiliere, filieres, setValue])

  // ── Theme-aware classes ────────────────────────────────────────────────────
  const pageBg  = D ? 'bg-[#06050f]' : 'bg-gradient-to-br from-slate-50 via-indigo-50/40 to-white'
  const cardCls = D
    ? 'bg-white/[0.04] border border-white/[0.09] backdrop-blur-xl rounded-3xl'
    : 'bg-white border border-slate-200 rounded-3xl shadow-2xl shadow-slate-200/60'
  const inp = D
    ? 'w-full rounded-xl px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-brand-400/60 focus:bg-white/8 focus:outline-none transition-all'
    : 'w-full rounded-xl px-4 py-3 border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:outline-none transition-all shadow-sm'
  const lbl = D
    ? 'block text-sm font-semibold mb-1.5 text-brand-300/90'
    : 'block text-sm font-semibold mb-1.5 text-slate-700'
  const tx  = D ? 'text-white'    : 'text-slate-900'
  const txs = D ? 'text-white/55' : 'text-slate-500'
  const errCls = 'text-red-400 text-xs mt-1 flex items-center gap-1'
  const infoBox = D
    ? 'bg-brand-500/10 border border-brand-500/20 text-brand-300 rounded-xl p-4 text-sm'
    : 'bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-4 text-sm'
  const selectCls = inp + ' appearance-none'

  // ── Step validation ────────────────────────────────────────────────────────
  const stepFields = [
    ['nom', 'prenom', 'email', 'telephone', 'sexe'],
    ['date_naissance', 'lieu_naissance', 'adresse', 'nationalite', 'pays_residence'],
    ['filiere_id', 'license_id'],
    [],
    ['mot_de_passe', 'mot_de_passe_confirmation'],
  ]

  const docsValid = () => {
    if (!docs.doc_bac || !docs.doc_releve_notes || !docs.doc_cin || !docs.doc_acte_naissance) return false
    if (estTransfert && !docs.doc_bulletin_transfert) return false
    return true
  }

  const next = async () => {
    if (step === 3) {
      if (!docsValid()) {
        toast.error('Veuillez fournir tous les documents obligatoires')
        return
      }
      setStep(s => s + 1)
      return
    }
    const valid = await trigger(stepFields[step])
    if (valid) setStep(s => s + 1)
  }
  const prev = () => setStep(s => s - 1)

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    if (!docsValid()) {
      setStep(3)
      toast.error('Documents obligatoires manquants')
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => fd.append(k, v ?? ''))
      if (photo) fd.append('photo', photo)
      fd.append('est_transfert', estTransfert ? '1' : '0')
      Object.entries(docs).forEach(([k, v]) => { if (v) fd.append(k, v) })

      const { data: res } = await submitPreInscription(fd)
      localStorage.setItem('isi_token', res.token)
      setDone(true)
    } catch (err) {
      const errs = err.response?.data?.errors
      if (errs) Object.values(errs).flat().forEach(m => toast.error(m))
      else toast.error(err.response?.data?.message || 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className={`min-h-screen relative flex items-center justify-center px-4 ${pageBg}`}>
        {D && <AnimatedBackground />}
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className={`p-10 text-center max-w-lg w-full relative z-10 ${cardCls}`}>
          <motion.div animate={{ rotate: [0, 12, -12, 6, 0] }} transition={{ repeat: 2, duration: 0.7 }} className="text-7xl mb-5">🎉</motion.div>
          <h2 className={`text-3xl font-black mb-3 ${tx}`}>Candidature envoyée !</h2>
          <p className={`mb-1 ${txs}`}>Votre dossier a été soumis avec succès.</p>
          <p className={`text-sm mb-7 ${txs}`}>
            Vous recevrez un email de confirmation. Notre équipe va vous revenir — vérifiez le plus souvent vos emails. En cas d'acceptation, vous serez notifié pour compléter votre paiement.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => navigate('/student')} className="btn-primary flex items-center gap-2">
              <GraduationCap size={16} /> Mon espace étudiant
            </button>
            <button onClick={() => navigate('/')}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border ${D ? 'border-white/20 text-white/70 hover:bg-white/8' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
              Retour à l'accueil
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen relative ${pageBg}`}>
      {D && <AnimatedBackground />}
      <Navbar />

      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-7">
            <div className="flex items-center justify-center gap-3 mb-3">
              <h1 className={`text-4xl font-black ${tx}`}>Pré-Inscription</h1>
              <button onClick={toggleTheme}
                className={`p-2 rounded-xl transition-all ${D ? 'bg-white/8 hover:bg-white/15 text-white/60 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
                title="Changer le thème">
                {D ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            </div>
            <p className={`text-sm ${txs}`}>ISI SUPTECH — Année {new Date().getFullYear()}/{new Date().getFullYear() + 1}</p>
          </motion.div>

          <StepIndicator current={step} total={STEPS.length} isDark={D} />

          {/* Card */}
          <motion.div className={`p-7 sm:p-9 ${cardCls}`}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

            {/* Step title */}
            <h2 className={`text-lg font-bold mb-6 flex items-center gap-2.5 ${tx}`}>
              <span className="w-7 h-7 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-black shadow-sm shadow-brand-600/40">
                {step + 1}
              </span>
              {STEPS[step]}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                <motion.div key={step}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25 }}>

                  {/* ── ÉTAPE 0 : Identité ──────────────────────────────── */}
                  {step === 0 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={lbl}>Nom *</label>
                          <input className={inp} placeholder="DIALLO"
                            {...register('nom', { required: 'Nom requis' })} />
                          {errors.nom && <p className={errCls}><AlertCircle size={11} />{errors.nom.message}</p>}
                        </div>
                        <div>
                          <label className={lbl}>Prénom *</label>
                          <input className={inp} placeholder="Moussa"
                            {...register('prenom', { required: 'Prénom requis' })} />
                          {errors.prenom && <p className={errCls}><AlertCircle size={11} />{errors.prenom.message}</p>}
                        </div>
                      </div>

                      <div>
                        <label className={lbl}>Adresse email *</label>
                        <div className="relative">
                          <Mail size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${D ? 'text-white/30' : 'text-slate-400'}`} />
                          <input className={inp + ' pl-9'} type="email" placeholder="vous@email.com"
                            {...register('email', { required: 'Email requis', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email invalide' } })} />
                        </div>
                        {errors.email && <p className={errCls}><AlertCircle size={11} />{errors.email.message}</p>}
                      </div>

                      <div>
                        <label className={lbl}>Téléphone *</label>
                        <div className="relative">
                          <Phone size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${D ? 'text-white/30' : 'text-slate-400'}`} />
                          <input className={inp + ' pl-9'} type="tel" placeholder="+221 77 000 00 00"
                            {...register('telephone', { required: 'Téléphone requis' })} />
                        </div>
                        {errors.telephone && <p className={errCls}><AlertCircle size={11} />{errors.telephone.message}</p>}
                      </div>

                      <div>
                        <label className={lbl}>Sexe *</label>
                        <select className={selectCls} {...register('sexe', { required: 'Sexe requis' })}>
                          <option value="">-- Sélectionner --</option>
                          <option value="M">Masculin</option>
                          <option value="F">Féminin</option>
                        </select>
                        {errors.sexe && <p className={errCls}><AlertCircle size={11} />{errors.sexe.message}</p>}
                      </div>

                      <div>
                        <label className={lbl}>Photo de profil</label>
                        <PhotoDropzone onFile={f => { setPhoto(f); setPhotoPreview(f ? URL.createObjectURL(f) : null) }} preview={photoPreview} isDark={D} />
                      </div>
                    </div>
                  )}

                  {/* ── ÉTAPE 1 : Naissance & Adresse ───────────────────── */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={lbl}>Date de naissance *</label>
                          <input className={inp} type="date"
                            {...register('date_naissance', { required: 'Date requise' })} />
                          {errors.date_naissance && <p className={errCls}><AlertCircle size={11} />{errors.date_naissance.message}</p>}
                        </div>
                        <div>
                          <label className={lbl}>Lieu de naissance *</label>
                          <input className={inp} placeholder="Dakar"
                            {...register('lieu_naissance', { required: 'Lieu requis' })} />
                          {errors.lieu_naissance && <p className={errCls}><AlertCircle size={11} />{errors.lieu_naissance.message}</p>}
                        </div>
                      </div>

                      <div>
                        <label className={lbl}>Ville / Commune de résidence *</label>
                        <div className="relative">
                          <MapPin size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none ${D ? 'text-white/30' : 'text-slate-400'}`} />
                          <select className={selectCls + ' pl-9'}
                            {...register('adresse', { required: 'Adresse requise' })}>
                            <option value="">-- Choisir une ville --</option>
                            {VILLES_SENEGAL.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                        {errors.adresse && <p className={errCls}><AlertCircle size={11} />{errors.adresse.message}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={lbl}>Nationalité *</label>
                          <div className="relative">
                            <Globe size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none ${D ? 'text-white/30' : 'text-slate-400'}`} />
                            <select className={selectCls + ' pl-9'}
                              {...register('nationalite', { required: 'Nationalité requise' })}>
                              <option value="">-- Sélectionner --</option>
                              {NATIONALITES.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                          {errors.nationalite && <p className={errCls}><AlertCircle size={11} />{errors.nationalite.message}</p>}
                        </div>
                        <div>
                          <label className={lbl}>Pays de résidence *</label>
                          <select className={selectCls}
                            {...register('pays_residence', { required: 'Pays requis' })}>
                            <option value="">-- Sélectionner --</option>
                            {PAYS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          {errors.pays_residence && <p className={errCls}><AlertCircle size={11} />{errors.pays_residence.message}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── ÉTAPE 2 : Formation ─────────────────────────────── */}
                  {step === 2 && (
                    <div className="space-y-5">
                      {/* Type d'inscription */}
                      <div>
                        <label className={lbl}>Type de candidature *</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { val: false, icon: GraduationCap, title: 'Nouveau bachelier', sub: 'Vous venez d\'obtenir le Bac' },
                            { val: true,  icon: School,        title: 'Transfert',         sub: 'Vous continuez Licence/Master' },
                          ].map(({ val, icon: Icon, title, sub }) => (
                            <button key={String(val)} type="button" onClick={() => setEstTransfert(val)}
                              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                estTransfert === val
                                  ? 'border-brand-500 bg-brand-500/10'
                                  : D ? 'border-white/10 hover:border-brand-500/40 bg-white/3' : 'border-slate-200 hover:border-brand-300 bg-white'
                              }`}>
                              <Icon size={20} className={estTransfert === val ? 'text-brand-400 mb-2' : D ? 'text-white/40 mb-2' : 'text-slate-400 mb-2'} />
                              <p className={`text-sm font-bold ${estTransfert === val ? 'text-brand-400' : tx}`}>{title}</p>
                              <p className={`text-xs mt-0.5 ${txs}`}>{sub}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className={lbl}>Filière souhaitée *</label>
                        <select className={selectCls} {...register('filiere_id', { required: 'Filière requise' })}>
                          <option value="">-- Choisir une filière --</option>
                          {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                        </select>
                        {errors.filiere_id && <p className={errCls}><AlertCircle size={11} />{errors.filiere_id.message}</p>}
                      </div>

                      {licenses.length > 0 && (
                        <div>
                          <label className={lbl}>Niveau *</label>
                          <select className={selectCls} {...register('license_id', { required: 'Niveau requis' })}>
                            <option value="">-- Choisir le niveau --</option>
                            {licenses.map(l => (
                              <option key={l.id} value={l.id}>
                                {l.nom} — {Number(l.frais_inscription).toLocaleString()} FCFA
                              </option>
                            ))}
                          </select>
                          {errors.license_id && <p className={errCls}><AlertCircle size={11} />{errors.license_id.message}</p>}
                        </div>
                      )}

                      <div className={infoBox}>
                        <p className="font-bold mb-1">ℹ️ Processus d'inscription</p>
                        <p className="leading-relaxed">Après soumission de votre dossier, notre équipe va vous revenir — vérifiez le plus souvent vos emails. En cas d'acceptation, vous serez invité à compléter votre paiement via Wave ou directement à l'école.</p>
                      </div>
                    </div>
                  )}

                  {/* ── ÉTAPE 3 : Documents ─────────────────────────────── */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <div className={infoBox}>
                        <p className="font-bold mb-1">📎 Documents requis</p>
                        <p>Chaque fichier doit être en <strong>PDF ou image</strong> (JPG, PNG) — 5 Mo maximum. Scannez ou photographiez clairement chaque document.</p>
                      </div>

                      <DocDropzone
                        label="Diplôme du Baccalauréat"
                        hint="Scan de votre diplôme de Bac ou relevé provisoire officiel"
                        file={docs.doc_bac}
                        onFile={f => setDocs(d => ({ ...d, doc_bac: f }))}
                        isDark={D}
                      />

                      <DocDropzone
                        label="Relevé de notes du Bac"
                        hint="Relevé de notes officiel ou bulletin de Terminale"
                        file={docs.doc_releve_notes}
                        onFile={f => setDocs(d => ({ ...d, doc_releve_notes: f }))}
                        isDark={D}
                      />

                      <DocDropzone
                        label="Photocopie CIN légalisée"
                        hint="Carte nationale d'identité ou passeport, copie légalisée"
                        file={docs.doc_cin}
                        onFile={f => setDocs(d => ({ ...d, doc_cin: f }))}
                        isDark={D}
                      />

                      <DocDropzone
                        label="Acte de naissance"
                        hint="Copie légalisée de votre acte de naissance"
                        file={docs.doc_acte_naissance}
                        onFile={f => setDocs(d => ({ ...d, doc_acte_naissance: f }))}
                        isDark={D}
                      />

                      {estTransfert && (
                        <div className={`rounded-xl border-l-4 pl-4 py-3 pr-3 ${D ? 'border-amber-400/70 bg-amber-500/8' : 'border-amber-400 bg-amber-50'}`}>
                          <p className={`text-xs font-bold mb-2 ${D ? 'text-amber-300' : 'text-amber-700'}`}>
                            🔁 Document supplémentaire — Transfert
                          </p>
                          <DocDropzone
                            label="Bulletin de transfert (60 crédits)"
                            hint="Dernier bulletin scolaire officiel avec minimum 60 crédits validés"
                            file={docs.doc_bulletin_transfert}
                            onFile={f => setDocs(d => ({ ...d, doc_bulletin_transfert: f }))}
                            isDark={D}
                          />
                        </div>
                      )}

                      {/* Récapitulatif docs */}
                      <div className={`rounded-xl p-3 ${D ? 'bg-white/4 border border-white/8' : 'bg-slate-50 border border-slate-200'}`}>
                        <p className={`text-xs font-bold mb-2 ${D ? 'text-white/50' : 'text-slate-500'}`}>État des documents</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { key: 'doc_bac', label: 'Diplôme Bac' },
                            { key: 'doc_releve_notes', label: 'Relevé de notes' },
                            { key: 'doc_cin', label: 'CIN légalisée' },
                            { key: 'doc_acte_naissance', label: 'Acte de naissance' },
                            ...(estTransfert ? [{ key: 'doc_bulletin_transfert', label: 'Bulletin transfert' }] : []),
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-1.5">
                              <span className={docs[key] ? 'text-green-500' : 'text-slate-300'}>
                                {docs[key] ? '✅' : '⬜'}
                              </span>
                              <span className={`text-xs ${docs[key] ? D ? 'text-green-300' : 'text-green-700' : txs}`}>{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── ÉTAPE 4 : Sécurité ──────────────────────────────── */}
                  {step === 4 && (
                    <div className="space-y-4">
                      <div className={infoBox}>
                        <p className="font-bold mb-1">🔐 Créez votre espace étudiant</p>
                        <p>Ce mot de passe vous permettra de vous connecter pour suivre votre candidature, accéder à vos documents et gérer vos paiements.</p>
                      </div>

                      <div>
                        <label className={lbl}>Mot de passe *</label>
                        <div className="relative">
                          <Lock size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${D ? 'text-white/30' : 'text-slate-400'}`} />
                          <input className={inp + ' pl-9 pr-11'} type={showPwd ? 'text' : 'password'} placeholder="Minimum 8 caractères"
                            {...register('mot_de_passe', { required: 'Mot de passe requis', minLength: { value: 8, message: 'Minimum 8 caractères' } })} />
                          <button type="button" onClick={() => setShowPwd(p => !p)}
                            className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${D ? 'text-white/30 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'}`}>
                            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {errors.mot_de_passe && <p className={errCls}><AlertCircle size={11} />{errors.mot_de_passe.message}</p>}
                      </div>

                      <div>
                        <label className={lbl}>Confirmer le mot de passe *</label>
                        <div className="relative">
                          <Lock size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${D ? 'text-white/30' : 'text-slate-400'}`} />
                          <input className={inp + ' pl-9 pr-11'} type={showPwd2 ? 'text' : 'password'} placeholder="Répétez le mot de passe"
                            {...register('mot_de_passe_confirmation', {
                              required: 'Confirmation requise',
                              validate: v => v === watch('mot_de_passe') || 'Les mots de passe ne correspondent pas',
                            })} />
                          <button type="button" onClick={() => setShowPwd2(p => !p)}
                            className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${D ? 'text-white/30 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'}`}>
                            {showPwd2 ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {errors.mot_de_passe_confirmation && <p className={errCls}><AlertCircle size={11} />{errors.mot_de_passe_confirmation.message}</p>}
                      </div>

                      <p className={`text-xs text-center mt-2 ${D ? 'text-white/25' : 'text-slate-400'}`}>
                        En soumettant ce formulaire, vous acceptez les conditions d'utilisation de la plateforme ISI SUPTECH.
                      </p>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className={`flex justify-between mt-7 pt-6 border-t ${D ? 'border-white/8' : 'border-slate-100'}`}>
                <button type="button" onClick={prev} disabled={step === 0}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    step === 0 ? 'opacity-0 pointer-events-none' :
                    D ? 'border border-white/20 text-white/70 hover:bg-white/8' : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}>
                  <ChevronLeft size={16} /> Précédent
                </button>

                {step < STEPS.length - 1 ? (
                  <button type="button" onClick={next} className="btn-primary flex items-center gap-2 px-6">
                    Suivant <ChevronRight size={16} />
                  </button>
                ) : (
                  <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2 px-8">
                    {submitting
                      ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Envoi en cours…</>
                      : <><CheckCircle size={17} /> Soumettre ma candidature</>}
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
