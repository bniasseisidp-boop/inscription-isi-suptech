import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Users, BookOpen, CreditCard, LogOut,
  Search, Check, X, Eye, UserPlus, RefreshCw,
  Pencil,
  Clock, Award, Plus, FileText, Handshake,
  MessageSquare, Mail, Share2, Trash2, ThumbsUp, Star,
  GraduationCap, Building2, Sun, Moon, Menu, ChevronRight,
  TrendingUp, Shield, Calendar, Download, ExternalLink, ToggleLeft, ToggleRight, Wallet, Lock, AlertTriangle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  getAdminStats, getAdminStudents, acceptStudent, rejectStudent,
  deleteStudent, getTrashedStudents, restoreStudent, forceDeleteStudent,
  generateStudentCard, downloadAdminCard, getAdminPayments, getFilieres, createAdminStudent, createFiliere,
  downloadClassListPdf,
  updateAdminFiliere, deleteAdminFiliere, createLicense, updateAdminLicense, deleteAdminLicense,
  getAdminSettings, updateAdminSettings,
  getStaff, createStaff, resetDonneesTest,
  adminGetMoisDesactives, adminToggleMoisDesactive, lockStudentProfile,
} from '../services/api'
import api from '../services/api'

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria','Azerbaijan',
  'Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi',
  'Côte d\'Ivoire','Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo (Congo-Brazzaville)','Costa Rica','Croatia','Cuba','Cyprus','Czechia',
  'Democratic Republic of the Congo','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia',
  'Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana',
  'Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan',
  'Kazakhstan','Kenya','Kiribati','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg',
  'Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar',
  'Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan','Palau','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda',
  'Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria',
  'Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States of America','Uruguay','Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'
]

const YEARS_BIRTH = (() => { const y = new Date().getFullYear(); const arr = []; for (let i = y; i >= y - 80; i--) arr.push(i); return arr })()
const YEARS_DIPLOMA = (() => { const y = new Date().getFullYear(); const arr = []; for (let i = y; i >= y - 30; i--) arr.push(i); return arr })()

const NAV = [
  { id: 'dashboard',   label: 'Tableau de bord',   icon: LayoutDashboard, color: 'text-violet-400',  badge: null },
  { id: 'etudiants',   label: 'Étudiants',          icon: Users,           color: 'text-blue-400',    badge: null },
  { id: 'paiements',   label: 'Paiements',           icon: CreditCard,      color: 'text-emerald-400', badge: null },
  { id: 'filieres',    label: 'Filières & Niveaux',  icon: BookOpen,        color: 'text-amber-400',   badge: null },
  { id: 'staff',       label: 'Équipe staff',        icon: Shield,          color: 'text-red-400',     badge: null },
  { id: 'mois',        label: 'Mois désactivés',     icon: Calendar,        color: 'text-purple-400',  badge: null },
  { id: 'corbeille',   label: 'Corbeille',            icon: Trash2,          color: 'text-red-400',     badge: null },
]

function SidebarContent({ active, setActive, onLogout, isDark, setIsDark, user, onClose }) {
  const T = isDark ? {
    logo:   'text-white',
    sub:    'text-brand-400',
    item:   'text-white/50 hover:text-white hover:bg-white/5',
    active: 'bg-brand-600/20 text-brand-300 border border-brand-500/30',
    foot:   'text-white/40 hover:text-red-400 hover:bg-red-500/5',
    theme:  'bg-white/10 text-amber-300 hover:bg-white/20 border-white/10',
    div:    'border-white/10',
  } : {
    logo:   'text-slate-900',
    sub:    'text-brand-600',
    item:   'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
    active: 'bg-brand-50 text-brand-700 border border-brand-200',
    foot:   'text-slate-400 hover:text-red-600 hover:bg-red-50',
    theme:  'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200',
    div:    'border-slate-200',
  }
  return (
    <>
      {/* En-tête */}
      <div className={`flex-shrink-0 p-5 border-b ${T.div}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center">
            <img src="/isi-logo.png" alt="ISI" className="h-11 w-auto object-contain"
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}/>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-pink-500 items-center justify-center shadow-lg hidden">
              <span className="text-white font-black text-sm">ISI</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className={`font-black text-base leading-tight ${T.logo}`}>ISI SUPTECH</div>
            <div className={`text-xs font-semibold ${T.sub}`}>Administration</div>
          </div>
          {onClose && (
            <button onClick={onClose} className={`p-1.5 rounded-lg ${T.item}`}><X size={16}/></button>
          )}
        </div>
        <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-pink-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">{(user?.name || 'A')[0].toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-xs font-bold truncate ${T.logo}`}>{user?.name || 'Administrateur'}</div>
            <div className={`text-xs ${T.sub}`}>Admin</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto p-3 space-y-1`}>
        {NAV.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <motion.button key={item.id} onClick={() => { setActive(item.id); onClose?.() }}
              whileTap={{ scale: 0.97 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? T.active : T.item}`}>
              <div className={`flex-shrink-0 ${isActive ? '' : item.color}`}><Icon size={17}/></div>
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && <ChevronRight size={14} className="flex-shrink-0 opacity-50"/>}
            </motion.button>
          )
        })}
      </nav>

      {/* Pied */}
      <div className={`flex-shrink-0 p-3 space-y-2 border-t ${T.div}`}>
        <button onClick={() => setIsDark(d => !d)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${T.theme}`}>
          {isDark ? <Sun size={17}/> : <Moon size={17}/>}
          {isDark ? 'Thème clair' : 'Thème sombre'}
        </button>
        <button onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${T.foot}`}>
          <LogOut size={17}/> Déconnexion
        </button>
      </div>
    </>
  )
}

function StatCard({ label, value, icon: Icon, color = 'brand', sub, isDark }) {
  const colors = {
    brand:  isDark ? 'bg-violet-600/20 border-violet-500/20 text-violet-400' : 'bg-violet-50 border-violet-200 text-violet-600',
    green:  isDark ? 'bg-emerald-600/20 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600',
    yellow: isDark ? 'bg-amber-600/20 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600',
    red:    isDark ? 'bg-red-600/20 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600',
  }
  const cardBg = isDark ? 'glass-card' : 'light-card'
  const textMain = isDark ? 'text-white' : 'text-slate-900'
  const textSub  = isDark ? 'text-white/60' : 'text-slate-500'
  return (
    <div className={`${cardBg} p-5 border ${colors[color]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}><Icon size={20}/></div>
        <TrendingUp size={14} className={`mt-1 ${isDark?'text-white/20':'text-slate-300'}`}/>
      </div>
      <div className={`text-3xl font-black ${textMain}`}>{value ?? '—'}</div>
      <div className={`text-sm mt-1 ${textSub}`}>{label}</div>
      {sub && <div className={`text-xs mt-0.5 ${isDark?'text-white/30':'text-slate-400'}`}>{sub}</div>}
    </div>
  )
}

const TEMPLATE_ACCEPT = `Félicitations !

Votre dossier d'inscription à ISI SUPTECH a été examiné avec attention et nous avons le plaisir de vous informer que votre candidature est acceptée.

Veuillez vous rendre à la caisse pour procéder au paiement de vos frais d'inscription afin de finaliser votre dossier.

Bienvenue dans la grande famille ISI SUPTECH !

L'équipe pédagogique`

const TEMPLATE_REJECT = `Madame / Monsieur,

Nous avons bien réceptionné et examiné votre dossier de candidature pour intégrer ISI SUPTECH.

Après étude approfondie, nous regrettons de vous informer que votre dossier ne peut être retenu à ce stade.

Nous vous encourageons à postuler à nouveau lors de la prochaine session d'inscription.

Cordialement,
L'équipe pédagogique ISI SUPTECH`

function ActionModal({ student, action, onClose, onDone, isDark }) {
  const [value, setValue] = useState(action === 'accepter' ? TEMPLATE_ACCEPT : TEMPLATE_REJECT)
  const [loading, setLoading] = useState(false)
  const handle = async () => {
    if (action === 'rejeter' && !value.trim()) { toast.error('Veuillez indiquer un motif'); return }
    setLoading(true)
    try {
      if (action === 'accepter') {
        await acceptStudent(student.id, { notes: value })
        toast.success('Dossier accepté ! Étudiant mis en attente de paiement.')
      } else {
        await rejectStudent(student.id, { motif: value })
        toast.success('Candidature rejetée')
      }
      onDone(); onClose()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur serveur — vérifiez les logs')
    } finally { setLoading(false) }
  }
  const bg      = isDark ? 'bg-[#0e0d1f] border border-white/10' : 'bg-white border border-slate-200 shadow-2xl'
  const text    = isDark ? 'text-white' : 'text-slate-900'
  const sub     = isDark ? 'text-white/60' : 'text-slate-500'
  const lbl     = isDark ? 'block text-xs font-bold mb-1.5 text-brand-300' : 'block text-xs font-bold mb-1.5 text-slate-600'
  const taCls   = isDark
    ? 'w-full rounded-xl px-3 py-2.5 text-xs leading-relaxed resize-none focus:outline-none transition-all bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-brand-500/60'
    : 'w-full rounded-xl px-3 py-2.5 text-xs leading-relaxed resize-none focus:outline-none transition-all bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-brand-400'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className={`relative ${bg} p-6 w-full max-w-md rounded-2xl`}>
        <h3 className={`font-bold text-lg mb-2 ${text}`}>
          {action === 'accepter' ? '✅ Valider le dossier' : '❌ Rejeter la candidature'}
        </h3>
        <p className={`text-sm mb-1 ${sub}`}>Candidat : <strong className={text}>{student.prenom} {student.nom}</strong></p>
        {action === 'accepter' && (
          <p className={`text-xs mb-4 font-semibold ${isDark ? 'text-amber-300/80' : 'text-amber-600'}`}>
            ℹ️ L'étudiant sera mis en attente de paiement et notifié par email.
          </p>
        )}
        <label className={lbl}>📧 Notes / Message email {action === 'accepter' ? '(joint à la notification)' : '*'}</label>
        <textarea className={taCls} rows={8} value={value} onChange={e => setValue(e.target.value)}/>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button onClick={handle} disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 font-semibold py-2.5 rounded-xl ${action === 'accepter' ? 'btn-primary' : 'btn-danger'}`}>
            {loading ? <div className="spinner w-4 h-4"/> : action === 'accepter' ? <Check size={16}/> : <X size={16}/>}
            Confirmer
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function StudentDrawer({ student, onClose, onRefresh, isDark }) {
  const [genCard, setGenCard]           = useState(false)
  const [viewingCard, setViewingCard]   = useState(false)
  const [dlCard, setDlCard]             = useState(false)
  const [locking, setLocking]           = useState(false)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (student) {
      setFormData({
        nom: student.nom || '',
        prenom: student.prenom || '',
        email: student.user?.email || '',
        telephone: student.telephone || '',
        sexe: student.sexe || 'M',
        date_naissance: student.date_naissance || '',
        lieu_naissance: student.lieu_naissance || '',
        adresse: student.adresse || '',
        nationalite: student.nationalite || '',
        pays_residence: student.pays_residence || '',
        filiere_id: student.filiere_id || '',
        license_id: student.license_id || '',
        statut_inscription: student.statut_inscription || 'en_attente',
        photo: null,
      })
    }
  }, [student])
  const [isLocked, setIsLocked] = useState(!!student.profil_verrouille)

  const handleGenCard = async () => {
    setGenCard(true)
    try { await generateStudentCard(student.id); toast.success('Carte générée !'); onRefresh() }
    catch { toast.error('Erreur génération carte') } finally { setGenCard(false) }
  }

  const openCardTab = async () => {
    setViewingCard(true)
    try {
      const { data } = await downloadAdminCard(student.id)
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch { toast.error('Erreur ouverture carte') } finally { setViewingCard(false) }
  }

  const downloadCard = async () => {
    setDlCard(true)
    try {
      const { data } = await downloadAdminCard(student.id)
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url
      a.download = `carte_${student.matricule || student.id}.pdf`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      toast.success('Téléchargement lancé')
    } catch { toast.error('Erreur téléchargement carte') } finally { setDlCard(false) }
  }

  const handleStudentSave = async () => {
    if (!formData) return
    setSaving(true)
    try {
      const payload = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value === null || value === undefined) return
        if (key === 'photo' && value instanceof File) {
          payload.append('photo', value)
        } else {
          payload.append(key, value)
        }
      })
      await updateAdminStudent(student.id, payload)
      toast.success('Étudiant mis à jour')
      setEditing(false)
      onRefresh()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur mise à jour étudiant')
    } finally {
      setSaving(false)
    }
  }

  const handleLockProfile = async () => {
    setLocking(true)
    try {
      await lockStudentProfile(student.id)
      toast.success("Profil verrouillé — l'étudiant a été notifié.")
      setIsLocked(true)
      onRefresh()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur lors du verrouillage')
    } finally { setLocking(false) }
  }
  const bg   = isDark ? 'bg-space-800 border-white/10' : 'bg-white border-slate-200'
  const text = isDark ? 'text-white' : 'text-slate-900'
  const sub  = isDark ? 'text-white/60' : 'text-slate-500'
  const mute = isDark ? 'text-white/40' : 'text-slate-400'
  const div  = isDark ? 'border-white/5' : 'border-slate-100'
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type:'spring', damping: 30, stiffness: 300 }}
        className={`relative w-full max-w-lg border-l h-full overflow-y-auto flex flex-col ${bg}`}>
        <div className={`p-5 border-b flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl ${bg}`}>
          <h3 className={`font-bold ${text}`}>Dossier étudiant</h3>
          <button onClick={onClose} className={`${mute} hover:${text}`}><X size={20}/></button>
        </div>
        <div className="p-5 flex-1 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className={`text-lg font-bold ${text}`}>Dossier étudiant</h3>
              <button onClick={() => setEditing((prev) => !prev)}
                className="text-sm btn-secondary py-2 px-3">
                {editing ? 'Annuler' : 'Modifier'}
              </button>
            </div>
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center overflow-hidden flex-shrink-0">
              {student.photo
                ? <img src={student.photo.startsWith('http') ? student.photo : `/storage/${student.photo}`} className="w-full h-full object-cover" onError={e => { e.target.style.display='none' }}/>
                : <span className="text-white text-3xl">👤</span>}
            </div>
            <div>
              <h2 className={`font-black text-xl ${text}`}>{student.prenom} {student.nom}</h2>
              <p className="text-brand-400 font-mono text-sm">{student.matricule || 'Sans matricule'}</p>
              <p className={`text-sm mt-1 ${sub}`}>{student.user?.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={student.statut_inscription === 'accepte' ? 'badge-accepted' : student.statut_inscription === 'rejete' ? 'badge-rejected' : 'badge-pending'}>
                  {student.statut_inscription === 'accepte' ? 'Accepté' : student.statut_inscription === 'rejete' ? 'Rejeté' : 'En attente'}
                </span>
                {isLocked && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium flex items-center gap-1">
                    <Lock size={10}/> Profil verrouillé
                  </span>
                )}
                {student.profil_complet && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">✓ Profil complet</span>
                )}
              </div>
            </div>
          </div>
          {editing && formData && (
            <div className="glass-card p-5 border border-brand-500/10">
              <h4 className={`font-semibold mb-4 ${text}`}>Modifier les informations</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {[
                  ['Prénom', 'prenom'],
                  ['Nom', 'nom'],
                  ['Téléphone', 'telephone'],
                  ['Email', 'email'],
                  ['Sexe', 'sexe'],
                  ['Date de naissance', 'date_naissance'],
                  ['Lieu de naissance', 'lieu_naissance'],
                  ['Adresse', 'adresse'],
                  ['Nationalité', 'nationalite'],
                  ['Pays de résidence', 'pays_residence'],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold mb-1 text-slate-500">{label}</label>
                    {key === 'sexe' ? (
                      <select className="form-input" value={formData[key]} onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}>
                        <option value="M">M</option>
                        <option value="F">F</option>
                      </select>
                    ) : (
                      <input
                        className="form-input"
                        value={formData[key]}
                        onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <button onClick={handleStudentSave} disabled={saving} className="btn-primary">
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <label className="cursor-pointer inline-flex items-center gap-2 text-sm text-slate-600">
                  <span className="px-3 py-2 rounded-xl border border-slate-200 bg-white">Photo</span>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => setFormData(prev => ({ ...prev, photo: e.target.files?.[0] || null }))}
                  />
                </label>
              </div>
            </div>
          )}
          {[
            ['Téléphone', student.telephone],
            ['Sexe', student.sexe === 'M' ? 'Masculin' : 'Féminin'],
            ['Date de naissance', student.date_naissance ? new Date(student.date_naissance).toLocaleDateString('fr-FR') : '—'],
            ['Lieu de naissance', student.lieu_naissance],
            ['Adresse', student.adresse],
            ['Nationalité', student.nationalite],
            ['Pays de résidence', student.pays_residence],
            ['Filière', student.filiere?.nom],
            ['Licence', student.license?.nom],
            ['Année scolaire', student.annee_scolaire],
            ['Inscription payée', student.inscription_payee ? '✅ Oui' : '❌ Non'],
          ].map(([label, val]) => val ? (
            <div key={label} className={`flex items-center justify-between py-2 border-b ${div}`}>
              <span className={`text-sm ${mute}`}>{label}</span>
              <span className={`text-sm font-medium ${text}`}>{val}</span>
            </div>
          ) : null)}
          {/* Informations du profil étudiant */}
          {(student.annee_bac || student.serie_college || student.tuteur_nom || student.numero_cni) && (
            <div>
              <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${mute}`}>Informations du profil</div>
              <div className="space-y-0.5">
                {[
                  ['Civilité',             student.civilite],
                  ['N° CNI',               student.numero_cni],
                  ['Série BAC',            student.serie_college],
                  ['Région BAC',           student.region_bac],
                  ['Année BAC',            student.annee_bac],
                  ['N° PV BAC',            student.numero_pv_bac],
                  ['Dernier diplôme',      student.dernier_diplome],
                  ['Dernier établissement',student.dernier_etablissement],
                  ['N° INE',               student.numero_ine],
                  ['Découverte ISI',       student.decouverte],
                  ['Tuteur 1',             student.tuteur_nom ? `${student.tuteur_nom}${student.tuteur_telephone ? ' — ' + student.tuteur_telephone : ''}` : null],
                  ['Tuteur 2',             student.tuteur2_nom || null],
                  ['Urgence 1',            student.contact_urgence1 ? `${student.contact_urgence1}${student.tel_urgence1 ? ' — ' + student.tel_urgence1 : ''}` : null],
                ].map(([label, val]) => val ? (
                  <div key={label} className={`flex items-start justify-between py-1.5 border-b ${div}`}>
                    <span className={`text-xs ${mute}`}>{label}</span>
                    <span className={`text-xs font-medium ${text} ml-4 text-right max-w-[55%]`}>{val}</span>
                  </div>
                ) : null)}
              </div>
            </div>
          )}

          {/* Documents */}
          {(student.doc_bac || student.doc_cin || student.doc_acte_naissance || student.doc_releve_notes || student.doc_bulletin_transfert) && (
            <div>
              <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${mute}`}>Documents soumis</div>
              <div className="space-y-2">
                {[
                  { key: 'doc_bac',              label: 'Diplôme BAC' },
                  { key: 'doc_releve_notes',     label: 'Relevé de notes' },
                  { key: 'doc_cin',              label: 'CIN légalisée' },
                  { key: 'doc_acte_naissance',   label: 'Acte de naissance' },
                  { key: 'doc_bulletin_transfert', label: 'Bulletin transfert' },
                ].map(({ key, label }) => {
                  const path = student[key]
                  if (!path) return null
                  const url = path.startsWith('http') ? path : `/storage/${path}`
                  return (
                    <div key={key} className={`flex items-center gap-3 p-2.5 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50 border border-slate-200'}`}>
                      <FileText size={15} className="text-brand-400 flex-shrink-0"/>
                      <span className={`text-xs flex-1 ${sub}`}>{label}</span>
                      <div className="flex gap-1.5">
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-brand-400 hover:text-brand-300 hover:bg-brand-500/10 transition-all" title="Voir">
                          <ExternalLink size={13}/>
                        </a>
                        <a href={url} download
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all" title="Télécharger">
                          <Download size={13}/>
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
              {student.est_transfert && (
                <div className={`mt-2 text-xs px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 ${isDark ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  🔁 Transfert d'une autre école
                </div>
              )}
            </div>
          )}

          {student.notes_admin && (
            <div className={`rounded-xl p-3 ${isDark ? 'bg-white/5' : 'bg-slate-50 border border-slate-200'}`}>
              <div className={`text-xs mb-1 ${mute}`}>Notes admin</div>
              <div className={`text-sm ${sub}`}>{student.notes_admin}</div>
            </div>
          )}
          {/* Verrouillage du profil */}
          {['en_attente_paiement', 'accepte'].includes(student.statut_inscription) && (
            isLocked ? (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${isDark ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
                <Lock size={15} className="flex-shrink-0"/>
                Profil verrouillé — l'étudiant ne peut plus modifier ses informations
              </div>
            ) : (
              <button onClick={handleLockProfile} disabled={locking}
                className={`w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 px-4 rounded-xl transition-all ${
                  isDark ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/20'
                         : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}>
                {locking ? <div className="spinner w-4 h-4"/> : <Lock size={15}/>}
                Verrouiller le profil ✓
              </button>
            )
          )}

          {student.statut_inscription === 'accepte' && (
            <div className="space-y-2">
              <button onClick={handleGenCard} disabled={genCard} className="w-full btn-secondary flex items-center justify-center gap-2 text-sm">
                {genCard ? <div className="spinner w-4 h-4"/> : <FileText size={16}/>}
                Générer / Regénérer la carte
              </button>
              <div className="flex gap-2">
                <button onClick={openCardTab} disabled={viewingCard} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-all disabled:opacity-50">
                  {viewingCard ? <div className="spinner w-4 h-4"/> : <ExternalLink size={14}/>}
                  Voir dans un onglet
                </button>
                <button onClick={downloadCard} disabled={dlCard} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-50">
                  {dlCard ? <div className="spinner w-4 h-4"/> : <Download size={14}/>}
                  Télécharger PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isDark, setIsDark]     = useState(() => localStorage.getItem('isi_theme') !== 'light')
  const [sideOpen, setSideOpen] = useState(false)
  const [active, setActive]     = useState('dashboard')
  const [stats, setStats]       = useState(null)
  const [students, setStudents] = useState([])
  const [pagination, setPagination] = useState({})
  const [payments, setPayments] = useState([])
  const [filieres, setFilieres] = useState([])
  const [staff, setStaff]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [search, setSearch]     = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [modalStudent, setModalStudent] = useState(null)
  const [modalAction, setModalAction]   = useState(null)
  const [drawerStudent, setDrawerStudent] = useState(null)
  const [showCreateStaff, setShowCreateStaff]     = useState(false)
  const [newFiliere, setNewFiliere]   = useState({ nom: '', code: '', description: '' })
  const [newLicense, setNewLicense]   = useState({ filiere_id: '', nom: '', code: '', duree_annees: 3, mois_debut: 9, mois_fin: 6, frais_inscription: 0, frais_mensuel: 0 })
  const [showCreateStudent, setShowCreateStudent] = useState(false)
  const [savingStudent, setSavingStudent] = useState(false)
  const [newStudent, setNewStudent] = useState({
      nom: '', prenom: '', email: '', telephone: '', sexe: 'M', date_naissance: '', lieu_naissance: '',
    adresse: '', nationalite: 'Sénégal', pays_residence: 'Sénégal', filiere_id: '', license_id: '', statut: 'en_attente', photo: null,
    // date parts
    dob_day: '', dob_month: '', dob_year: '',
    // advanced fields
    numero_ine: '', numero_cni: '', date_delivrance_cni: '', dernier_diplome: '', annee_dernier_diplome: '', dernier_etablissement: '',
    choix_specialites: '', notes_personnelles: '', tuteur_nom: '', tuteur_telephone: '', tuteur_email: '', contact_urgence1: '', tel_urgence1: '',
  })
  const [createAdvanced, setCreateAdvanced] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [resetting, setResetting]     = useState(false)
  const [newStaff, setNewStaff]       = useState({ name: '', email: '', role: 'cashier', password: '' })
  const [formateurs, setFormateurs]   = useState([])
  const [membres, setMembres]         = useState([])
  const [partenaires, setPartenaires] = useState([])
  const [temoignages, setTemoignages] = useState([])
  const [newsletterSubs, setNewsletterSubs] = useState([])
  const [socialLinks, setSocialLinks] = useState({ facebook: '', instagram: '', tiktok: '', youtube: '', linkedin: '', twitter: '' })
  const [trash, setTrash] = useState([])
  const [trashLoading, setTrashLoading] = useState(false)
  const [moisDesactives, setMoisDesactives] = useState([])
  const [moisToggling, setMoisToggling] = useState('')
  const [newFormateur, setNewFormateur] = useState({ nom:'', prenom:'', titre:'M.', specialite:'', bio:'', email:'', linkedin:'', ordre:0 })
  const [newMembre, setNewMembre]       = useState({ nom:'', prenom:'', titre:'M.', poste:'', email:'', ordre:0 })
  const [newPartenaire, setNewPartenaire] = useState({ nom:'', description:'', site_web:'', ordre:0 })
  const [editingLicense, setEditingLicense] = useState(null)
  const [editingFiliere, setEditingFiliere] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [filiereLocked, setFiliereLocked] = useState(false)
  const [loadingLock, setLoadingLock] = useState(false)
  const [dlListId, setDlListId] = useState(null)
  const [formateurPhoto, setFormateurPhoto] = useState(null)
  const [membrePhoto, setMembrePhoto]       = useState(null)
  const [partenaireLogo, setPartenaireLogo] = useState(null)

  useEffect(() => { localStorage.setItem('isi_theme', isDark ? 'dark' : 'light') }, [isDark])

  const handleLogout = async () => { await logout(); navigate('/') }

  useEffect(() => {
    if (active === 'dashboard')  { setLoading(true); getAdminStats().then(({ data }) => setStats(data)).catch(() => {}).finally(() => setLoading(false)) }
    if (active === 'etudiants')  {
      loadStudents()
      if (filieres.length === 0) {
        getFilieres().then(({ data }) => setFilieres(data)).catch(() => {})
      }
    }
    if (active === 'paiements')  getAdminPayments().then(({ data }) => setPayments(data.data || [])).catch(() => {})
    if (active === 'filieres')   { getFilieres().then(({ data }) => setFilieres(data)).catch(() => {}); getAdminSettings().then(({ data }) => setFiliereLocked(data.filieres_lock_pedagogique)).catch(() => {}) }
    if (active === 'staff')      getStaff().then(({ data }) => setStaff(data)).catch(() => {})
    if (active === 'corbeille')   { setTrashLoading(true); getTrashedStudents().then(({ data }) => setTrash(data)).catch(() => {}).finally(() => setTrashLoading(false)) }
    if (active === 'mois')        adminGetMoisDesactives().then(({ data }) => setMoisDesactives(data)).catch(() => {})
  }, [active])

  const loadStudents = async (page = 1) => {
    setLoading(true)
    try {
      const { data } = await getAdminStudents({ search, statut: filterStatut, page })
      setStudents(data.data || [])
      setPagination({ current: data.current_page, last: data.last_page, total: data.total })
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    if (active === 'etudiants') { const t = setTimeout(() => loadStudents(), 400); return () => clearTimeout(t) }
  }, [search, filterStatut])

  const submitFiliere = async () => {
    try { await createFiliere(newFiliere); toast.success('Filière créée !'); setNewFiliere({ nom:'', code:'', description:'' }); getFilieres().then(({ data }) => setFilieres(data)) }
    catch { toast.error('Erreur') }
  }
  const submitLicense = async () => {
    try { await createLicense(newLicense); toast.success('Niveau ajouté !'); getFilieres().then(({ data }) => setFilieres(data)) }
    catch { toast.error('Erreur') }
  }
  const handleSaveLicense = async () => {
    if (!editingLicense) return
    setSavingEdit(true)
    try {
      await updateAdminLicense(editingLicense.id, {
        nom: editingLicense.nom,
        mois_debut: Number(editingLicense.mois_debut),
        mois_fin: Number(editingLicense.mois_fin),
        frais_inscription: Number(editingLicense.frais_inscription),
        frais_mensuel: Number(editingLicense.frais_mensuel),
      })
      toast.success('Niveau mis à jour !')
      setEditingLicense(null)
      getFilieres().then(({ data }) => setFilieres(data))
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur') } finally { setSavingEdit(false) }
  }
  const handleDeleteLicense = async (id) => {
    if (!window.confirm('Supprimer ce niveau ?')) return
    try {
      await deleteAdminLicense(id)
      toast.success('Niveau supprimé.')
      getFilieres().then(({ data }) => setFilieres(data))
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
  }
  const handleSaveFiliere = async () => {
    if (!editingFiliere) return
    setSavingEdit(true)
    try {
      await updateAdminFiliere(editingFiliere.id, {
        nom: editingFiliere.nom,
        code: editingFiliere.code,
        description: editingFiliere.description || '',
      })
      toast.success('Filière mise à jour !')
      setEditingFiliere(null)
      getFilieres().then(({ data }) => setFilieres(data))
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur') } finally { setSavingEdit(false) }
  }
  const handleDeleteFiliere = async (id) => {
    if (!window.confirm('Supprimer cette filière ? Tous ses niveaux seront aussi supprimés.')) return
    try {
      await deleteAdminFiliere(id)
      toast.success('Filière supprimée.')
      getFilieres().then(({ data }) => setFilieres(data))
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
  }
  const toggleFiliereLock = async () => {
    setLoadingLock(true)
    try {
      const { data } = await updateAdminSettings({ filieres_lock_pedagogique: !filiereLocked })
      setFiliereLocked(data.filieres_lock_pedagogique)
      toast.success(data.filieres_lock_pedagogique ? 'Pédagogique verrouillé — plus de modifications filières.' : 'Pédagogique déverrouillé.')
    } catch { toast.error('Erreur') } finally { setLoadingLock(false) }
  }
  const downloadAdminList = async (filiereId, licenseId = null, filiereName = '', licenseName = '') => {
    const key = licenseId ? `l${licenseId}` : `f${filiereId}`
    setDlListId(key)
    try {
      const params = { filiere_id: filiereId }
      if (licenseId) params.license_id = licenseId
      const { data } = await downloadClassListPdf(params)
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url
      a.download = `liste_${filiereName}_${licenseName || 'tous'}.pdf`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      toast.success('Liste téléchargée !')
    } catch { toast.error('Erreur téléchargement liste') } finally { setDlListId(null) }
  }
  const submitStaff = async () => {
    try { await createStaff(newStaff); toast.success('Compte créé !'); setShowCreateStaff(false); getStaff().then(({ data }) => setStaff(data)) }
    catch { toast.error('Erreur') }
  }
  const submitNewStudent = async () => {
    setSavingStudent(true)
    try {
      // assemble date of birth
      const formData = new FormData()
      const dob = (newStudent.dob_year && newStudent.dob_month && newStudent.dob_day)
        ? `${newStudent.dob_year}-${String(newStudent.dob_month).padStart(2,'0')}-${String(newStudent.dob_day).padStart(2,'0')}`
        : ''
      const payloadObj = { ...newStudent, date_naissance: dob }
      delete payloadObj.dob_day; delete payloadObj.dob_month; delete payloadObj.dob_year
      Object.entries(payloadObj).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') return
        if (key === 'photo' && value instanceof File) {
          formData.append('photo', value)
        } else {
          formData.append(key, value)
        }
      })
      await createAdminStudent(formData)
      toast.success('Étudiant ajouté !')
      setShowCreateStudent(false)
      setNewStudent({
        nom: '', prenom: '', email: '', telephone: '', sexe: 'M', date_naissance: '', lieu_naissance: '',
        adresse: '', nationalite: 'Sénégal', pays_residence: 'Sénégal', filiere_id: '', license_id: '', statut: 'en_attente', photo: null,
      })
      loadStudents()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur création étudiant')
    } finally {
      setSavingStudent(false)
    }
  }

  // Theme-aware classes
  const T = isDark ? {
    page:  'bg-space-950',
    topbar:'bg-space-900/80 backdrop-blur-xl border-white/10',
    title: 'text-white',
    sub:   'text-brand-300',
    card:  'glass-card',
    input: 'form-input',
    label: 'form-label',
    table: 'data-table',
    th:    '',
    td:    '',
    tr:    '',
    pill:  'bg-white/5 text-white/60',
    mute:  'text-white/30',
    divider: 'border-white/10',
  } : {
    page:  'bg-slate-50',
    topbar:'bg-white/90 backdrop-blur-xl border-slate-200',
    title: 'text-slate-900',
    sub:   'text-brand-600',
    card:  'light-card',
    input: 'w-full rounded-xl px-4 py-3 text-sm bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-400 transition-all shadow-sm',
    label: 'block text-xs font-semibold mb-1.5 text-slate-600',
    table: 'w-full border-collapse',
    th:    'text-left text-xs font-bold uppercase tracking-widest px-4 py-3 text-slate-500 bg-slate-50 border-b border-slate-200',
    td:    'px-4 py-3 text-sm text-slate-700 border-b border-slate-100',
    tr:    'hover:bg-slate-50 transition-colors',
    pill:  'bg-slate-100 text-slate-600',
    mute:  'text-slate-400',
    divider: 'border-slate-100',
  }

  const activeLabel = NAV.find(n => n.id === active)?.label || ''

  return (
    <div className={`min-h-screen flex ${T.page}`}>

      {/* Sidebar desktop — statique dans le flex */}
      <aside className={`hidden lg:flex flex-col w-64 flex-shrink-0 border-r backdrop-blur-xl ${isDark ? 'bg-space-900/95 border-white/10' : 'bg-white/95 border-slate-200'}`}>
        <SidebarContent active={active} setActive={setActive} onLogout={handleLogout}
          isDark={isDark} setIsDark={setIsDark} user={user} onClose={null}/>
      </aside>

      {/* Sidebar mobile — drawer fixe avec overlay */}
      <AnimatePresence>
        {sideOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setSideOpen(false)}/>
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col border-r backdrop-blur-xl lg:hidden ${isDark ? 'bg-space-900 border-white/10' : 'bg-white border-slate-200'}`}>
              <SidebarContent active={active} setActive={setActive} onLogout={handleLogout}
                isDark={isDark} setIsDark={setIsDark} user={user} onClose={() => setSideOpen(false)}/>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* Topbar */}
        <div className={`sticky top-0 z-30 border-b px-4 sm:px-6 h-16 flex items-center justify-between flex-shrink-0 ${T.topbar}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSideOpen(true)} className={`lg:hidden p-2 rounded-xl transition-colors ${isDark?'text-white/60 hover:bg-white/10':'text-slate-500 hover:bg-slate-100'}`}>
              <Menu size={20}/>
            </button>
            <div>
              <h1 className={`font-bold text-base ${T.title}`}>{activeLabel}</h1>
              <div className={`text-xs font-semibold hidden sm:block ${T.sub}`}>Espace Administration</div>
            </div>
          </div>
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${isDark?'bg-brand-500/20 text-brand-300 border border-brand-500/30':'bg-brand-50 text-brand-700 border border-brand-200'}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
            En ligne
          </div>
        </div>

        {/* Zone de contenu */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

              {/* DASHBOARD */}
              {active === 'dashboard' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    <StatCard label="Total candidatures"   value={stats?.total_etudiants}         icon={Users}      color="brand"  isDark={isDark} sub="Hors annulées"/>
                    <StatCard label="Dossiers en attente"  value={stats?.en_attente}               icon={Clock}      color="yellow" isDark={isDark}/>
                    <StatCard label="En attente paiement"  value={stats?.en_attente_paiement}      icon={Wallet}     color="yellow" isDark={isDark} sub="Acceptés, non payés"/>
                    <StatCard label="Inscriptions actives" value={stats?.acceptes}                 icon={Check}      color="green"  isDark={isDark} sub="Payé + confirmé"/>
                    <StatCard label="Frais d'insc. perçus" value={stats?.inscriptions_payees}      icon={CreditCard} color="green"  isDark={isDark}/>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`${T.card} p-5`}>
                      <div className={`text-xs uppercase tracking-wider mb-1 font-bold ${T.mute}`}>Recettes totales</div>
                      <div className={`text-3xl font-black ${T.title}`}>{Number(stats?.total_paiements || 0).toLocaleString()}</div>
                      <div className={`text-xs mt-0.5 ${T.mute}`}>FCFA</div>
                    </div>
                    <div className={`${T.card} p-5`}>
                      <div className={`text-xs uppercase tracking-wider mb-1 font-bold ${T.mute}`}>Recettes ce mois</div>
                      <div className="text-3xl font-black text-brand-400">{Number(stats?.paiements_ce_mois || 0).toLocaleString()}</div>
                      <div className={`text-xs mt-0.5 ${T.mute}`}>FCFA</div>
                    </div>
                  </div>
                  {stats?.par_filiere && Object.keys(stats.par_filiere).length > 0 && (
                    <div className={`${T.card} p-5`}>
                      <h3 className={`font-semibold mb-4 ${T.title}`}>Répartition par filière</h3>
                      <div className="space-y-3">
                        {Object.entries(stats.par_filiere).map(([filiere, count]) => {
                          const pct = (count / (stats.acceptes || 1)) * 100
                          return (
                            <div key={filiere}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className={T.sub.includes('brand') ? 'text-slate-600' : 'text-white/70'}>{filiere}</span>
                                <span className={`font-semibold ${T.title}`}>{count} étudiants</span>
                              </div>
                              <div className={`h-2 rounded-full ${isDark?'bg-white/10':'bg-slate-200'}`}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }}
                                  className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full"/>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ETUDIANTS */}
              {active === 'etudiants' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex flex-wrap gap-3 flex-1 min-w-0">
                      <div className="relative flex-1 min-w-48">
                        <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${T.mute}`}/>
                        <input className={`${T.input} pl-9 py-2`} placeholder="Nom, prénom, matricule..." value={search} onChange={e => setSearch(e.target.value)}/>
                      </div>
                      <select className={`${T.input} py-2 w-auto`} value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
                        <option value="">Tous les statuts</option>
                        <option value="en_attente">En attente</option>
                        <option value="en_attente_paiement">Attente paiement</option>
                        <option value="accepte">Inscrits</option>
                        <option value="rejete">Rejetés</option>
                      </select>
                      <button onClick={() => loadStudents()} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
                        <RefreshCw size={14}/> Actualiser
                      </button>
                    </div>
                    <button onClick={() => setShowCreateStudent(prev => !prev)} className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
                      <Plus size={14}/> Ajouter un étudiant
                    </button>
                  </div>

                  {showCreateStudent && (<>
                    <div className="mb-2">
                      <label className={T.label}>Compléter le dossier</label>
                      <div className="flex items-center gap-2 mb-3">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="form-checkbox" checked={createAdvanced} onChange={e => setCreateAdvanced(e.target.checked)} />
                          <span className="text-sm">Afficher les champs avancés</span>
                        </label>
                      </div>
                    </div>
                    <div className={`${T.card} p-5 space-y-4`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className={`font-semibold text-lg ${T.title}`}>Créer un étudiant manuellement</h3>
                          <p className={`text-sm ${T.mute}`}>Remplissez toutes les informations pour un étudiant inscrit physiquement.</p>
                        </div>
                        <button onClick={() => setShowCreateStudent(false)} className="text-sm text-slate-500 hover:text-slate-900">Fermer</button>
                      </div>
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div><label className={T.label}>Prénom</label><input className={T.input} value={newStudent.prenom} onChange={e => setNewStudent({...newStudent, prenom: e.target.value})}/></div>
                          <div><label className={T.label}>Nom</label><input className={T.input} value={newStudent.nom} onChange={e => setNewStudent({...newStudent, nom: e.target.value})}/></div>
                          <div><label className={T.label}>Email</label><input className={T.input} type="email" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})}/></div>
                          <div><label className={T.label}>Téléphone</label><input className={T.input} value={newStudent.telephone} onChange={e => setNewStudent({...newStudent, telephone: e.target.value})}/></div>
                          <div><label className={T.label}>Sexe</label><select className={T.input} value={newStudent.sexe} onChange={e => setNewStudent({...newStudent, sexe: e.target.value})}><option value="M">Masculin</option><option value="F">Féminin</option></select></div>
                          <div>
                            <label className={T.label}>Date de naissance</label>
                            <div className="flex gap-2">
                              <select className={`${T.input} w-24`} value={newStudent.dob_day} onChange={e => setNewStudent({...newStudent, dob_day: e.target.value})}>
                                <option value="">Jour</option>
                                {Array.from({length:31}, (_,i) => i+1).map(d => <option key={d} value={String(d).padStart(2,'0')}>{d}</option>)}
                              </select>
                              <select className={`${T.input} w-28`} value={newStudent.dob_month} onChange={e => setNewStudent({...newStudent, dob_month: e.target.value})}>
                                <option value="">Mois</option>
                                {["01 Jan","02 Fév","03 Mar","04 Avr","05 Mai","06 Jun","07 Jul","08 Aoû","09 Sep","10 Oct","11 Nov","12 Déc"].map((m,i)=> <option key={i} value={String(i+1).padStart(2,'0')}>{m.split(' ')[1]}</option>)}
                              </select>
                              <select className={`${T.input} w-32`} value={newStudent.dob_year} onChange={e => setNewStudent({...newStudent, dob_year: e.target.value})}>
                                <option value="">Année</option>
                                {YEARS_BIRTH.map(y => <option key={y} value={y}>{y}</option>)}
                              </select>
                            </div>
                          </div>
                          <div><label className={T.label}>Lieu de naissance</label><input className={T.input} value={newStudent.lieu_naissance} onChange={e => setNewStudent({...newStudent, lieu_naissance: e.target.value})}/></div>
                        </div>
                        <div className="space-y-3">
                          <div><label className={T.label}>Adresse</label><input className={T.input} value={newStudent.adresse} onChange={e => setNewStudent({...newStudent, adresse: e.target.value})}/></div>
                          <div>
                            <label className={T.label}>Nationalité</label>
                            <select className={T.input} value={newStudent.nationalite} onChange={e => setNewStudent({...newStudent, nationalite: e.target.value})}>
                              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={T.label}>Pays de résidence</label>
                            <select className={T.input} value={newStudent.pays_residence} onChange={e => setNewStudent({...newStudent, pays_residence: e.target.value})}>
                              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div><label className={T.label}>Filière</label><select className={T.input} value={newStudent.filiere_id} onChange={e => setNewStudent({...newStudent, filiere_id: e.target.value, license_id: ''})}><option value="">-- Choisir --</option>{filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}</select></div>
                          <div><label className={T.label}>Licence / Niveau</label><select className={T.input} value={newStudent.license_id} onChange={e => setNewStudent({...newStudent, license_id: e.target.value})} disabled={!newStudent.filiere_id}><option value="">-- Choisir --</option>{filieres.find(f => String(f.id) === String(newStudent.filiere_id))?.licenses?.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}</select></div>
                          <div><label className={T.label}>Statut initial</label><select className={T.input} value={newStudent.statut} onChange={e => setNewStudent({...newStudent, statut: e.target.value})}><option value="en_attente">En attente</option><option value="accepte">Accepté</option></select></div>
                          <div><label className={T.label}>Photo (facultative)</label><input className={T.input} type="file" accept="image/*" onChange={e => setNewStudent({...newStudent, photo: e.target.files?.[0] ?? null})}/></div>
                        </div>
                      </div>
                      {createAdvanced && (
                        <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div><label className={T.label}>N° INE</label><input className={T.input} value={newStudent.numero_ine} onChange={e => setNewStudent({...newStudent, numero_ine: e.target.value})}/></div>
                            <div><label className={T.label}>N° CNI</label><input className={T.input} value={newStudent.numero_cni} onChange={e => setNewStudent({...newStudent, numero_cni: e.target.value})}/></div>
                            <div><label className={T.label}>Date délivrance CNI</label><input className={T.input} type="date" value={newStudent.date_delivrance_cni} onChange={e => setNewStudent({...newStudent, date_delivrance_cni: e.target.value})}/></div>
                            <div><label className={T.label}>Dernier diplôme</label><input className={T.input} value={newStudent.dernier_diplome} onChange={e => setNewStudent({...newStudent, dernier_diplome: e.target.value})}/></div>
                            <div>
                              <label className={T.label}>Année dernier diplôme</label>
                              <select className={T.input} value={newStudent.annee_dernier_diplome} onChange={e => setNewStudent({...newStudent, annee_dernier_diplome: e.target.value})}>
                                <option value="">--</option>
                                {YEARS_DIPLOMA.map(y => <option key={y} value={y}>{y}</option>)}
                              </select>
                            </div>
                            <div><label className={T.label}>Dernier établissement</label><input className={T.input} value={newStudent.dernier_etablissement} onChange={e => setNewStudent({...newStudent, dernier_etablissement: e.target.value})}/></div>
                          </div>
                          <div className="space-y-3">
                            <div><label className={T.label}>Choix spécialités (3)</label><textarea className={T.input} rows={3} value={newStudent.choix_specialites} onChange={e => setNewStudent({...newStudent, choix_specialites: e.target.value})}/></div>
                            <div><label className={T.label}>Notes / Informations</label><textarea className={T.input} rows={3} value={newStudent.notes_personnelles} onChange={e => setNewStudent({...newStudent, notes_personnelles: e.target.value})}/></div>
                            <div><label className={T.label}>Tuteur - Nom</label><input className={T.input} value={newStudent.tuteur_nom} onChange={e => setNewStudent({...newStudent, tuteur_nom: e.target.value})}/></div>
                            <div><label className={T.label}>Tuteur - Téléphone</label><input className={T.input} value={newStudent.tuteur_telephone} onChange={e => setNewStudent({...newStudent, tuteur_telephone: e.target.value})}/></div>
                            <div><label className={T.label}>Tuteur - Email</label><input className={T.input} value={newStudent.tuteur_email} onChange={e => setNewStudent({...newStudent, tuteur_email: e.target.value})}/></div>
                            <div><label className={T.label}>Contact urgence - Nom</label><input className={T.input} value={newStudent.contact_urgence1} onChange={e => setNewStudent({...newStudent, contact_urgence1: e.target.value})}/></div>
                            <div><label className={T.label}>Contact urgence - Téléphone</label><input className={T.input} value={newStudent.tel_urgence1} onChange={e => setNewStudent({...newStudent, tel_urgence1: e.target.value})}/></div>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-3">
                        <button onClick={submitNewStudent} disabled={savingStudent} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
                          {savingStudent ? 'Enregistrement...' : 'Enregistrer l’étudiant'}
                        </button>
                        <button onClick={() => setShowCreateStudent(false)} className="btn-secondary py-2 px-4 text-sm">Annuler</button>
                      </div>
                    </div>
                  </>)}

                  <div className={`${T.card} overflow-hidden`}>
                    <table className={T.table}>
                      <thead>
                        <tr>
                          {['Étudiant','Filière','Statut','Paiement','Date','Actions'].map(h => (
                            <th key={h} className={isDark ? '' : T.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr><td colSpan={6} className="text-center py-10"><div className="spinner mx-auto"/></td></tr>
                        ) : students.length === 0 ? (
                          <tr><td colSpan={6} className={`text-center py-10 ${T.mute}`}>Aucun étudiant trouvé</td></tr>
                        ) : students.map(s => (
                          <tr key={s.id} className={isDark ? '' : T.tr}>
                            <td className={isDark ? '' : T.td}>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden border-2 border-brand-500/30">
                                  {s.photo
                                    ? <img src={s.photo.startsWith('http') ? s.photo : `/storage/${s.photo}`} className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; e.target.parentNode.querySelector('span')?.style && (e.target.parentNode.querySelector('span').style.display='flex') }}/>
                                    : null}
                                  <span className={s.photo ? 'hidden' : ''}>{s.prenom?.[0] || 'E'}</span>
                                </div>
                                <div>
                                  <div className={`text-sm font-medium ${T.title}`}>{s.prenom} {s.nom}</div>
                                  <div className={`text-xs ${T.mute}`}>{s.user?.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className={isDark ? '' : T.td}>
                              <div className={`text-sm ${isDark?'text-white/70':'text-slate-600'}`}>{s.filiere?.nom}</div>
                              <div className={`text-xs ${T.mute}`}>{s.license?.nom}</div>
                            </td>
                            <td className={isDark ? '' : T.td}>
                              <span className={
                                s.statut_inscription === 'accepte' ? 'badge-accepted' :
                                s.statut_inscription === 'rejete'  ? 'badge-rejected' :
                                s.statut_inscription === 'en_attente_paiement' ? 'badge-payment' :
                                'badge-pending'
                              }>
                                {s.statut_inscription === 'accepte' ? 'Inscrit' :
                                 s.statut_inscription === 'rejete'  ? 'Rejeté' :
                                 s.statut_inscription === 'en_attente_paiement' ? '💳 Attente paiement' :
                                 'En attente'}
                              </span>
                            </td>
                            <td className={isDark ? '' : T.td}>
                              <span className={s.inscription_payee ? 'badge-paid' : 'badge-pending'}>{s.inscription_payee ? 'Payée' : 'Non payée'}</span>
                            </td>
                            <td className={`text-xs ${isDark ? T.mute : T.td}`}>{new Date(s.created_at).toLocaleDateString('fr-FR')}</td>
                            <td className={isDark ? '' : T.td}>
                              <div className="flex items-center gap-2">
                                <button onClick={() => setDrawerStudent(s)} className="text-brand-400 hover:text-brand-300 p-1.5 rounded-lg hover:bg-brand-500/10 transition-all" title="Voir"><Eye size={15}/></button>
                                {(s.statut_inscription === 'en_attente') && (
                                  <>
                                    <button onClick={() => { setModalStudent(s); setModalAction('accepter') }} className="text-emerald-400 hover:text-emerald-300 p-1.5 rounded-lg hover:bg-emerald-500/10 transition-all" title="Accepter le dossier"><Check size={15}/></button>
                                    <button onClick={() => { setModalStudent(s); setModalAction('rejeter') }} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-all" title="Rejeter la candidature"><X size={15}/></button>
                                  </>
                                )}
                                <button onClick={async () => {
                                  if (!window.confirm(`Supprimer ${s.prenom} ${s.nom} ?`)) return
                                  try { await deleteStudent(s.id); toast.success('Déplacé en corbeille'); loadStudents() }
                                  catch { toast.error('Erreur suppression') }
                                }} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all" title="Supprimer"><Trash2 size={15}/></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {pagination.last > 1 && (
                      <div className={`p-4 border-t ${T.divider} flex items-center justify-between`}>
                        <span className={`text-sm ${T.mute}`}>Page {pagination.current} / {pagination.last} — {pagination.total} étudiants</span>
                        <div className="flex gap-2">
                          {pagination.current > 1 && <button onClick={() => loadStudents(pagination.current - 1)} className="btn-secondary text-xs py-1.5 px-3">Précédent</button>}
                          {pagination.current < pagination.last && <button onClick={() => loadStudents(pagination.current + 1)} className="btn-primary text-xs py-1.5 px-3">Suivant</button>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PAIEMENTS */}
              {active === 'paiements' && (
                <div className={`${T.card} overflow-hidden`}>
                  <table className={T.table}>
                    <thead><tr>{['Étudiant','Type','Montant','Méthode','Date','Statut'].map(h => <th key={h} className={isDark?'':T.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {payments.length === 0
                        ? <tr><td colSpan={6} className={`text-center py-10 ${T.mute}`}>Aucun paiement</td></tr>
                        : payments.map(p => (
                          <tr key={p.id} className={isDark?'':T.tr}>
                            <td className={isDark?'':T.td}><div className={`text-sm ${T.title}`}>{p.student?.prenom} {p.student?.nom}</div><div className={`text-xs ${T.mute}`}>{p.student?.matricule}</div></td>
                            <td className={`text-sm ${isDark?'text-white/70':'text-slate-600 '+T.td}`}>{p.libelle || p.type}</td>
                            <td className={`font-semibold ${T.title} ${isDark?'':T.td}`}>{Number(p.montant).toLocaleString()} FCFA</td>
                            <td className={`text-sm ${isDark?'text-white/60':T.td}`}>{p.methode?.toUpperCase()}</td>
                            <td className={`text-xs ${isDark?T.mute:T.td}`}>{p.date_paiement ? new Date(p.date_paiement).toLocaleDateString('fr-FR') : '—'}</td>
                            <td className={isDark?'':T.td}><span className={p.statut === 'complete' ? 'badge-accepted' : 'badge-pending'}>{p.statut}</span></td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              )}

              {/* FILIERES */}
              {active === 'filieres' && (
                <div className="space-y-6">
                  {/* Toggle verrou pédagogique */}
                  <div className={`${T.card} p-4 flex items-center justify-between gap-4`}>
                    <div>
                      <div className={`font-semibold text-sm ${T.title} flex items-center gap-2`}>
                        {filiereLocked ? <Lock size={14} className="text-red-400"/> : <Shield size={14} className="text-emerald-400"/>}
                        Accueil Pédagogique — Droit de modification
                      </div>
                      <div className={`text-xs mt-0.5 ${T.mute}`}>
                        {filiereLocked ? 'Pédagogique ne peut pas modifier les filières ni les prix.' : 'Pédagogique peut modifier les filières et niveaux.'}
                      </div>
                    </div>
                    <button onClick={toggleFiliereLock} disabled={loadingLock}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-60 ${filiereLocked ? 'bg-red-500' : 'bg-emerald-500'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${filiereLocked ? 'translate-x-6' : 'translate-x-1'}`}/>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={`${T.card} p-5`}>
                      <h3 className={`font-semibold mb-4 flex items-center gap-2 ${T.title}`}><Plus size={16}/> Nouvelle filière</h3>
                      <div className="space-y-3">
                        <div><label className={T.label}>Nom</label><input className={T.input} value={newFiliere.nom} onChange={e => setNewFiliere({...newFiliere, nom: e.target.value})} placeholder="Informatique"/></div>
                        <div><label className={T.label}>Code</label><input className={T.input} value={newFiliere.code} onChange={e => setNewFiliere({...newFiliere, code: e.target.value})} placeholder="INFO"/></div>
                        <div><label className={T.label}>Description</label><textarea className={`${T.input} resize-none`} rows={2} value={newFiliere.description} onChange={e => setNewFiliere({...newFiliere, description: e.target.value})}/></div>
                        <button onClick={submitFiliere} className="btn-primary w-full text-sm">Créer la filière</button>
                      </div>
                    </div>
                    <div className={`${T.card} p-5`}>
                      <h3 className={`font-semibold mb-4 flex items-center gap-2 ${T.title}`}><Plus size={16}/> Nouveau niveau</h3>
                      <div className="space-y-3">
                        <div><label className={T.label}>Filière</label><select className={T.input} value={newLicense.filiere_id} onChange={e => setNewLicense({...newLicense, filiere_id: e.target.value})}><option value="">-- Choisir --</option>{filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}</select></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className={T.label}>Nom</label><input className={T.input} placeholder="Licence 1" value={newLicense.nom} onChange={e => setNewLicense({...newLicense, nom: e.target.value})}/></div>
                          <div><label className={T.label}>Code</label><input className={T.input} placeholder="L1" value={newLicense.code} onChange={e => setNewLicense({...newLicense, code: e.target.value})}/></div>
                          <div><label className={T.label}>Durée (ans)</label><input className={T.input} type="number" value={newLicense.duree_annees} onChange={e => setNewLicense({...newLicense, duree_annees: e.target.value})}/></div>
                          <div><label className={T.label}>Frais inscription</label><input className={T.input} type="number" placeholder="150000" value={newLicense.frais_inscription} onChange={e => setNewLicense({...newLicense, frais_inscription: e.target.value})}/></div>
                          <div className="col-span-2"><label className={T.label}>Mensualité</label><input className={T.input} type="number" placeholder="50000" value={newLicense.frais_mensuel} onChange={e => setNewLicense({...newLicense, frais_mensuel: e.target.value})}/></div>
                          <div>
                            <label className={T.label}>Mois début cours</label>
                            <select className={T.input} value={newLicense.mois_debut} onChange={e => setNewLicense({...newLicense, mois_debut: e.target.value})}>
                              {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={T.label}>Mois fin cours</label>
                            <select className={T.input} value={newLicense.mois_fin} onChange={e => setNewLicense({...newLicense, mois_fin: e.target.value})}>
                              {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
                            </select>
                          </div>
                        </div>
                        <button onClick={submitLicense} className="btn-primary w-full text-sm">Ajouter le niveau</button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {filieres.map(f => (
                      <div key={f.id} className={`${T.card} p-4`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className={`font-semibold ${T.title}`}>{f.nom}</span>
                            <span className="ml-2 text-xs bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded">{f.code}</span>
                            {f.description && <p className={`text-xs mt-0.5 ${T.mute}`}>{f.description}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => downloadAdminList(f.id, null, f.code)} disabled={dlListId === `f${f.id}`} className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${isDark?'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10':'border-emerald-500 text-emerald-600 hover:bg-emerald-50'} disabled:opacity-50`} title="Télécharger liste complète">
                              {dlListId === `f${f.id}` ? <RefreshCw size={12} className="animate-spin"/> : <Download size={12}/>} Tous
                            </button>
                            <button onClick={() => setEditingFiliere({ id: f.id, nom: f.nom, code: f.code, description: f.description || '' })} className={`p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-400 transition-colors`} title="Modifier"><Pencil size={14}/></button>
                            <button onClick={() => handleDeleteFiliere(f.id)} className={`p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors`} title="Supprimer"><Trash2 size={14}/></button>
                          </div>
                        </div>
                        {f.licenses?.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {f.licenses.map(l => (
                              <div key={l.id} className={`rounded-lg p-3 ${isDark?'bg-white/5':'bg-slate-50 border border-slate-200'}`}>
                                <div className="flex items-center justify-between mb-1">
                                  <div className={`text-sm font-medium ${T.title}`}>{l.nom}</div>
                                  <div className="flex gap-1">
                                    <button onClick={() => downloadAdminList(f.id, l.id, f.code, l.code)} disabled={dlListId === `l${l.id}`} className={`p-1 rounded transition-colors ${isDark?'text-emerald-400 hover:bg-emerald-500/10':'text-emerald-600 hover:bg-emerald-50'} disabled:opacity-50`} title="Liste PDF"><Download size={12}/></button>
                                    <button onClick={() => setEditingLicense({ id: l.id, filiere_id: l.filiere_id, nom: l.nom, mois_debut: l.mois_debut||9, mois_fin: l.mois_fin||6, frais_inscription: l.frais_inscription, frais_mensuel: l.frais_mensuel })} className="p-1 rounded hover:bg-amber-500/10 text-amber-400 transition-colors" title="Modifier"><Pencil size={12}/></button>
                                    <button onClick={() => handleDeleteLicense(l.id)} className="p-1 rounded hover:bg-red-500/10 text-red-400 transition-colors" title="Supprimer"><Trash2 size={12}/></button>
                                  </div>
                                </div>
                                <div className={`text-xs ${T.mute}`}>Inscription : {Number(l.frais_inscription).toLocaleString()} FCFA</div>
                                <div className={`text-xs ${T.mute}`}>Mensualité : {Number(l.frais_mensuel).toLocaleString()} FCFA</div>
                                {(l.mois_debut || l.mois_fin) && (
                                  <div className={`text-xs mt-1 ${T.mute}`}>
                                    {['','Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][l.mois_debut||9]} → {['','Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][l.mois_fin||6]}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MODAL EDIT LICENSE */}
              <AnimatePresence>
                {editingLicense && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className={`${T.card} p-6 w-full max-w-md shadow-2xl`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`font-bold text-lg ${T.title}`}>Modifier le niveau</h3>
                        <button onClick={() => setEditingLicense(null)} className={`p-1.5 rounded-lg hover:bg-white/10 ${T.mute}`}><X size={16}/></button>
                      </div>
                      <div className="space-y-3">
                        <div><label className={T.label}>Nom du niveau</label><input className={T.input} value={editingLicense.nom} onChange={e => setEditingLicense({...editingLicense, nom: e.target.value})}/></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className={T.label}>Mois début</label>
                            <select className={T.input} value={editingLicense.mois_debut} onChange={e => setEditingLicense({...editingLicense, mois_debut: Number(e.target.value)})}>
                              {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
                            </select>
                          </div>
                          <div><label className={T.label}>Mois fin</label>
                            <select className={T.input} value={editingLicense.mois_fin} onChange={e => setEditingLicense({...editingLicense, mois_fin: Number(e.target.value)})}>
                              {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
                            </select>
                          </div>
                          <div><label className={T.label}>Frais inscription (FCFA)</label><input className={T.input} type="number" value={editingLicense.frais_inscription} onChange={e => setEditingLicense({...editingLicense, frais_inscription: e.target.value})}/></div>
                          <div><label className={T.label}>Mensualité (FCFA)</label><input className={T.input} type="number" value={editingLicense.frais_mensuel} onChange={e => setEditingLicense({...editingLicense, frais_mensuel: e.target.value})}/></div>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-5">
                        <button onClick={() => setEditingLicense(null)} className="btn-secondary flex-1 text-sm">Annuler</button>
                        <button onClick={handleSaveLicense} disabled={savingEdit} className="btn-primary flex-1 text-sm">{savingEdit ? 'Enregistrement…' : 'Enregistrer'}</button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* MODAL EDIT FILIERE */}
              <AnimatePresence>
                {editingFiliere && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className={`${T.card} p-6 w-full max-w-md shadow-2xl`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`font-bold text-lg ${T.title}`}>Modifier la filière</h3>
                        <button onClick={() => setEditingFiliere(null)} className={`p-1.5 rounded-lg hover:bg-white/10 ${T.mute}`}><X size={16}/></button>
                      </div>
                      <div className="space-y-3">
                        <div><label className={T.label}>Nom</label><input className={T.input} value={editingFiliere.nom} onChange={e => setEditingFiliere({...editingFiliere, nom: e.target.value})}/></div>
                        <div><label className={T.label}>Code</label><input className={T.input} value={editingFiliere.code} onChange={e => setEditingFiliere({...editingFiliere, code: e.target.value})}/></div>
                        <div><label className={T.label}>Description</label><textarea className={`${T.input} resize-none`} rows={2} value={editingFiliere.description} onChange={e => setEditingFiliere({...editingFiliere, description: e.target.value})}/></div>
                      </div>
                      <div className="flex gap-3 mt-5">
                        <button onClick={() => setEditingFiliere(null)} className="btn-secondary flex-1 text-sm">Annuler</button>
                        <button onClick={handleSaveFiliere} disabled={savingEdit} className="btn-primary flex-1 text-sm">{savingEdit ? 'Enregistrement…' : 'Enregistrer'}</button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* STAFF */}
              {active === 'staff' && (
                <div className="space-y-4">
                  <button onClick={() => setShowCreateStaff(true)} className="btn-primary flex items-center gap-2"><UserPlus size={16}/> Créer un compte</button>
                  {showCreateStaff && (
                    <div className={`${T.card} p-5 neon-border`}>
                      <h3 className={`font-semibold mb-4 ${T.title}`}>Nouveau membre de l'équipe</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className={T.label}>Nom complet</label><input className={T.input} value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})}/></div>
                        <div><label className={T.label}>Email</label><input className={T.input} type="email" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})}/></div>
                        <div><label className={T.label}>Rôle</label><select className={T.input} value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})}><option value="admin">Administrateur</option><option value="cashier">Caissier</option><option value="accueil">Accueil</option><option value="pedagogique">Accueil Pédagogique</option></select></div>
                        <div><label className={T.label}>Mot de passe</label><input className={T.input} type="password" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})}/></div>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button onClick={() => setShowCreateStaff(false)} className="btn-secondary text-sm">Annuler</button>
                        <button onClick={submitStaff} className="btn-primary text-sm">Créer le compte</button>
                      </div>
                    </div>
                  )}
                  <div className={`${T.card} overflow-hidden`}>
                    <table className={T.table}>
                      <thead><tr>{['Nom','Email','Rôle','Statut'].map(h=><th key={h} className={isDark?'':T.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {staff.map(s => (
                          <tr key={s.id} className={isDark?'':T.tr}>
                            <td className={`font-medium ${T.title} ${isDark?'':T.td}`}>{s.name}</td>
                            <td className={`text-sm ${isDark?'text-white/60':T.td}`}>{s.email}</td>
                            <td className={isDark?'':T.td}>
                              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${s.role==='admin'?'bg-red-500/20 text-red-300':s.role==='cashier'?'bg-emerald-500/20 text-emerald-300':'bg-blue-500/20 text-blue-300'}`}>
                                {s.role==='admin'?'Admin':s.role==='cashier'?'Caissier':s.role==='pedagogique'?'Pédagogique':'Accueil'}
                              </span>
                            </td>
                            <td className={isDark?'':T.td}><span className={s.actif ? 'badge-accepted' : 'badge-rejected'}>{s.actif ? 'Actif' : 'Inactif'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Zone Danger */}
                  <div className={`border-2 border-red-500/40 rounded-xl p-5 ${isDark?'bg-red-500/5':'bg-red-50'}`}>
                    <h3 className="font-semibold text-red-500 flex items-center gap-2 mb-2"><AlertTriangle size={16}/> Zone Danger</h3>
                    <p className={`text-xs mb-4 ${T.mute}`}>Supprime tous les étudiants, paiements, notifications et PDFs générés. Les comptes utilisateurs, filières et niveaux sont conservés.</p>
                    {!resetConfirm ? (
                      <button onClick={() => setResetConfirm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 font-semibold text-sm transition-colors">
                        <Trash2 size={14}/> Réinitialiser toutes les données test
                      </button>
                    ) : (
                      <div className={`${T.card} p-4 border border-red-500/50 mt-3`}>
                        <p className="text-red-400 font-semibold text-sm mb-3">Êtes-vous sûr ? Cette action est irréversible.</p>
                        <div className="flex gap-3">
                          <button onClick={() => setResetConfirm(false)} className="btn-secondary text-sm">Annuler</button>
                          <button disabled={resetting} onClick={async () => {
                            setResetting(true)
                            try {
                              await resetDonneesTest()
                              toast.success('Données réinitialisées avec succès')
                              setResetConfirm(false)
                            } catch { toast.error('Erreur lors de la réinitialisation') }
                            finally { setResetting(false) }
                          }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-50 transition-colors">
                            <Trash2 size={14}/>{resetting ? 'Suppression...' : 'Confirmer la suppression'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FORMATEURS - désactivé temporairement */}
              {false && active === 'formateurs' && (
                <div className="space-y-6">
                  <div className={`${T.card} p-5`}>
                    <h3 className={`font-semibold mb-4 flex items-center gap-2 ${T.title}`}><Plus size={16}/> Ajouter un formateur</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={T.label}>Prénom *</label><input className={T.input} value={newFormateur.prenom} onChange={e => setNewFormateur({...newFormateur, prenom: e.target.value})}/></div>
                      <div><label className={T.label}>Nom *</label><input className={T.input} value={newFormateur.nom} onChange={e => setNewFormateur({...newFormateur, nom: e.target.value})}/></div>
                      <div><label className={T.label}>Titre</label><select className={T.input} value={newFormateur.titre} onChange={e => setNewFormateur({...newFormateur, titre: e.target.value})}>{['M.','Mme.','Dr.','Prof.','Ing.'].map(t=><option key={t}>{t}</option>)}</select></div>
                      <div><label className={T.label}>Spécialité *</label><input className={T.input} value={newFormateur.specialite} onChange={e => setNewFormateur({...newFormateur, specialite: e.target.value})} placeholder="Ex: Intelligence Artificielle"/></div>
                      <div><label className={T.label}>Email</label><input className={T.input} type="email" value={newFormateur.email} onChange={e => setNewFormateur({...newFormateur, email: e.target.value})}/></div>
                      <div><label className={T.label}>LinkedIn</label><input className={T.input} value={newFormateur.linkedin} onChange={e => setNewFormateur({...newFormateur, linkedin: e.target.value})} placeholder="https://..."/></div>
                      <div className="col-span-2"><label className={T.label}>Biographie</label><textarea className={`${T.input} resize-none`} rows={2} value={newFormateur.bio} onChange={e => setNewFormateur({...newFormateur, bio: e.target.value})}/></div>
                      <div><label className={T.label}>Photo</label><input type="file" accept="image/*" onChange={e => setFormateurPhoto(e.target.files[0])} className={`text-sm ${T.mute}`}/></div>
                      <div><label className={T.label}>Ordre d'affichage</label><input className={T.input} type="number" value={newFormateur.ordre} onChange={e => setNewFormateur({...newFormateur, ordre: e.target.value})}/></div>
                    </div>
                    <button onClick={async () => {
                      try {
                        const fd = new FormData()
                        Object.entries(newFormateur).forEach(([k,v]) => fd.append(k, v))
                        if (formateurPhoto) fd.append('photo', formateurPhoto)
                        await adminCreateFormateur(fd)
                        toast.success('Formateur ajouté !')
                        setNewFormateur({ nom:'', prenom:'', titre:'M.', specialite:'', bio:'', email:'', linkedin:'', ordre:0 })
                        setFormateurPhoto(null)
                        adminGetFormateurs().then(({data}) => setFormateurs(data))
                      } catch { toast.error('Erreur') }
                    }} className="btn-primary mt-4 text-sm">Ajouter le formateur</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {formateurs.map(f => (
                      <div key={f.id} className={`${T.card} p-4 flex items-start gap-3`}>
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {f.photo ? <img src={f.photo} className="w-full h-full object-cover" alt={f.nom}/> : <span className="text-white font-bold">{f.prenom?.[0]}{f.nom?.[0]}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold text-sm ${T.title}`}>{f.titre} {f.prenom} {f.nom}</div>
                          <div className="text-brand-400 text-xs">{f.specialite}</div>
                          {f.email && <div className={`text-xs ${T.mute}`}>{f.email}</div>}
                        </div>
                        <button onClick={async () => { await adminDeleteFormateur(f.id); setFormateurs(frs => frs.filter(x => x.id !== f.id)); toast.success('Supprimé') }}
                          className="text-red-400 hover:text-red-300 p-1.5 flex-shrink-0"><Trash2 size={15}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MEMBRES - désactivé temporairement */}
              {false && active === 'membres' && (
                <div className="space-y-6">
                  <div className={`${T.card} p-5`}>
                    <h3 className={`font-semibold mb-4 flex items-center gap-2 ${T.title}`}><Plus size={16}/> Ajouter un membre</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={T.label}>Prénom *</label><input className={T.input} value={newMembre.prenom} onChange={e => setNewMembre({...newMembre, prenom: e.target.value})}/></div>
                      <div><label className={T.label}>Nom *</label><input className={T.input} value={newMembre.nom} onChange={e => setNewMembre({...newMembre, nom: e.target.value})}/></div>
                      <div><label className={T.label}>Titre</label><select className={T.input} value={newMembre.titre} onChange={e => setNewMembre({...newMembre, titre: e.target.value})}>{['M.','Mme.','Dr.','Prof.'].map(t=><option key={t}>{t}</option>)}</select></div>
                      <div><label className={T.label}>Poste *</label><input className={T.input} value={newMembre.poste} onChange={e => setNewMembre({...newMembre, poste: e.target.value})} placeholder="Ex: Directeur Général"/></div>
                      <div><label className={T.label}>Email</label><input className={T.input} type="email" value={newMembre.email} onChange={e => setNewMembre({...newMembre, email: e.target.value})}/></div>
                      <div><label className={T.label}>Photo</label><input type="file" accept="image/*" onChange={e => setMembrePhoto(e.target.files[0])} className={`text-sm ${T.mute}`}/></div>
                    </div>
                    <button onClick={async () => {
                      try {
                        const fd = new FormData()
                        Object.entries(newMembre).forEach(([k,v]) => fd.append(k, v))
                        if (membrePhoto) fd.append('photo', membrePhoto)
                        await adminCreateMembre(fd)
                        toast.success('Membre ajouté !')
                        setNewMembre({ nom:'', prenom:'', titre:'M.', poste:'', email:'', ordre:0 })
                        setMembrePhoto(null)
                        adminGetMembres().then(({data}) => setMembres(data))
                      } catch { toast.error('Erreur') }
                    }} className="btn-primary mt-4 text-sm">Ajouter le membre</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {membres.map(m => (
                      <div key={m.id} className={`${T.card} p-4 flex items-start gap-3`}>
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {m.photo ? <img src={m.photo} className="w-full h-full object-cover" alt={m.nom}/> : <Building2 size={20} className="text-white"/>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold text-sm ${T.title}`}>{m.titre} {m.prenom} {m.nom}</div>
                          <div className="text-indigo-400 text-xs">{m.poste}</div>
                          {m.email && <div className={`text-xs ${T.mute}`}>{m.email}</div>}
                        </div>
                        <button onClick={async () => { await adminDeleteMembre(m.id); setMembres(ms => ms.filter(x => x.id !== m.id)); toast.success('Supprimé') }}
                          className="text-red-400 hover:text-red-300 p-1.5 flex-shrink-0"><Trash2 size={15}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PARTENAIRES - désactivé temporairement */}
              {false && active === 'partenaires' && (
                <div className="space-y-6">
                  <div className={`${T.card} p-5`}>
                    <h3 className={`font-semibold mb-4 flex items-center gap-2 ${T.title}`}><Plus size={16}/> Ajouter un partenaire</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={T.label}>Nom *</label><input className={T.input} value={newPartenaire.nom} onChange={e => setNewPartenaire({...newPartenaire, nom: e.target.value})}/></div>
                      <div><label className={T.label}>Site web</label><input className={T.input} value={newPartenaire.site_web} onChange={e => setNewPartenaire({...newPartenaire, site_web: e.target.value})} placeholder="https://..."/></div>
                      <div className="col-span-2"><label className={T.label}>Description</label><input className={T.input} value={newPartenaire.description} onChange={e => setNewPartenaire({...newPartenaire, description: e.target.value})}/></div>
                      <div><label className={T.label}>Logo (image)</label><input type="file" accept="image/*" onChange={e => setPartenaireLogo(e.target.files[0])} className={`text-sm ${T.mute}`}/></div>
                    </div>
                    <button onClick={async () => {
                      try {
                        const fd = new FormData()
                        Object.entries(newPartenaire).forEach(([k,v]) => fd.append(k, v))
                        if (partenaireLogo) fd.append('logo', partenaireLogo)
                        await adminCreatePartenaire(fd)
                        toast.success('Partenaire ajouté !')
                        setNewPartenaire({ nom:'', description:'', site_web:'', ordre:0 })
                        setPartenaireLogo(null)
                        adminGetPartenaires().then(({data}) => setPartenaires(data))
                      } catch { toast.error('Erreur') }
                    }} className="btn-primary mt-4 text-sm">Ajouter le partenaire</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {partenaires.map(p => (
                      <div key={p.id} className={`${T.card} p-4 flex flex-col items-center gap-2 relative`}>
                        <div className="w-20 h-16 flex items-center justify-center">
                          {p.logo ? <img src={p.logo} className="max-h-full max-w-full object-contain" alt={p.nom}/> : <Handshake size={32} className="text-brand-400"/>}
                        </div>
                        <div className={`text-sm font-semibold text-center ${T.title}`}>{p.nom}</div>
                        {p.site_web && <a href={p.site_web} target="_blank" rel="noopener noreferrer" className="text-brand-400 text-xs">Visiter</a>}
                        <button onClick={async () => { await adminDeletePartenaire(p.id); setPartenaires(ps => ps.filter(x => x.id !== p.id)); toast.success('Supprimé') }}
                          className="absolute top-2 right-2 text-red-400 hover:text-red-300"><Trash2 size={14}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TEMOIGNAGES - désactivé temporairement */}
              {false && active === 'temoignages' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className={`text-sm ${T.mute}`}>{temoignages.length} témoignage{temoignages.length !== 1 ? 's' : ''} au total</div>
                    <span className="text-emerald-400 text-sm">· {temoignages.filter(t => t.approuve).length} approuvé{temoignages.filter(t => t.approuve).length !== 1 ? 's' : ''}</span>
                    <span className="text-amber-400 text-sm">· {temoignages.filter(t => !t.approuve).length} en attente</span>
                  </div>
                  <div className="space-y-3">
                    {temoignages.map(t => (
                      <div key={t.id} className={`${T.card} p-4 flex items-start gap-4`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`font-semibold text-sm ${T.title}`}>{t.nom}</span>
                            {t.filiere && <span className="text-brand-400 text-xs">{t.filiere}</span>}
                            {t.annee_diplome && <span className={`text-xs ${T.mute}`}>{t.annee_diplome}</span>}
                            <div className="flex gap-0.5 ml-auto">
                              {[1,2,3,4,5].map(i => <Star key={i} size={12} className={i <= t.note ? 'text-amber-400 fill-amber-400' : 'text-white/20'}/>)}
                            </div>
                          </div>
                          <p className={`text-sm leading-relaxed line-clamp-3 ${isDark?'text-white/60':'text-slate-600'}`}>{t.contenu}</p>
                          <div className={`text-xs mt-1 ${T.mute}`}>{new Date(t.created_at).toLocaleDateString('fr-FR')}</div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {!t.approuve && (
                            <button onClick={async () => {
                              await adminApprouverTemoignage(t.id)
                              setTemoignages(ts => ts.map(x => x.id === t.id ? {...x, approuve: true} : x))
                              toast.success('Approuvé !')
                            }} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-lg transition-all">
                              <ThumbsUp size={12}/> Approuver
                            </button>
                          )}
                          {t.approuve && <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">✓ Publié</span>}
                          <button onClick={async () => { await adminDeleteTemoignage(t.id); setTemoignages(ts => ts.filter(x => x.id !== t.id)); toast.success('Supprimé') }}
                            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-red-500/10 px-2 py-1 rounded-lg transition-all">
                            <Trash2 size={12}/> Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                    {temoignages.length === 0 && <p className={`text-center py-10 ${T.mute}`}>Aucun témoignage reçu</p>}
                  </div>
                </div>
              )}

              {/* NEWSLETTER - désactivé temporairement */}
              {false && active === 'newsletter' && (
                <div className="space-y-4">
                  <div className={`text-sm ${T.mute}`}>{newsletterSubs.length} abonné{newsletterSubs.length !== 1 ? 's' : ''}</div>
                  <div className={`${T.card} overflow-hidden`}>
                    <table className={T.table}>
                      <thead><tr>{['Email','Nom','Statut','Date'].map(h=><th key={h} className={isDark?'':T.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {newsletterSubs.length === 0
                          ? <tr><td colSpan={4} className={`text-center py-10 ${T.mute}`}>Aucun abonné</td></tr>
                          : newsletterSubs.map(s => (
                            <tr key={s.id} className={isDark?'':T.tr}>
                              <td className={`text-sm ${T.title} ${isDark?'':T.td}`}>{s.email}</td>
                              <td className={`text-sm ${isDark?'text-white/60':T.td}`}>{s.nom || '—'}</td>
                              <td className={isDark?'':T.td}><span className={s.actif ? 'badge-accepted' : 'badge-rejected'}>{s.actif ? 'Actif' : 'Inactif'}</span></td>
                              <td className={`text-xs ${isDark?T.mute:T.td}`}>{new Date(s.created_at).toLocaleDateString('fr-FR')}</td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* MOIS DESACTIVES */}
              {active === 'mois' && (
                <div className="space-y-5 max-w-3xl">
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-purple-900/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
                    <p className={`text-sm ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                      <strong>Mois désactivés</strong> — Les mois sélectionnés ne seront pas comptabilisés dans les mensualités requises. Les étudiants n'auront pas à payer ces mois-là (vacances, périodes spéciales…).
                    </p>
                  </div>

                  {/* Sélecteur d'année */}
                  {(() => {
                    const year = new Date().getFullYear()
                    const years = [year - 1, year, year + 1]
                    const moisLabels = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

                    const isDesactive = (mois) => moisDesactives.some(m => m.mois === mois)

                    const toggleMois = async (mois) => {
                      if (moisToggling === mois) return
                      setMoisToggling(mois)
                      try {
                        const motif = isDesactive(mois) ? undefined : window.prompt('Raison de désactivation (optionnel) :', '') ?? undefined
                        await adminToggleMoisDesactive({ mois, raison: motif })
                        adminGetMoisDesactives().then(({ data }) => setMoisDesactives(data))
                        toast.success(isDesactive(mois) ? `${mois} réactivé` : `${mois} désactivé`)
                      } catch { toast.error('Erreur') } finally { setMoisToggling('') }
                    }

                    return years.map(y => (
                      <div key={y} className={`${T.card} p-5`}>
                        <h3 className={`font-bold mb-4 ${T.title}`}>{y}</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                          {moisLabels.map((label, idx) => {
                            const moisKey = `${y}-${String(idx + 1).padStart(2, '0')}`
                            const desactive = isDesactive(moisKey)
                            const loading   = moisToggling === moisKey
                            return (
                              <button key={moisKey} onClick={() => toggleMois(moisKey)} disabled={loading}
                                className={`relative p-3 rounded-xl text-center transition-all border text-sm font-semibold ${
                                  desactive
                                    ? isDark ? 'bg-red-900/30 border-red-500/40 text-red-300' : 'bg-red-50 border-red-300 text-red-600'
                                    : isDark ? 'bg-white/5 border-white/10 text-white/60 hover:bg-green-900/20 hover:border-green-500/30 hover:text-green-300'
                                             : 'bg-white border-slate-200 text-slate-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700'
                                }`}>
                                {loading
                                  ? <div className="spinner mx-auto w-4 h-4"/>
                                  : <>
                                      <div>{label.slice(0, 3)}</div>
                                      <div className="text-[10px] mt-0.5 opacity-60">{desactive ? '🚫' : '✅'}</div>
                                    </>
                                }
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))
                  })()}

                  {moisDesactives.length > 0 && (
                    <div className={`${T.card} p-4`}>
                      <h4 className={`font-semibold text-sm mb-3 ${T.title}`}>Mois actuellement désactivés ({moisDesactives.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {moisDesactives.map(m => (
                          <div key={m.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-red-900/20 border border-red-500/30 text-red-300' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                            <span>🚫 {m.mois}</span>
                            {m.raison && <span className="opacity-60">— {m.raison}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CORBEILLE */}
              {active === 'corbeille' && (
                <div className="space-y-4">
                  <div className={`flex items-center gap-3 p-4 rounded-xl border ${isDark ? 'bg-red-900/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                    <Trash2 size={18} className="text-red-400 flex-shrink-0"/>
                    <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                      Les étudiants supprimés peuvent être restaurés ou supprimés définitivement. La suppression définitive est irréversible.
                    </p>
                  </div>
                  <div className={`${T.card} overflow-hidden`}>
                    <table className={T.table}>
                      <thead>
                        <tr>
                          {['Étudiant', 'Filière', 'Statut', 'Supprimé le', 'Actions'].map(h => (
                            <th key={h} className={isDark ? '' : T.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {trashLoading ? (
                          <tr><td colSpan={5} className="text-center py-10"><div className="spinner mx-auto"/></td></tr>
                        ) : trash.length === 0 ? (
                          <tr><td colSpan={5} className={`text-center py-10 ${T.mute}`}>Corbeille vide</td></tr>
                        ) : trash.map(s => (
                          <tr key={s.id} className={isDark ? '' : T.tr}>
                            <td className={isDark ? '' : T.td}>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 opacity-60">
                                  {s.prenom?.[0] || 'E'}
                                </div>
                                <div>
                                  <div className={`text-sm font-medium line-through opacity-60 ${T.title}`}>{s.prenom} {s.nom}</div>
                                  <div className={`text-xs ${T.mute}`}>{s.user?.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className={isDark ? '' : T.td}>
                              <div className={`text-sm opacity-60 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>{s.filiere?.nom || '—'}</div>
                              <div className={`text-xs ${T.mute}`}>{s.license?.nom}</div>
                            </td>
                            <td className={isDark ? '' : T.td}>
                              <span className={
                                s.statut_inscription === 'accepte' ? 'badge-accepted' :
                                s.statut_inscription === 'rejete'  ? 'badge-rejected' :
                                s.statut_inscription === 'en_attente_paiement' ? 'badge-payment' :
                                'badge-pending'
                              }>
                                {s.statut_inscription === 'accepte' ? 'Inscrit' :
                                 s.statut_inscription === 'rejete'  ? 'Rejeté' :
                                 s.statut_inscription === 'en_attente_paiement' ? '💳 Attente paiement' :
                                 'En attente'}
                              </span>
                            </td>
                            <td className={`text-xs ${isDark ? T.mute : T.td}`}>{s.deleted_at ? new Date(s.deleted_at).toLocaleDateString('fr-FR') : '—'}</td>
                            <td className={isDark ? '' : T.td}>
                              <div className="flex items-center gap-2">
                                <button onClick={async () => {
                                  try { await restoreStudent(s.id); toast.success(`${s.prenom} ${s.nom} restauré !`); setTrash(t => t.filter(x => x.id !== s.id)); getAdminStats().then(({ data }) => setStats(data)).catch(() => {}) }
                                  catch { toast.error('Erreur restauration') }
                                }} className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-all font-medium">
                                  <RefreshCw size={13}/> Restaurer
                                </button>
                                <button onClick={async () => {
                                  if (!window.confirm(`Supprimer définitivement ${s.prenom} ${s.nom} ? Cette action est irréversible.`)) return
                                  try { await forceDeleteStudent(s.id); toast.success('Supprimé définitivement'); setTrash(t => t.filter(x => x.id !== s.id)) }
                                  catch { toast.error('Erreur') }
                                }} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-all font-medium">
                                  <Trash2 size={13}/> Supprimer définitivement
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* RESEAUX SOCIAUX - désactivé temporairement */}
              {false && active === 'social' && (
                <div className="max-w-xl">
                  <div className={`${T.card} p-6 space-y-4`}>
                    <h3 className={`font-semibold mb-2 ${T.title}`}>Liens réseaux sociaux</h3>
                    <p className={`text-xs mb-4 ${T.mute}`}>Ces liens apparaîtront dans le footer de la page d'accueil.</p>
                    {[
                      { key: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/isisuptech' },
                      { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/isisuptech' },
                      { key: 'tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@isisuptech' },
                      { key: 'youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/@isisuptech' },
                      { key: 'linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/company/isisuptech' },
                      { key: 'twitter',   label: 'Twitter/X', placeholder: 'https://twitter.com/isisuptech' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className={T.label}>{label}</label>
                        <input className={T.input} type="url" placeholder={placeholder}
                          value={socialLinks[key] || ''} onChange={e => setSocialLinks(s => ({...s, [key]: e.target.value}))}/>
                      </div>
                    ))}
                    <button onClick={async () => {
                      try { await api.post('/admin/contenu/social', socialLinks); toast.success('Réseaux sociaux mis à jour !') }
                      catch { toast.error('Erreur') }
                    }} className="btn-primary w-full mt-2">Enregistrer les liens</button>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modalStudent && (
          <ActionModal student={modalStudent} action={modalAction} isDark={isDark}
            onClose={() => { setModalStudent(null); setModalAction(null) }} onDone={loadStudents}/>
        )}
        {drawerStudent && (
          <StudentDrawer student={drawerStudent} isDark={isDark}
            onClose={() => setDrawerStudent(null)} onRefresh={loadStudents}/>
        )}
      </AnimatePresence>
    </div>
  )
}
