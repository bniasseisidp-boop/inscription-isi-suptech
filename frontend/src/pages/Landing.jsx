import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  X, ChevronDown, ArrowRight, Send, ChevronRight, ChevronLeft,
  Moon, Sun, Quote, MapPin, Phone, Mail, Globe, ExternalLink,
  Star, Play, Pause, Cpu, Network, Brain, Shield, Code2, GitBranch,
  Database, Building, CreditCard, UserCheck, Wrench, Server,
  Award, Zap, Lock, Users, GraduationCap, BookOpen,
  TrendingUp, Clock, CheckCircle2, Camera, Image as ImageIcon,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import {
  getPublicStudents, getFilieres, getFormateurs, getMembresAdmins,
  getPartenaires, getTemoignages, submitTemoignage, subscribeNewsletter,
} from '../services/api'

// ─── Social icons ─────────────────────────────────────────────────────────────
const SOCIALS = [
  { key:'facebook',  I: ({s})=><svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg> },
  { key:'instagram', I: ({s})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg> },
  { key:'tiktok',   I: ({s})=><svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.77.08 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 106.34 6.34V8.69a8.19 8.19 0 004.79 1.53V6.78a4.85 4.85 0 01-1.02-.09z"/></svg> },
  { key:'youtube',  I: ({s})=><svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg> },
  { key:'linkedin', I: ({s})=><svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg> },
]

// ─── Static data ──────────────────────────────────────────────────────────────
const SLIDES = [
  { img:'/Etudiant_gestion.jpeg',               titre:'Gestion & Excellence',    sous:'Des outils numériques modernes pour une administration académique efficace.' },
  { img:'/caroursel_isi_suptech_soutenace.jpg', titre:'Soutenances & Diplômes',  sous:'Nos diplômés défendent leurs projets devant des jurys professionnels.' },
  { img:'/etudant_farda.jpeg',                  titre:'Talents en Action',       sous:'Une communauté vivante qui façonne le numérique africain de demain.' },
  { img:'/kara_directeur.jpg',                  titre:'Direction Visionnaire',   sous:'Un leadership expert au service de l\'excellence académique et professionnelle.' },
  { img:'/mr_robert.jpeg',                      titre:'Corps Enseignant Expert', sous:'Des formateurs passionnés issus du terrain pour une pédagogie au sommet.' },
]

const PARTENAIRES = [
  { nom:'3FPT',        logo:'/3FPT.png',        tag:'Financement',    desc:'Fonds de Financement de la Formation Pro & Technique. Soutient nos programmes avec des bourses et co-financements officiels.' },
  { nom:'AWS Academy', logo:'/aws-academy.png', tag:'Cloud & Certif', desc:'Programme Amazon Web Services. Nos étudiants obtiennent des certifications Cloud officielles reconnues mondialement.' },
  { nom:'CAMES',       logo:'/cames_logo.png',  tag:'Accréditation',  desc:'Conseil Africain et Malgache pour l\'Enseignement Supérieur. Garantit la reconnaissance officielle de tous nos diplômes.' },
  { nom:'Cisco',       logo:'/cisco.png',        tag:'Réseaux & CCNA', desc:'Cisco Networking Academy. Certifications CCNA et CyberOps accessibles directement depuis le campus ISI SUPTECH.' },
  { nom:'Demdik',      logo:'/demdik.jpeg',      tag:'Emploi & Stages',desc:'Partenaire local de transformation digitale au Sénégal. Stages et recrutements pour nos diplômés.' },
  { nom:'Huawei',      logo:'/huawei.png',       tag:'ICT & 5G',       desc:'Huawei ICT Academy. Formation et certifications : Cloud, 5G, datacenter et infrastructure réseau.' },
  { nom:'ANAQ',        logo:'/logo_anaq.png',    tag:'Qualité',        desc:'Autorité Nationale d\'Assurance Qualité. Certifie l\'excellence et la rigueur académique de l\'ISI SUPTECH.' },
  { nom:'ONFP',        logo:'/onfp.png',         tag:'Formation Pro',  desc:'Office National de la Formation Professionnelle. Reconnaît officiellement nos certifications techniques.' },
]

const FORMATEURS = [
  { nom:'Cissé',  prenom:'Mr', photo:'/cisse.jpeg',     role:'Formateur • Coach Cisco', specialite:'Réseaux & Infrastructure', icon:Network, skills:['Cisco CCNA','VLAN','TCP/IP','Wireless'], desc:'Expert en architecture réseau et protocoles TCP/IP. Coach certifié Cisco CCNA — il accompagne les étudiants jusqu\'à la certification officielle.' },
  { nom:'Junior', prenom:'Mr', photo:'/junior.jpeg',    role:'Formateur • Pentester',   specialite:'Cybersécurité',            icon:Shield,  skills:['Pentest','CTF','Forensics','SIEM'],    desc:'Spécialiste sécurité offensive et défensive. Anime des CTF, forme au pentesting, forensique numérique et réponse aux incidents.' },
  { nom:'Robert', prenom:'Mr', photo:'/mr_robert.jpeg', role:'Formateur • Dev Full-Stack',specialite:'Développement Web & Mobile',icon:Code2, skills:['React','Laravel','Flutter','Node.js'],desc:'Développeur full-stack passionné. Enseigne React, Laravel, Flutter et Node.js. Mentor de projets innovants et startups étudiantes.' },
]

const MEMBRES = [
  { nom:'Kara',        photo:'/kara_directeur.jpg', poste:'Directeur Général',   specialite:'Formateur Analyse & BDD', icon:Building,    skills:['Oracle','MySQL','Merise','UML'],         desc:'Dirige l\'ISI SUPTECH avec vision et excellence. Formateur expert en analyse de systèmes d\'information et bases de données.',    grad:'from-violet-700 to-brand-600' },
  { nom:'Oumoukhairy', photo:'/oumoukhairy.jpg',    poste:'Caissière',           specialite:'Gestion financière',      icon:CreditCard,  skills:['Wave','Orange Money','Reçus PDF','Suivi'],desc:'Gère avec rigueur les paiements et le suivi financier. Disponible et souriante pour faciliter chaque démarche.',                  grad:'from-cyan-700 to-teal-600' },
  { nom:'Mbetne Tall', photo:'/mbene-tall.jpg',     poste:'Agent d\'Accueil',    specialite:'Relations & Orientation', icon:UserCheck,   skills:['Orientation','Dossiers','Planning','Support'],desc:'Premier visage de l\'ISI SUPTECH. Oriente et accompagne chaque étudiant et parent avec bienveillance.',                        grad:'from-blue-700 to-cyan-600' },
  { nom:'Samba',       photo:'/samba.jpg',           poste:'Technicien IT',       specialite:'Support & Infrastructure', icon:Wrench,      skills:['Maintenance','Réseau LAN','Serveurs','Support'],desc:'Maintient l\'infrastructure du campus. Gère les équipements, le réseau LAN, les serveurs et fournit un support rapide.',       grad:'from-amber-700 to-orange-600' },
]

const FILIERES = [
  { id:1, code:'INFO',  nom:'Informatique & Systèmes',       icon:Cpu,        color:'blue',    desc:'Systèmes d\'info, bases de données, programmation et architecture logicielle.',      skills:['Python','Java','SQL','OS'],
    curriculum:['Algorithmique & Programmation','Bases de données (SQL, Oracle)','Architecture des systèmes','Développement d\'applications','Analyse & Conception UML'],
    duree:'2-3 ans', certifs:['Oracle Certified','Microsoft MTA'], meta:'Fondamentaux IT · Très demandé' },
  { id:2, code:'RT',    nom:'Réseaux & Télécommunications',  icon:Network,    color:'cyan',    desc:'Infrastructure réseau, protocoles, sécurité des communications et cloud computing.', skills:['Cisco','CCNA','WiFi','5G'],
    curriculum:['Fondamentaux TCP/IP','Routage & Commutation CCNA','Infrastructure WiFi & 5G','Cloud Networking AWS','Sécurité & Supervision réseau'],
    duree:'2-3 ans', certifs:['Cisco CCNA','Huawei HCIA'], meta:'Cisco Academy · Certif officielle' },
  { id:3, code:'IA',    nom:'Intelligence Artificielle',     icon:Brain,      color:'violet',  desc:'Machine learning, deep learning, traitement du langage naturel et vision par ordi.', skills:['Python','TensorFlow','NLP','CV'],
    curriculum:['Mathématiques pour l\'IA','Machine Learning (Scikit-learn)','Deep Learning TensorFlow/Keras','NLP & Traitement du texte','Computer Vision & Projets IA'],
    duree:'2-3 ans', certifs:['AWS ML Specialty','Google AI Certificate'], meta:'Filière du futur · Très haute valeur' },
  { id:4, code:'CYBER', nom:'Cybersécurité',                 icon:Shield,     color:'red',     desc:'Sécurité offensive/défensive, audit, forensique numérique et gestion des risques.',  skills:['Pentest','CTF','SIEM','Kali'],
    curriculum:['Fondamentaux cybersécurité','Tests de pénétration Kali Linux','Forensique numérique','OSINT & Threat Intelligence','Audit & Conformité RGPD'],
    duree:'2-3 ans', certifs:['CEH','CompTIA Security+'], meta:'Forte demande · Certifs reconnues' },
  { id:5, code:'DWM',   nom:'Développement Web & Mobile',    icon:Code2,      color:'emerald', desc:'Applications web modernes, mobile natif et cross-platform, UX/UI design avancé.',    skills:['React','Laravel','Flutter','Node'],
    curriculum:['JavaScript ES6+ & TypeScript','React.js & Vue.js (Frontend)','Laravel & Node.js Backend','Flutter Mobile iOS/Android','DevOps & Déploiement Cloud'],
    duree:'2-3 ans', certifs:['Meta Front-End','AWS Developer'], meta:'Le + polyvalent · Débouchés immédiats' },
  { id:6, code:'GL',    nom:'Génie Logiciel',                icon:GitBranch,  color:'amber',   desc:'Méthodes Agile, DevOps, architecture microservices et assurance qualité logicielle.', skills:['Agile','Docker','CI/CD','Git'],
    curriculum:['Méthodes Agile & Scrum','Docker & Kubernetes','CI/CD GitHub Actions','Tests automatisés TDD','Architecture microservices'],
    duree:'2-3 ans', certifs:['Scrum Master','Docker Certified'], meta:'DevOps & Qualité · Architecture' },
]

const CM = {
  blue:   { g:'from-blue-600 to-blue-400',    t:'text-blue-400',    b:'bg-blue-500/15 border-blue-500/25' },
  cyan:   { g:'from-cyan-600 to-cyan-400',    t:'text-cyan-400',    b:'bg-cyan-500/15 border-cyan-500/25' },
  violet: { g:'from-violet-600 to-violet-400',t:'text-violet-400',  b:'bg-violet-500/15 border-violet-500/25' },
  red:    { g:'from-red-600 to-red-400',      t:'text-red-400',     b:'bg-red-500/15 border-red-500/25' },
  emerald:{ g:'from-emerald-600 to-emerald-400',t:'text-emerald-400',b:'bg-emerald-500/15 border-emerald-500/25' },
  amber:  { g:'from-amber-600 to-amber-400',  t:'text-amber-400',   b:'bg-amber-500/15 border-amber-500/25' },
}

const GALLERY = [
  { img:'/Etudiant_gestion.jpeg',               span:'col-span-2 row-span-2', label:'Gestion académique' },
  { img:'/caroursel_isi_suptech_soutenace.jpg', span:'col-span-1 row-span-1', label:'Soutenances' },
  { img:'/etudant_farda.jpeg',                  span:'col-span-1 row-span-1', label:'Étudiants' },
]

const CAMPUS_SHOTS = [
  { img:'/Etudiant_gestion.jpeg',               label:'Laboratoire',  tag:'Informatique' },
  { img:'/caroursel_isi_suptech_soutenace.jpg', label:'Soutenance',   tag:'Diplômes' },
  { img:'/etudant_farda.jpeg',                  label:'Ateliers',     tag:'Pratique' },
]

const WORDS = ['<html/>','{ }','01001','import','SELECT *','git push','TCP/IP','const =>','#!/bin/sh','docker run','0xFF','BASE64','ssh root@','VLAN 10','ping 8.8.8','npm run','def model()']

// ─── Tech BG ─────────────────────────────────────────────────────────────────
function TechBg({ isDark }) {
  const items = useMemo(() => WORDS.map((w, i) => ({ w, x: 5 + (i * 47) % 90, y: 5 + (i * 31) % 88, dur: 4 + (i % 4), delay: i * 0.38 })), [])
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

// ─── Filières animated background ─────────────────────────────────────────────
function FilieresBg({ isDark }) {
  const nodes = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    x: 5 + (i * 83) % 88, y: 8 + (i * 61) % 82,
    dur: 3 + (i % 3) * 1.5, delay: i * 0.45
  })), [])
  const links = [[0,3],[1,4],[2,5],[3,6],[4,7],[5,8],[6,9],[7,1],[8,2],[9,0]]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className={`absolute inset-0 ${isDark
        ? 'bg-gradient-to-br from-[#07071e] via-[#0a0a2e]/80 to-[#05050f]'
        : 'bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/80'
      }`}/>
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: isDark ? 0.09 : 0.08 }}>
        <defs>
          <pattern id="hexfil" x="0" y="0" width="80" height="70" patternUnits="userSpaceOnUse">
            <polygon points="40,2 74,20 74,56 40,70 6,56 6,20" fill="none"
              stroke={isDark ? '#818cf8' : '#4f46e5'} strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexfil)"/>
      </svg>
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {links.map(([a, b], i) => (
          <motion.line key={i}
            x1={`${nodes[a].x}%`} y1={`${nodes[a].y}%`}
            x2={`${nodes[b].x}%`} y2={`${nodes[b].y}%`}
            stroke={isDark ? 'rgba(99,102,241,0.22)' : 'rgba(79,70,229,0.15)'}
            strokeWidth="1" strokeDasharray="4 8"
            animate={{ opacity: [0, 0.9, 0.9, 0] }}
            transition={{ duration: 5 + i * 0.3, repeat: Infinity, delay: i * 0.7, ease: 'easeInOut' }}
          />
        ))}
      </svg>
      {nodes.map((n, i) => (
        <motion.div key={i} className={`absolute rounded-full ${isDark ? 'bg-brand-400' : 'bg-brand-500'}`}
          style={{ left: `${n.x}%`, top: `${n.y}%`, width: 6, height: 6, marginLeft: -3, marginTop: -3 }}
          animate={{ scale: [1, 2.2, 1], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: n.dur, repeat: Infinity, delay: n.delay, ease: 'easeInOut' }}
        />
      ))}
      <motion.div className={`absolute left-0 right-0 h-px ${isDark
        ? 'bg-gradient-to-r from-transparent via-brand-500/25 to-transparent'
        : 'bg-gradient-to-r from-transparent via-brand-400/20 to-transparent'
      }`}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />
      <div className={`absolute rounded-full blur-3xl ${isDark ? 'bg-brand-600/8' : 'bg-indigo-300/15'}`}
        style={{ top: '-10%', right: '-5%', width: 600, height: 600, transform: 'translate(30%,-30%)' }}/>
      <div className={`absolute rounded-full blur-3xl ${isDark ? 'bg-cyan-600/6' : 'bg-blue-300/12'}`}
        style={{ bottom: '-10%', left: '-5%', width: 600, height: 600, transform: 'translate(-30%,30%)' }}/>
    </div>
  )
}

// ─── Formateurs animated background ──────────────────────────────────────────
function FormateursBg({ isDark }) {
  const particles = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    x: 2 + (i * 53) % 96, y: 2 + (i * 41) % 96, sz: 3 + (i % 4),
    dur: 3 + (i % 5) * 1.1, delay: i * 0.32
  })), [])
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className={`absolute inset-0 ${isDark
        ? 'bg-gradient-to-br from-[#080814] via-[#0b0a22]/90 to-[#060610]'
        : 'bg-gradient-to-br from-slate-100/95 via-indigo-50/80 to-slate-50'
      }`}/>
      {/* Large glow orbs */}
      <motion.div className={`absolute rounded-full blur-3xl ${isDark?'bg-brand-600/18':'bg-indigo-300/50'}`}
        style={{top:'10%',left:'-5%',width:500,height:500}}
        animate={{scale:[1,1.25,1],opacity:[0.5,1,0.5],y:[0,-20,0]}}
        transition={{duration:8,repeat:Infinity,ease:'easeInOut'}}/>
      <motion.div className={`absolute rounded-full blur-3xl ${isDark?'bg-cyan-600/14':'bg-cyan-200/60'}`}
        style={{bottom:'5%',right:'-5%',width:420,height:420}}
        animate={{scale:[1,1.3,1],opacity:[0.4,0.9,0.4],y:[0,15,0]}}
        transition={{duration:9,repeat:Infinity,delay:2,ease:'easeInOut'}}/>
      <motion.div className={`absolute rounded-full blur-3xl ${isDark?'bg-violet-600/10':'bg-violet-200/40'}`}
        style={{top:'40%',left:'45%',width:300,height:300,marginLeft:-150,marginTop:-150}}
        animate={{scale:[1,1.4,1],opacity:[0.3,0.7,0.3]}}
        transition={{duration:7,repeat:Infinity,delay:1,ease:'easeInOut'}}/>
      {/* Particles */}
      {particles.map((p, i) => (
        <motion.div key={i}
          className={`absolute rounded-full ${isDark?'bg-brand-400/45':'bg-brand-500/25'}`}
          style={{left:`${p.x}%`,top:`${p.y}%`,width:p.sz,height:p.sz,marginLeft:-p.sz/2,marginTop:-p.sz/2}}
          animate={{scale:[1,3.5,1],opacity:[0.1,0.6,0.1]}}
          transition={{duration:p.dur,repeat:Infinity,delay:p.delay,ease:'easeInOut'}}/>
      ))}
      {/* Scan line */}
      <motion.div className={`absolute left-0 right-0 h-px ${isDark
        ?'bg-gradient-to-r from-transparent via-brand-400/25 to-transparent'
        :'bg-gradient-to-r from-transparent via-brand-400/18 to-transparent'
      }`} animate={{top:['0%','100%']}} transition={{duration:12,repeat:Infinity,ease:'linear'}}/>
    </div>
  )
}

// ─── Membres animated background ─────────────────────────────────────────────
function MembresBg({ isDark }) {
  const orbs = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    x: 5 + (i * 67) % 88, y: 8 + (i * 43) % 82,
    size: 220 + (i * 55) % 280, dur: 6 + (i % 4) * 2, delay: i * 0.8
  })), [])
  const dots = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    x: 3 + (i * 59) % 94, y: 4 + (i * 71) % 92, dur: 3.5 + (i % 5), delay: i * 0.38
  })), [])
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className={`absolute inset-0 ${isDark
        ? 'bg-gradient-to-br from-[#050510] via-[#06061a] to-[#030308]'
        : 'bg-white'
      }`}/>
      {/* Large animated orbs - much more visible */}
      {orbs.map((o, i) => (
        <motion.div key={i}
          className={`absolute rounded-full blur-3xl ${isDark
            ? i % 2 === 0 ? 'bg-cyan-500/20' : 'bg-brand-500/15'
            : i % 2 === 0 ? 'bg-cyan-400/20' : 'bg-brand-400/15'
          }`}
          style={{ left:`${o.x}%`, top:`${o.y}%`, width:o.size, height:o.size, marginLeft:-o.size/2, marginTop:-o.size/2 }}
          animate={{ scale:[1,1.4,1], opacity:[0.5,1,0.5], x:[0,20,-12,0], y:[0,-25,12,0] }}
          transition={{ duration:o.dur, repeat:Infinity, delay:o.delay, ease:'easeInOut' }}
        />
      ))}
      {/* Sparkle dots */}
      {dots.map((n, i) => (
        <motion.div key={i}
          className={`absolute rounded-full ${isDark ? 'bg-cyan-300/50' : 'bg-cyan-600/30'}`}
          style={{ left:`${n.x}%`, top:`${n.y}%`, width:4, height:4, marginLeft:-2, marginTop:-2 }}
          animate={{ scale:[1,3.2,1], opacity:[0.15,0.7,0.15] }}
          transition={{ duration:n.dur, repeat:Infinity, delay:n.delay, ease:'easeInOut' }}
        />
      ))}
      {/* Scan line */}
      <motion.div
        className={`absolute left-0 right-0 h-[1px] ${isDark
          ? 'bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent'
          : 'bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent'
        }`}
        animate={{ top:['0%','100%'] }}
        transition={{ duration:14, repeat:Infinity, ease:'linear' }}
      />
    </div>
  )
}

// ─── Campus photo strip (hero side panel) ────────────────────────────────────
function CampusStrip({ isDark }) {
  const [lightbox, setLightbox] = useState(null)
  const D = isDark
  return (
    <>
      <div className="hidden lg:flex flex-col gap-2 w-[88px] flex-shrink-0">
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-xl mb-0.5 ${D?'bg-white/5 border border-white/10':'bg-slate-100 border border-slate-200'}`}>
          <Camera size={10} className={D?'text-brand-400':'text-brand-600'}/>
          <span className={`text-[9px] font-black uppercase tracking-widest ${D?'text-white/50':'text-slate-500'}`}>Campus</span>
        </div>
        {CAMPUS_SHOTS.map((s, i) => (
          <motion.button key={i} onClick={() => setLightbox(s)}
            initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.5 + i*0.12 }}
            whileHover={{ scale:1.04, x:-3, transition:{ type:'spring', stiffness:260, damping:20 } }}
            className={`relative rounded-2xl overflow-hidden border-2 transition-colors group shadow-xl shadow-black/30 ${D?'border-white/10 hover:border-brand-400/70':'border-slate-200 hover:border-brand-400'}`}
            style={{ height:110 }}>
            <img src={s.img} alt={s.label} className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"/>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <ImageIcon size={12} className="text-white"/>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-1.5">
              <span className="text-[8px] text-white/90 font-black block leading-tight">{s.label}</span>
              <span className="text-[7px] text-brand-300/70 font-bold">{s.tag}</span>
            </div>
          </motion.button>
        ))}
        <p className={`text-[8px] text-center leading-tight mt-0.5 ${D?'text-white/20':'text-slate-400'}`}>Cliquez<br/>pour voir</p>
      </div>
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}>
            <div className="absolute inset-0 bg-black/82 backdrop-blur-xl"/>
            <motion.div initial={{ scale:0.85, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.85, opacity:0, y:20 }}
              transition={{ type:'spring', damping:22, stiffness:250 }}
              className="relative z-10 max-w-3xl w-full rounded-3xl overflow-hidden shadow-2xl shadow-black/60"
              onClick={e => e.stopPropagation()}>
              <img src={lightbox.img} alt={lightbox.label} className="w-full object-cover max-h-[80vh]"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent"/>
              <div className="absolute bottom-6 left-6">
                <span className="text-white font-black text-2xl">{lightbox.label}</span>
                <p className="text-white/55 text-sm mt-0.5">ISI SUPTECH — Campus Dakar</p>
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="bg-brand-600/85 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-black text-white">{lightbox.tag}</div>
                <button onClick={() => setLightbox(null)}
                  className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                  <X size={16}/>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Hero Carousel ────────────────────────────────────────────────────────────
function Carousel() {
  const [cur, setCur] = useState(0)
  const [dir, setDir] = useState(1)
  const [play, setPlay] = useState(true)
  useEffect(() => {
    if (!play) return
    const t = setInterval(() => { setDir(1); setCur(c => (c+1)%SLIDES.length) }, 5000)
    return () => clearInterval(t)
  }, [play])
  const go = i => { setDir(i>cur?1:-1); setCur(i); setPlay(false); setTimeout(()=>setPlay(true),8000) }
  const s = SLIDES[cur]
  return (
    <div className="relative w-full h-[540px] lg:h-[640px] rounded-3xl overflow-hidden shadow-2xl shadow-black/40 group">
      <AnimatePresence custom={dir} mode="popLayout">
        <motion.div key={cur} custom={dir}
          variants={{ enter:d=>({x:d>0?'100%':'-100%',scale:1.06,opacity:0}), center:{x:0,scale:1,opacity:1}, exit:d=>({x:d>0?'-100%':'100%',scale:0.96,opacity:0}) }}
          initial="enter" animate="center" exit="exit"
          transition={{ duration:0.8, ease:[0.76,0,0.24,1] }} className="absolute inset-0">
          <motion.img src={s.img} alt={s.titre} className="w-full h-full object-cover"
            initial={{scale:1.1}} animate={{scale:1}} transition={{duration:7,ease:'easeOut'}}/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"/>
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <motion.div initial={{y:22,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.35,duration:0.6}}>
              <div className="inline-flex items-center gap-2 bg-brand-500/25 backdrop-blur-sm border border-brand-400/30 rounded-full px-4 py-1.5 mb-3">
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"/><span className="text-brand-200 text-xs font-black uppercase tracking-widest">ISI SUPTECH</span>
              </div>
              <h3 className="text-3xl lg:text-4xl font-black text-white mb-2 drop-shadow-xl">{s.titre}</h3>
              <p className="text-white/60 text-sm max-w-md leading-relaxed">{s.sous}</p>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
      <button onClick={()=>go((cur-1+SLIDES.length)%SLIDES.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-brand-600/70 transition-all z-20"><ChevronLeft size={18}/></button>
      <button onClick={()=>go((cur+1)%SLIDES.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-brand-600/70 transition-all z-20"><ChevronRight size={18}/></button>
      <button onClick={()=>setPlay(p=>!p)} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-all z-20">{play?<Pause size={13}/>:<Play size={13}/>}</button>
      <div className="absolute bottom-3 right-6 flex items-center gap-2 z-20">
        {SLIDES.map((_,i)=><button key={i} onClick={()=>go(i)}><div className={`rounded-full transition-all duration-500 ${i===cur?'w-7 h-2.5 bg-brand-400':'w-2.5 h-2.5 bg-white/40'}`}/></button>)}
      </div>
      <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1 text-xs text-white/40 font-mono z-20">{String(cur+1).padStart(2,'0')}/{String(SLIDES.length).padStart(2,'0')}</div>
    </div>
  )
}

// ─── Counter ──────────────────────────────────────────────────────────────────
function Counter({ target, suffix='', label, icon: Icon, isDark }) {
  const [n, setN] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once:true })
  useEffect(() => {
    if (!inView) return
    let v=0; const end=parseInt(target); const step=Math.max(1,end/60)
    const t=setInterval(()=>{ v+=step; if(v>=end){setN(end);clearInterval(t)}else setN(Math.floor(v)) },25)
    return ()=>clearInterval(t)
  }, [inView, target])
  return (
    <motion.div ref={ref} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-center group">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/30 group-hover:scale-110 transition-transform duration-300">
        <Icon size={24} className="text-white"/>
      </div>
      <div className={`text-4xl md:text-5xl font-black mb-1 ${isDark?'text-white':'text-slate-900'}`}>{n.toLocaleString()}{suffix}</div>
      <div className={`text-sm font-medium ${isDark?'text-white/50':'text-slate-500'}`}>{label}</div>
    </motion.div>
  )
}

function Stars({ note, sz=14 }) {
  return <div className="flex gap-0.5">{[1,2,3,4,5].map(i=><Star key={i} size={sz} className={i<=note?'text-amber-400 fill-amber-400':'text-white/20'}/>)}</div>
}

function Overlay({ open, onClose, children }) {
  useEffect(()=>{ document.body.style.overflow=open?'hidden':''; return()=>{ document.body.style.overflow='' } },[open])
  return (
    <AnimatePresence>
      {open&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md"/>
        <motion.div initial={{scale:0.88,opacity:0,y:24}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.88,opacity:0}} transition={{type:'spring',damping:22,stiffness:280}}
          className="relative z-10 w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl" onClick={e=>e.stopPropagation()}>
          {children}
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  )
}

// ─── Filière card with hover curriculum ──────────────────────────────────────
function FCard({ f, openF, D }) {
  const [hovered, setHovered] = useState(false)
  const c = CM[f.color] || CM.blue
  const Icon = f.icon || Cpu
  return (
    <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={{y:-8,scale:1.02,transition:{type:'spring',stiffness:200,damping:20}}}
        whileTap={{scale:0.98}}
        onClick={() => openF(f)}
        className={`cursor-pointer rounded-2xl border h-full relative overflow-hidden transition-all duration-300 ${D
          ?'bg-white/[0.04] border-white/[0.08] hover:border-brand-500/40 hover:shadow-2xl hover:shadow-brand-500/10 hover:bg-white/[0.07]'
          :'bg-white border-slate-200 hover:border-brand-300 shadow-[0_2px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_40px_rgba(99,102,241,0.15)]'}`}>
        {/* Base content */}
        <motion.div
          animate={{ opacity: hovered ? 0 : 1, y: hovered ? -8 : 0 }}
          transition={{ duration: 0.22 }}
          className="p-6 flex flex-col h-full">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.g} flex items-center justify-center mb-5 shadow-lg`}>
            <Icon size={26} className="text-white"/>
          </div>
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className={`font-black text-base leading-tight flex-1 ${D?'text-white':'text-slate-900'}`}>{f.nom}</h3>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border flex-shrink-0 ${D?`${c.b} ${c.t}`:'bg-slate-100 border-slate-200 text-slate-500'}`}>{f.code}</span>
          </div>
          <p className={`text-xs leading-relaxed flex-1 mb-4 ${D?'text-white/60':'text-slate-500'}`}>{f.desc}</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(f.skills||[]).map((s,si)=><span key={si} className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${D?`${c.b} ${c.t}`:'bg-slate-50 border-slate-200 text-slate-600'}`}>{s}</span>)}
          </div>
          <div className={`text-xs font-bold flex items-center gap-1 ${D?'text-brand-400':'text-brand-600'}`}>
            Survolez pour le programme <ChevronRight size={13}/>
          </div>
        </motion.div>
        {/* Hover overlay with curriculum */}
        <motion.div
          initial={{ y:'100%', opacity:0 }}
          animate={{ y: hovered ? 0 : '100%', opacity: hovered ? 1 : 0 }}
          transition={{ duration:0.35, ease:[0.76,0,0.24,1] }}
          className={`absolute inset-0 z-20 p-6 flex flex-col justify-between bg-gradient-to-br ${c.g}`}>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30 flex-shrink-0">
                <Icon size={20} className="text-white"/>
              </div>
              <div>
                <p className="font-black text-white text-sm leading-tight">{f.nom}</p>
                <p className="text-white/60 text-[10px] mt-0.5">{f.duree||'2-3 ans'} · {(f.certifs||[])[0]||f.code}</p>
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Ce que vous apprendrez</p>
            <div className="space-y-2">
              {(f.curriculum||f.skills||[]).slice(0,5).map((item,idx)=>(
                <motion.div key={idx} className="flex items-start gap-2"
                  initial={{ x:-8, opacity:0 }}
                  animate={hovered ? { x:0, opacity:1 } : { x:-8, opacity:0 }}
                  transition={{ delay: 0.07 + idx * 0.07 }}>
                  <CheckCircle2 size={12} className="text-white/80 mt-0.5 flex-shrink-0"/>
                  <span className="text-xs text-white/85 leading-snug">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
          <div>
            {(f.certifs||[]).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(f.certifs||[]).map((cert,ci)=>(
                  <span key={ci} className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/15 border border-white/25 text-white">
                    <Award size={9}/> {cert}
                  </span>
                ))}
              </div>
            )}
            <button onClick={e=>{e.stopPropagation();openF(f)}}
              className="w-full bg-white/20 border border-white/30 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-white/35 transition-colors flex items-center justify-center gap-1.5">
              <GraduationCap size={13}/> Voir détails complets <ArrowRight size={12}/>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// ─── Partner card with hover reveal ──────────────────────────────────────────
function PCard({ p, isDark }) {
  const [h, setH] = useState(false)
  return (
    <motion.div whileHover={{y:-5}} onHoverStart={()=>setH(true)} onHoverEnd={()=>setH(false)}
      className={`relative h-36 rounded-2xl overflow-hidden border cursor-pointer transition-all duration-300 ${isDark?'bg-white/4 border-white/10 hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/15':'bg-white border-slate-200 hover:border-brand-300 shadow-sm hover:shadow-xl'}`}>
      {/* Front */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-4">
        <div className="h-10 flex items-center justify-center">
          <img src={p.logo} alt={p.nom} className={`max-h-10 max-w-[100px] object-contain ${isDark?'invert brightness-90':''}`} onError={e=>{e.target.style.display='none'}}/>
        </div>
        <span className={`text-xs font-bold text-center ${isDark?'text-white/50':'text-slate-600'}`}>{p.nom}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isDark?'bg-brand-500/10 border-brand-500/20 text-brand-400':'bg-brand-50 border-brand-200 text-brand-600'}`}>{p.tag}</span>
      </div>
      {/* Hover overlay */}
      <AnimatePresence>
        {h&&<motion.div initial={{opacity:0,y:'100%'}} animate={{opacity:1,y:0}} exit={{opacity:0,y:'100%'}} transition={{duration:0.26,ease:'easeOut'}}
          className={`absolute inset-0 flex flex-col justify-between p-4 ${isDark?'bg-space-800/97 backdrop-blur-sm':'bg-white/98 backdrop-blur-sm'}`}>
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className={`font-black text-sm leading-tight ${isDark?'text-white':'text-slate-900'}`}>{p.nom}</span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0 border ${isDark?'bg-brand-500/15 border-brand-500/25 text-brand-300':'bg-brand-50 border-brand-200 text-brand-600'}`}>{p.tag}</span>
            </div>
            <p className={`text-[11px] leading-relaxed ${isDark?'text-white/55':'text-slate-600'}`}>{p.desc}</p>
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-bold mt-1 ${isDark?'text-emerald-400':'text-emerald-600'}`}>
            <CheckCircle2 size={10}/> Partenaire officiel
          </div>
        </motion.div>}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Filière modal ────────────────────────────────────────────────────────────
function FModal({ f, onClose }) {
  if (!f) return null
  const c = CM[f.color] || CM.blue; const Icon = f.icon || Cpu
  return (
    <Overlay open={!!f} onClose={onClose}>
      <div className="bg-gradient-to-br from-space-800 to-space-950 border border-white/10 rounded-3xl overflow-hidden">
        <div className={`bg-gradient-to-r ${c.g} p-8 text-center relative`}>
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/40"><X size={16} className="text-white"/></button>
          <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center mx-auto mb-4 shadow-xl"><Icon size={32} className="text-white"/></div>
          <h3 className="text-2xl font-black text-white mb-2">{f.nom}</h3>
          <span className="inline-block px-4 py-1 bg-black/20 rounded-full text-white/80 text-xs font-mono font-black tracking-widest">{f.code}</span>
        </div>
        <div className="p-6">
          {f.desc && <p className="text-white/60 text-sm leading-relaxed mb-5">{f.desc}</p>}
          {f.skills?.length>0&&<div className="flex flex-wrap gap-2 mb-5">{f.skills.map((s,i)=><span key={i} className={`text-xs font-bold px-3 py-1 rounded-lg border ${c.b} ${c.t}`}>{s}</span>)}</div>}
          {f.licenses?.length>0&&<><p className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-3">Niveaux & Frais</p><div className="space-y-3 mb-5">
            {f.licenses.map((l,i)=><div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3"><span className="font-bold text-white text-sm">{l.nom}</span><span className="text-xs bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full">{l.duree_annees} an{l.duree_annees>1?'s':''}</span></div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/5 rounded-xl p-2.5"><div className="text-white/40 mb-0.5">Inscription</div><div className="text-white font-bold">{Number(l.frais_inscription).toLocaleString()} FCFA</div></div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5"><div className="text-emerald-400/70 mb-0.5">Mensualité</div><div className="text-emerald-300 font-bold">{Number(l.frais_mensuel).toLocaleString()} FCFA</div></div>
              </div>
            </div>)}
          </div></>}
          <Link to="/pre-inscription" onClick={onClose} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-xl"><GraduationCap size={18}/> S'inscrire dans cette filière</Link>
        </div>
      </div>
    </Overlay>
  )
}

// ─── Infinite horizontal marquee ─────────────────────────────────────────────
function Marquee({ items, renderItem, direction = 1, duration = 40, gap = 20, className = '' }) {
  return (
    <div className={`overflow-hidden relative ${className}`}>
      <motion.div
        className="flex"
        style={{ gap }}
        animate={{ x: direction > 0 ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{ duration, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}>
        {items.map((item, i) => <div key={`a-${i}`} style={{ flexShrink: 0 }}>{renderItem(item, i)}</div>)}
        {items.map((item, i) => <div key={`b-${i}`} style={{ flexShrink: 0 }}>{renderItem(item, i)}</div>)}
      </motion.div>
    </div>
  )
}

// ─── Circular 3D carousel — pot style (RAF-driven, no Framer Motion for rotation) ─
function CircleCarousel({ items, renderItem, radius=420, duration=22, cardW=268, cardH=260, height=540, isDark }) {
  const count   = items.length
  const step    = 360 / (count || 1)
  const rotRef  = useRef(null)
  const rafRef  = useRef(null)
  const angleRef = useRef(0)

  useEffect(() => {
    const degPerMs = 360 / (duration * 1000)
    let prev = performance.now()
    function frame(now) {
      const dt = now - prev
      prev = now
      angleRef.current = (angleRef.current + degPerMs * dt) % 360
      if (rotRef.current) rotRef.current.style.transform = `rotateY(${angleRef.current}deg)`
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [duration])

  const fadeL = isDark ? 'rgba(7,7,30,0.97)'  : 'rgba(255,255,255,0.97)'
  const fadeM = isDark ? 'rgba(7,7,30,0.4)'   : 'rgba(255,255,255,0.4)'

  return (
    <div className="w-full relative" style={{ height, overflow:'hidden' }}>
      <div className="absolute inset-0" style={{ perspective:'1400px', perspectiveOrigin:'50% 50%' }}>

        {/* LEFT / RIGHT cylinder wall fade */}
        <div className="absolute inset-0 pointer-events-none" style={{
          zIndex:20,
          background:`linear-gradient(to right, ${fadeL} 0%, transparent 18%, transparent 82%, ${fadeL} 100%)`
        }}/>

        {/* TOP / BOTTOM cylinder fade */}
        <div className="absolute inset-0 pointer-events-none" style={{
          zIndex:20,
          background:`linear-gradient(to bottom, ${fadeM} 0%, transparent 18%, transparent 82%, ${fadeM} 100%)`
        }}/>

        {/* CAPUCHON — top elliptical rim */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{
          zIndex:30, top:8, width:'70%', height:50, borderRadius:'50%',
          background: isDark
            ? 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.1) 0%, rgba(99,102,241,0.2) 55%, transparent 100%)'
            : 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.92) 0%, rgba(99,102,241,0.1) 55%, transparent 100%)',
          border: isDark ? '1.5px solid rgba(139,92,246,0.38)' : '1.5px solid rgba(99,102,241,0.28)',
          boxShadow: isDark ? '0 4px 20px rgba(99,102,241,0.15)' : '0 3px 14px rgba(99,102,241,0.08)',
        }}/>
        {/* Rim highlight */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{
          zIndex:30, top:12, width:'38%', height:16, borderRadius:'50%',
          background: isDark
            ? 'linear-gradient(to bottom, rgba(255,255,255,0.14), transparent)'
            : 'linear-gradient(to bottom, rgba(255,255,255,1), transparent)',
        }}/>

        {/* Central glow */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl pointer-events-none" style={{
          zIndex:1, width:200, height:200,
          background: isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.03)',
        }}/>

        {/* 3D rotating ring — driven by requestAnimationFrame */}
        <div
          ref={rotRef}
          style={{
            position:'absolute',
            transformStyle:'preserve-3d',
            left:'50%', top:'50%',
            width:0, height:0,
            zIndex:10,
            transform:'rotateY(0deg)',
          }}>
          {items.map((item, i) => (
            <div key={i} style={{
              position:'absolute',
              transform:`rotateY(${step * i}deg) translateZ(${radius}px)`,
              width:cardW, height:cardH,
              marginLeft:-cardW/2, marginTop:-cardH/2,
              backfaceVisibility:'hidden',
            }}>
              {renderItem(item, i)}
            </div>
          ))}
        </div>

        {/* Bottom elliptical shadow */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{
          zIndex:22, bottom:6, width:'70%', height:38, borderRadius:'50%',
          background:'radial-gradient(ellipse at center, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.05) 55%, transparent 75%)',
          filter:'blur(4px)',
        }}/>
        {/* Ground drop shadow */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{
          zIndex:22, bottom:-14, width:'38%', height:20, borderRadius:'50%',
          background:'radial-gradient(ellipse at center, rgba(0,0,0,0.14) 0%, transparent 70%)',
          filter:'blur(8px)',
        }}/>
      </div>
    </div>
  )
}

// ─── Filière card for marquee (no whileInView) ────────────────────────────────
function FCardM({ f, openF, D }) {
  const [hovered, setHovered] = useState(false)
  const c = CM[f.color] || CM.blue
  const Icon = f.icon || Cpu
  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y:-6, scale:1.03, transition:{type:'spring',stiffness:220,damping:20} }}
      whileTap={{ scale:0.97 }}
      onClick={() => openF(f)}
      className={`cursor-pointer rounded-2xl border relative overflow-hidden transition-all duration-300 ${D
        ?'bg-white/[0.04] border-white/[0.08] hover:border-brand-500/40 hover:shadow-2xl hover:shadow-brand-500/10 hover:bg-white/[0.07]'
        :'bg-white border-slate-200 hover:border-brand-300 shadow-[0_2px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_40px_rgba(99,102,241,0.15)]'}`}
      style={{ width:272, height:255 }}>
      {/* Base content */}
      <motion.div animate={{ opacity:hovered?0:1, y:hovered?-8:0 }} transition={{ duration:0.2 }}
        className="p-5 flex flex-col h-full">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.g} flex items-center justify-center mb-4 shadow-lg`}>
          <Icon size={20} className="text-white"/>
        </div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className={`font-black text-sm leading-tight flex-1 ${D?'text-white':'text-slate-900'}`}>{f.nom}</h3>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border flex-shrink-0 ${D?`${c.b} ${c.t}`:'bg-slate-100 border-slate-200 text-slate-500'}`}>{f.code}</span>
        </div>
        <p className={`text-xs leading-relaxed flex-1 mb-3 line-clamp-3 ${D?'text-white/60':'text-slate-500'}`}>{f.desc}</p>
        <div className="flex flex-wrap gap-1">
          {(f.skills||[]).slice(0,3).map((s,si)=>(
            <span key={si} className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${D?`${c.b} ${c.t}`:'bg-slate-50 border-slate-200 text-slate-600'}`}>{s}</span>
          ))}
        </div>
      </motion.div>
      {/* Hover overlay */}
      <motion.div
        initial={{ y:'100%', opacity:0 }}
        animate={{ y:hovered?0:'100%', opacity:hovered?1:0 }}
        transition={{ duration:0.32, ease:[0.76,0,0.24,1] }}
        className={`absolute inset-0 z-20 p-5 flex flex-col justify-between bg-gradient-to-br ${c.g}`}>
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center border border-white/30 flex-shrink-0">
              <Icon size={17} className="text-white"/>
            </div>
            <div>
              <p className="font-black text-white text-sm leading-tight">{f.nom}</p>
              <p className="text-white/60 text-[10px]">{f.duree||'2-3 ans'}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {(f.curriculum||f.skills||[]).slice(0,4).map((item,idx)=>(
              <motion.div key={idx} className="flex items-start gap-1.5"
                initial={{ x:-8, opacity:0 }}
                animate={hovered?{x:0,opacity:1}:{x:-8,opacity:0}}
                transition={{ delay:0.05+idx*0.06 }}>
                <CheckCircle2 size={11} className="text-white/80 mt-0.5 flex-shrink-0"/>
                <span className="text-[11px] text-white/85 leading-snug">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
        <button onClick={e=>{e.stopPropagation();openF(f)}}
          className="w-full bg-white/20 border border-white/30 text-white font-bold text-xs py-2 rounded-xl hover:bg-white/35 transition-colors flex items-center justify-center gap-1.5 mt-3">
          <GraduationCap size={11}/> Voir détails <ArrowRight size={10}/>
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
// Icon mapping helpers
function formateurIcon(specialite='') {
  const s = specialite.toLowerCase()
  if (s.includes('réseau') || s.includes('reseau') || s.includes('cisco')) return Network
  if (s.includes('cyber') || s.includes('sécurité') || s.includes('securite')) return Shield
  if (s.includes('dev') || s.includes('web') || s.includes('mobile') || s.includes('logiciel')) return Code2
  if (s.includes('ia') || s.includes('intelligence') || s.includes('machine')) return Brain
  if (s.includes('base') || s.includes('bdd') || s.includes('données')) return Database
  if (s.includes('système') || s.includes('systeme') || s.includes('server')) return Server
  return BookOpen
}
function membreIcon(poste='') {
  const p = poste.toLowerCase()
  if (p.includes('direct')) return Building
  if (p.includes('caissier') || p.includes('caissière') || p.includes('finance')) return CreditCard
  if (p.includes('accueil') || p.includes('orient') || p.includes('reception')) return UserCheck
  if (p.includes('tech') || p.includes('infra') || p.includes('maintenance')) return Wrench
  return Users
}
function membreGrad(poste='') {
  const p = poste.toLowerCase()
  if (p.includes('direct')) return 'from-violet-700 to-brand-600'
  if (p.includes('caissier') || p.includes('caissière')) return 'from-cyan-700 to-teal-600'
  if (p.includes('accueil')) return 'from-blue-700 to-cyan-600'
  return 'from-amber-700 to-orange-600'
}
function photoUrl(path) {
  if (!path) return null
  if (path.startsWith('http') || path.startsWith('/')) return path
  return `/storage/${path}`
}

export default function Landing() {
  const [isDark, setDark]       = useState(() => localStorage.getItem('isi_theme')==='dark')
  const [filieres, setFil]      = useState(FILIERES)
  const [formateurs, setForms]  = useState(FORMATEURS)
  const [membres, setMembres]   = useState(MEMBRES)
  const [temos, setTemos]       = useState([])
  const [selF, setSelF]         = useState(null)
  const [news, setNews]         = useState({ email:'', nom:'' })
  const [newsOK, setNewsOK]     = useState(false)
  const [tForm, setTForm]       = useState({ nom:'', filiere:'', annee_diplome:'', contenu:'', note:5 })
  const [tOK, setTOK]           = useState(false)
  const [socials, setSocials]   = useState({})

  useEffect(() => { localStorage.setItem('isi_theme', isDark?'dark':'light') }, [isDark])
  useEffect(() => {
    getFilieres().then(r => {
      if (r.data?.length) {
        setFil(r.data.map(f => ({ ...FILIERES.find(d=>d.code===f.code)||FILIERES[0], ...f })))
      }
    }).catch(()=>{})
    // Load real team from API — fall back to static if empty
    getFormateurs().then(r => {
      const list = r.data || []
      if (list.length > 0) {
        setForms(list.map(f => ({
          ...f,
          nom: f.nom || f.name || '',
          prenom: f.prenom || 'Mr',
          photo: photoUrl(f.photo) || `/cisse.jpeg`,
          role: f.role || 'Formateur',
          specialite: f.specialite || f.expertise || '',
          desc: f.description || f.desc || '',
          skills: f.competences ? f.competences.split(',').map(s=>s.trim()) : (f.skills || []),
          icon: formateurIcon(f.specialite || f.expertise || ''),
        })))
      }
    }).catch(()=>{})
    getMembresAdmins().then(r => {
      const list = r.data || []
      if (list.length > 0) {
        setMembres(list.map(m => ({
          ...m,
          nom: m.nom || m.name || '',
          photo: photoUrl(m.photo) || `/kara_directeur.jpg`,
          poste: m.poste || m.role || '',
          specialite: m.specialite || m.expertise || '',
          desc: m.description || m.desc || '',
          skills: m.competences ? m.competences.split(',').map(s=>s.trim()) : (m.skills || []),
          icon: membreIcon(m.poste || m.role || ''),
          grad: membreGrad(m.poste || m.role || ''),
        })))
      }
    }).catch(()=>{})
    getTemoignages().then(r => setTemos(r.data||[])).catch(()=>{})
    fetch('/api/settings/social').then(r=>r.json()).then(setSocials).catch(()=>{})
  }, [])

  // Scroll to section if navigated from another page via Navbar
  useEffect(() => {
    const id = sessionStorage.getItem('isi_scroll_to')
    if (!id) return
    sessionStorage.removeItem('isi_scroll_to')
    const attempt = (tries = 0) => {
      const el = document.getElementById(id)
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 72
        window.scrollTo({ top: y, behavior: 'smooth' })
      } else if (tries < 10) {
        setTimeout(() => attempt(tries + 1), 150)
      }
    }
    setTimeout(() => attempt(), 300)
  }, [])

  const openF = async f => {
    setSelF(f)
    if (f.id && !f.licenses) {
      try { const r=await fetch(`/api/filieres/${f.id}`); setSelF({...f,...await r.json()}) } catch{}
    }
  }

  const D = isDark
  const tx  = D ? 'text-white'   : 'text-slate-900'
  const txs = D ? 'text-white/60': 'text-slate-500'
  const txm = D ? 'text-white/30': 'text-slate-400'
  const card= D
    ? 'bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm'
    : 'bg-white border border-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
  const inp = D
    ? 'bg-white/5 border border-white/10 text-white placeholder-white/25 focus:border-brand-400/60 focus:bg-white/8'
    : 'bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-brand-400 shadow-sm'
  const hr  = D ? 'border-white/[0.08]':'border-slate-100'
  const sec = D ? 'bg-white/[0.02]':'bg-slate-50/80'

  return (
    <div className={`min-h-screen relative ${D?'bg-[#080812]':'bg-slate-50'}`}>
      <TechBg isDark={D}/>

      {/* Theme toggle */}
      <motion.button whileTap={{scale:0.9}} onClick={()=>setDark(d=>!d)}
        className={`fixed bottom-6 right-6 z-[100] w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl shadow-black/30 transition-all ${D?'bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 hover:bg-white/15':'bg-slate-900 text-amber-300 hover:bg-slate-800'}`}>
        {D?<Sun size={20}/>:<Moon size={20}/>}
      </motion.button>

      <Navbar/>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 min-h-screen flex items-center px-4 pt-20 pb-16">
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
              className={`inline-flex items-center gap-2.5 rounded-full px-5 py-2 text-sm font-bold mb-8 border ${D?'bg-brand-500/10 border-brand-500/25 text-brand-300':'bg-brand-50 border-brand-200 text-brand-700'}`}>
              <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"/> Inscriptions 2025-2026 ouvertes
            </motion.div>
            <motion.h1 initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.1}}
              className={`text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] mb-6 ${tx}`}>
              Votre avenir<br/>
              <span className={D?'gradient-text':'gradient-text-light'}>numérique</span><br/>
              commence ici
            </motion.h1>
            <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.2}}
              className={`text-lg max-w-lg mb-10 leading-relaxed ${txs}`}>
              ISI SUPTECH — Institut d'excellence en informatique, réseaux et innovation numérique.{' '}
              <span className={D?'text-brand-300 font-bold':'text-brand-700 font-bold'}>Dakar, Sénégal.</span>
            </motion.p>
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.3}} className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link to="/pre-inscription" className="btn-primary text-base px-8 py-4 flex items-center justify-center gap-2.5 rounded-2xl shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 transition-shadow">
                <GraduationCap size={20}/> Pré-inscription <ArrowRight size={18}/>
              </Link>
              <Link to="/connexion" className={`flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-2xl border-2 transition-all ${D?'border-white/15 text-white hover:bg-white/6 hover:border-white/30':'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 shadow-sm'}`}>
                <Lock size={16}/> Espace étudiant
              </Link>
            </motion.div>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.7}}
              className={`flex flex-wrap gap-8 pt-8 border-t ${hr}`}>
              {[['2 500+','Étudiants formés'],['15 ans','d\'expérience'],['95%','Insertion pro']].map(([v,l],i)=>(
                <div key={i}>
                  <div className={`text-3xl font-black ${D?'text-white':'text-slate-900'}`}>{v}</div>
                  <div className={`text-xs ${txm}`}>{l}</div>
                </div>
              ))}
            </motion.div>
          </div>
          <motion.div initial={{opacity:0,x:60}} animate={{opacity:1,x:0}} transition={{duration:0.9,delay:0.2}}>
            <Carousel/>
          </motion.div>
        </div>
        <motion.div animate={{y:[0,10,0]}} transition={{repeat:Infinity,duration:2.5}} className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 ${txm}`}>
          <span className="text-xs tracking-[0.3em] uppercase">Défiler</span><ChevronDown size={18}/>
        </motion.div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section className={`relative z-10 py-20 px-4 ${sec}`}>
        <div className="max-w-5xl mx-auto">
          <div className={`${card} rounded-3xl p-10 grid grid-cols-2 md:grid-cols-4 gap-8`}>
            <Counter target="2500" suffix="+" label="Étudiants formés"    icon={GraduationCap} isDark={D}/>
            <Counter target="15"   suffix="+" label="Années d'expérience" icon={Award}         isDark={D}/>
            <Counter target="20"   suffix=""  label="Filières & niveaux"  icon={BookOpen}      isDark={D}/>
            <Counter target="95"   suffix="%" label="Taux d'insertion"    icon={TrendingUp}    isDark={D}/>
          </div>
        </div>
      </section>

      {/* ── FILIÈRES ──────────────────────────────────────────────────────── */}
      <section id="filieres" className={`relative z-10 py-20 px-4 overflow-hidden ${D?'bg-[#07071e]':'bg-gradient-to-br from-slate-50 via-indigo-50/60 to-white'}`}>
        <FilieresBg isDark={D}/>
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-center mb-14">
            <span className={`text-sm font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 mb-3 ${D?'text-brand-400':'text-brand-600'}`}>
              <Cpu size={14}/> Formations
            </span>
            <h2 className={`text-4xl md:text-5xl font-black mb-4 ${tx}`}>Nos <span className={D?'gradient-text':'gradient-text-light'}>filières d'excellence</span></h2>
            <p className={`max-w-xl mx-auto text-sm ${txs}`}>6 filières pro avec certifications reconnues. Cliquez pour voir les détails et les frais.</p>
          </motion.div>
          {/* ── Turbillon 3D circulaire ── */}
          <CircleCarousel
            items={filieres} isDark={D}
            radius={420} duration={22} cardW={268} cardH={260} height={540}
            renderItem={f => <FCardM f={f} openF={openF} D={D}/>}
          />
        </div>
      </section>

      {/* ── PARTENAIRES ───────────────────────────────────────────────────── */}
      <section className={`relative z-10 py-20 px-4 ${sec}`}>
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-center mb-14">
            <span className={`text-sm font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 mb-3 ${D?'text-brand-400':'text-brand-600'}`}>
              <Award size={14}/> Partenariat
            </span>
            <h2 className={`text-4xl md:text-5xl font-black mb-4 ${tx}`}>Nos <span className={D?'gradient-text':'gradient-text-light'}>partenaires</span></h2>
            <p className={`max-w-xl mx-auto text-sm ${txs}`}>Survolez chaque logo pour découvrir le partenariat.</p>
          </motion.div>
          {/* ── Défilement horizontal infini ── */}
          <div className="space-y-4 -mx-4 sm:-mx-8 lg:-mx-12">
            <Marquee items={PARTENAIRES} direction={1} duration={35} gap={16}
              renderItem={p => <div style={{width:200,flexShrink:0}}><PCard p={p} isDark={D}/></div>}/>
            <Marquee items={[...PARTENAIRES].reverse()} direction={-1} duration={28} gap={16}
              renderItem={p => <div style={{width:200,flexShrink:0}}><PCard p={p} isDark={D}/></div>}/>
          </div>
        </div>
      </section>

      {/* ── PROCESSUS ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-center mb-14">
            <span className={`text-sm font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 mb-3 ${D?'text-brand-400':'text-brand-600'}`}><Zap size={14}/> Processus</span>
            <h2 className={`text-4xl md:text-5xl font-black ${tx}`}>Comment s'inscrire ?</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { icon:BookOpen,     n:'01', t:'Remplissez le formulaire', d:'Saisissez vos infos et choisissez votre filière en quelques minutes.' },
              { icon:Users,        n:'02', t:'Étude du dossier',         d:'Notre équipe examine votre candidature sous 48h ouvrées.' },
              { icon:CreditCard,   n:'03', t:'Paiement',                 d:'Payez vos frais via Wave, Orange Money ou directement à la caisse.' },
              { icon:GraduationCap,n:'04', t:'Carte QR Code',            d:'Obtenez votre carte étudiant sécurisée pour tous vos accès campus.' },
            ].map((s,i)=>{
              const Icon = s.icon
              return (
                <motion.div key={i} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.12}}>
                  <motion.div whileHover={{y:-8,scale:1.02}}
                    className={`rounded-2xl border p-6 text-center relative transition-all duration-300 ${D
                      ?'bg-white/[0.04] border-white/[0.08] hover:border-brand-500/35 hover:shadow-2xl hover:shadow-brand-500/10'
                      :'bg-white border-slate-200 shadow-[0_2px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_40px_rgba(99,102,241,0.12)]'}`}>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-brand-500/40">{s.n}</div>
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center mb-4 mt-3 shadow-lg shadow-brand-500/30">
                      <Icon size={22} className="text-white"/>
                    </div>
                    <h4 className={`font-black mb-2 ${tx}`}>{s.t}</h4>
                    <p className={`text-xs leading-relaxed ${txs}`}>{s.d}</p>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FORMATEURS ─────────────────────────── PLEIN ÉCRAN ───────────── */}
      <section className={`relative z-10 overflow-hidden ${D?'bg-[#080814]':'bg-white'}`}>
        {D && <FormateursBg isDark={D}/>}
        {/* Header */}
        <div className="max-w-6xl mx-auto px-4 pt-20 pb-12 text-center relative z-10">
          <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
            <span className={`text-sm font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 mb-3 ${D?'text-brand-400':'text-brand-600'}`}><Server size={14}/> Encadrement</span>
            <h2 className={`text-4xl md:text-5xl font-black mb-4 ${tx}`}>Nos <span className={D?'gradient-text':'gradient-text-light'}>formateurs</span></h2>
            <p className={`max-w-xl mx-auto text-sm ${txs}`}>Des experts du terrain. Survolez chaque photo pour découvrir leurs compétences.</p>
          </motion.div>
        </div>
        {/* Full-width photo strip with proper card separation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 sm:px-8 lg:px-12 relative z-10">
          {formateurs.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div key={i}
                initial={{opacity:0, y:40}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.15}}
                whileHover={{y:-6,transition:{type:'spring',stiffness:200,damping:20}}}
                className={`relative h-[480px] lg:h-[560px] overflow-hidden group rounded-3xl shadow-2xl shadow-black/30 border-2 transition-all duration-500 ${D
                  ?'border-white/8 hover:border-brand-500/50 hover:shadow-brand-500/20'
                  :'border-slate-200/60 hover:border-brand-300 hover:shadow-brand-200/40'}`}
              >
                {/* Photo full bleed */}
                <img src={f.photo} alt={`${f.prenom} ${f.nom}`}
                  className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"/>
                {/* Always-on gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/5"/>
                {/* Hover expand overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-900/85 via-brand-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>

                {/* Top badge — visible always */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1.5">
                  <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
                    <Icon size={13} className="text-white"/>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-200">{f.role}</span>
                </div>

                {/* Content bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h4 className="text-2xl font-black text-white mb-1">{f.prenom} {f.nom}</h4>
                  <p className="text-brand-300 text-sm font-bold mb-0 group-hover:mb-4 transition-all duration-300">{f.specialite}</p>
                  {/* Skills & desc — visible on hover */}
                  <div className="max-h-0 overflow-hidden group-hover:max-h-52 transition-all duration-500">
                    <p className="text-white/65 text-xs leading-relaxed mb-3 pt-1">{f.desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {f.skills.map((s,si)=><span key={si} className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/15 border border-white/25 text-white">{s}</span>)}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ── ÉQUIPE DIRECTION ──────────────────────────────────────────────── */}
      <section className={`relative z-10 overflow-hidden ${D?'bg-[#050510]':'bg-white'}`}>
        {D && <MembresBg isDark={D}/>}
        {/* Header */}
        <div className="max-w-6xl mx-auto px-4 pt-20 pb-12 text-center relative z-10">
          <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
            <span className={`text-sm font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 mb-3 ${D?'text-cyan-400':'text-cyan-700'}`}><Users size={14}/> Notre équipe</span>
            <h2 className={`text-4xl md:text-5xl font-black mb-4 ${tx}`}>L'équipe <span className={D?'gradient-text':'gradient-text-light'}>ISI SUPTECH</span></h2>
            <p className={`max-w-xl mx-auto text-sm ${txs}`}>L'équipe dédiée à votre réussite et à la bonne marche du campus.</p>
          </motion.div>
        </div>
        {/* Full-width photo cards like formateurs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 sm:px-8 lg:px-12 pb-20 relative z-10">
          {membres.map((m, i) => {
            const Icon = m.icon
            return (
              <motion.div key={i}
                initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.12}}
                whileHover={{y:-6,transition:{type:'spring',stiffness:200,damping:20}}}
                className={`relative h-[400px] lg:h-[460px] overflow-hidden group rounded-3xl shadow-2xl shadow-black/25 border-2 transition-all duration-500 ${D
                  ?'border-white/8 hover:border-cyan-500/50 hover:shadow-cyan-500/15'
                  :'border-slate-200/60 hover:border-cyan-300 hover:shadow-cyan-200/40'}`}>
                <img src={m.photo} alt={m.nom}
                  className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/5"/>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>

                {/* Top role badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1.5">
                  <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${m.grad} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={12} className="text-white"/>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{m.poste}</span>
                </div>

                {/* Bottom content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h4 className="text-xl font-black text-white mb-1">{m.nom}</h4>
                  <p className="text-cyan-300 text-sm font-bold mb-0 group-hover:mb-3 transition-all duration-300">{m.specialite}</p>
                  <div className="max-h-0 overflow-hidden group-hover:max-h-44 transition-all duration-500">
                    <p className="text-white/55 text-xs leading-relaxed mb-3 pt-1">{m.desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(m.skills||[]).map((s,si)=><span key={si} className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/15 border border-white/25 text-white">{s}</span>)}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ── GALERIE VIE DU CAMPUS ─────────────────────────────────────────── */}
      <section id="campus" className={`relative z-10 py-20 overflow-hidden ${sec}`}>
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="mb-12">
            <span className={`text-sm font-black uppercase tracking-[0.3em] flex items-center gap-2 mb-3 ${D?'text-brand-400':'text-brand-600'}`}><Camera size={14}/> Vie du campus</span>
            <h2 className={`text-4xl md:text-5xl font-black mb-3 ${tx}`}>Campus & <span className={D?'gradient-text':'gradient-text-light'}>Étudiants</span></h2>
            <p className={`text-sm ${txs}`}>Découvrez la vie à l'ISI SUPTECH — formations, soutenances et projets innovants.</p>
          </motion.div>
        </div>
        {/* Full-width 3D mosaic */}
        <div className="px-4 sm:px-8 lg:px-12" style={{perspective:'1400px'}}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-4" style={{gridTemplateRows:'280px 280px'}}>
            {/* Big left - 2 rows */}
            <motion.div
              initial={{opacity:0,x:-40}} whileInView={{opacity:1,x:0,transition:{duration:0.7}}} viewport={{once:true}}
              whileHover={{rotateY:3,rotateX:-2,scale:1.02,transition:{type:'spring',stiffness:200,damping:20}}}
              className="row-span-2 relative rounded-3xl overflow-hidden group cursor-pointer shadow-2xl shadow-black/25">
              <img src="/Etudiant_gestion.jpeg" alt="Gestion" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent"/>
              <motion.div initial={{y:10,opacity:0}} whileInView={{y:0,opacity:1}} viewport={{once:true}} transition={{delay:0.3}} className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0`}><Camera size={14} className="text-white"/></div>
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Gestion académique</span>
                </div>
                <p className="text-white font-black text-xl">Outils numériques modernes</p>
                <p className="text-white/50 text-xs mt-1">Administration & suivi étudiant en temps réel</p>
              </motion.div>
              {/* Glow on hover */}
              <div className="absolute inset-0 ring-2 ring-brand-500/0 group-hover:ring-brand-500/60 rounded-3xl transition-all duration-500"/>
            </motion.div>

            {/* Top right - Soutenance */}
            <motion.div
              initial={{opacity:0,y:-30}} whileInView={{opacity:1,y:0,transition:{delay:0.1,duration:0.6}}} viewport={{once:true}}
              whileHover={{rotateY:-3,rotateX:2,scale:1.03,transition:{type:'spring',stiffness:200,damping:20}}}
              className="relative rounded-3xl overflow-hidden group cursor-pointer shadow-xl shadow-black/20">
              <img src="/caroursel_isi_suptech_soutenace.jpg" alt="Soutenance" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"/>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white font-black text-base">Soutenances officielles</p>
                <p className="text-white/50 text-xs">Jurys professionnels</p>
              </div>
              <div className="absolute top-3 right-3 bg-brand-600/80 text-white text-[10px] font-black px-2.5 py-1 rounded-full">Diplômes</div>
              <div className="absolute inset-0 ring-2 ring-cyan-500/0 group-hover:ring-cyan-500/60 rounded-3xl transition-all duration-500"/>
            </motion.div>

            {/* Bottom right - Étudiant */}
            <motion.div
              initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0,transition:{delay:0.2,duration:0.6}}} viewport={{once:true}}
              whileHover={{rotateY:3,rotateX:2,scale:1.03,transition:{type:'spring',stiffness:200,damping:20}}}
              className="relative rounded-3xl overflow-hidden group cursor-pointer shadow-xl shadow-black/20">
              <img src="/etudant_farda.jpeg" alt="Étudiant" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"/>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white font-black text-base">Talents en Formation</p>
                <p className="text-white/50 text-xs">Innovation & projets numériques</p>
              </div>
              <div className="absolute top-3 right-3 bg-emerald-600/80 text-white text-[10px] font-black px-2.5 py-1 rounded-full">Projets</div>
              <div className="absolute inset-0 ring-2 ring-emerald-500/0 group-hover:ring-emerald-500/60 rounded-3xl transition-all duration-500"/>
            </motion.div>

            {/* Stats card - bottom left (hidden on small screens) */}
            <motion.div
              initial={{opacity:0,scale:0.88}} whileInView={{opacity:1,scale:1,transition:{delay:0.3,duration:0.6}}} viewport={{once:true}}
              whileHover={{scale:1.04,transition:{type:'spring',stiffness:200,damping:20}}}
              className="hidden md:flex col-span-2 md:col-span-1 rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-cyan-700 flex-col items-center justify-center p-8 shadow-2xl shadow-brand-500/35 relative overflow-hidden cursor-pointer">
              <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.12) 1px,transparent 1px)',backgroundSize:'22px 22px'}}/>
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 blur-2xl -translate-y-1/2 translate-x-1/2"/>
              <div className="relative z-10 grid grid-cols-3 gap-6 w-full">
                {[['2 500+','Étudiants formés'],['20','Filières actives'],['95%','Insertion pro']].map(([v,l],i)=>(
                  <div key={i} className="text-center">
                    <div className="text-2xl md:text-3xl font-black text-white mb-1">{v}</div>
                    <div className="text-white/55 text-[11px] font-medium leading-tight">{l}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
        {/* CTA under gallery */}
        <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:0.4}} className="mt-8 text-center px-4">
          <Link to="/pre-inscription" className={`inline-flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-xl border transition-all ${D?'border-brand-500/30 text-brand-400 hover:bg-brand-500/10 hover:border-brand-400':'border-brand-300 text-brand-600 hover:bg-brand-50'}`}>
            Rejoindre la communauté ISI SUPTECH <ArrowRight size={16}/>
          </Link>
        </motion.div>
      </section>

      {/* ── TÉMOIGNAGES ───────────────────────────────────────────────────── */}
      {temos.length > 0 && (
        <section className="relative z-10 py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-center mb-14">
              <span className={`text-sm font-black uppercase tracking-[0.3em] mb-3 block ${D?'text-brand-400':'text-brand-600'}`}>Témoignages</span>
              <h2 className={`text-4xl font-black ${tx}`}>Ce que disent <span className={D?'gradient-text':'gradient-text-light'}>nos étudiants</span></h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {temos.slice(0,6).map((t,i)=>(
                <motion.div key={i} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}}>
                  <div className={`${card} rounded-2xl p-6 h-full flex flex-col`}>
                    <Quote size={20} className={`mb-3 ${D?'text-brand-400':'text-brand-500'}`}/>
                    <p className={`text-sm leading-relaxed flex-1 mb-4 ${txs}`}>{t.contenu}</p>
                    <div><Stars note={t.note}/><div className={`font-bold text-sm mt-2 ${tx}`}>{t.nom}</div><div className={`text-xs ${txm}`}>{t.filiere}{t.annee_diplome?` · ${t.annee_diplome}`:''}</div></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TÉMOIGNAGE FORM ───────────────────────────────────────────────── */}
      <section className={`relative z-10 py-24 px-4 overflow-hidden ${D?'bg-[#07071e]':'bg-white'}`}>
        {/* BG elements */}
        <div className="absolute inset-0 pointer-events-none">
          {D ? (
            <>
              <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(circle,rgba(139,92,246,0.06) 1px,transparent 1px)',backgroundSize:'28px 28px'}}/>
              <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-500/12 blur-3xl"/>
              <div className="absolute -bottom-40 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-3xl"/>
            </>
          ) : (
            <>
              <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(circle,rgba(99,102,241,0.04) 1px,transparent 1px)',backgroundSize:'32px 32px'}}/>
              <div className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full bg-brand-100/60 blur-3xl translate-x-1/2 -translate-y-1/4"/>
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-cyan-100/50 blur-3xl -translate-x-1/4 translate-y-1/4"/>
            </>
          )}
          {[{x:'4%',y:'12%',rot:-15,s:68},{x:'87%',y:'8%',rot:20,s:52},{x:'2%',y:'78%',rot:10,s:58},{x:'93%',y:'82%',rot:-20,s:42}].map(({x,y,rot,s},i)=>(
            <motion.div key={i} className={`absolute font-black select-none ${D?'text-white/[0.04]':'text-brand-200/60'}`}
              style={{left:x,top:y,fontSize:s,transform:`rotate(${rot}deg)`}}
              animate={{y:[0,-12,0],opacity:D?[0.04,0.08,0.04]:[0.4,0.8,0.4]}}
              transition={{duration:4.5+i*0.9,repeat:Infinity,delay:i*1.1,ease:'easeInOut'}}>
              "
            </motion.div>
          ))}
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-5 gap-12 items-center">

            {/* ── Left info panel ── */}
            <motion.div initial={{opacity:0,x:-40}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:0.7}}
              className="lg:col-span-2">
              <div className={`inline-flex items-center gap-2 border rounded-full px-4 py-1.5 text-xs font-bold mb-6 ${D?'bg-white/10 border-white/20 text-white/80':'bg-brand-50 border-brand-200 text-brand-700'}`}>
                <Quote size={12}/> Témoignages étudiants
              </div>
              <h2 className={`text-4xl md:text-5xl font-black mb-4 leading-tight ${D?'text-white':'text-slate-900'}`}>
                Votre voix<br/><span className={D?'gradient-text':'gradient-text-light'}>compte ici</span>
              </h2>
              <p className={`leading-relaxed mb-8 text-base ${D?'text-white/60':'text-slate-500'}`}>
                Chaque témoignage aide les futurs étudiants à trouver leur voie. Partagez votre vécu à l'ISI SUPTECH.
              </p>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  {n:'2 500+',l:'Étudiants',Icon:Users},
                  {n:'95%',l:'Satisfaction',Icon:Star},
                  {n:'15 ans',l:'Excellence',Icon:Award},
                ].map(({n,l,Icon},i)=>(
                  <motion.div key={i} initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:0.2+i*0.1}}
                    className={`border rounded-2xl p-3.5 text-center ${D?'bg-white/8 border-white/12':'bg-white border-slate-200 shadow-sm'}`}>
                    <Icon size={15} className={D?'text-brand-300 mx-auto mb-1.5':'text-brand-500 mx-auto mb-1.5'}/>
                    <div className={`text-xl font-black ${D?'text-white':'text-slate-900'}`}>{n}</div>
                    <div className={`text-[10px] font-medium leading-tight ${D?'text-white/50':'text-slate-400'}`}>{l}</div>
                  </motion.div>
                ))}
              </div>
              {/* Sample testimonial */}
              <motion.div initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:0.5}}
                className={`border rounded-2xl p-5 relative overflow-hidden ${D?'bg-white/5 border-white/12':'bg-white border-slate-200 shadow-md'}`}>
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-500 via-cyan-500 to-violet-500"/>
                <Quote size={18} className={D?'text-brand-300 mb-3':'text-brand-500 mb-3'}/>
                <p className={`text-sm leading-relaxed italic mb-4 ${D?'text-white/65':'text-slate-600'}`}>
                  "ISI SUPTECH m'a donné les outils pour réussir dans le numérique. Les formateurs sont de vrais experts du terrain."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center flex-shrink-0 text-white font-black text-sm">A</div>
                  <div>
                    <div className={`font-bold text-sm ${D?'text-white':'text-slate-800'}`}>Amadou D.</div>
                    <div className={`text-xs ${D?'text-white/40':'text-slate-400'}`}>Cybersécurité · 2024</div>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {[1,2,3,4,5].map(i=><Star key={i} size={11} className="text-amber-400 fill-amber-400"/>)}
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* ── Right: form ── */}
            <motion.div initial={{opacity:0,x:40}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:0.7,delay:0.1}}
              className="lg:col-span-3">
              <div className={`relative rounded-3xl overflow-hidden shadow-2xl ${D?'shadow-black/40':'shadow-slate-200/80'}`}>
                <div className="h-1.5 bg-gradient-to-r from-brand-500 via-cyan-500 to-violet-500"/>
                <div className={`p-8 border border-t-0 ${D?'bg-white/[0.05] backdrop-blur-xl border-white/10':'bg-white border-slate-200'}`}>
                  <div className="text-center mb-7">
                    <h3 className={`text-2xl font-black mb-1.5 ${D?'text-white':'text-slate-900'}`}>Partagez votre expérience</h3>
                    <p className={`text-sm ${D?'text-white/50':'text-slate-500'}`}>Votre avis aide les futurs étudiants à choisir ISI SUPTECH</p>
                  </div>
                  {tOK ? (
                    <div className="text-center py-10">
                      <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',damping:12}}
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-emerald-500/30">
                        <CheckCircle2 size={36} className="text-white"/>
                      </motion.div>
                      <h4 className={`font-black text-2xl mb-2 ${D?'text-white':'text-slate-900'}`}>Merci pour votre témoignage !</h4>
                      <p className={D?'text-white/50':'text-slate-500'}>Il sera affiché après validation par notre équipe.</p>
                    </div>
                  ) : (
                    <form onSubmit={async e=>{e.preventDefault();try{await submitTemoignage(tForm);setTOK(true)}catch{setTOK(true)}}} className="space-y-5">
                      {/* Stars */}
                      <div className={`flex flex-col items-center gap-3 py-5 rounded-2xl border ${D?'bg-white/5 border-white/8':'bg-brand-50/60 border-brand-100'}`}>
                        <p className={`text-xs font-black uppercase tracking-widest ${D?'text-white/40':'text-slate-400'}`}>Votre satisfaction</p>
                        <div className="flex gap-3">
                          {[1,2,3,4,5].map(n=>(
                            <motion.button key={n} type="button" whileHover={{scale:1.25}} whileTap={{scale:0.9}}
                              onClick={()=>setTForm(f=>({...f,note:n}))}>
                              <Star size={38} className={n<=tForm.note?'text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]':D?'text-white/20':'text-slate-300'} style={{transition:'all 0.2s'}}/>
                            </motion.button>
                          ))}
                        </div>
                        <p className={`text-sm font-bold ${D?'text-amber-300':'text-amber-600'}`}>
                          {['','Décevant','Passable','Bien','Très bien','Excellent !'][tForm.note]}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-xs font-black mb-2 ${D?'text-white/50':'text-slate-500'}`}>Nom complet *</label>
                          <input value={tForm.nom} onChange={e=>setTForm(f=>({...f,nom:e.target.value}))} required
                            className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition-all font-medium ${inp}`}
                            placeholder="Votre nom"/>
                        </div>
                        <div>
                          <label className={`block text-xs font-black mb-2 ${D?'text-white/50':'text-slate-500'}`}>Filière</label>
                          <input value={tForm.filiere} onChange={e=>setTForm(f=>({...f,filiere:e.target.value}))}
                            className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition-all font-medium ${inp}`}
                            placeholder="Ex: Informatique"/>
                        </div>
                      </div>
                      <div>
                        <label className={`block text-xs font-black mb-2 ${D?'text-white/50':'text-slate-500'}`}>Promotion / Année</label>
                        <input value={tForm.annee_diplome} onChange={e=>setTForm(f=>({...f,annee_diplome:e.target.value}))}
                          className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition-all font-medium ${inp}`}
                          placeholder="2024-2025"/>
                      </div>
                      <div>
                        <label className={`block text-xs font-black mb-2 ${D?'text-white/50':'text-slate-500'}`}>Votre témoignage *</label>
                        <textarea value={tForm.contenu} onChange={e=>setTForm(f=>({...f,contenu:e.target.value}))}
                          required rows={4} className={`w-full rounded-xl px-4 py-3 text-sm outline-none resize-none transition-all font-medium ${inp}`}
                          placeholder="Partagez ce que vous avez aimé, ce que vous avez appris, comment ISI SUPTECH a changé votre parcours..."/>
                      </div>
                      <motion.button whileHover={{scale:1.02,y:-2}} whileTap={{scale:0.98}} type="submit"
                        className="btn-primary w-full flex items-center justify-center gap-2 py-4 rounded-xl shadow-xl shadow-brand-500/25 text-base">
                        <Send size={16}/> Envoyer mon témoignage
                      </motion.button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{opacity:0,scale:0.95}} whileInView={{opacity:1,scale:1}} viewport={{once:true}}
            className="relative rounded-3xl overflow-hidden">
            {/* BG */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-800 via-brand-700 to-cyan-800"/>
            <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.08) 1px,transparent 1px)',backgroundSize:'28px 28px'}}/>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/2"/>
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 blur-3xl translate-y-1/2 -translate-x-1/2"/>
            <div className="relative z-10 p-10 md:p-14">
              {newsOK ? (
                <div className="text-center py-4">
                  <CheckCircle2 size={52} className="text-emerald-400 mx-auto mb-4"/>
                  <h3 className="text-2xl font-black text-white mb-2">Vous êtes inscrit(e) !</h3>
                  <p className="text-white/60">Vous recevrez nos actualités ISI SUPTECH directement par email.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-10 items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-white/80 text-xs font-bold mb-4">
                      <Mail size={12}/> Newsletter ISI SUPTECH
                    </div>
                    <h3 className="text-3xl font-black text-white mb-3">Restez informé(e)</h3>
                    <p className="text-white/60 leading-relaxed">Actualités, dates d'inscription, événements et opportunités de notre campus — dans votre boîte mail.</p>
                  </div>
                  <form onSubmit={async e=>{e.preventDefault();try{await subscribeNewsletter(news);setNewsOK(true)}catch{setNewsOK(true)}}} className="space-y-3">
                    <input value={news.nom} onChange={e=>setNews(n=>({...n,nom:e.target.value}))} placeholder="Votre prénom" className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/50 focus:bg-white/15 transition-all"/>
                    <input value={news.email} onChange={e=>setNews(n=>({...n,email:e.target.value}))} type="email" required placeholder="Votre email *" className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/50 focus:bg-white/15 transition-all"/>
                    <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} type="submit"
                      className="w-full bg-white text-brand-700 hover:bg-brand-50 font-black py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-xl transition-colors">
                      <Send size={16}/> S'abonner gratuitement
                    </motion.button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── LOCALISATION ──────────────────────────────────────────────────── */}
      <section className={`relative z-10 py-20 px-4 ${sec}`}>
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-center mb-14">
            <span className={`text-sm font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 mb-3 ${D?'text-brand-400':'text-brand-600'}`}><MapPin size={14}/> Localisation</span>
            <h2 className={`text-4xl md:text-5xl font-black mb-3 ${tx}`}>Où nous <span className={D?'gradient-text':'gradient-text-light'}>trouver ?</span></h2>
            <p className={`max-w-xl mx-auto text-sm ${txs}`}>Sicap Liberté 3, Dakar — facile d'accès en transport ou en voiture.</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* Info */}
            <motion.div initial={{opacity:0,x:-30}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:0.6}} className="lg:col-span-2 space-y-4">
              <div className={`${card} rounded-2xl p-6`}>
                <div className="flex items-center gap-3 mb-5">
                  <motion.div animate={{y:[0,-5,0]}} transition={{duration:2.2,repeat:Infinity}} className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
                    <MapPin size={22} className="text-white"/>
                  </motion.div>
                  <div><h3 className={`font-black text-lg ${tx}`}>Campus ISI SUPTECH</h3><p className={`text-xs ${txm}`}>Siège principal — Dakar</p></div>
                </div>
                <div className="space-y-3">
                  {[
                    { Icon:MapPin, l:'Adresse',   v:'Sicap Liberté 3 N°1977\nDakar, Sénégal' },
                    { Icon:Phone,  l:'Téléphone', v:'+221 33 825 62 10', href:'tel:+221338256210' },
                    { Icon:Mail,   l:'Email',     v:'suptech@isisuptech.com', href:'mailto:suptech@isisuptech.com' },
                    { Icon:Globe,  l:'Web',       v:'www.isisuptech.com' },
                  ].map(({Icon,l,v,href},i)=>(
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${D?'bg-white/3 border border-white/5':'bg-slate-50 border border-slate-100'}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${D?'bg-brand-500/15':'bg-brand-50'}`}><Icon size={14} className={D?'text-brand-400':'text-brand-600'}/></div>
                      <div>
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${txm}`}>{l}</div>
                        {href?<a href={href} className={`text-sm font-semibold ${D?'text-white hover:text-brand-300':'text-slate-800 hover:text-brand-600'} transition-colors`}>{v}</a>:<p className={`text-sm whitespace-pre-line ${tx}`}>{v}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`${card} rounded-2xl p-5`}>
                <div className={`flex items-center gap-2 mb-4 text-xs font-black uppercase tracking-widest ${txm}`}><Clock size={13}/> Horaires</div>
                <div className="space-y-2.5">
                  {[['Lundi – Vendredi','08h00 – 18h00',true],['Samedi','09h00 – 14h00',true],['Dimanche','Fermé',false]].map(([j,h,o],i)=>(
                    <div key={i} className="flex items-center justify-between">
                      <span className={`text-sm ${txs}`}>{j}</span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${o?(D?'bg-emerald-500/15 text-emerald-400':'bg-emerald-50 text-emerald-700 border border-emerald-200'):(D?'bg-red-500/10 text-red-400':'bg-red-50 text-red-600 border border-red-200')}`}>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Map */}
            <motion.div initial={{opacity:0,x:30,scale:0.96}} whileInView={{opacity:1,x:0,scale:1}} viewport={{once:true}} transition={{duration:0.7}} className="lg:col-span-3">
              <div className="relative">
                <motion.div animate={{scale:[1,1.015,1],opacity:[0.6,1,0.6]}} transition={{duration:3,repeat:Infinity}} className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-brand-500/20 via-cyan-500/10 to-brand-500/20 blur-xl"/>
                <div className={`relative rounded-2xl overflow-hidden border-2 shadow-2xl ${D?'border-white/10 shadow-black/40':'border-slate-200 shadow-slate-300/40'}`}>
                  <iframe
                    title="ISI SUPTECH Dakar"
                    src="https://maps.google.com/maps?q=Sicap+Liberte+3+Dakar+Senegal&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    width="100%" height="440"
                    style={{display:'block',border:'none',filter:D?'invert(90%) hue-rotate(180deg) brightness(0.85) contrast(0.9)':'none'}}
                    allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                  />
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-black shadow-xl shadow-brand-500/40">
                    <motion.div animate={{scale:[1,1.4,1]}} transition={{duration:1.4,repeat:Infinity}}><MapPin size={14}/></motion.div>
                    ISI SUPTECH — Dakar
                  </div>
                  <a href="https://maps.google.com/?q=Sicap+Liberte+3+Dakar+Senegal" target="_blank" rel="noopener noreferrer"
                    className="absolute bottom-4 right-4 flex items-center gap-2 bg-white text-slate-800 hover:bg-brand-50 px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-colors">
                    <ExternalLink size={14}/> Itinéraire
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-4 overflow-hidden">
        <motion.div initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.7}}
          className={`max-w-5xl mx-auto relative overflow-hidden rounded-3xl shadow-2xl ${D?'shadow-blue-200/40':'shadow-brand-600/30'}`}>
          {/* Backgrounds - inversés selon mode */}
          {D ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/80 to-indigo-50"/>
              <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-brand-400/25 to-cyan-400/15 blur-3xl"/>
              <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-400/20 to-blue-400/25 blur-3xl"/>
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-brand-900/90 to-slate-950"/>
              <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.3) 0%, transparent 60%)'}}/>
              <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(ellipse at 80% 50%, rgba(6,182,212,0.2) 0%, transparent 60%)'}}/>
            </>
          )}
          {/* Dot pattern */}
          <div className="absolute inset-0" style={{backgroundImage:`radial-gradient(circle,${D?'rgba(99,102,241,0.12)':'rgba(255,255,255,0.05)'} 1px,transparent 1px)`,backgroundSize:'24px 24px'}}/>
          {/* Floating tech icons */}
          {[
            {Icon:Code2,x:'6%',y:'15%'},{Icon:Shield,x:'88%',y:'12%'},
            {Icon:Network,x:'8%',y:'72%'},{Icon:Brain,x:'85%',y:'68%'},
            {Icon:Database,x:'50%',y:'4%'},{Icon:Cpu,x:'47%',y:'88%'},
          ].map(({Icon,x,y},i)=>(
            <motion.div key={i} className={`absolute w-11 h-11 rounded-2xl flex items-center justify-center pointer-events-none ${D?'bg-brand-100/80 text-brand-500':'bg-white/6 text-white/20'}`}
              style={{left:x,top:y}}
              animate={{y:[0,-14,0],rotate:[0,6,-6,0]}}
              transition={{duration:3.5+i*0.6,repeat:Infinity,delay:i*0.5,ease:'easeInOut'}}>
              <Icon size={18}/>
            </motion.div>
          ))}

          <div className="relative z-10 px-8 py-14 md:px-16 md:py-20">
            <div className="max-w-2xl mx-auto text-center">
              {/* Status badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black mb-6 border ${D?'bg-brand-50 border-brand-200 text-brand-700':'bg-white/10 border-white/20 text-white/80'}`}>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/> Inscriptions 2025-2026 ouvertes
              </div>
              {/* Animated icon */}
              <motion.div className={`w-20 h-20 rounded-2xl mx-auto mb-7 flex items-center justify-center shadow-2xl ${D?'bg-gradient-to-br from-brand-600 to-cyan-600 shadow-brand-400/40':'bg-white/10 border-2 border-white/20'}`}
                animate={{rotate:[0,6,-6,0]}} transition={{duration:5,repeat:Infinity,ease:'easeInOut'}}>
                <GraduationCap size={36} className="text-white"/>
              </motion.div>
              <h2 className={`text-4xl md:text-5xl font-black mb-4 leading-tight ${D?'text-slate-900':'text-white'}`}>
                Prêt à rejoindre<br/><span className={D?'gradient-text-light':'gradient-text'}>l'excellence ?</span>
              </h2>
              <p className={`mb-8 text-base max-w-lg mx-auto leading-relaxed ${D?'text-slate-500':'text-white/60'}`}>
                Déposez votre dossier en quelques minutes.<br/>Réponse garantie sous <strong className={D?'text-brand-600':'text-cyan-300'}>48h ouvrées</strong>.
              </p>
              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                <motion.div whileHover={{scale:1.05}} whileTap={{scale:0.97}}>
                  <Link to="/pre-inscription" className={`inline-flex items-center gap-3 font-black text-lg px-10 py-4 rounded-2xl transition-all shadow-xl ${D
                    ?'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-brand-500/40 hover:shadow-brand-500/60'
                    :'bg-white text-slate-900 hover:bg-brand-50 shadow-white/20'}`}>
                    <GraduationCap size={22}/> Pré-inscription <ArrowRight size={18}/>
                  </Link>
                </motion.div>
                <motion.div whileHover={{scale:1.04}} whileTap={{scale:0.97}}>
                  <Link to="/connexion" className={`inline-flex items-center gap-2 font-bold text-base px-8 py-4 rounded-2xl border-2 transition-all ${D
                    ?'border-slate-200 text-slate-700 hover:bg-slate-100 bg-white/60'
                    :'border-white/30 text-white hover:bg-white/10'}`}>
                    <Lock size={16}/> Espace étudiant
                  </Link>
                </motion.div>
              </div>
              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center gap-3">
                {[{Icon:CheckCircle2,t:'ANAQ Certifié'},{Icon:Award,t:'CAMES Reconnu'},{Icon:Shield,t:'Cisco Academy'},{Icon:TrendingUp,t:'95% Insertion'}].map(({Icon,t},i)=>(
                  <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${D?'bg-slate-100 text-slate-600 border border-slate-200':'bg-white/10 text-white/70 border border-white/15'}`}>
                    <Icon size={11} className={D?'text-brand-600':'text-brand-300'}/> {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 bg-white">
        {/* Gradient accent top bar */}
        <div className="h-1 bg-gradient-to-r from-brand-600 via-cyan-500 to-violet-600"/>

        <div className="py-14 px-4 border-t border-slate-100">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">

              {/* Brand — span 2 */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-5">
                  <img src="/isi-logo.png" alt="ISI" className="h-12 w-auto object-contain" onError={e=>{e.target.style.display='none'}}/>
                  <div>
                    <div className="font-black text-xl text-slate-900">ISI SUPTECH</div>
                    <div className="text-xs text-slate-400">Institut Supérieur d'Informatique</div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-6 max-w-xs text-slate-500">
                  Excellence académique, pratique professionnelle et innovation numérique au service des talents africains depuis 2009.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {['Cisco Academy','AWS Academy','ANAQ certifié','CAMES reconnu'].map((b,i)=>(
                    <span key={i} className="text-xs px-3 py-1 rounded-full font-bold border bg-brand-50 border-brand-200 text-brand-700">{b}</span>
                  ))}
                </div>
                <div className="flex gap-3">
                  {SOCIALS.map(({key,I})=>{
                    const url=socials[key]; if(!url) return null
                    return (
                      <motion.a key={key} href={url} target="_blank" rel="noopener noreferrer"
                        whileHover={{scale:1.15,y:-2}} whileTap={{scale:0.9}}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-slate-100 border border-slate-200 text-slate-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200">
                        <I s={16}/>
                      </motion.a>
                    )
                  })}
                </div>
              </div>

              {/* Formations */}
              <div>
                <h4 className="font-black text-xs uppercase tracking-widest mb-5 text-slate-400">Formations</h4>
                <div className="space-y-2.5">
                  {filieres.map((f,i)=>(
                    <button key={i} onClick={()=>openF(f)}
                      className="flex items-center gap-2 text-sm group transition-colors text-left text-slate-500 hover:text-brand-600">
                      <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"/>
                      <span>{f.nom}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div>
                <h4 className="font-black text-xs uppercase tracking-widest mb-5 text-slate-400">Contact</h4>
                <div className="space-y-4">
                  {[
                    {Icon:MapPin,v:'Sicap Liberté 3 N°1977\nDakar, Sénégal'},
                    {Icon:Phone,v:'+221 33 825 62 10',href:'tel:+221338256210'},
                    {Icon:Mail,v:'suptech@isisuptech.com',href:'mailto:suptech@isisuptech.com'},
                    {Icon:Globe,v:'www.isisuptech.com'},
                  ].map(({Icon,v,href},i)=>(
                    <div key={i} className="flex items-start gap-2.5">
                      <Icon size={13} className="mt-0.5 flex-shrink-0 text-brand-500"/>
                      {href
                        ?<a href={href} className="text-sm transition-colors text-slate-500 hover:text-brand-600">{v}</a>
                        :<span className="text-sm whitespace-pre-line text-slate-500">{v}</span>
                      }
                    </div>
                  ))}
                </div>
              </div>

              {/* Accès rapide + Horaires */}
              <div>
                <h4 className="font-black text-xs uppercase tracking-widest mb-5 text-slate-400">Accès rapide</h4>
                <div className="space-y-2.5 mb-7">
                  {[{to:'/pre-inscription',l:'Pré-inscription',Icon:GraduationCap},{to:'/connexion',l:'Espace étudiant',Icon:Lock},{to:'/formations',l:'Nos Formations',Icon:BookOpen}].map((lk,i)=>(
                    <Link key={i} to={lk.to} className="flex items-center gap-2 text-sm transition-colors text-slate-500 hover:text-brand-600">
                      <lk.Icon size={13} className="text-brand-500"/> {lk.l}
                    </Link>
                  ))}
                </div>
                <h4 className="font-black text-xs uppercase tracking-widest mb-3 text-slate-400">Horaires</h4>
                <div className="space-y-1.5">
                  {[['Lun–Ven','08h–18h',true],['Samedi','09h–14h',true],['Dimanche','Fermé',false]].map(([j,h,o],i)=>(
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{j}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${o?'bg-emerald-50 text-emerald-600 border-emerald-200':'bg-red-50 text-red-500 border-red-200'}`}>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Partners strip */}
            <div className="py-8 border-t border-b border-slate-100">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-center mb-6 text-slate-400">Partenaires officiels</p>
              <div className="flex flex-wrap justify-center items-center gap-8">
                {PARTENAIRES.map((p,i)=>(
                  <img key={i} src={p.logo} alt={p.nom}
                    className="h-7 max-w-[80px] object-contain transition-all opacity-35 grayscale hover:grayscale-0 hover:opacity-100"
                    onError={e=>{e.target.style.display='none'}}/>
                ))}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-400">© {new Date().getFullYear()} ISI SUPTECH. Tous droits réservés.</p>
              <div className="flex items-center gap-4">
                <Link to="/pre-inscription" className="text-xs transition-colors text-slate-400 hover:text-brand-600">Pré-inscription</Link>
                <span className="text-slate-300">·</span>
                <Link to="/connexion" className="text-xs transition-colors text-slate-400 hover:text-brand-600">Connexion</Link>
              </div>
              <p className="text-xs text-slate-400">Développé par <span className="text-brand-600">Multi Brain Tech</span></p>
            </div>
          </div>
        </div>
      </footer>

      <FModal f={selF} onClose={()=>setSelF(null)}/>
    </div>
  )
}
