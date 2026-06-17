import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { X, ChevronDown, ArrowRight, Send, ChevronRight, Moon, Sun, Quote, MapPin, Phone, Mail, Globe, ExternalLink, Star, Linkedin } from 'lucide-react'
import AnimatedBackground from '../components/AnimatedBackground'
import AnimatedBackgroundWhite from '../components/AnimatedBackgroundWhite'
import Navbar from '../components/Navbar'
import {
  getPublicStudents, getFilieres, getFormateurs, getMembresAdmins,
  getPartenaires, getTemoignages, submitTemoignage, subscribeNewsletter,
} from '../services/api'

/* â”€â”€ TikTok SVG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const TikTokIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.53V6.78a4.85 4.85 0 01-1.02-.09z"/>
  </svg>
)

/* â”€â”€ FiliÃ¨re icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const FILIERE_ICONS = {
  INFO: { icon: 'ðŸ’»', color: 'from-blue-600 to-cyan-500', bg: 'bg-blue-500/10 border-blue-400/20' },
  RT:   { icon: 'ðŸ“¡', color: 'from-teal-600 to-emerald-500', bg: 'bg-teal-500/10 border-teal-400/20' },
  IA:   { icon: 'ðŸ¤–', color: 'from-violet-600 to-purple-500', bg: 'bg-violet-500/10 border-violet-400/20' },
  CYBER:{ icon: 'ðŸ”', color: 'from-red-600 to-orange-500', bg: 'bg-red-500/10 border-red-400/20' },
  DWM:  { icon: 'ðŸŒ', color: 'from-pink-600 to-rose-500', bg: 'bg-pink-500/10 border-pink-400/20' },
  GL:   { icon: 'âš™ï¸', color: 'from-amber-600 to-yellow-500', bg: 'bg-amber-500/10 border-amber-400/20' },
  DEFAULT: { icon: 'ðŸ“š', color: 'from-brand-600 to-brand-400', bg: 'bg-brand-500/10 border-brand-400/20' },
}

/* â”€â”€ Animated counter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function Counter({ target, suffix = '', label, emoji, isDark }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView) return
    let v = 0; const end = parseInt(target); const step = end / 60
    const t = setInterval(() => { v += step; if (v >= end) { setCount(end); clearInterval(t) } else setCount(Math.floor(v)) }, 25)
    return () => clearInterval(t)
  }, [inView, target])
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl mb-2">{emoji}</div>
      <div className={`text-4xl md:text-5xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{count.toLocaleString()}{suffix}</div>
      <div className={`text-sm font-medium tracking-wide ${isDark ? 'text-white/50' : 'text-slate-500'}`}>{label}</div>
    </div>
  )
}

/* â”€â”€ Stars rating â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function Stars({ note, size = 14 }) {
  return <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} size={size} className={i <= note ? 'text-amber-400 fill-amber-400' : 'text-white/20'} />)}</div>
}

/* â”€â”€ Modal wrapper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function Modal({ open, onClose, children }) {
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [open])
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <motion.div initial={{ scale: 0.88, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0 }} transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl" onClick={e => e.stopPropagation()}>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* â”€â”€ FiliÃ¨re modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function FiliereModal({ filiere, onClose }) {
  if (!filiere) return null
  const meta = FILIERE_ICONS[filiere.code] || FILIERE_ICONS.DEFAULT
  return (
    <Modal open={!!filiere} onClose={onClose}>
      <div className="bg-gradient-to-br from-space-800 to-space-950 border border-white/10 rounded-3xl overflow-hidden">
        <div className={`bg-gradient-to-r ${meta.color} p-8 text-center relative`}>
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/40 transition-colors">
            <X size={16} className="text-white" />
          </button>
          <div className="text-7xl mb-3 drop-shadow-lg">{meta.icon}</div>
          <h3 className="text-2xl font-black text-white mb-2">{filiere.nom}</h3>
          <span className="inline-block px-4 py-1 bg-black/20 rounded-full text-white/80 text-xs font-mono font-bold tracking-widest">{filiere.code}</span>
        </div>
        <div className="p-6">
          {filiere.description && <p className="text-white/60 text-sm leading-relaxed mb-6">{filiere.description}</p>}
          {filiere.licenses?.length > 0 && (
            <>
              <p className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-3">Niveaux & Frais</p>
              <div className="space-y-3">
                {filiere.licenses.map((l, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-white text-sm">{l.nom}</span>
                      <span className="text-xs bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full">{l.duree_annees} an{l.duree_annees > 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white/5 rounded-xl p-2.5">
                        <div className="text-white/40 mb-0.5">Inscription</div>
                        <div className="text-white font-bold">{Number(l.frais_inscription).toLocaleString()} <span className="text-white/40">FCFA</span></div>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5">
                        <div className="text-emerald-400/70 mb-0.5">MensualitÃ©</div>
                        <div className="text-emerald-300 font-bold">{Number(l.frais_mensuel).toLocaleString()} <span className="text-emerald-400/50">FCFA</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <Link to="/pre-inscription" onClick={onClose}
            className={`btn-primary w-full mt-6 flex items-center justify-center gap-2 py-3.5`}>
            ðŸŽ“ S'inscrire dans cette filiÃ¨re
          </Link>
        </div>
      </div>
    </Modal>
  )
}

/* â”€â”€ Student modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function StudentModal({ student, onClose }) {
  if (!student) return null
  const initials = (student.nom || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <Modal open={!!student} onClose={onClose}>
      <div className="bg-gradient-to-br from-space-800 to-space-950 border border-white/10 rounded-3xl overflow-hidden">
        <div className="bg-gradient-to-br from-brand-700 via-brand-600 to-accent-pink p-8 text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/40 transition-colors">
            <X size={16} className="text-white" />
          </button>
          <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 overflow-hidden border-4 border-white/30 shadow-2xl bg-space-800">
            {student.photo ? <img src={student.photo} alt={student.nom} className="w-full h-full object-cover" /> : <span className="text-2xl font-black text-white">{initials}</span>}
          </div>
          <h3 className="text-xl font-black text-white">{student.nom}</h3>
          <p className="text-white/70 text-sm mt-1">{student.filiere}</p>
        </div>
        <div className="p-6 space-y-0">
          {[
            ['Niveau', student.license],
            ['AnnÃ©e', student.annee],
            ['Matricule', student.matricule],
            ['Statut', 'âœ… Ã‰tudiant actif'],
          ].filter(([,v]) => v).map(([label, val]) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-white/[0.06]">
              <span className="text-white/40 text-sm">{label}</span>
              <span className={`text-sm font-semibold ${label === 'Matricule' ? 'text-brand-300 font-mono' : 'text-white'}`}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

/* â”€â”€ 360 Tour â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function Tour360() {
  const [angle, setAngle] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [auto, setAuto] = useState(true)
  const scenes = [
    { label: 'Hall Principal',     emoji: 'ðŸ›ï¸', from: '#1e3a8a', to: '#312e81' },
    { label: 'Salle Informatique', emoji: 'ðŸ’»', from: '#134e4a', to: '#164e63' },
    { label: 'BibliothÃ¨que',       emoji: 'ðŸ“š', from: '#1e1b4b', to: '#0f172a' },
    { label: 'AmphithÃ©Ã¢tre',       emoji: 'ðŸŽ“', from: '#4a1d96', to: '#1e1b4b' },
    { label: 'Labo IA',            emoji: 'ðŸ¤–', from: '#3b0764', to: '#1e3a8a' },
    { label: 'Espace DÃ©tente',     emoji: 'ðŸŒ¿', from: '#064e3b', to: '#0f2027' },
  ]
  useEffect(() => {
    if (!auto) return
    const t = setInterval(() => setAngle(a => (a + 1) % 360), 40)
    return () => clearInterval(t)
  }, [auto])
  const si = Math.floor((((angle % 360) + 360) % 360) / 60) % scenes.length
  const s = scenes[si]
  return (
    <div className="select-none" onMouseDown={e => { setDragging(true); setStartX(e.clientX); setAuto(false) }}
      onMouseMove={e => { if (!dragging) return; setAngle(a => a + (e.clientX - startX) * 0.5); setStartX(e.clientX) }}
      onMouseUp={() => setDragging(false)} onMouseLeave={() => setDragging(false)}>
      <div className="relative w-full h-80 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}>
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)',
          backgroundSize: '50px 50px',
          transform: `perspective(600px) rotateX(${angle * 0.04}deg)`,
        }}/>
        {/* Glow ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full border border-white/5" style={{ transform: `rotate(${angle}deg)` }}/>
          <div className="absolute w-[400px] h-[400px] rounded-full border border-white/10" style={{ transform: `rotate(${-angle * 0.7}deg)` }}/>
        </div>
        {/* Scene */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <motion.div key={si} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-8xl mb-4 drop-shadow-2xl">
            {s.emoji}
          </motion.div>
          <motion.div key={`t-${si}`} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-xl font-black text-white drop-shadow-lg">
            {s.label}
          </motion.div>
        </div>
        {/* Compass */}
        <div className="absolute top-4 right-4 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-black/30 backdrop-blur-sm z-20">
          <div className="w-px h-4 bg-red-400 absolute" style={{ transform: `rotate(${angle}deg)`, transformOrigin: 'bottom center', bottom: '50%' }}/>
        </div>
        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {scenes.map((_, i) => <div key={i} className={`rounded-full transition-all ${i===si?'w-4 h-2 bg-white':'w-2 h-2 bg-white/30'}`}/>)}
        </div>
      </div>
      <div className="flex justify-center gap-6 mt-3 text-sm">
        <button onClick={() => setAuto(!auto)} className="text-brand-400 hover:text-brand-300 transition-colors">{auto ? 'â¸ Pause' : 'â–¶ Auto'}</button>
        <span className="text-white/20">â† Glissez pour explorer â†’</span>
        <button onClick={() => { setAngle(0); setAuto(true) }} className="text-white/30 hover:text-white/60 transition-colors">â†º Reset</button>
      </div>
    </div>
  )
}

/* â”€â”€ MAIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function Landing() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('isi_theme') === 'dark')
  const [students, setStudents]   = useState([])
  const [filieres, setFilieres]   = useState([])
  const [formateurs, setFormateurs] = useState([])
  const [membres, setMembres]     = useState([])
  const [partenaires, setPartenaires] = useState([])
  const [temoignages, setTemoignages] = useState([])
  const [selFiliere, setSelFiliere] = useState(null)
  const [selStudent, setSelStudent] = useState(null)
  const [newsletter, setNewsletter] = useState({ email: '', nom: '' })
  const [newsletterOK, setNewsletterOK] = useState(false)
  const [temoForm, setTemoForm]   = useState({ nom: '', filiere: '', annee_diplome: '', contenu: '', note: 5 })
  const [temoOK, setTemoOK]       = useState(false)
  const [socials, setSocials]     = useState({})

  useEffect(() => { localStorage.setItem('isi_theme', isDark ? 'dark' : 'light') }, [isDark])

  useEffect(() => {
    Promise.all([
      getPublicStudents().catch(() => ({ data: [] })),
      getFilieres().catch(() => ({ data: [] })),
      getFormateurs().catch(() => ({ data: [] })),
      getMembresAdmins().catch(() => ({ data: [] })),
      getPartenaires().catch(() => ({ data: [] })),
      getTemoignages().catch(() => ({ data: [] })),
    ]).then(([s, f, fo, m, p, te]) => {
      setStudents((s.data || []).slice(0, 12))
      setFilieres(f.data?.length ? f.data : DEMO_FILIERES)
      setFormateurs(fo.data || [])
      setMembres(m.data || [])
      setPartenaires(p.data || [])
      setTemoignages(te.data || [])
    })
    fetch('/api/settings/social').then(r=>r.json()).then(setSocials).catch(()=>{})
  }, [])

  const openFiliere = async (f) => {
    setSelFiliere(f)
    if (f.id && !f.licenses) {
      try {
        const r = await fetch(`/api/filieres/${f.id}`)
        setSelFiliere(await r.json())
      } catch {}
    }
  }

  const T = isDark ? {
    bg: 'bg-space-950', text: 'text-white', sub: 'text-white/60', muted: 'text-white/30',
    card: 'glass-card', cardHover: 'glass-card-hover cursor-pointer',
    badge: 'bg-white/5 border border-white/10 text-brand-300',
    input: 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-brand-400/60',
    section: '', hr: 'border-white/10', footerBg: 'bg-space-900/80 backdrop-blur-xl border-white/10',
  } : {
    bg: 'bg-transparent', text: 'text-slate-900', sub: 'text-slate-600', muted: 'text-slate-400',
    card: 'light-card', cardHover: 'light-card-hover cursor-pointer',
    badge: 'bg-white border border-brand-200 text-brand-700 shadow-sm',
    input: 'bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-brand-400 shadow-sm',
    section: '', hr: 'border-slate-200', footerBg: 'bg-white/80 backdrop-blur-xl border-slate-200',
  }

  const fadeUp = { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } }
  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }

  const SOCIALS_MAP = [
    { key:'facebook',  Icon: ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>, color: '#1877F2' },
    { key:'instagram', Icon: ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>, color: '#E1306C' },
    { key:'tiktok',    Icon: TikTokIcon, color: '#010101' },
    { key:'youtube',   Icon: ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>, color: '#FF0000' },
    { key:'linkedin',  Icon: ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>, color: '#0A66C2' },
    { key:'twitter',   Icon: ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, color: '#000' },
  ]

  return (
    <div className={`min-h-screen relative ${isDark ? 'bg-space-950' : ''}`}>
      {isDark ? <AnimatedBackground /> : <AnimatedBackgroundWhite />}

      {/* Theme toggle */}
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsDark(d => !d)}
        className={`fixed bottom-6 right-6 z-[100] w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${
          isDark ? 'bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 hover:bg-white/20' : 'bg-slate-900 text-amber-300 hover:bg-slate-800'
        }`}>
        {isDark ? <Sun size={20}/> : <Moon size={20}/>}
      </motion.button>

      <Navbar />

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• HERO â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="text-center max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className={`inline-flex items-center gap-2.5 rounded-full px-5 py-2 text-sm font-semibold mb-8 ${T.badge}`}>
            âœ¨ Ouverture des inscriptions 2025-2026 âœ¨
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className={`text-6xl sm:text-7xl md:text-8xl font-black leading-[1.05] mb-6 ${T.text}`}>
            Votre avenir<br />
            <span className={isDark ? 'gradient-text' : 'gradient-text-light'}>commence ici</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className={`text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed ${T.sub}`}>
            ISI SUPTECH â€” Institut d'excellence en informatique, technologies et innovation numÃ©rique Ã  Dakar, SÃ©nÃ©gal.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/pre-inscription"
              className="btn-primary text-base px-8 py-4 flex items-center gap-2.5 rounded-2xl">
              ðŸŽ“ Commencer ma prÃ©-inscription <ArrowRight size={18}/>
            </Link>
            <Link to="/connexion"
              className={`flex items-center gap-2 font-semibold px-8 py-4 rounded-2xl border-2 transition-all duration-300 ${
                isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-200 text-slate-700 bg-white/70 hover:bg-white'
              }`}>
              ðŸ”‘ Mon espace Ã©tudiant
            </Link>
          </motion.div>

          {/* Hero floating badges */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center gap-3 mt-12">
            {['ðŸ† Excellence acadÃ©mique', 'ðŸ’¡ Innovation & Pratique', 'ðŸŒ Certifications reconnues', 'ðŸ“± Campus connectÃ©'].map((b, i) => (
              <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 + i * 0.1 }}
                className={`text-xs font-semibold px-4 py-2 rounded-full ${isDark ? 'bg-white/5 border border-white/10 text-white/60' : 'bg-white/80 border border-slate-200 text-slate-600 shadow-sm'}`}>
                {b}
              </motion.span>
            ))}
          </motion.div>
        </div>

        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}
          className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 ${T.muted}`}>
          <span className="text-xs tracking-[0.3em] uppercase">DÃ©filer</span>
          <ChevronDown size={18}/>
        </motion.div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• STATS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className={`${T.card} p-10 grid grid-cols-2 md:grid-cols-4 gap-10`}>
            <Counter target="2500" suffix="+"  label="Ã‰tudiants formÃ©s"     emoji="ðŸ‘¨â€ðŸŽ“" isDark={isDark} />
            <Counter target="15"   suffix="+"  label="AnnÃ©es d'expÃ©rience"  emoji="ðŸ›ï¸" isDark={isDark} />
            <Counter target="20"   suffix=""   label="FiliÃ¨res disponibles" emoji="ðŸ“š" isDark={isDark} />
            <Counter target="95"   suffix="%"  label="Taux d'insertion"     emoji="ðŸ’¼" isDark={isDark} />
          </motion.div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• TOUR 360 â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section id="campus" className="relative z-10 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className={`text-sm font-bold uppercase tracking-[0.3em] ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>Visite virtuelle</span>
            <h2 className={`text-4xl md:text-5xl font-black mt-3 mb-3 ${T.text}`}>
              Explorez notre campus <span className={isDark ? 'gradient-text' : 'gradient-text-light'}>en 360Â°</span>
            </h2>
            <p className={`max-w-xl mx-auto ${T.sub}`}>Glissez pour naviguer dans nos installations modernes.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <Tour360 />
          </motion.div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• FILIÃˆRES â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section id="filieres" className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className={`text-sm font-bold uppercase tracking-[0.3em] ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>Formations</span>
            <h2 className={`text-4xl md:text-5xl font-black mt-3 mb-3 ${T.text}`}>
              Nos <span className={isDark ? 'gradient-text' : 'gradient-text-light'}>filiÃ¨res d'excellence</span>
            </h2>
            <p className={T.sub}>Cliquez pour voir les dÃ©tails et les frais de chaque filiÃ¨re.</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filieres.map((f, i) => {
              const meta = FILIERE_ICONS[f.code] || FILIERE_ICONS.DEFAULT
              return (
                <motion.div key={f.id || i} variants={fadeUp}>
                  <motion.div whileHover={{ y: -6 }} whileTap={{ scale: 0.98 }}
                    className={`${T.card} p-6 h-full flex flex-col transition-all duration-300 ${
                      isDark ? 'hover:border-brand-500/40 hover:shadow-2xl hover:shadow-brand-500/10' : 'hover:shadow-2xl hover:shadow-brand-100/60 hover:border-brand-200'
                    } cursor-pointer`}
                    onClick={() => openFiliere(f)}>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center mb-5 shadow-lg`}>
                      <span className="text-2xl">{meta.icon}</span>
                    </div>
                    <h3 className={`font-black text-lg mb-2 ${T.text}`}>{f.nom}</h3>
                    <p className={`text-sm leading-relaxed flex-1 mb-4 ${T.sub}`}>{f.description || 'Formation professionnelle de haut niveau.'}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${isDark ? `${meta.bg} border text-white/60` : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                        {f.code}
                      </span>
                      <span className={`text-xs font-semibold flex items-center gap-1 ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>
                        Voir dÃ©tails <ChevronRight size={14}/>
                      </span>
                    </div>
                  </motion.div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• PROCESSUS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className={`text-sm font-bold uppercase tracking-[0.3em] ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>Processus</span>
            <h2 className={`text-4xl md:text-5xl font-black mt-3 ${T.text}`}>Comment s'inscrire ?</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`${T.card} p-6 text-center relative`}>
                {i < STEPS.length - 1 && <div className="hidden md:block absolute top-8 left-full w-5 h-px border-t-2 border-dashed border-brand-500/30 z-10 -mr-2"/>}
                <div className="text-4xl mb-4">{step.emoji}</div>
                <div className={`text-xs font-bold mb-2 ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>Ã‰tape {i + 1}</div>
                <h4 className={`font-bold mb-2 ${T.text}`}>{step.title}</h4>
                <p className={`text-xs leading-relaxed ${T.sub}`}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Ã‰TUDIANTS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {(students.length > 0 || DEMO_STUDENTS.length > 0) && (
        <section className="relative z-10 py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
              <span className={`text-sm font-bold uppercase tracking-[0.3em] ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>CommunautÃ©</span>
              <h2 className={`text-4xl md:text-5xl font-black mt-3 mb-3 ${T.text}`}>Nos Ã©tudiants actuels</h2>
              <p className={T.sub}>Cliquez sur un Ã©tudiant pour dÃ©couvrir son profil.</p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(students.length ? students : DEMO_STUDENTS).map((s, i) => (
                <motion.div key={s.id || i} initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  <motion.div whileHover={{ scale: 1.02 }} className={`${T.cardHover} p-4 flex items-center gap-4`} onClick={() => setSelStudent(s)}>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-pink flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg">
                      {s.photo ? <img src={s.photo} alt={s.nom} className="w-full h-full object-cover"/> :
                        <span className="text-white font-black text-sm">{(s.nom||'').split(' ').map(n=>n[0]).join('').slice(0,2)}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm truncate ${T.text}`}>{s.nom}</div>
                      <div className={`text-xs ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>{s.filiere}</div>
                      <div className={`text-xs ${T.muted}`}>{s.license} Â· {s.annee}</div>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"/>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• FORMATEURS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {formateurs.length > 0 && (
        <section className="relative z-10 py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
              <span className={`text-sm font-bold uppercase tracking-[0.3em] ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>Encadrement</span>
              <h2 className={`text-4xl font-black mt-3 ${T.text}`}>Nos <span className={isDark ? 'gradient-text' : 'gradient-text-light'}>formateurs</span></h2>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {formateurs.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i*0.07 }}>
                  <div className={`${T.card} p-5 text-center`}>
                    <div className="w-18 h-18 mx-auto rounded-2xl bg-gradient-to-br from-brand-600 to-accent-pink flex items-center justify-center mb-3 overflow-hidden shadow-lg" style={{width:64,height:64}}>
                      {f.photo ? <img src={f.photo} alt={f.nom} className="w-full h-full object-cover"/> :
                        <span className="text-xl font-black text-white">{f.prenom?.[0]}{f.nom?.[0]}</span>}
                    </div>
                    <div className={`text-xs font-bold mb-0.5 ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>{f.titre}</div>
                    <h4 className={`font-black text-sm mb-1 ${T.text}`}>{f.prenom} {f.nom}</h4>
                    <p className={`text-xs ${T.sub} line-clamp-2`}>{f.specialite}</p>
                    {f.linkedin && <a href={f.linkedin} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 mt-2 text-xs ${isDark?'text-brand-400':'text-brand-600'}`}><Linkedin size={11}/> LinkedIn</a>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• MEMBRES ADMINS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {membres.length > 0 && (
        <section className="relative z-10 py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
              <span className={`text-sm font-bold uppercase tracking-[0.3em] ${isDark ? 'text-accent-indigo' : 'text-indigo-600'}`}>Direction</span>
              <h2 className={`text-4xl font-black mt-3 ${T.text}`}>Notre <span className={isDark ? 'gradient-text' : 'gradient-text-light'}>Ã©quipe dirigeante</span></h2>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {membres.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i*0.07 }}>
                  <div className={`${T.card} p-5 text-center`}>
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mb-3 overflow-hidden shadow-lg">
                      {m.photo ? <img src={m.photo} alt={m.nom} className="w-full h-full object-cover"/> :
                        <span className="text-xl">ðŸ›ï¸</span>}
                    </div>
                    <div className={`text-xs font-bold mb-0.5 ${isDark ? 'text-accent-indigo' : 'text-indigo-600'}`}>{m.titre}</div>
                    <h4 className={`font-black text-sm mb-1 ${T.text}`}>{m.prenom} {m.nom}</h4>
                    <p className={`text-xs ${T.sub}`}>{m.poste}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• PARTENAIRES â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {partenaires.length > 0 && (
        <section className="relative z-10 py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <span className={`text-sm font-bold uppercase tracking-[0.3em] ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>Partenariat</span>
              <h2 className={`text-4xl font-black mt-3 ${T.text}`}>Nos <span className={isDark ? 'gradient-text' : 'gradient-text-light'}>partenaires</span></h2>
            </motion.div>
            <div className="flex flex-wrap justify-center gap-5">
              {partenaires.map((p, i) => (
                <motion.div key={i} whileHover={{ scale: 1.08, y: -4 }} className={`${T.card} p-5 flex flex-col items-center gap-2 w-36 h-28`}>
                  {p.logo ? <img src={p.logo} alt={p.nom} className="max-h-10 object-contain"/> : <span className="text-3xl">ðŸ¤</span>}
                  <span className={`text-xs font-bold text-center line-clamp-2 ${T.text}`}>{p.nom}</span>
                  {p.site_web && <a href={p.site_web} target="_blank" rel="noopener noreferrer" className="text-brand-400"><ExternalLink size={11}/></a>}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• TÃ‰MOIGNAGES â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className={`text-sm font-bold uppercase tracking-[0.3em] ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>TÃ©moignages</span>
            <h2 className={`text-4xl font-black mt-3 ${T.text}`}>Ce que disent <span className={isDark ? 'gradient-text' : 'gradient-text-light'}>nos Ã©tudiants</span></h2>
          </motion.div>
          {temoignages.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
              {temoignages.slice(0, 6).map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i*0.1 }}>
                  <div className={`${T.card} p-6 h-full flex flex-col`}>
                    <Quote size={22} className={`mb-3 ${isDark ? 'text-brand-400' : 'text-brand-500'}`}/>
                    <p className={`text-sm leading-relaxed flex-1 mb-4 ${T.sub}`}>{t.contenu}</p>
                    <div><Stars note={t.note}/><div className={`font-bold text-sm mt-2 ${T.text}`}>{t.nom}</div>
                    <div className={`text-xs ${T.muted}`}>{t.filiere}{t.annee_diplome ? ` Â· ${t.annee_diplome}` : ''}</div></div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          {/* Submit form */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className={`${T.card} p-8 max-w-2xl mx-auto`}>
            {temoOK ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">ðŸ™</div>
                <h4 className={`font-black text-lg mb-2 ${T.text}`}>Merci pour votre tÃ©moignage !</h4>
                <p className={T.sub}>Il sera affichÃ© aprÃ¨s validation.</p>
              </div>
            ) : (<>
              <h4 className={`font-black text-xl mb-6 ${T.text}`}>âœï¸ Partagez votre expÃ©rience</h4>
              <form onSubmit={async e => { e.preventDefault(); try { await submitTemoignage(temoForm); setTemoOK(true) } catch { setTemoOK(true) } }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="form-label text-xs">Nom *</label><input value={temoForm.nom} onChange={e=>setTemoForm(f=>({...f,nom:e.target.value}))} required className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${T.input}`} placeholder="Votre nom"/></div>
                  <div><label className="form-label text-xs">FiliÃ¨re</label><input value={temoForm.filiere} onChange={e=>setTemoForm(f=>({...f,filiere:e.target.value}))} className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${T.input}`} placeholder="Ex: Informatique"/></div>
                </div>
                <div><label className="form-label text-xs">Promotion</label><input value={temoForm.annee_diplome} onChange={e=>setTemoForm(f=>({...f,annee_diplome:e.target.value}))} className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${T.input}`} placeholder="2024-2025"/></div>
                <div><label className="form-label text-xs">Note *</label>
                  <div className="flex gap-2">{[1,2,3,4,5].map(n=><button key={n} type="button" onClick={()=>setTemoForm(f=>({...f,note:n}))} className="transition-transform hover:scale-110"><Star size={28} className={n<=temoForm.note?'text-amber-400 fill-amber-400':'text-white/20'}/></button>)}</div>
                </div>
                <div><label className="form-label text-xs">TÃ©moignage *</label><textarea value={temoForm.contenu} onChange={e=>setTemoForm(f=>({...f,contenu:e.target.value}))} required rows={4} className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none transition-all ${T.input}`} placeholder="Partagez votre expÃ©rience..."/></div>
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-xl"><Send size={16}/> Envoyer</button>
              </form>
            </>)}
          </motion.div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• NEWSLETTER â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className={`${T.card} p-8 text-center`}>
            {newsletterOK ? (<><div className="text-5xl mb-3">ðŸ“¬</div><h3 className={`text-xl font-black mb-2 ${T.text}`}>Inscrit(e) !</h3><p className={T.sub}>Vous recevrez nos actualitÃ©s.</p></>) : (<>
              <div className="text-4xl mb-4">ðŸ“®</div>
              <h3 className={`text-2xl font-black mb-2 ${T.text}`}>Restez informÃ©(e)</h3>
              <p className={`mb-6 ${T.sub}`}>ActualitÃ©s, dates importantes et offres d'ISI SUPTECH directement dans votre boÃ®te.</p>
              <form onSubmit={async e=>{e.preventDefault();try{await subscribeNewsletter(newsletter);setNewsletterOK(true)}catch{setNewsletterOK(true)}}} className="flex flex-col sm:flex-row gap-3">
                <input value={newsletter.nom} onChange={e=>setNewsletter(n=>({...n,nom:e.target.value}))} placeholder="PrÃ©nom" className={`flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-all ${T.input}`}/>
                <input value={newsletter.email} onChange={e=>setNewsletter(n=>({...n,email:e.target.value}))} type="email" required placeholder="Email *" className={`flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-all ${T.input}`}/>
                <button type="submit" className="btn-primary px-6 py-3 flex items-center gap-2 rounded-xl whitespace-nowrap"><Send size={15}/> S'inscrire</button>
              </form>
            </>)}
          </motion.div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• CTA â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative z-10 py-24 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-500 to-accent-pink"/>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)'}}/>
          <div className="relative z-10 p-12">
            <div className="text-6xl mb-6">ðŸš€</div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">PrÃªt Ã  rejoindre l'excellence ?</h2>
            <p className="text-white/70 mb-8 text-lg">DÃ©posez votre dossier en quelques minutes. RÃ©ponse sous 48h.</p>
            <Link to="/pre-inscription" className="inline-flex items-center gap-3 bg-white text-brand-700 hover:bg-brand-50 font-black text-lg px-10 py-4 rounded-2xl transition-all shadow-2xl hover:scale-105">
              ðŸŽ“ DÃ©marrer ma prÃ©-inscription <ArrowRight size={20}/>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• FOOTER â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <footer className={`relative z-10 border-t py-16 px-4 ${T.footerBg}`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <img src="/isi-logo.png" alt="ISI" className="h-12 w-auto object-contain" onError={e=>{e.target.style.display='none'}}/>
                <div><div className={`font-black text-xl ${T.text}`}>ISI SUPTECH</div><div className={`text-xs ${T.muted}`}>Institut SupÃ©rieur d'Informatique et des Technologies</div></div>
              </div>
              <p className={`text-sm leading-relaxed mb-5 max-w-sm ${T.sub}`}>
                Nous plaÃ§ons l'excellence acadÃ©mique, la pratique professionnelle et l'innovation au cÅ“ur de notre pÃ©dagogie. Nos programmes sont conÃ§us pour rÃ©pondre aux exigences du marchÃ© du travail.
              </p>
              <div className="flex flex-wrap gap-2">
                {['ðŸ‘¨â€ðŸ« Encadrement perso','ðŸ’¡ Projets pratiques','ðŸ† Certifications','ðŸ”“ AccÃ¨s 24/7','ðŸ¤ CommunautÃ©'].map((b,i)=>(
                  <span key={i} className={`text-xs px-3 py-1.5 rounded-full ${isDark?'bg-white/5 border border-white/10 text-white/50':'bg-slate-100 border border-slate-200 text-slate-600'}`}>{b}</span>
                ))}
              </div>
            </div>

            <div>
              <h4 className={`font-black text-sm uppercase tracking-widest mb-5 ${T.muted}`}>Contact</h4>
              <div className="space-y-3.5">
                {[
                  { icon: MapPin, text: 'Sicap LibertÃ© 3 NÂ°1977\nDakar, SÃ©nÃ©gal' },
                  { icon: Phone,  text: '+221 33 825 62 10', href: 'tel:+221338256210' },
                  { icon: Mail,   text: 'suptech@isisuptech.com', href: 'mailto:suptech@isisuptech.com' },
                  { icon: Globe,  text: 'inscription.isisuptech.com' },
                ].map(({ icon: Icon, text, href }, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Icon size={15} className={`flex-shrink-0 mt-0.5 ${isDark?'text-brand-400':'text-brand-600'}`}/>
                    {href ? <a href={href} className={`text-sm hover:text-brand-400 transition-colors ${T.sub}`}>{text}</a> :
                      <span className={`text-sm whitespace-pre-line ${T.sub}`}>{text}</span>}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className={`font-black text-sm uppercase tracking-widest mb-5 ${T.muted}`}>Navigation</h4>
              <div className="space-y-2.5">
                {[['ðŸŽ“ PrÃ©-inscription','/pre-inscription'],['ðŸ”‘ Espace Ã©tudiant','/connexion'],['ðŸ“š Nos filiÃ¨res','/#filieres'],['ðŸ›ï¸ Campus','/#campus']].map(([label,to])=>(
                  <Link key={to} to={to} className={`flex items-center gap-2 text-sm transition-colors hover:text-brand-400 ${T.sub}`}><ChevronRight size={13}/>{label}</Link>
                ))}
              </div>
              {Object.values(socials).some(Boolean) && (
                <div className="mt-6">
                  <h4 className={`font-black text-xs uppercase tracking-widest mb-3 ${T.muted}`}>Suivez-nous</h4>
                  <div className="flex flex-wrap gap-2">
                    {SOCIALS_MAP.filter(s => socials[s.key]).map(({ key, Icon, color }) => (
                      <a key={key} href={socials[key]} target="_blank" rel="noopener noreferrer"
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 ${isDark?'bg-white/5 border border-white/10 text-white/60 hover:text-white':'bg-white border border-slate-200 text-slate-500 hover:text-brand-600 shadow-sm'}`}>
                        <Icon size={16}/>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={`border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4 ${T.hr}`}>
            <p className={`text-sm ${T.muted}`}>Â© {new Date().getFullYear()} ISI SUPTECH â€” Tous droits rÃ©servÃ©s</p>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${T.muted}`}>DÃ©veloppÃ© par</span>
              <span className={`font-black text-base ${isDark ? 'gradient-text' : 'gradient-text-light'}`}>Multi Brain Tech</span>
            </div>
          </div>
        </div>
      </footer>

      <FiliereModal filiere={selFiliere} onClose={() => setSelFiliere(null)}/>
      <StudentModal student={selStudent} onClose={() => setSelStudent(null)}/>
    </div>
  )
}

const DEMO_STUDENTS = [
  { nom: 'Moussa Diallo',   filiere: 'Informatique',     license: 'Licence 3', annee: '2024-2025' },
  { nom: 'Fatou SÃ¨ne',      filiere: 'RÃ©seaux & TÃ©lÃ©coms',license: 'Licence 2', annee: '2024-2025' },
  { nom: 'Ibrahima Ndiaye', filiere: 'GÃ©nie Logiciel',   license: 'Licence 1', annee: '2024-2025' },
  { nom: 'AÃ¯ssatou Ba',     filiere: 'Intelligence IA',  license: 'Master 1',  annee: '2024-2025' },
  { nom: 'Omar Sy',         filiere: 'CybersÃ©curitÃ©',    license: 'Licence 3', annee: '2024-2025' },
  { nom: 'Mariama KonÃ©',    filiere: 'DÃ©v. Web & Mobile',license: 'Licence 2', annee: '2024-2025' },
]

const DEMO_FILIERES = [
  { id:1, nom:'Informatique & SystÃ¨mes',     code:'INFO', description:"SystÃ¨mes d'information, bases de donnÃ©es, programmation avancÃ©e et architecture logicielle." },
  { id:2, nom:'RÃ©seaux & TÃ©lÃ©communications',code:'RT',   description:"Infrastructure rÃ©seau, protocoles, sÃ©curitÃ© des communications et cloud computing." },
  { id:3, nom:'Intelligence Artificielle',   code:'IA',   description:"Machine learning, deep learning, traitement du langage naturel et vision par ordinateur." },
  { id:4, nom:'CybersÃ©curitÃ©',               code:'CYBER',description:"SÃ©curitÃ© offensive et dÃ©fensive, audit, forensique et gestion des risques numÃ©riques." },
  { id:5, nom:'DÃ©veloppement Web & Mobile',  code:'DWM',  description:"Applications web modernes, mobile natif et cross-platform, UX/UI design." },
  { id:6, nom:'GÃ©nie Logiciel',              code:'GL',   description:"MÃ©thodes agiles, DevOps, architecture microservices et qualitÃ© logicielle." },
]

const STEPS = [
  { title:'Remplissez le formulaire',  emoji:'ðŸ“', desc:"Saisissez vos informations personnelles et choisissez votre filiÃ¨re en quelques minutes." },
  { title:'Examen du dossier',         emoji:'ðŸ”', desc:"Notre Ã©quipe pÃ©dagogique examine votre candidature sous 48h ouvrÃ©es." },
  { title:'Acceptation & Paiement',    emoji:'ðŸ’³', desc:"Recevez votre acceptation par email et payez vos frais via Wave ou Ã  la caisse." },
  { title:'Carte Ã©tudiant QR',         emoji:'ðŸªª', desc:"Obtenez votre carte avec QR code sÃ©curisÃ© pour accÃ©der Ã  tous les services." },
]
