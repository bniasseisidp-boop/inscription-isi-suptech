import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Users, BookOpen, CreditCard, LogOut,
  Search, Check, X, Eye, UserPlus, RefreshCw,
  Clock, Award, Plus, FileText, Image, Handshake,
  MessageSquare, Mail, Share2, Trash2, ThumbsUp, Star,
  GraduationCap, Building2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  getAdminStats, getAdminStudents, acceptStudent, rejectStudent,
  generateStudentCard, getAdminPayments, getFilieres, createFiliere,
  createLicense, getStaff, createStaff,
  adminGetFormateurs, adminCreateFormateur, adminDeleteFormateur,
  adminGetMembres, adminCreateMembre, adminDeleteMembre,
  adminGetPartenaires, adminCreatePartenaire, adminDeletePartenaire,
  adminGetTemoignages, adminApprouverTemoignage, adminDeleteTemoignage,
  adminGetNewsletter,
} from '../services/api'
import api from '../services/api'

// ── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard',   label: 'Tableau de bord',    icon: LayoutDashboard },
  { id: 'etudiants',   label: 'Étudiants',           icon: Users },
  { id: 'paiements',   label: 'Paiements',            icon: CreditCard },
  { id: 'filieres',    label: 'Filières & Licences',  icon: BookOpen },
  { id: 'staff',       label: 'Équipe',               icon: Award },
  { id: 'formateurs',  label: 'Formateurs',            icon: GraduationCap },
  { id: 'membres',     label: 'Membres admins',        icon: Building2 },
  { id: 'partenaires', label: 'Partenaires',           icon: Handshake },
  { id: 'temoignages', label: 'Témoignages',           icon: MessageSquare },
  { id: 'newsletter',  label: 'Newsletter',            icon: Mail },
  { id: 'social',      label: 'Réseaux sociaux',       icon: Share2 },
]

function Sidebar({ active, setActive, onLogout }) {
  return (
    <div className="w-64 flex-shrink-0 bg-navy-800/70 backdrop-blur-xl border-r border-white/10 flex flex-col fixed top-0 left-0 h-full z-40">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center">
            <span className="text-white font-black text-sm">ISI</span>
          </div>
          <div>
            <div className="text-white font-bold">ISI SUPTECH</div>
            <div className="text-red-400 text-xs font-medium">Administration</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon
          return (
            <button key={item.id} onClick={() => setActive(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                active === item.id ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30' : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={17} />{item.label}
            </button>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all">
          <LogOut size={17} /> Déconnexion
        </button>
      </div>
    </div>
  )
}

// ── Stats card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color = 'brand', sub }) {
  const colors = {
    brand:  'bg-brand-600/20 border-brand-500/20 text-brand-400',
    green:  'bg-green-600/20 border-green-500/20 text-green-400',
    yellow: 'bg-yellow-600/20 border-yellow-500/20 text-yellow-400',
    red:    'bg-red-600/20 border-red-500/20 text-red-400',
  }
  return (
    <div className={`glass-card p-5 border ${colors[color]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}><Icon size={20} /></div>
      </div>
      <div className="text-3xl font-black text-white">{value ?? '—'}</div>
      <div className="text-white/60 text-sm mt-1">{label}</div>
      {sub && <div className="text-white/30 text-xs mt-0.5">{sub}</div>}
    </div>
  )
}

// ── Accept/Reject modal ───────────────────────────────────────────────────────
function ActionModal({ student, action, onClose, onDone }) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (action === 'rejeter' && !value.trim()) { toast.error('Veuillez indiquer un motif'); return }
    setLoading(true)
    try {
      if (action === 'accepter') {
        await acceptStudent(student.id, { notes: value })
        toast.success('Inscription acceptée — email envoyé !')
      } else {
        await rejectStudent(student.id, { motif: value })
        toast.success('Inscription rejetée')
      }
      onDone()
      onClose()
    } catch (e) {
      toast.error('Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative glass-card p-6 w-full max-w-md neon-border">
        <h3 className="text-white font-bold text-lg mb-2">
          {action === 'accepter' ? '✅ Accepter l\'inscription' : '❌ Rejeter la candidature'}
        </h3>
        <p className="text-white/60 text-sm mb-4">
          Étudiant : <strong className="text-white">{student.prenom} {student.nom}</strong>
        </p>
        <label className="form-label">{action === 'accepter' ? 'Notes (optionnel)' : 'Motif du rejet *'}</label>
        <textarea
          className="form-input resize-none"
          rows={3}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={action === 'accepter' ? 'Félicitations, notes spéciales...' : 'Dossier incomplet, critères non remplis...'}
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button onClick={handle} disabled={loading} className={`flex-1 flex items-center justify-center gap-2 font-semibold py-2.5 rounded-xl ${action === 'accepter' ? 'btn-primary' : 'btn-danger'}`}>
            {loading ? <div className="spinner w-4 h-4" /> : action === 'accepter' ? <Check size={16} /> : <X size={16} />}
            Confirmer
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Student detail drawer ──────────────────────────────────────────────────────
function StudentDrawer({ student, onClose, onRefresh }) {
  const [genCard, setGenCard] = useState(false)

  const handleGenCard = async () => {
    setGenCard(true)
    try {
      await generateStudentCard(student.id)
      toast.success('Carte générée et envoyée !')
      onRefresh()
    } catch {
      toast.error('Erreur génération carte')
    } finally {
      setGenCard(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-lg bg-navy-800 border-l border-white/10 h-full overflow-y-auto flex flex-col"
      >
        <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-navy-800 z-10">
          <h3 className="text-white font-bold">Dossier étudiant</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-5 flex-1 space-y-5">
          {/* Photo & identity */}
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center overflow-hidden flex-shrink-0">
              {student.photo
                ? <img src={`/storage/${student.photo}`} className="w-full h-full object-cover" />
                : <span className="text-white text-3xl">👤</span>
              }
            </div>
            <div>
              <h2 className="text-white font-black text-xl">{student.prenom} {student.nom}</h2>
              <p className="text-brand-400 font-mono text-sm">{student.matricule || 'Sans matricule'}</p>
              <p className="text-white/50 text-sm mt-1">{student.user?.email}</p>
              <div className="mt-2">
                <span className={student.statut_inscription === 'accepte' ? 'badge-accepted' : student.statut_inscription === 'rejete' ? 'badge-rejected' : 'badge-pending'}>
                  {student.statut_inscription === 'accepte' ? 'Accepté' : student.statut_inscription === 'rejete' ? 'Rejeté' : 'En attente'}
                </span>
              </div>
            </div>
          </div>

          {/* Info grid */}
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
            <div key={label} className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/40 text-sm">{label}</span>
              <span className="text-white text-sm font-medium">{val}</span>
            </div>
          ) : null)}

          {student.notes_admin && (
            <div className="glass-card p-3">
              <div className="text-white/40 text-xs mb-1">Notes admin</div>
              <div className="text-white/70 text-sm">{student.notes_admin}</div>
            </div>
          )}

          {/* Actions */}
          {student.statut_inscription === 'accepte' && (
            <button
              onClick={handleGenCard}
              disabled={genCard}
              className="w-full btn-secondary flex items-center justify-center gap-2 text-sm"
            >
              {genCard ? <div className="spinner w-4 h-4" /> : <FileText size={16} />}
              Générer / Régénérer la carte étudiante
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ── Main Admin Dashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [active, setActive]       = useState('dashboard')
  const [stats, setStats]         = useState(null)
  const [students, setStudents]   = useState([])
  const [pagination, setPagination] = useState({})
  const [payments, setPayments]   = useState([])
  const [filieres, setFilieres]   = useState([])
  const [staff, setStaff]         = useState([])
  const [loading, setLoading]     = useState(false)
  const [search, setSearch]       = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [modalStudent, setModalStudent] = useState(null)
  const [modalAction, setModalAction] = useState(null)
  const [drawerStudent, setDrawerStudent] = useState(null)
  const [showCreateStaff, setShowCreateStaff] = useState(false)
  const [showCreateFiliere, setShowCreateFiliere] = useState(false)
  const [newFiliere, setNewFiliere] = useState({ nom: '', code: '', description: '' })
  const [newLicense, setNewLicense] = useState({ filiere_id: '', nom: '', code: '', duree_annees: 3, frais_inscription: 0, frais_mensuel: 0 })
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'cashier', password: '' })
  // Content management state
  const [formateurs, setFormateurs] = useState([])
  const [membres, setMembres] = useState([])
  const [partenaires, setPartenaires] = useState([])
  const [temoignages, setTemoignages] = useState([])
  const [newsletterSubs, setNewsletterSubs] = useState([])
  const [socialLinks, setSocialLinks] = useState({ facebook: '', instagram: '', tiktok: '', youtube: '', linkedin: '', twitter: '' })
  const [newFormateur, setNewFormateur] = useState({ nom: '', prenom: '', titre: 'M.', specialite: '', bio: '', email: '', linkedin: '', ordre: 0 })
  const [newMembre, setNewMembre] = useState({ nom: '', prenom: '', titre: 'M.', poste: '', email: '', ordre: 0 })
  const [newPartenaire, setNewPartenaire] = useState({ nom: '', description: '', site_web: '', ordre: 0 })
  const [formateurPhoto, setFormateurPhoto] = useState(null)
  const [membrePhoto, setMembrePhoto] = useState(null)
  const [partenaireLogo, setPartenaireLogo] = useState(null)

  const handleLogout = async () => { await logout(); navigate('/') }

  useEffect(() => {
    if (active === 'dashboard') {
      setLoading(true)
      getAdminStats().then(({ data }) => setStats(data)).catch(() => {}).finally(() => setLoading(false))
    }
    if (active === 'etudiants') loadStudents()
    if (active === 'paiements') getAdminPayments().then(({ data }) => setPayments(data.data || [])).catch(() => {})
    if (active === 'filieres') getFilieres().then(({ data }) => setFilieres(data)).catch(() => {})
    if (active === 'staff') getStaff().then(({ data }) => setStaff(data)).catch(() => {})
    if (active === 'formateurs') adminGetFormateurs().then(({ data }) => setFormateurs(data)).catch(() => {})
    if (active === 'membres') adminGetMembres().then(({ data }) => setMembres(data)).catch(() => {})
    if (active === 'partenaires') adminGetPartenaires().then(({ data }) => setPartenaires(data)).catch(() => {})
    if (active === 'temoignages') adminGetTemoignages().then(({ data }) => setTemoignages(data)).catch(() => {})
    if (active === 'newsletter') adminGetNewsletter().then(({ data }) => setNewsletterSubs(data)).catch(() => {})
    if (active === 'social') api.get('/admin/contenu/social').then(({ data }) => setSocialLinks(prev => ({ ...prev, ...data }))).catch(() => {})
  }, [active])

  const loadStudents = async (page = 1) => {
    setLoading(true)
    try {
      const { data } = await getAdminStudents({ search, statut: filterStatut, page })
      setStudents(data.data || [])
      setPagination({ current: data.current_page, last: data.last_page, total: data.total })
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (active === 'etudiants') {
      const t = setTimeout(() => loadStudents(), 400)
      return () => clearTimeout(t)
    }
  }, [search, filterStatut])

  const submitFiliere = async () => {
    try {
      await createFiliere(newFiliere)
      toast.success('Filière créée !')
      setShowCreateFiliere(false)
      getFilieres().then(({ data }) => setFilieres(data))
    } catch { toast.error('Erreur') }
  }

  const submitLicense = async () => {
    try {
      await createLicense(newLicense)
      toast.success('Licence ajoutée !')
      getFilieres().then(({ data }) => setFilieres(data))
    } catch { toast.error('Erreur') }
  }

  const submitStaff = async () => {
    try {
      await createStaff(newStaff)
      toast.success('Compte créé !')
      setShowCreateStaff(false)
      getStaff().then(({ data }) => setStaff(data))
    } catch { toast.error('Erreur') }
  }

  return (
    <div className="min-h-screen bg-navy-950 flex">
      <Sidebar active={active} setActive={setActive} onLogout={handleLogout} />

      <div className="flex-1 ml-64 min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-navy-900/80 backdrop-blur-xl border-b border-white/10 px-6 h-16 flex items-center justify-between">
          <h1 className="text-white font-semibold">{NAV.find((n) => n.id === active)?.label}</h1>
          <div className="text-brand-300 text-xs font-semibold uppercase tracking-wider">Administrateur</div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>

              {/* ── DASHBOARD ─────────────────────────────────────────── */}
              {active === 'dashboard' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total étudiants"    value={stats?.total_etudiants}    icon={Users}         color="brand" />
                    <StatCard label="En attente"         value={stats?.en_attente}          icon={Clock}         color="yellow" />
                    <StatCard label="Acceptés"           value={stats?.acceptes}            icon={Check}         color="green" />
                    <StatCard label="Inscriptions payées" value={stats?.inscriptions_payees} icon={CreditCard}   color="green" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-5">
                      <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Recettes totales</div>
                      <div className="text-3xl font-black text-white">{Number(stats?.total_paiements || 0).toLocaleString()}</div>
                      <div className="text-white/40 text-xs mt-0.5">FCFA</div>
                    </div>
                    <div className="glass-card p-5">
                      <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Recettes ce mois</div>
                      <div className="text-3xl font-black text-brand-400">{Number(stats?.paiements_ce_mois || 0).toLocaleString()}</div>
                      <div className="text-white/40 text-xs mt-0.5">FCFA</div>
                    </div>
                  </div>

                  {stats?.par_filiere && Object.keys(stats.par_filiere).length > 0 && (
                    <div className="glass-card p-5">
                      <h3 className="text-white font-semibold mb-4">Répartition par filière</h3>
                      <div className="space-y-3">
                        {Object.entries(stats.par_filiere).map(([filiere, count]) => {
                          const pct = (count / (stats.acceptes || 1)) * 100
                          return (
                            <div key={filiere}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-white/70">{filiere}</span>
                                <span className="text-white font-semibold">{count} étudiants</span>
                              </div>
                              <div className="h-2 bg-white/10 rounded-full">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full" />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── ÉTUDIANTS ─────────────────────────────────────────── */}
              {active === 'etudiants' && (
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-48">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                      <input className="form-input pl-9 py-2 text-sm" placeholder="Nom, prénom, matricule..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <select className="form-input py-2 text-sm w-auto" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
                      <option value="">Tous les statuts</option>
                      <option value="en_attente">En attente</option>
                      <option value="accepte">Acceptés</option>
                      <option value="rejete">Rejetés</option>
                    </select>
                    <button onClick={() => loadStudents()} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
                      <RefreshCw size={14} /> Actualiser
                    </button>
                  </div>

                  <div className="glass-card overflow-hidden">
                    <table className="data-table">
                      <thead>
                        <tr><th>Étudiant</th><th>Filière</th><th>Statut</th><th>Paiement</th><th>Date</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr><td colSpan={6} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
                        ) : students.length === 0 ? (
                          <tr><td colSpan={6} className="text-center py-10 text-white/30">Aucun étudiant trouvé</td></tr>
                        ) : students.map((s) => (
                          <tr key={s.id}>
                            <td>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                                  {s.photo ? <img src={`/storage/${s.photo}`} className="w-full h-full object-cover" /> : (s.prenom?.[0] || 'E')}
                                </div>
                                <div>
                                  <div className="text-white text-sm font-medium">{s.prenom} {s.nom}</div>
                                  <div className="text-white/40 text-xs">{s.user?.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="text-white/70 text-sm">{s.filiere?.nom}</div>
                              <div className="text-white/40 text-xs">{s.license?.nom}</div>
                            </td>
                            <td>
                              <span className={s.statut_inscription === 'accepte' ? 'badge-accepted' : s.statut_inscription === 'rejete' ? 'badge-rejected' : 'badge-pending'}>
                                {s.statut_inscription === 'accepte' ? 'Accepté' : s.statut_inscription === 'rejete' ? 'Rejeté' : 'En attente'}
                              </span>
                            </td>
                            <td>
                              <span className={s.inscription_payee ? 'badge-paid' : 'badge-pending'}>
                                {s.inscription_payee ? 'Payée' : 'Non payée'}
                              </span>
                            </td>
                            <td className="text-white/40 text-xs">
                              {new Date(s.created_at).toLocaleDateString('fr-FR')}
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <button onClick={() => setDrawerStudent(s)} className="text-brand-400 hover:text-brand-300 p-1.5 rounded-lg hover:bg-brand-500/10 transition-all" title="Voir">
                                  <Eye size={15} />
                                </button>
                                {s.statut_inscription === 'en_attente' && (
                                  <>
                                    <button onClick={() => { setModalStudent(s); setModalAction('accepter') }} className="text-green-400 hover:text-green-300 p-1.5 rounded-lg hover:bg-green-500/10 transition-all" title="Accepter">
                                      <Check size={15} />
                                    </button>
                                    <button onClick={() => { setModalStudent(s); setModalAction('rejeter') }} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-all" title="Rejeter">
                                      <X size={15} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {pagination.last > 1 && (
                      <div className="p-4 border-t border-white/10 flex items-center justify-between">
                        <span className="text-white/40 text-sm">Page {pagination.current} / {pagination.last} — {pagination.total} étudiants</span>
                        <div className="flex gap-2">
                          {pagination.current > 1 && <button onClick={() => loadStudents(pagination.current - 1)} className="btn-secondary text-xs py-1.5 px-3">Précédent</button>}
                          {pagination.current < pagination.last && <button onClick={() => loadStudents(pagination.current + 1)} className="btn-primary text-xs py-1.5 px-3">Suivant</button>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── PAIEMENTS ─────────────────────────────────────────── */}
              {active === 'paiements' && (
                <div className="glass-card overflow-hidden">
                  <table className="data-table">
                    <thead><tr><th>Étudiant</th><th>Type</th><th>Montant</th><th>Méthode</th><th>Date</th><th>Statut</th></tr></thead>
                    <tbody>
                      {payments.length === 0
                        ? <tr><td colSpan={6} className="text-center py-10 text-white/30">Aucun paiement</td></tr>
                        : payments.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <div className="text-white text-sm">{p.student?.prenom} {p.student?.nom}</div>
                              <div className="text-white/40 text-xs">{p.student?.matricule}</div>
                            </td>
                            <td className="text-white/70 text-sm">{p.libelle || p.type}</td>
                            <td className="text-white font-semibold">{Number(p.montant).toLocaleString()} FCFA</td>
                            <td className="text-white/60 text-sm">{p.methode?.toUpperCase()}</td>
                            <td className="text-white/40 text-xs">{p.date_paiement ? new Date(p.date_paiement).toLocaleDateString('fr-FR') : '—'}</td>
                            <td><span className={p.statut === 'complete' ? 'badge-accepted' : 'badge-pending'}>{p.statut}</span></td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── FILIÈRES ──────────────────────────────────────────── */}
              {active === 'filieres' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Create filiere */}
                    <div className="glass-card p-5">
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Plus size={16} /> Nouvelle filière</h3>
                      <div className="space-y-3">
                        <div><label className="form-label text-xs">Nom</label><input className="form-input text-sm py-2" value={newFiliere.nom} onChange={(e) => setNewFiliere({ ...newFiliere, nom: e.target.value })} placeholder="Informatique" /></div>
                        <div><label className="form-label text-xs">Code</label><input className="form-input text-sm py-2" value={newFiliere.code} onChange={(e) => setNewFiliere({ ...newFiliere, code: e.target.value })} placeholder="INFO" /></div>
                        <div><label className="form-label text-xs">Description</label><textarea className="form-input text-sm py-2 resize-none" rows={2} value={newFiliere.description} onChange={(e) => setNewFiliere({ ...newFiliere, description: e.target.value })} /></div>
                        <button onClick={submitFiliere} className="btn-primary w-full text-sm">Créer la filière</button>
                      </div>
                    </div>

                    {/* Create license */}
                    <div className="glass-card p-5">
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Plus size={16} /> Nouveau niveau / licence</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="form-label text-xs">Filière</label>
                          <select className="form-input text-sm py-2" value={newLicense.filiere_id} onChange={(e) => setNewLicense({ ...newLicense, filiere_id: e.target.value })}>
                            <option value="">-- Choisir --</option>
                            {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="form-label text-xs">Nom</label><input className="form-input text-sm py-2" placeholder="Licence 1" value={newLicense.nom} onChange={(e) => setNewLicense({ ...newLicense, nom: e.target.value })} /></div>
                          <div><label className="form-label text-xs">Code</label><input className="form-input text-sm py-2" placeholder="L1" value={newLicense.code} onChange={(e) => setNewLicense({ ...newLicense, code: e.target.value })} /></div>
                          <div><label className="form-label text-xs">Durée (ans)</label><input className="form-input text-sm py-2" type="number" value={newLicense.duree_annees} onChange={(e) => setNewLicense({ ...newLicense, duree_annees: e.target.value })} /></div>
                          <div><label className="form-label text-xs">Frais inscription</label><input className="form-input text-sm py-2" type="number" placeholder="150000" value={newLicense.frais_inscription} onChange={(e) => setNewLicense({ ...newLicense, frais_inscription: e.target.value })} /></div>
                          <div className="col-span-2"><label className="form-label text-xs">Mensualité</label><input className="form-input text-sm py-2" type="number" placeholder="50000" value={newLicense.frais_mensuel} onChange={(e) => setNewLicense({ ...newLicense, frais_mensuel: e.target.value })} /></div>
                        </div>
                        <button onClick={submitLicense} className="btn-primary w-full text-sm">Ajouter le niveau</button>
                      </div>
                    </div>
                  </div>

                  {/* List filieres */}
                  <div className="space-y-3">
                    {filieres.map((f) => (
                      <div key={f.id} className="glass-card p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-white font-semibold">{f.nom}</span>
                            <span className="ml-2 text-xs bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded">{f.code}</span>
                          </div>
                        </div>
                        {f.licenses?.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {f.licenses.map((l) => (
                              <div key={l.id} className="bg-white/5 rounded-lg p-3">
                                <div className="text-white/80 text-sm font-medium">{l.nom}</div>
                                <div className="text-white/40 text-xs mt-1">Inscription : {Number(l.frais_inscription).toLocaleString()} FCFA</div>
                                <div className="text-white/40 text-xs">Mensualité : {Number(l.frais_mensuel).toLocaleString()} FCFA</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── STAFF ─────────────────────────────────────────────── */}
              {active === 'staff' && (
                <div className="space-y-4">
                  <button onClick={() => setShowCreateStaff(true)} className="btn-primary flex items-center gap-2">
                    <UserPlus size={16} /> Créer un compte
                  </button>

                  {showCreateStaff && (
                    <div className="glass-card p-5 neon-border">
                      <h3 className="text-white font-semibold mb-4">Nouveau membre de l'équipe</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="form-label text-xs">Nom complet</label><input className="form-input text-sm py-2" value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} /></div>
                        <div><label className="form-label text-xs">Email</label><input className="form-input text-sm py-2" type="email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} /></div>
                        <div>
                          <label className="form-label text-xs">Rôle</label>
                          <select className="form-input text-sm py-2" value={newStaff.role} onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}>
                            <option value="admin">Administrateur</option>
                            <option value="cashier">Caissier</option>
                            <option value="accueil">Accueil</option>
                          </select>
                        </div>
                        <div><label className="form-label text-xs">Mot de passe</label><input className="form-input text-sm py-2" type="password" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} /></div>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button onClick={() => setShowCreateStaff(false)} className="btn-secondary text-sm">Annuler</button>
                        <button onClick={submitStaff} className="btn-primary text-sm">Créer le compte</button>
                      </div>
                    </div>
                  )}

                  <div className="glass-card overflow-hidden">
                    <table className="data-table">
                      <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th></tr></thead>
                      <tbody>
                        {staff.map((s) => (
                          <tr key={s.id}>
                            <td className="text-white font-medium">{s.name}</td>
                            <td className="text-white/60 text-sm">{s.email}</td>
                            <td>
                              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                                s.role === 'admin' ? 'bg-red-500/20 text-red-300' :
                                s.role === 'cashier' ? 'bg-green-500/20 text-green-300' :
                                'bg-blue-500/20 text-blue-300'
                              }`}>
                                {s.role === 'admin' ? 'Admin' : s.role === 'cashier' ? 'Caissier' : 'Accueil'}
                              </span>
                            </td>
                            <td><span className={s.actif ? 'badge-accepted' : 'badge-rejected'}>{s.actif ? 'Actif' : 'Inactif'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── FORMATEURS ────────────────────────────────────────── */}
              {active === 'formateurs' && (
                <div className="space-y-6">
                  <div className="glass-card p-5">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Plus size={16} /> Ajouter un formateur</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="form-label text-xs">Prénom *</label><input className="form-input text-sm py-2" value={newFormateur.prenom} onChange={e => setNewFormateur({...newFormateur, prenom: e.target.value})} /></div>
                      <div><label className="form-label text-xs">Nom *</label><input className="form-input text-sm py-2" value={newFormateur.nom} onChange={e => setNewFormateur({...newFormateur, nom: e.target.value})} /></div>
                      <div>
                        <label className="form-label text-xs">Titre</label>
                        <select className="form-input text-sm py-2" value={newFormateur.titre} onChange={e => setNewFormateur({...newFormateur, titre: e.target.value})}>
                          {['M.','Mme.','Dr.','Prof.','Ing.'].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div><label className="form-label text-xs">Spécialité *</label><input className="form-input text-sm py-2" value={newFormateur.specialite} onChange={e => setNewFormateur({...newFormateur, specialite: e.target.value})} placeholder="Ex: Intelligence Artificielle" /></div>
                      <div><label className="form-label text-xs">Email</label><input className="form-input text-sm py-2" type="email" value={newFormateur.email} onChange={e => setNewFormateur({...newFormateur, email: e.target.value})} /></div>
                      <div><label className="form-label text-xs">LinkedIn</label><input className="form-input text-sm py-2" value={newFormateur.linkedin} onChange={e => setNewFormateur({...newFormateur, linkedin: e.target.value})} placeholder="https://..." /></div>
                      <div className="col-span-2"><label className="form-label text-xs">Biographie</label><textarea className="form-input text-sm py-2 resize-none" rows={2} value={newFormateur.bio} onChange={e => setNewFormateur({...newFormateur, bio: e.target.value})} /></div>
                      <div>
                        <label className="form-label text-xs">Photo</label>
                        <input type="file" accept="image/*" onChange={e => setFormateurPhoto(e.target.files[0])} className="text-white/60 text-sm" />
                      </div>
                      <div><label className="form-label text-xs">Ordre d'affichage</label><input className="form-input text-sm py-2" type="number" value={newFormateur.ordre} onChange={e => setNewFormateur({...newFormateur, ordre: e.target.value})} /></div>
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
                      <div key={f.id} className="glass-card p-4 flex items-start gap-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {f.photo ? <img src={f.photo} className="w-full h-full object-cover" alt={f.nom} /> : <span className="text-white font-bold">{f.prenom?.[0]}{f.nom?.[0]}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-semibold text-sm">{f.titre} {f.prenom} {f.nom}</div>
                          <div className="text-brand-400 text-xs">{f.specialite}</div>
                          {f.email && <div className="text-white/40 text-xs">{f.email}</div>}
                        </div>
                        <button onClick={async () => {
                          await adminDeleteFormateur(f.id)
                          setFormateurs(frs => frs.filter(x => x.id !== f.id))
                          toast.success('Supprimé')
                        }} className="text-red-400 hover:text-red-300 p-1.5 flex-shrink-0">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── MEMBRES ADMINS ────────────────────────────────────────── */}
              {active === 'membres' && (
                <div className="space-y-6">
                  <div className="glass-card p-5">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Plus size={16} /> Ajouter un membre</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="form-label text-xs">Prénom *</label><input className="form-input text-sm py-2" value={newMembre.prenom} onChange={e => setNewMembre({...newMembre, prenom: e.target.value})} /></div>
                      <div><label className="form-label text-xs">Nom *</label><input className="form-input text-sm py-2" value={newMembre.nom} onChange={e => setNewMembre({...newMembre, nom: e.target.value})} /></div>
                      <div>
                        <label className="form-label text-xs">Titre</label>
                        <select className="form-input text-sm py-2" value={newMembre.titre} onChange={e => setNewMembre({...newMembre, titre: e.target.value})}>
                          {['M.','Mme.','Dr.','Prof.'].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div><label className="form-label text-xs">Poste *</label><input className="form-input text-sm py-2" value={newMembre.poste} onChange={e => setNewMembre({...newMembre, poste: e.target.value})} placeholder="Ex: Directeur Général" /></div>
                      <div><label className="form-label text-xs">Email</label><input className="form-input text-sm py-2" type="email" value={newMembre.email} onChange={e => setNewMembre({...newMembre, email: e.target.value})} /></div>
                      <div>
                        <label className="form-label text-xs">Photo</label>
                        <input type="file" accept="image/*" onChange={e => setMembrePhoto(e.target.files[0])} className="text-white/60 text-sm" />
                      </div>
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
                      <div key={m.id} className="glass-card p-4 flex items-start gap-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {m.photo ? <img src={m.photo} className="w-full h-full object-cover" alt={m.nom} /> : <Building2 size={20} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-semibold text-sm">{m.titre} {m.prenom} {m.nom}</div>
                          <div className="text-indigo-400 text-xs">{m.poste}</div>
                          {m.email && <div className="text-white/40 text-xs">{m.email}</div>}
                        </div>
                        <button onClick={async () => {
                          await adminDeleteMembre(m.id)
                          setMembres(ms => ms.filter(x => x.id !== m.id))
                          toast.success('Supprimé')
                        }} className="text-red-400 hover:text-red-300 p-1.5 flex-shrink-0">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── PARTENAIRES ───────────────────────────────────────────── */}
              {active === 'partenaires' && (
                <div className="space-y-6">
                  <div className="glass-card p-5">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Plus size={16} /> Ajouter un partenaire</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="form-label text-xs">Nom *</label><input className="form-input text-sm py-2" value={newPartenaire.nom} onChange={e => setNewPartenaire({...newPartenaire, nom: e.target.value})} /></div>
                      <div><label className="form-label text-xs">Site web</label><input className="form-input text-sm py-2" value={newPartenaire.site_web} onChange={e => setNewPartenaire({...newPartenaire, site_web: e.target.value})} placeholder="https://..." /></div>
                      <div className="col-span-2"><label className="form-label text-xs">Description</label><input className="form-input text-sm py-2" value={newPartenaire.description} onChange={e => setNewPartenaire({...newPartenaire, description: e.target.value})} /></div>
                      <div>
                        <label className="form-label text-xs">Logo (image)</label>
                        <input type="file" accept="image/*" onChange={e => setPartenaireLogo(e.target.files[0])} className="text-white/60 text-sm" />
                      </div>
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
                      <div key={p.id} className="glass-card p-4 flex flex-col items-center gap-2 relative">
                        <div className="w-20 h-16 flex items-center justify-center">
                          {p.logo ? <img src={p.logo} className="max-h-full max-w-full object-contain" alt={p.nom} /> : <Handshake size={32} className="text-brand-400" />}
                        </div>
                        <div className="text-white text-sm font-semibold text-center">{p.nom}</div>
                        {p.site_web && <a href={p.site_web} target="_blank" rel="noopener noreferrer" className="text-brand-400 text-xs">Visiter</a>}
                        <button onClick={async () => {
                          await adminDeletePartenaire(p.id)
                          setPartenaires(ps => ps.filter(x => x.id !== p.id))
                          toast.success('Supprimé')
                        }} className="absolute top-2 right-2 text-red-400 hover:text-red-300">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TÉMOIGNAGES ───────────────────────────────────────────── */}
              {active === 'temoignages' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="text-white/50 text-sm">{temoignages.length} témoignage{temoignages.length !== 1 ? 's' : ''} au total</div>
                    <span className="text-green-400 text-sm">· {temoignages.filter(t => t.approuve).length} approuvé{temoignages.filter(t => t.approuve).length !== 1 ? 's' : ''}</span>
                    <span className="text-yellow-400 text-sm">· {temoignages.filter(t => !t.approuve).length} en attente</span>
                  </div>
                  <div className="space-y-3">
                    {temoignages.map(t => (
                      <div key={t.id} className="glass-card p-4 flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-semibold text-sm">{t.nom}</span>
                            {t.filiere && <span className="text-brand-400 text-xs">{t.filiere}</span>}
                            {t.annee_diplome && <span className="text-white/40 text-xs">{t.annee_diplome}</span>}
                            <div className="flex gap-0.5 ml-auto">
                              {[1,2,3,4,5].map(i => <Star key={i} size={12} className={i <= t.note ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'} />)}
                            </div>
                          </div>
                          <p className="text-white/60 text-sm leading-relaxed line-clamp-3">{t.contenu}</p>
                          <div className="text-white/30 text-xs mt-1">{new Date(t.created_at).toLocaleDateString('fr-FR')}</div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {!t.approuve && (
                            <button onClick={async () => {
                              await adminApprouverTemoignage(t.id)
                              setTemoignages(ts => ts.map(x => x.id === t.id ? {...x, approuve: true} : x))
                              toast.success('Approuvé !')
                            }} className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 bg-green-500/10 px-2 py-1 rounded-lg transition-all">
                              <ThumbsUp size={12} /> Approuver
                            </button>
                          )}
                          {t.approuve && <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">✓ Publié</span>}
                          <button onClick={async () => {
                            await adminDeleteTemoignage(t.id)
                            setTemoignages(ts => ts.filter(x => x.id !== t.id))
                            toast.success('Supprimé')
                          }} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-red-500/10 px-2 py-1 rounded-lg transition-all">
                            <Trash2 size={12} /> Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                    {temoignages.length === 0 && <p className="text-white/30 text-center py-10">Aucun témoignage reçu</p>}
                  </div>
                </div>
              )}

              {/* ── NEWSLETTER ────────────────────────────────────────────── */}
              {active === 'newsletter' && (
                <div className="space-y-4">
                  <div className="text-white/50 text-sm">{newsletterSubs.length} abonné{newsletterSubs.length !== 1 ? 's' : ''}</div>
                  <div className="glass-card overflow-hidden">
                    <table className="data-table">
                      <thead><tr><th>Email</th><th>Nom</th><th>Statut</th><th>Date</th></tr></thead>
                      <tbody>
                        {newsletterSubs.length === 0
                          ? <tr><td colSpan={4} className="text-center py-10 text-white/30">Aucun abonné</td></tr>
                          : newsletterSubs.map(s => (
                            <tr key={s.id}>
                              <td className="text-white text-sm">{s.email}</td>
                              <td className="text-white/60 text-sm">{s.nom || '—'}</td>
                              <td><span className={s.actif ? 'badge-accepted' : 'badge-rejected'}>{s.actif ? 'Actif' : 'Inactif'}</span></td>
                              <td className="text-white/40 text-xs">{new Date(s.created_at).toLocaleDateString('fr-FR')}</td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── RÉSEAUX SOCIAUX ───────────────────────────────────────── */}
              {active === 'social' && (
                <div className="max-w-xl">
                  <div className="glass-card p-6 space-y-4">
                    <h3 className="text-white font-semibold mb-2">Liens réseaux sociaux</h3>
                    <p className="text-white/40 text-xs mb-4">Ces liens apparaîtront dans le footer de la page d'accueil.</p>
                    {[
                      { key: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/isisuptech' },
                      { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/isisuptech' },
                      { key: 'tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@isisuptech' },
                      { key: 'youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/@isisuptech' },
                      { key: 'linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/company/isisuptech' },
                      { key: 'twitter',   label: 'Twitter/X', placeholder: 'https://twitter.com/isisuptech' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="form-label text-xs">{label}</label>
                        <input className="form-input text-sm py-2" type="url" placeholder={placeholder}
                          value={socialLinks[key] || ''} onChange={e => setSocialLinks(s => ({...s, [key]: e.target.value}))} />
                      </div>
                    ))}
                    <button onClick={async () => {
                      try {
                        await api.post('/admin/contenu/social', socialLinks)
                        toast.success('Réseaux sociaux mis à jour !')
                      } catch { toast.error('Erreur') }
                    }} className="btn-primary w-full mt-2">
                      Enregistrer les liens
                    </button>
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
          <ActionModal
            student={modalStudent}
            action={modalAction}
            onClose={() => { setModalStudent(null); setModalAction(null) }}
            onDone={loadStudents}
          />
        )}
        {drawerStudent && (
          <StudentDrawer
            student={drawerStudent}
            onClose={() => setDrawerStudent(null)}
            onRefresh={loadStudents}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
