import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu, Network, Brain, Shield, Code2, GitBranch, GraduationCap,
  CheckCircle2, Award, ArrowRight, ArrowLeft, ChevronRight,
  Moon, Sun, X, Lock, Star, BookOpen, Zap, Clock, Users,
  Database, Server, ExternalLink, MapPin, Play,
} from 'lucide-react'
import Navbar from '../components/Navbar'

// ─── Color map ────────────────────────────────────────────────────────────────
const CM = {
  blue:    { g:'from-blue-700 to-blue-500',    ov:'from-blue-950/97 to-blue-900/97',    t:'text-blue-300',   b:'bg-blue-500/20 border-blue-400/30',  ring:'ring-blue-500/50',  glow:'shadow-blue-500/20'  },
  cyan:    { g:'from-cyan-700 to-cyan-500',     ov:'from-cyan-950/97 to-cyan-900/97',    t:'text-cyan-300',   b:'bg-cyan-500/20 border-cyan-400/30',  ring:'ring-cyan-500/50',  glow:'shadow-cyan-500/20'  },
  violet:  { g:'from-violet-700 to-purple-600', ov:'from-violet-950/97 to-purple-900/97',t:'text-violet-300', b:'bg-violet-500/20 border-violet-400/30',ring:'ring-violet-500/50',glow:'shadow-violet-500/20'},
  red:     { g:'from-red-700 to-rose-600',      ov:'from-red-950/97 to-rose-900/97',     t:'text-rose-300',   b:'bg-red-500/20 border-red-400/30',    ring:'ring-red-500/50',   glow:'shadow-red-500/20'   },
  emerald: { g:'from-emerald-700 to-green-600', ov:'from-emerald-950/97 to-green-900/97',t:'text-emerald-300',b:'bg-emerald-500/20 border-emerald-400/30',ring:'ring-emerald-500/50',glow:'shadow-emerald-500/20'},
  amber:   { g:'from-amber-700 to-orange-600',  ov:'from-amber-950/97 to-orange-900/97', t:'text-amber-300',  b:'bg-amber-500/20 border-amber-400/30', ring:'ring-amber-500/50', glow:'shadow-amber-500/20' },
}

// ─── Static data ──────────────────────────────────────────────────────────────
const FORMATIONS = [
  {
    id:1, code:'INFO', color:'blue', icon:Cpu,
    nom:'Informatique & Systèmes d\'Information',
    desc:'Maîtrisez les systèmes d\'information, les bases de données, la programmation orientée objet et l\'architecture logicielle moderne.',
    skills:['Python','Java','SQL','Merise','UML','OS Linux'],
    duree:'2 à 3 ans', certifs:['Oracle Certified','Microsoft MTA'],
    formateur:'M. Kara — Directeur & Expert BDD',
    frais:'150 000 FCFA / an',
    curriculum:[
      'Algorithmique & Programmation Python/Java',
      'Bases de données relationnelles (SQL, Oracle)',
      'Modélisation UML & Merise',
      'Architecture des systèmes d\'information',
      'Développement d\'applications métier',
      'Gestion de projets informatiques',
    ],
    img:'/Etudiant_gestion.jpeg',
    meta:'Fondamentaux IT · Très demandé',
  },
  {
    id:2, code:'RT', color:'cyan', icon:Network,
    nom:'Réseaux & Télécommunications',
    desc:'Infrastructure réseau, protocoles TCP/IP, sécurité des communications, cloud computing et solutions de télécommunications 5G.',
    skills:['Cisco CCNA','VLAN','TCP/IP','WiFi','5G','AWS Cloud'],
    duree:'2 à 3 ans', certifs:['Cisco CCNA','Huawei HCIA','AWS Cloud'],
    formateur:'M. Cissé — Coach Cisco Certifié',
    frais:'150 000 FCFA / an',
    curriculum:[
      'Fondamentaux des réseaux TCP/IP',
      'Routage & Commutation Cisco (CCNA)',
      'Infrastructure WiFi & Technologies 5G',
      'VLANs, QoS & Architecture réseau',
      'Cloud Networking (AWS, Azure)',
      'Sécurité & Supervision réseau',
    ],
    img:'/caroursel_isi_suptech_soutenace.jpg',
    meta:'Cisco Academy · Certification officielle',
  },
  {
    id:3, code:'IA', color:'violet', icon:Brain,
    nom:'Intelligence Artificielle',
    desc:'Machine learning, deep learning, traitement du langage naturel et vision par ordinateur. Préparez-vous aux métiers de demain.',
    skills:['Python','TensorFlow','NLP','Keras','Scikit-learn','OpenCV'],
    duree:'2 à 3 ans', certifs:['AWS ML Specialty','Google AI Certificate'],
    formateur:'M. Kara — Expert Data Science',
    frais:'175 000 FCFA / an',
    curriculum:[
      'Mathématiques pour l\'IA (algèbre, stats)',
      'Machine Learning classique (Scikit-learn)',
      'Deep Learning & Réseaux de neurones (TF/Keras)',
      'NLP & Traitement automatique du texte',
      'Computer Vision & Détection d\'objets',
      'Projets IA réels & Déploiement cloud',
    ],
    img:'/etudant_farda.jpeg',
    meta:'Filière du futur · Très haute valeur',
  },
  {
    id:4, code:'CYBER', color:'red', icon:Shield,
    nom:'Cybersécurité',
    desc:'Sécurité offensive & défensive, tests de pénétration, forensique numérique, OSINT et gestion des risques cyber.',
    skills:['Pentest','Kali Linux','CTF','Forensics','SIEM','OSINT'],
    duree:'2 à 3 ans', certifs:['CEH','CompTIA Security+','OSCP'],
    formateur:'M. Junior — Pentester & Expert Cyber',
    frais:'180 000 FCFA / an',
    curriculum:[
      'Fondamentaux de la cybersécurité',
      'Tests de pénétration (Kali, Metasploit)',
      'Analyse forensique numérique',
      'OSINT & Threat Intelligence',
      'Gestion des incidents (SIEM)',
      'Audit de sécurité & Conformité RGPD',
    ],
    img:'/Etudiant_gestion.jpeg',
    meta:'Filière en forte demande · Certifs reconnues',
  },
  {
    id:5, code:'DWM', color:'emerald', icon:Code2,
    nom:'Développement Web & Mobile',
    desc:'Applications web modernes, mobile natif & cross-platform avec React, Laravel, Flutter. Design UX/UI et APIs REST avancées.',
    skills:['React','Laravel','Flutter','Node.js','TypeScript','REST API'],
    duree:'2 à 3 ans', certifs:['Meta Front-End','AWS Developer','Flutter Dev'],
    formateur:'M. Robert — Dev Full-Stack Senior',
    frais:'165 000 FCFA / an',
    curriculum:[
      'HTML/CSS/JavaScript ES6+ & TypeScript',
      'React.js & Vue.js (SPA modernes)',
      'Laravel & Node.js (Backend & APIs REST)',
      'Flutter (Mobile iOS & Android)',
      'Bases de données & Intégration API',
      'DevOps & Déploiement Cloud (CI/CD)',
    ],
    img:'/caroursel_isi_suptech_soutenace.jpg',
    meta:'Le + polyvalent · Débouchés immédiats',
  },
  {
    id:6, code:'GL', color:'amber', icon:GitBranch,
    nom:'Génie Logiciel',
    desc:'Méthodes Agile & Scrum, DevOps, architecture microservices, containerisation Docker/K8s et assurance qualité logicielle avancée.',
    skills:['Agile/Scrum','Docker','Kubernetes','CI/CD','Git','TDD'],
    duree:'2 à 3 ans', certifs:['Scrum Master','AWS DevOps','Docker Certified'],
    formateur:'M. Robert — Architecte Logiciel',
    frais:'165 000 FCFA / an',
    curriculum:[
      'Génie logiciel & Patterns de conception',
      'Méthodes Agile, Scrum & Kanban',
      'Git avancé & GitFlow',
      'Docker, Kubernetes & Containerisation',
      'CI/CD avec GitHub Actions & Jenkins',
      'Tests automatisés (TDD, BDD) & Qualité',
    ],
    img:'/etudant_farda.jpeg',
    meta:'DevOps & Qualité · Architecture moderne',
  },
]

// ─── Tech animated background ─────────────────────────────────────────────────
const WORDS = ['<html/>','{ }','01001','import','SELECT *','git push','TCP/IP','const =>','docker run','0xFF','BASE64','ssh root@','VLAN 10','ping 8.8.8','npm run','def model()','</>','[*]']
function TechBg({ isDark }) {
  const items = useMemo(() => WORDS.map((w, i) => ({ w, x: 5 + (i * 47) % 90, y: 5 + (i * 31) % 88, dur: 4 + (i % 4), delay: i * 0.4 })), [])
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div style={{ backgroundImage:`radial-gradient(circle,${isDark?'rgba(139,92,246,0.18)':'rgba(99,102,241,0.18)'} 1px,transparent 1px)`,backgroundSize:'40px 40px' }} className="absolute inset-0"/>
      <div className={`absolute -top-48 -left-48 w-[700px] h-[700px] rounded-full blur-3xl ${isDark?'bg-brand-700/10':'bg-indigo-300/20'}`}/>
      <div className={`absolute -bottom-48 -right-48 w-[700px] h-[700px] rounded-full blur-3xl ${isDark?'bg-cyan-800/8':'bg-blue-200/25'}`}/>
      {items.map(({ w, x, y, dur, delay }, i) => (
        <motion.span key={i} className={`absolute text-[11px] font-mono select-none ${isDark?'text-cyan-400/30':'text-brand-600/40'}`}
          style={{ left:`${x}%`, top:`${y}%` }}
          animate={{ y:[0,-16,0], opacity:[0.45,0.9,0.45] }}
          transition={{ duration:dur, repeat:Infinity, delay, ease:'easeInOut' }}>
          {w}
        </motion.span>
      ))}
    </div>
  )
}

// ─── Formation card with hover overlay ───────────────────────────────────────
function FormationCard({ f, onOpen }) {
  const [hovered, setHovered] = useState(false)
  const c = CM[f.color] || CM.blue
  const Icon = f.icon

  return (
    <motion.div
      initial={{ opacity:0, y:40 }}
      whileInView={{ opacity:1, y:0, transition:{ duration:0.6 } }}
      viewport={{ once:true }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onOpen(f)}
      className={`relative h-[520px] rounded-3xl overflow-hidden cursor-pointer shadow-2xl shadow-black/30 transition-all duration-500 ring-2 ring-transparent hover:${c.ring} hover:shadow-2xl hover:${c.glow}`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${c.g}`}/>

      {/* Animated dot pattern */}
      <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.15) 1px,transparent 1px)',backgroundSize:'28px 28px'}}/>

      {/* Pulsing glow top-right */}
      <motion.div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/15 blur-3xl"
        animate={{ scale:[1,1.25,1], opacity:[0.4,0.7,0.4] }}
        transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}/>

      {/* ── BASE CONTENT ── */}
      <motion.div animate={{ opacity: hovered ? 0 : 1, scale: hovered ? 0.96 : 1 }}
        transition={{ duration:0.3 }}
        className="absolute inset-0 p-8 flex flex-col justify-between z-10">
        <div>
          {/* Code badge + meta */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 px-3 py-1 bg-black/25 border border-white/20 rounded-xl text-white/70 text-xs font-black tracking-widest">
              <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse"/>
              {f.code}
            </div>
            <span className="text-[10px] font-bold text-white/50 bg-black/20 px-2 py-1 rounded-lg border border-white/10">{f.meta}</span>
          </div>

          {/* Icon */}
          <motion.div
            animate={{ rotate: hovered ? 0 : [0,5,-5,0] }}
            transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}
            className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center mb-6 shadow-xl">
            <Icon size={30} className="text-white"/>
          </motion.div>

          {/* Title + desc */}
          <h3 className="text-2xl font-black text-white leading-tight mb-3">{f.nom}</h3>
          <p className="text-white/65 text-sm leading-relaxed line-clamp-3">{f.desc}</p>
        </div>

        <div>
          {/* Skills */}
          <div className="flex flex-wrap gap-2 mb-5">
            {f.skills.slice(0,5).map((s,i) => (
              <span key={i} className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${c.b} ${c.t}`}>{s}</span>
            ))}
          </div>
          {/* Bottom CTA hint */}
          <div className="flex items-center gap-2 text-white/50 text-xs font-bold">
            <ChevronRight size={14} className="animate-pulse"/> Survolez pour voir le programme complet
          </div>
        </div>
      </motion.div>

      {/* ── HOVER OVERLAY ── */}
      <motion.div
        initial={{ y:'100%' }}
        animate={{ y: hovered ? 0 : '100%' }}
        transition={{ duration:0.42, ease:[0.76,0,0.24,1] }}
        className={`absolute inset-0 bg-gradient-to-br ${c.ov} backdrop-blur-sm z-20 p-8 flex flex-col justify-between`}>

        <div>
          {/* Header */}
          <div className="flex items-start gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 border border-white/25">
              <Icon size={20} className="text-white"/>
            </div>
            <div>
              <h3 className="text-base font-black text-white leading-tight">{f.nom}</h3>
              <span className={`text-xs font-bold ${c.t}`}>{f.duree} • {f.certifs[0]}</span>
            </div>
          </div>

          {/* Curriculum */}
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/35 mb-3">Programme de formation</p>
            <div className="space-y-2">
              {f.curriculum.map((m, i) => (
                <motion.div key={i} className="flex items-start gap-2.5"
                  initial={{ x:-10, opacity:0 }}
                  animate={hovered ? { x:0, opacity:1 } : {}}
                  transition={{ delay: 0.05 + i * 0.07 }}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border ${c.b}`}>
                    <CheckCircle2 size={9} className={c.t}/>
                  </div>
                  <span className="text-xs text-white/75 leading-snug">{m}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div>
          {/* Certifications */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {f.certifs.map((cert,i) => (
              <span key={i} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-300">
                <Award size={9}/> {cert}
              </span>
            ))}
          </div>

          {/* Formateur + Prix */}
          <div className={`flex items-center justify-between mb-4 px-3 py-2.5 rounded-xl border bg-white/5 ${c.b}`}>
            <div>
              <p className="text-[9px] text-white/35 font-black uppercase tracking-widest">Formateur</p>
              <p className="text-xs font-bold text-white">{f.formateur}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-white/35 font-black uppercase tracking-widest">Frais</p>
              <p className={`text-xs font-black ${c.t}`}>{f.frais}</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Link to="/pre-inscription" onClick={e=>e.stopPropagation()}
              className="flex-1 bg-white text-slate-900 font-black text-sm py-3 rounded-xl text-center hover:bg-brand-50 transition-colors shadow-xl">
              S'inscrire <ArrowRight size={14} className="inline ml-1"/>
            </Link>
            <button onClick={()=>onOpen(f)}
              className="flex-1 bg-white/12 border border-white/25 text-white font-bold text-sm py-3 rounded-xl hover:bg-white/22 transition-colors">
              Détails
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Detail modal ─────────────────────────────────────────────────────────────
function DetailModal({ f, onClose, isDark }) {
  useEffect(() => { document.body.style.overflow = f ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [f])
  if (!f) return null
  const c = CM[f.color] || CM.blue; const Icon = f.icon
  return (
    <AnimatePresence>
      {f && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl"/>
          <motion.div initial={{ scale:0.88, opacity:0, y:30 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.88, opacity:0 }}
            transition={{ type:'spring', damping:22, stiffness:280 }}
            className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl" onClick={e=>e.stopPropagation()}>

            {/* Header */}
            <div className={`bg-gradient-to-br ${c.g} p-8 relative`}>
              <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/25 flex items-center justify-center hover:bg-black/40 transition-colors"><X size={16} className="text-white"/></button>
              <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.08) 1px,transparent 1px)',backgroundSize:'24px 24px'}}/>
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 bg-black/20 border border-white/20 rounded-full text-white/70 text-xs font-black tracking-widest mb-4">{f.code} • {f.meta}</span>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shadow-xl flex-shrink-0"><Icon size={28} className="text-white"/></div>
                  <div>
                    <h2 className="text-2xl font-black text-white">{f.nom}</h2>
                    <p className={`text-sm font-bold ${c.t} mt-1`}>{f.duree} • {f.formateur}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className={`p-8 ${isDark?'bg-[#0c0c20]':'bg-white'}`}>
              <p className={`text-sm leading-relaxed mb-6 ${isDark?'text-white/60':'text-slate-600'}`}>{f.desc}</p>

              {/* Curriculum */}
              <div className="mb-6">
                <h4 className={`text-xs font-black uppercase tracking-widest mb-4 ${isDark?'text-white/35':'text-slate-400'}`}>Programme de formation</h4>
                <div className="space-y-2">
                  {f.curriculum.map((m,i)=>(
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${isDark?'bg-white/3 border border-white/6':'bg-slate-50 border border-slate-100'}`}>
                      <CheckCircle2 size={16} className={`${c.t} mt-0.5 flex-shrink-0`}/>
                      <span className={`text-sm ${isDark?'text-white/70':'text-slate-700'}`}>{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="mb-6">
                <h4 className={`text-xs font-black uppercase tracking-widest mb-3 ${isDark?'text-white/35':'text-slate-400'}`}>Compétences acquises</h4>
                <div className="flex flex-wrap gap-2">
                  {f.skills.map((s,i)=><span key={i} className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${isDark?`${c.b} ${c.t}`:'bg-slate-100 border-slate-200 text-slate-700'}`}>{s}</span>)}
                </div>
              </div>

              {/* Certifications */}
              <div className="mb-6">
                <h4 className={`text-xs font-black uppercase tracking-widest mb-3 ${isDark?'text-white/35':'text-slate-400'}`}>Certifications</h4>
                <div className="flex flex-wrap gap-2">
                  {f.certifs.map((cert,i)=>(
                    <span key={i} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-600">
                      <Award size={12}/> {cert}
                    </span>
                  ))}
                </div>
              </div>

              {/* Frais + CTA */}
              <div className={`p-5 rounded-2xl border mb-6 ${isDark?'bg-white/3 border-white/8':'bg-brand-50/50 border-brand-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div><p className={`text-xs font-black uppercase tracking-widest ${isDark?'text-white/30':'text-slate-400'}`}>Frais annuels</p><p className={`text-xl font-black ${isDark?c.t:'text-brand-700'}`}>{f.frais}</p></div>
                  <div><p className={`text-xs font-black uppercase tracking-widest ${isDark?'text-white/30':'text-slate-400'}`}>Durée</p><p className={`text-base font-black ${isDark?'text-white':'text-slate-800'}`}>{f.duree}</p></div>
                </div>
                <Link to="/pre-inscription" onClick={onClose} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-base shadow-lg shadow-brand-500/30">
                  <GraduationCap size={18}/> S'inscrire dans cette filière <ArrowRight size={16}/>
                </Link>
              </div>

              <button onClick={onClose} className={`w-full py-3 rounded-xl text-sm font-bold border transition-colors ${isDark?'border-white/10 text-white/40 hover:bg-white/5':'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                Fermer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Formations() {
  const [isDark, setDark] = useState(() => localStorage.getItem('isi_theme') === 'dark')
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => { localStorage.setItem('isi_theme', isDark ? 'dark' : 'light') }, [isDark])

  const D = isDark
  const tx  = D ? 'text-white'    : 'text-slate-900'
  const txs = D ? 'text-white/60' : 'text-slate-500'

  const filtered = filter === 'all' ? FORMATIONS : FORMATIONS.filter(f => f.color === filter)

  const FILTERS = [
    { key:'all',     label:'Toutes les filières', count:6 },
    { key:'blue',    label:'Informatique',         count:1 },
    { key:'cyan',    label:'Réseaux',              count:1 },
    { key:'violet',  label:'Intelligence Artificielle', count:1 },
    { key:'red',     label:'Cybersécurité',        count:1 },
    { key:'emerald', label:'Développement',        count:1 },
    { key:'amber',   label:'Génie Logiciel',       count:1 },
  ]

  return (
    <div className={`min-h-screen relative ${D?'bg-[#080812]':'bg-slate-50'}`}>
      <TechBg isDark={D}/>

      {/* Theme toggle */}
      <motion.button whileTap={{ scale:0.9 }} onClick={() => setDark(d=>!d)}
        className={`fixed bottom-6 right-6 z-[100] w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${D?'bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 hover:bg-white/15':'bg-slate-900 text-amber-300 hover:bg-slate-800'}`}>
        {D ? <Sun size={20}/> : <Moon size={20}/>}
      </motion.button>

      <Navbar/>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-28 pb-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          {/* Back */}
          <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} className="flex justify-center mb-8">
            <Link to="/" className={`inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl border transition-all ${D?'border-white/15 text-white/60 hover:text-white hover:bg-white/8':'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-white'}`}>
              <ArrowLeft size={14}/> Retour à l'accueil
            </Link>
          </motion.div>

          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold mb-6 border ${D?'bg-brand-500/10 border-brand-500/25 text-brand-300':'bg-brand-50 border-brand-200 text-brand-700'}`}>
            <BookOpen size={14}/> Institut Supérieur en Informatique
          </motion.div>

          <motion.h1 initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
            className={`text-5xl sm:text-6xl md:text-7xl font-black mb-6 leading-[1.05] ${tx}`}>
            Nos <span className={D?'gradient-text':'gradient-text-light'}>formations</span><br/>d'excellence
          </motion.h1>

          <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
            className={`text-lg max-w-2xl mx-auto mb-10 leading-relaxed ${txs}`}>
            6 filières professionnelles avec certifications officielles reconnues. Survolez chaque carte pour découvrir le programme complet, les certifications et les débouchés.
          </motion.p>

          {/* Stats */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
            className="flex flex-wrap justify-center gap-6">
            {[
              { Icon:BookOpen,    v:'6',    l:'Filières' },
              { Icon:Award,       v:'15+',  l:'Certifications' },
              { Icon:Users,       v:'2500+',l:'Diplômés' },
              { Icon:Star,        v:'95%',  l:'Insertion pro' },
            ].map(({ Icon,v,l },i) => (
              <div key={i} className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${D?'bg-white/4 border-white/8':'bg-white border-slate-200 shadow-sm'}`}>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-white"/>
                </div>
                <div>
                  <div className={`text-xl font-black leading-tight ${tx}`}>{v}</div>
                  <div className={`text-[11px] font-medium ${txs}`}>{l}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FILTER TABS ───────────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 pb-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            {FILTERS.map(({ key, label, count }) => (
              <motion.button key={key} whileTap={{ scale:0.95 }} onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${filter === key
                  ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-500/30'
                  : D ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600 shadow-sm'
                }`}>
                {label}
                {key === 'all' && <span className={`ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-full ${filter==='all'?'bg-white/20':'bg-brand-500/20 text-brand-400'}`}>{count}</span>}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORMATIONS GRID ───────────────────────────────────────────────── */}
      <section className="relative z-10 py-8 px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="popLayout">
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((f, i) => (
                <motion.div key={f.id} layout
                  initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }}
                  transition={{ delay: i * 0.07 }}>
                  <FormationCard f={f} onOpen={setSelected}/>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── CTA SECTION ───────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-4">
        <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          className={`max-w-4xl mx-auto relative overflow-hidden rounded-3xl p-12 text-center shadow-2xl ${D?'shadow-black/40':'shadow-brand-200/60'}`}>
          {/* BG */}
          {D ? (
            <><div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-brand-900/80 to-slate-950"/>
            <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.3) 0%, transparent 60%)'}}/>
            <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(ellipse at 70% 50%, rgba(6,182,212,0.2) 0%, transparent 60%)'}}/>
            </>
          ) : (
            <><div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-600 to-cyan-700"/>
            <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.08) 1px,transparent 1px)',backgroundSize:'24px 24px'}}/>
            </>
          )}
          <div className="relative z-10">
            <GraduationCap size={52} className="mx-auto mb-6 text-white/80"/>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Vous avez trouvé votre filière ?</h2>
            <p className="text-white/65 text-base mb-8 max-w-xl mx-auto">Déposez votre dossier de pré-inscription en moins de 5 minutes. Notre équipe vous répond sous 48h ouvrées.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/pre-inscription" className="inline-flex items-center gap-2 bg-white text-brand-800 font-black text-base px-8 py-4 rounded-2xl hover:bg-brand-50 transition-colors shadow-xl">
                <GraduationCap size={20}/> Pré-inscription gratuite <ArrowRight size={16}/>
              </Link>
              <Link to="/#campus" className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-bold text-base px-8 py-4 rounded-2xl hover:bg-white/10 transition-colors">
                Voir le campus <Play size={14}/>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Detail modal */}
      <DetailModal f={selected} onClose={() => setSelected(null)} isDark={D}/>
    </div>
  )
}
