import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  GraduationCap, Users, Award, Cpu, BookOpen, Globe, ChevronDown,
  ArrowRight, Star, Play, Pause, RotateCcw, X, MapPin, Phone, Mail,
  Facebook, Instagram, Youtube, Linkedin, ExternalLink, Send, ChevronRight,
  Moon, Sun, Quote, Building2, Handshake,
} from 'lucide-react'
import AnimatedBackground from '../components/AnimatedBackground'
import AnimatedBackgroundWhite from '../components/AnimatedBackgroundWhite'
import Navbar from '../components/Navbar'
import {
  getPublicStudents, getFilieres, getFormateurs, getMembresAdmins,
  getPartenaires, getTemoignages, submitTemoignage, subscribeNewsletter,
} from '../services/api'

/* ── TikTok icon (not in lucide) ─────────────────────────────────────────── */
const TikTokIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.53V6.78a4.85 4.85 0 01-1.02-.09z"/>
  </svg>
)

/* ── Counter ─────────────────────────────────────────────────────────────── */
function Counter({ target, suffix = '', label, icon: Icon, isDark }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const end = parseInt(target)
    const step = end / 60
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 25)
    return () => clearInterval(timer)
  }, [inView, target])

  return (
    <div ref={ref} className="text-center">
      <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${isDark ? 'bg-brand-600/20 border border-brand-500/30' : 'bg-brand-50 border border-brand-200'}`}>
        <Icon className="text-brand-500" size={28} />
      </div>
      <div className={`text-4xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-slate-500'}`}>{label}</div>
    </div>
  )
}

/* ── Tour 360° ───────────────────────────────────────────────────────────── */
function Tour360() {
  const [angle, setAngle] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [auto, setAuto] = useState(true)

  const scenes = [
    { label: 'Hall Principal',      color: 'from-blue-900 to-indigo-950',   icon: '🏛️' },
    { label: 'Salle Informatique',  color: 'from-slate-900 to-blue-950',    icon: '💻' },
    { label: 'Bibliothèque',        color: 'from-indigo-900 to-slate-950',  icon: '📚' },
    { label: 'Amphi Principal',     color: 'from-navy-800 to-blue-900',     icon: '🎓' },
    { label: 'Laboratoire IA',      color: 'from-violet-950 to-blue-950',   icon: '🤖' },
    { label: 'Espace Détente',      color: 'from-teal-950 to-navy-800',     icon: '🌿' },
  ]

  useEffect(() => {
    if (!auto) return
    const timer = setInterval(() => setAngle((a) => (a + 1) % 360), 40)
    return () => clearInterval(timer)
  }, [auto])

  const sceneIndex = Math.floor((((angle % 360) + 360) % 360) / 60) % scenes.length
  const onMouseDown = (e) => { setDragging(true); setStartX(e.clientX); setAuto(false) }
  const onMouseMove = (e) => { if (!dragging) return; setAngle((a) => a + (e.clientX - startX) * 0.5); setStartX(e.clientX) }
  const onMouseUp = () => setDragging(false)

  return (
    <div className="relative select-none" onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      <div className={`w-full h-80 rounded-2xl bg-gradient-to-br ${scenes[sceneIndex].color} border border-white/10 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden relative`}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          transform: `perspective(500px) rotateX(${angle * 0.05}deg)`,
        }} />
        <motion.div key={sceneIndex} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }} className="text-8xl mb-4 relative z-10">
          {scenes[sceneIndex].icon}
        </motion.div>
        <motion.div key={`label-${sceneIndex}`} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-xl font-bold text-white relative z-10">
          {scenes[sceneIndex].label}
        </motion.div>
        <div className="absolute top-4 right-4 w-10 h-10 rounded-full border border-brand-400/40 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10">
          <div className="w-px h-4 bg-red-400 absolute" style={{ transform: `rotate(${angle}deg)`, transformOrigin: 'bottom center', bottom: '50%' }} />
          <div className="w-px h-4 bg-white/40 absolute" style={{ transform: `rotate(${angle + 180}deg)`, transformOrigin: 'bottom center', bottom: '50%' }} />
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {scenes.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === sceneIndex ? 'bg-brand-400 scale-125' : 'bg-white/30'}`} />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 mt-4">
        <button onClick={() => setAuto(!auto)} className="flex items-center gap-2 text-brand-300 hover:text-brand-200 text-sm transition-colors">
          {auto ? <Pause size={14} /> : <Play size={14} />} {auto ? 'Pause' : 'Auto'}
        </button>
        <button onClick={() => { setAngle(0); setAuto(true) }} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors">
          <RotateCcw size={14} /> Reset
        </button>
        <span className="text-white/30 text-xs">← Faites glisser pour explorer →</span>
      </div>
    </div>
  )
}

/* ── Stars ───────────────────────────────────────────────────────────────── */
function Stars({ note, size = 16 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= note ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
      ))}
    </div>
  )
}

/* ── Modals ───────────────────────────────────────────────────────────────── */
function ModalWrapper({ open, onClose, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function FiliereModal({ filiere, onClose }) {
  if (!filiere) return null
  const FILIERE_IMAGES = {
    'INFO': '💻', 'RT': '📡', 'IA': '🤖', 'CYBER': '🔐', 'DWM': '🌐', 'GL': '⚙️',
  }
  const icon = FILIERE_IMAGES[filiere.code] || '📚'

  return (
    <ModalWrapper open={!!filiere} onClose={onClose}>
      <div className="bg-gradient-to-br from-navy-800 to-navy-950 border border-white/10 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-brand-700 to-brand-500 p-8 text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <X size={16} className="text-white" />
          </button>
          <div className="text-6xl mb-3">{icon}</div>
          <h3 className="text-2xl font-black text-white">{filiere.nom}</h3>
          <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-white/80 text-xs font-mono font-bold">
            {filiere.code}
          </span>
        </div>
        <div className="p-6">
          {filiere.description && (
            <p className="text-white/70 text-sm leading-relaxed mb-6">{filiere.description}</p>
          )}
          {filiere.licenses?.length > 0 && (
            <>
              <h4 className="text-brand-300 text-xs font-semibold uppercase tracking-widest mb-3">Niveaux disponibles</h4>
              <div className="space-y-3">
                {filiere.licenses.map((lic, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold text-white text-sm">{lic.nom}</div>
                      <span className="text-xs text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded-full">{lic.duree_annees} an{lic.duree_annees > 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-white/40">Inscription</span>
                        <div className="text-white font-semibold">{Number(lic.frais_inscription).toLocaleString()} FCFA</div>
                      </div>
                      <div>
                        <span className="text-white/40">Mensualité</span>
                        <div className="text-green-400 font-semibold">{Number(lic.frais_mensuel).toLocaleString()} FCFA</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <Link to="/pre-inscription" onClick={onClose} className="btn-primary w-full mt-6 flex items-center justify-center gap-2 py-3">
            <GraduationCap size={18} /> M'inscrire dans cette filière
          </Link>
        </div>
      </div>
    </ModalWrapper>
  )
}

function StudentModal({ student, onClose }) {
  if (!student) return null
  return (
    <ModalWrapper open={!!student} onClose={onClose}>
      <div className="bg-gradient-to-br from-navy-800 to-navy-950 border border-white/10 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-brand-800 to-brand-600 p-8 text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <X size={16} className="text-white" />
          </button>
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center mb-4 overflow-hidden border-4 border-white/20">
            {student.photo
              ? <img src={student.photo} alt={student.nom} className="w-full h-full object-cover" />
              : <GraduationCap size={36} className="text-white" />
            }
          </div>
          <h3 className="text-xl font-black text-white">{student.nom}</h3>
          <p className="text-brand-200 text-sm mt-1">{student.filiere}</p>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <span className="text-white/50 text-sm">Niveau</span>
            <span className="text-white font-semibold text-sm">{student.license}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <span className="text-white/50 text-sm">Année académique</span>
            <span className="text-white font-semibold text-sm">{student.annee}</span>
          </div>
          {student.matricule && (
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <span className="text-white/50 text-sm">Matricule</span>
              <span className="text-brand-300 font-mono font-bold text-sm">{student.matricule}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-3">
            <span className="text-white/50 text-sm">Statut</span>
            <span className="flex items-center gap-2 text-green-400 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Étudiant actif
            </span>
          </div>
        </div>
      </div>
    </ModalWrapper>
  )
}

/* ── Main Landing ─────────────────────────────────────────────────────────── */
export default function Landing() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('isi_theme')
    return saved !== 'light'
  })
  const [students, setStudents] = useState([])
  const [filieres, setFilieres] = useState([])
  const [formateurs, setFormateurs] = useState([])
  const [membres, setMembres] = useState([])
  const [partenaires, setPartenaires] = useState([])
  const [temoignages, setTemoignages] = useState([])
  const [selectedFiliere, setSelectedFiliere] = useState(null)
  const [filiereDetail, setFiliereDetail] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [newsletter, setNewsletter] = useState({ email: '', nom: '' })
  const [newsletterSent, setNewsletterSent] = useState(false)
  const [temoForm, setTemoForm] = useState({ nom: '', filiere: '', annee_diplome: '', contenu: '', note: 5 })
  const [temoSent, setTemoSent] = useState(false)
  const [socialLinks, setSocialLinks] = useState({})

  useEffect(() => {
    localStorage.setItem('isi_theme', isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    Promise.all([
      getPublicStudents().catch(() => ({ data: DEMO_STUDENTS })),
      getFilieres().catch(() => ({ data: DEMO_FILIERES })),
      getFormateurs().catch(() => ({ data: [] })),
      getMembresAdmins().catch(() => ({ data: [] })),
      getPartenaires().catch(() => ({ data: [] })),
      getTemoignages().catch(() => ({ data: [] })),
    ]).then(([s, f, form, mem, part, temo]) => {
      setStudents((s.data || []).slice(0, 12))
      setFilieres(f.data || [])
      setFormateurs(form.data || [])
      setMembres(mem.data || [])
      setPartenaires(part.data || [])
      setTemoignages(temo.data || [])
    })

    // Fetch social links from public settings endpoint
    fetch('/api/settings/social').then(r => r.json()).then(setSocialLinks).catch(() => {})
  }, [])

  const toggleTheme = () => setIsDark((d) => !d)

  const handleNewsletter = async (e) => {
    e.preventDefault()
    if (!newsletter.email) return
    try {
      await subscribeNewsletter(newsletter)
      setNewsletterSent(true)
    } catch { setNewsletterSent(true) }
  }

  const handleTemoignage = async (e) => {
    e.preventDefault()
    if (!temoForm.contenu.trim()) return
    try {
      await submitTemoignage(temoForm)
      setTemoSent(true)
    } catch { setTemoSent(true) }
  }

  // Theme classes
  const T = isDark ? {
    text: 'text-white',
    textSub: 'text-white/60',
    textMuted: 'text-white/40',
    card: 'glass-card',
    cardHover: 'glass-card-hover cursor-pointer',
    badge: 'bg-brand-600/15 border border-brand-500/30 text-brand-300',
    input: 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-brand-400 focus:bg-white/10',
    section: '',
    navBg: 'bg-navy-900/50',
    hrColor: 'border-white/10',
  } : {
    text: 'text-slate-800',
    textSub: 'text-slate-600',
    textMuted: 'text-slate-400',
    card: 'bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-md',
    cardHover: 'bg-white border border-blue-100 rounded-2xl shadow-md hover:shadow-xl hover:shadow-brand-100/50 transition-all duration-300 cursor-pointer',
    badge: 'bg-brand-50 border border-brand-200 text-brand-600',
    input: 'bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-brand-400 focus:bg-white shadow-sm',
    section: '',
    navBg: 'bg-white/70',
    hrColor: 'border-slate-200',
  }

  const fadeUp = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } } }
  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } }

  const SOCIALS = [
    { key: 'facebook',  icon: Facebook,  color: '#1877F2', label: 'Facebook' },
    { key: 'instagram', icon: Instagram, color: '#E1306C', label: 'Instagram' },
    { key: 'tiktok',   icon: TikTokIcon, color: '#000000', label: 'TikTok' },
    { key: 'youtube',  icon: Youtube,   color: '#FF0000', label: 'YouTube' },
    { key: 'linkedin', icon: Linkedin,  color: '#0A66C2', label: 'LinkedIn' },
  ]

  const activeSocials = SOCIALS.filter(s => socialLinks[s.key])

  return (
    <div className={`min-h-screen relative ${isDark ? 'bg-navy-950' : ''}`}>
      {isDark ? <AnimatedBackground /> : <AnimatedBackgroundWhite />}

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className={`fixed bottom-6 right-6 z-[100] w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isDark ? 'bg-white/10 backdrop-blur-md border border-white/20 text-yellow-300 hover:bg-white/20' : 'bg-slate-800 text-yellow-300 hover:bg-slate-700 shadow-slate-300'
        }`}
        title={isDark ? 'Mode clair' : 'Mode sombre'}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-16">
        <motion.div variants={stagger} initial="hidden" animate="show" className="text-center max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium mb-8 ${T.badge}`}>
            <Star size={14} className="text-yellow-400" />
            Ouverture des inscriptions 2025-2026
            <Star size={14} className="text-yellow-400" />
          </motion.div>
          <motion.h1 variants={fadeUp} className={`text-5xl sm:text-7xl font-black mb-6 leading-tight ${T.text}`}>
            Votre avenir
            <br />
            <span className="gradient-text">commence ici</span>
          </motion.h1>
          <motion.p variants={fadeUp} className={`text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed ${T.textSub}`}>
            ISI SUPTECH — Institut d'excellence en informatique, technologie et innovation numérique à Dakar.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pre-inscription" className="btn-primary text-base px-8 py-4 flex items-center gap-2 justify-center">
              <GraduationCap size={20} /> Commencer ma pré-inscription <ArrowRight size={18} />
            </Link>
            <Link to="/connexion" className="btn-secondary text-base px-8 py-4 flex items-center gap-2 justify-center">
              Accéder à mon espace
            </Link>
          </motion.div>
        </motion.div>
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 ${T.textMuted}`}>
          <span className="text-xs font-medium tracking-widest uppercase">Découvrir</span>
          <ChevronDown size={20} />
        </motion.div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className={`${T.card} p-10 grid grid-cols-2 md:grid-cols-4 gap-10`}>
            <Counter target="2500" suffix="+" label="Étudiants formés"     icon={Users}    isDark={isDark} />
            <Counter target="15"   suffix="+"  label="Années d'expérience" icon={Award}    isDark={isDark} />
            <Counter target="20"   suffix=""   label="Filières disponibles"icon={BookOpen} isDark={isDark} />
            <Counter target="95"   suffix="%"  label="Taux d'insertion"    icon={Globe}    isDark={isDark} />
          </motion.div>
        </div>
      </section>

      {/* ── TOUR 360 ─────────────────────────────────────────────────────── */}
      <section id="campus" className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Visite virtuelle</span>
            <h2 className={`text-4xl font-black mt-3 mb-4 ${T.text}`}>
              Explorez notre campus <span className="gradient-text">en 360°</span>
            </h2>
            <p className={T.textSub}>Faites glisser pour naviguer dans nos installations modernes.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <Tour360 />
          </motion.div>
        </div>
      </section>

      {/* ── FILIÈRES ─────────────────────────────────────────────────────── */}
      <section id="filieres" className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Formations</span>
            <h2 className={`text-4xl font-black mt-3 mb-2 ${T.text}`}>
              Nos <span className="gradient-text">filières d'excellence</span>
            </h2>
            <p className={T.textSub}>Cliquez sur une filière pour voir tous les détails et les niveaux.</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(filieres.length > 0 ? filieres : DEMO_FILIERES).map((f, i) => (
              <motion.div key={f.id || i} variants={fadeUp}>
                <div className={`${T.cardHover} p-6 h-full`} onClick={async () => {
                  setSelectedFiliere(f)
                  if (f.id && !f.licenses) {
                    try {
                      const res = await fetch(`/api/filieres/${f.id}`)
                      const detail = await res.json()
                      setFiliereDetail(detail)
                    } catch { setFiliereDetail(f) }
                  } else { setFiliereDetail(f) }
                }}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isDark ? 'bg-brand-600/20 border border-brand-500/20' : 'bg-brand-50 border border-brand-100'}`}>
                    <Cpu size={22} className="text-brand-500" />
                  </div>
                  <h3 className={`font-bold text-lg mb-2 ${T.text}`}>{f.nom}</h3>
                  <p className={`text-sm leading-relaxed mb-4 ${T.textSub}`}>{f.description || 'Formation professionnelle de haut niveau.'}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className={`text-sm font-medium ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>Code : {f.code}</span>
                    <ChevronRight size={16} className="text-brand-400" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Processus</span>
            <h2 className={`text-4xl font-black mt-3 ${T.text}`}>Comment ça marche ?</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center relative">
                {i < STEPS.length - 1 && <div className="hidden md:block absolute top-6 left-[60%] w-full h-px border-t border-dashed border-brand-500/30" />}
                <div className="w-12 h-12 rounded-full bg-brand-600 text-white font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/30">
                  {i + 1}
                </div>
                <h4 className={`font-semibold mb-2 ${T.text}`}>{step.title}</h4>
                <p className={`text-sm ${T.textSub}`}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STUDENTS ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
            <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Communauté</span>
            <h2 className={`text-4xl font-black mt-3 mb-2 ${T.text}`}>Nos étudiants actuels</h2>
            <p className={T.textSub}>Cliquez sur un étudiant pour voir son profil. Rejoignez une communauté d'innovateurs.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(students.length > 0 ? students : DEMO_STUDENTS).map((s, i) => (
              <motion.div key={s.id || i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <motion.div whileHover={{ scale: 1.02 }} className={`${T.cardHover} p-4 flex items-center gap-4`}
                  onClick={() => setSelectedStudent(s)}>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {s.photo ? <img src={s.photo} alt={s.nom} className="w-full h-full object-cover" /> : <GraduationCap size={20} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm truncate ${T.text}`}>{s.nom}</div>
                    <div className="text-brand-500 text-xs">{s.filiere}</div>
                    <div className={`text-xs ${T.textMuted}`}>{s.license} · {s.annee}</div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORMATEURS ───────────────────────────────────────────────────── */}
      {formateurs.length > 0 && (
        <section className="relative z-10 py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Encadrement</span>
              <h2 className={`text-4xl font-black mt-3 mb-2 ${T.text}`}>
                Nos <span className="gradient-text">formateurs</span>
              </h2>
              <p className={T.textSub}>Des experts passionnés, engagés pour votre réussite.</p>
            </motion.div>
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {formateurs.map((f, i) => (
                <motion.div key={f.id || i} variants={fadeUp}>
                  <div className={`${T.card} p-6 text-center`}>
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center mb-4 overflow-hidden border-4 border-brand-500/20">
                      {f.photo ? <img src={f.photo} alt={f.nom} className="w-full h-full object-cover" /> : <span className="text-2xl text-white font-black">{f.prenom?.[0]}{f.nom?.[0]}</span>}
                    </div>
                    <div className={`text-xs font-semibold mb-1 ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>{f.titre}</div>
                    <h4 className={`font-bold mb-1 ${T.text}`}>{f.prenom} {f.nom}</h4>
                    <p className={`text-xs mb-3 ${T.textSub}`}>{f.specialite}</p>
                    {f.bio && <p className={`text-xs leading-relaxed line-clamp-3 ${T.textMuted}`}>{f.bio}</p>}
                    {f.linkedin && (
                      <a href={f.linkedin} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-3 text-xs text-brand-400 hover:text-brand-300 transition-colors">
                        <Linkedin size={12} /> LinkedIn
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── MEMBRES ADMINS ───────────────────────────────────────────────── */}
      {membres.length > 0 && (
        <section className="relative z-10 py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Direction</span>
              <h2 className={`text-4xl font-black mt-3 mb-2 ${T.text}`}>
                Équipe <span className="gradient-text">administrative</span>
              </h2>
              <p className={T.textSub}>Nos membres dévoués qui pilotent l'excellence de l'institution.</p>
            </motion.div>
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {membres.map((m, i) => (
                <motion.div key={m.id || i} variants={fadeUp}>
                  <div className={`${T.card} p-6 text-center`}>
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center mb-4 overflow-hidden border-4 border-indigo-500/20">
                      {m.photo ? <img src={m.photo} alt={m.nom} className="w-full h-full object-cover" /> : <Building2 size={28} className="text-white" />}
                    </div>
                    <div className={`text-xs font-semibold mb-1 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{m.titre}</div>
                    <h4 className={`font-bold mb-1 ${T.text}`}>{m.prenom} {m.nom}</h4>
                    <p className={`text-xs ${T.textSub}`}>{m.poste}</p>
                    {m.email && <p className={`text-xs mt-2 ${T.textMuted}`}>{m.email}</p>}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── PARTENAIRES ──────────────────────────────────────────────────── */}
      {partenaires.length > 0 && (
        <section className="relative z-10 py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Partenariat</span>
              <h2 className={`text-4xl font-black mt-3 mb-2 ${T.text}`}>
                Nos <span className="gradient-text">partenaires</span>
              </h2>
              <p className={T.textSub}>Des organisations qui croient en notre mission et soutiennent votre avenir.</p>
            </motion.div>
            <div className="flex flex-wrap justify-center gap-6">
              {partenaires.map((p, i) => (
                <motion.div key={p.id || i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                  <motion.div whileHover={{ scale: 1.05, y: -4 }}
                    className={`${T.card} p-6 flex flex-col items-center justify-center gap-3 w-40 h-32`}>
                    {p.logo
                      ? <img src={p.logo} alt={p.nom} className="max-h-12 max-w-full object-contain" />
                      : <Handshake size={32} className="text-brand-400" />
                    }
                    <span className={`text-xs text-center font-semibold ${T.text}`}>{p.nom}</span>
                    {p.site_web && (
                      <a href={p.site_web} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300">
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TÉMOIGNAGES ──────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-brand-500 text-sm font-semibold uppercase tracking-widest">Témoignages</span>
            <h2 className={`text-4xl font-black mt-3 mb-2 ${T.text}`}>
              Ce que disent nos <span className="gradient-text">étudiants</span>
            </h2>
          </motion.div>

          {temoignages.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {temoignages.slice(0, 6).map((t, i) => (
                <motion.div key={t.id || i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <div className={`${T.card} p-6 h-full flex flex-col`}>
                    <Quote size={24} className="text-brand-400 mb-3 flex-shrink-0" />
                    <p className={`text-sm leading-relaxed flex-1 mb-4 ${T.textSub}`}>{t.contenu}</p>
                    <div className="mt-auto">
                      <Stars note={t.note} size={14} />
                      <div className={`font-semibold text-sm mt-2 ${T.text}`}>{t.nom}</div>
                      {t.filiere && <div className={`text-xs ${T.textMuted}`}>{t.filiere}{t.annee_diplome ? ` · ${t.annee_diplome}` : ''}</div>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Submit testimonial form */}
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className={`${T.card} p-8 max-w-2xl mx-auto`}>
            {temoSent ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">🙏</div>
                <h4 className={`font-bold text-lg mb-2 ${T.text}`}>Merci pour votre témoignage !</h4>
                <p className={T.textSub}>Il sera affiché après validation par notre équipe.</p>
              </div>
            ) : (
              <>
                <h4 className={`font-bold text-lg mb-6 ${T.text}`}>Partagez votre expérience</h4>
                <form onSubmit={handleTemoignage} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${T.textSub}`}>Votre nom *</label>
                      <input value={temoForm.nom} onChange={e => setTemoForm(f => ({...f, nom: e.target.value}))}
                        placeholder="Nom complet" required
                        className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${T.input}`} />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${T.textSub}`}>Filière</label>
                      <input value={temoForm.filiere} onChange={e => setTemoForm(f => ({...f, filiere: e.target.value}))}
                        placeholder="Ex: Informatique"
                        className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${T.input}`} />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${T.textSub}`}>Année de promotion</label>
                    <input value={temoForm.annee_diplome} onChange={e => setTemoForm(f => ({...f, annee_diplome: e.target.value}))}
                      placeholder="Ex: 2024-2025"
                      className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${T.input}`} />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${T.textSub}`}>Note *</label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button" onClick={() => setTemoForm(f => ({...f, note: n}))}
                          className="transition-transform hover:scale-110">
                          <Star size={24} className={n <= temoForm.note ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${T.textSub}`}>Votre témoignage *</label>
                    <textarea value={temoForm.contenu} onChange={e => setTemoForm(f => ({...f, contenu: e.target.value}))}
                      placeholder="Partagez votre expérience à ISI SUPTECH..." required rows={4}
                      className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none transition-all ${T.input}`} />
                  </div>
                  <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                    <Send size={16} /> Envoyer mon témoignage
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── NEWSLETTER ───────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className={`${T.card} p-8 text-center`}>
            {newsletterSent ? (
              <>
                <div className="text-4xl mb-3">✉️</div>
                <h3 className={`text-xl font-bold mb-2 ${T.text}`}>Vous êtes inscrit(e) !</h3>
                <p className={T.textSub}>Vous recevrez nos actualités et informations importantes.</p>
              </>
            ) : (
              <>
                <div className="text-3xl mb-4">📬</div>
                <h3 className={`text-2xl font-black mb-2 ${T.text}`}>Restez informé(e)</h3>
                <p className={`mb-6 ${T.textSub}`}>Recevez les actualités, dates importantes et offres de formation d'ISI SUPTECH.</p>
                <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3">
                  <input value={newsletter.nom} onChange={e => setNewsletter(n => ({...n, nom: e.target.value}))}
                    placeholder="Votre prénom"
                    className={`flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-all ${T.input}`} />
                  <input value={newsletter.email} onChange={e => setNewsletter(n => ({...n, email: e.target.value}))}
                    type="email" placeholder="Votre email *" required
                    className={`flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-all ${T.input}`} />
                  <button type="submit" className="btn-primary px-6 py-3 flex items-center gap-2 whitespace-nowrap">
                    <Send size={16} /> S'inscrire
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className={`max-w-3xl mx-auto text-center ${isDark ? 'glass-card neon-border' : 'bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl shadow-2xl'} p-12`}>
          <div className="text-6xl mb-6">🎓</div>
          <h2 className="text-4xl font-black text-white mb-4">Prêt à rejoindre l'excellence ?</h2>
          <p className="text-white/70 mb-8 text-lg">Déposez votre dossier en quelques minutes. Réponse sous 48h.</p>
          <Link to="/pre-inscription" className={`${isDark ? 'btn-primary' : 'bg-white text-brand-700 hover:bg-brand-50 font-bold px-10 py-4 rounded-xl transition-all shadow-lg'} text-lg inline-flex items-center gap-3`}>
            <GraduationCap size={22} /> Démarrer ma pré-inscription <ArrowRight size={20} />
          </Link>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className={`relative z-10 border-t py-16 px-4 ${isDark ? 'border-white/10 bg-navy-950/80 backdrop-blur-sm' : 'border-slate-200 bg-white/70 backdrop-blur-sm'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center">
                  <span className="text-white font-black">ISI</span>
                </div>
                <div>
                  <div className={`font-black text-lg ${T.text}`}>ISI SUPTECH</div>
                  <div className={`text-xs ${T.textMuted}`}>Institut Supérieur d'Informatique et des Technologies</div>
                </div>
              </div>
              <p className={`text-sm leading-relaxed mb-6 max-w-sm ${T.textSub}`}>
                ISI-SUPTECH est une école supérieure de référence dédiée à la formation des talents du numérique, du génie logiciel, de la gestion et des technologies innovantes. Nous plaçons l'excellence académique, la pratique professionnelle et l'innovation au cœur de notre pédagogie.
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Encadrement personnalisé',    icon: '👨‍🏫' },
                  { label: 'Projets académiques pratiques', icon: '💡' },
                  { label: 'Certifications reconnues',    icon: '🏆' },
                  { label: 'Accès aux ressources 24/7',  icon: '🔓' },
                  { label: 'Communauté engagée',         icon: '🤝' },
                ].map((item, i) => (
                  <span key={i} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${isDark ? 'bg-white/5 border border-white/10 text-white/60' : 'bg-brand-50 border border-brand-100 text-slate-600'}`}>
                    <span>{item.icon}</span> {item.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className={`font-bold text-sm uppercase tracking-widest mb-5 ${T.textMuted}`}>Contact</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-brand-400 mt-0.5 flex-shrink-0" />
                  <span className={`text-sm ${T.textSub}`}>Sicap Liberté 3 N°1977<br />Dakar, Sénégal</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-brand-400 flex-shrink-0" />
                  <a href="tel:+221338256210" className={`text-sm hover:text-brand-400 transition-colors ${T.textSub}`}>+221 33 825 62 10</a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-brand-400 flex-shrink-0" />
                  <a href="mailto:suptech@isisuptech.com" className={`text-sm hover:text-brand-400 transition-colors ${T.textSub}`}>suptech@isisuptech.com</a>
                </div>
                <div className="flex items-center gap-3">
                  <Globe size={16} className="text-brand-400 flex-shrink-0" />
                  <span className={`text-sm ${T.textSub}`}>inscription.isisuptech.com</span>
                </div>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className={`font-bold text-sm uppercase tracking-widest mb-5 ${T.textMuted}`}>Liens rapides</h4>
              <div className="space-y-3">
                {[
                  { to: '/pre-inscription', label: 'Pré-inscription' },
                  { to: '/connexion', label: 'Espace étudiant' },
                  { to: '/#filieres', label: 'Nos filières' },
                  { to: '/#campus', label: 'Visite campus' },
                ].map((link, i) => (
                  <Link key={i} to={link.to} className={`flex items-center gap-2 text-sm hover:text-brand-400 transition-colors ${T.textSub}`}>
                    <ChevronRight size={14} className="text-brand-400" /> {link.label}
                  </Link>
                ))}
              </div>

              {/* Social links */}
              {activeSocials.length > 0 && (
                <div className="mt-6">
                  <h4 className={`font-bold text-sm uppercase tracking-widest mb-3 ${T.textMuted}`}>Suivez-nous</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeSocials.map(({ key, icon: Icon, label, color }) => (
                      <a key={key} href={socialLinks[key]} target="_blank" rel="noopener noreferrer"
                        title={label}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 ${
                          isDark ? 'bg-white/5 border border-white/10 text-white/60 hover:border-white/30 hover:text-white' : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-brand-50'
                        }`}>
                        <Icon size={16} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={`border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4 ${T.hrColor}`}>
            <p className={`text-sm ${T.textMuted}`}>© {new Date().getFullYear()} ISI SUPTECH — Tous droits réservés</p>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${T.textMuted}`}>Plateforme développée par</span>
              <span className="gradient-text font-black text-base tracking-wide">Multi Brain Tech</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <FiliereModal filiere={filiereDetail || selectedFiliere} onClose={() => { setSelectedFiliere(null); setFiliereDetail(null) }} />
      <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  )
}

/* ── Demo data ────────────────────────────────────────────────────────────── */
const DEMO_STUDENTS = [
  { id: 1, nom: 'Moussa Diallo',  filiere: 'Informatique',           license: 'Licence 3', annee: '2024-2025' },
  { id: 2, nom: 'Fatou Sène',     filiere: 'Réseaux & Télécoms',     license: 'Licence 2', annee: '2024-2025' },
  { id: 3, nom: 'Ibrahima Ndiaye',filiere: 'Génie Logiciel',         license: 'Licence 1', annee: '2024-2025' },
  { id: 4, nom: 'Aïssatou Ba',    filiere: 'Intelligence Artificielle',license: 'Master 1', annee: '2024-2025' },
  { id: 5, nom: 'Omar Sy',        filiere: 'Cybersécurité',           license: 'Licence 3', annee: '2024-2025' },
  { id: 6, nom: 'Mariama Koné',   filiere: 'Développement Web',       license: 'Licence 2', annee: '2024-2025' },
]

const DEMO_FILIERES = [
  { id: 1, nom: 'Informatique & Systèmes',     code: 'INFO', description: 'Systèmes d\'information, bases de données, programmation avancée et architecture logicielle.' },
  { id: 2, nom: 'Réseaux & Télécommunications',code: 'RT',   description: 'Infrastructure réseau, protocoles, sécurité des communications et cloud computing.' },
  { id: 3, nom: 'Intelligence Artificielle',   code: 'IA',   description: 'Machine learning, deep learning, traitement du langage naturel et vision par ordinateur.' },
  { id: 4, nom: 'Cybersécurité',               code: 'CYBER',description: 'Sécurité offensive et défensive, audit, forensique et gestion des risques numériques.' },
  { id: 5, nom: 'Développement Web & Mobile',  code: 'DWM',  description: 'Applications web modernes, mobile natif et cross-platform, UX/UI design.' },
  { id: 6, nom: 'Génie Logiciel',              code: 'GL',   description: 'Méthodes agiles, DevOps, architecture microservices et qualité logicielle.' },
]

const STEPS = [
  { title: 'Remplissez le formulaire',  desc: 'Saisissez vos informations personnelles et choisissez votre filière.' },
  { title: 'Examen du dossier',         desc: 'Notre équipe pédagogique examine votre candidature sous 48h.' },
  { title: 'Confirmation & Paiement',   desc: 'Recevez votre acceptation par email et payez via Wave.' },
  { title: 'Carte étudiant',            desc: 'Obtenez votre carte avec QR code pour accéder à tous les services.' },
]
