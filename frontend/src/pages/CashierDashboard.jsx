import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Wallet, Search, Plus, Download, LogOut, LayoutDashboard, TrendingUp, Clock, CheckCircle, RefreshCw, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getCashierPayments, recordManualPayment, getCashierStats, getAdminStudents } from '../services/api'

function StatBox({ label, value, sub, color = 'brand' }) {
  const c = { brand: 'text-brand-400', green: 'text-green-400', yellow: 'text-yellow-400' }
  return (
    <div className="glass-card p-5">
      <div className={`text-xs uppercase tracking-wider mb-1 ${c[color]}`}>{label}</div>
      <div className="text-3xl font-black text-white">{value}</div>
      {sub && <div className="text-white/40 text-xs mt-0.5">{sub}</div>}
    </div>
  )
}

export default function CashierDashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [active, setActive]   = useState('dashboard')
  const [stats, setStats]     = useState(null)
  const [payments, setPayments] = useState([])
  const [students, setStudents] = useState([])
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ student_id: '', type: 'mensualite', montant: '', mois: '', methode: 'especes', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [searchStudent, setSearchStudent] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)

  const handleLogout = async () => { await logout(); navigate('/') }

  useEffect(() => {
    getCashierStats().then(({ data }) => setStats(data)).catch(() => {})
    if (active === 'paiements') loadPayments()
  }, [active])

  const loadPayments = async () => {
    setLoading(true)
    getCashierPayments({ search }).then(({ data }) => setPayments(data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchStudent.length >= 2) {
        getAdminStudents({ search: searchStudent, statut: 'accepte' })
          .then(({ data }) => setStudents(data.data || []))
          .catch(() => {})
      }
    }, 400)
    return () => clearTimeout(t)
  }, [searchStudent])

  const handleSelectStudent = (s) => {
    setSelectedStudent(s)
    setForm((f) => ({
      ...f,
      student_id: s.id,
      montant: form.type === 'inscription' ? s.license?.frais_inscription : s.license?.frais_mensuel,
    }))
    setStudents([])
    setSearchStudent('')
  }

  const handleSubmitPayment = async () => {
    if (!form.student_id || !form.montant) { toast.error('Remplissez tous les champs obligatoires'); return }
    setSubmitting(true)
    try {
      const { data } = await recordManualPayment(form)
      toast.success('Paiement enregistré — reçu PDF généré !')
      setShowForm(false)
      setSelectedStudent(null)
      setForm({ student_id: '', type: 'mensualite', montant: '', mois: '', methode: 'especes', notes: '' })
      getCashierStats().then(({ data }) => setStats(data))
      if (active === 'paiements') loadPayments()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const MOIS_LABELS = [
    'Octobre', 'Novembre', 'Décembre', 'Janvier', 'Février', 'Mars',
    'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre'
  ]

  const getCurrentMoisOptions = () => {
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 6 + i, 1)
      return { value: d.toISOString().slice(0, 7), label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) }
    })
  }

  return (
    <div className="min-h-screen bg-navy-950 flex">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 bg-navy-800/70 backdrop-blur-xl border-r border-white/10 flex flex-col fixed top-0 left-0 h-full z-40">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center">
              <Wallet size={20} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold">ISI SUPTECH</div>
              <div className="text-green-400 text-xs font-medium">Caisse</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[
            { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
            { id: 'paiements', label: 'Paiements', icon: TrendingUp },
            { id: 'saisie', label: 'Saisir un paiement', icon: Plus },
          ].map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} onClick={() => setActive(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active === item.id ? 'bg-green-600/20 text-green-300 border border-green-500/30' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
              >
                <Icon size={17} />{item.label}
              </button>
            )
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all">
            <LogOut size={17} /> Déconnexion
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 ml-64">
        <div className="sticky top-0 z-30 bg-navy-900/80 backdrop-blur-xl border-b border-white/10 px-6 h-16 flex items-center justify-between">
          <h1 className="text-white font-semibold">
            {active === 'dashboard' ? 'Tableau de bord' : active === 'paiements' ? 'Paiements' : 'Saisir un paiement'}
          </h1>
          <div className="text-green-300 text-xs font-semibold uppercase tracking-wider">Caisse</div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>

              {/* DASHBOARD */}
              {active === 'dashboard' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatBox label="Recettes du jour" value={`${Number(stats?.total_jour || 0).toLocaleString()} FCFA`} color="green" />
                    <StatBox label="Recettes du mois" value={`${Number(stats?.total_mois || 0).toLocaleString()} FCFA`} color="brand" />
                    <StatBox label="Opérations en attente" value={stats?.en_attente || 0} color="yellow" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <StatBox label="Paiements ce jour" value={stats?.count_jour || 0} sub="transactions" />
                    <StatBox label="Paiements ce mois" value={stats?.count_mois || 0} sub="transactions" />
                  </div>

                  {stats?.par_type?.length > 0 && (
                    <div className="glass-card p-5">
                      <h3 className="text-white font-semibold mb-4">Répartition par type</h3>
                      <div className="space-y-3">
                        {stats.par_type.map((t) => (
                          <div key={t.type} className="flex items-center justify-between py-3 border-b border-white/5">
                            <div>
                              <div className="text-white/80 text-sm font-medium">{t.type === 'inscription' ? 'Frais d\'inscription' : t.type === 'mensualite' ? 'Mensualités' : 'Autre'}</div>
                              <div className="text-white/40 text-xs">{t.count} transactions</div>
                            </div>
                            <div className="text-green-400 font-bold">{Number(t.total).toLocaleString()} FCFA</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button onClick={() => setActive('saisie')} className="btn-primary flex items-center gap-2">
                    <Plus size={18} /> Saisir un nouveau paiement
                  </button>
                </div>
              )}

              {/* LISTE PAIEMENTS */}
              {active === 'paiements' && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                      <input className="form-input pl-9 py-2 text-sm" placeholder="Rechercher un étudiant..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <button onClick={loadPayments} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"><RefreshCw size={14} /> Actualiser</button>
                  </div>
                  <div className="glass-card overflow-hidden">
                    <table className="data-table">
                      <thead><tr><th>Étudiant</th><th>Type</th><th>Montant</th><th>Méthode</th><th>Saisi par</th><th>Date</th><th>Statut</th><th>Reçu</th></tr></thead>
                      <tbody>
                        {loading
                          ? <tr><td colSpan={8} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
                          : payments.length === 0
                          ? <tr><td colSpan={8} className="text-center py-8 text-white/30">Aucun paiement</td></tr>
                          : payments.map((p) => (
                            <tr key={p.id}>
                              <td>
                                <div className="text-white text-sm">{p.student?.prenom} {p.student?.nom}</div>
                                <div className="text-white/40 text-xs">{p.student?.matricule}</div>
                              </td>
                              <td className="text-white/70 text-sm">{p.libelle || p.type}</td>
                              <td className="text-white font-bold">{Number(p.montant).toLocaleString()} FCFA</td>
                              <td className="text-white/60 text-sm">{p.methode?.toUpperCase()}</td>
                              <td className="text-white/50 text-xs">{p.saiseur?.name || 'Wave'}</td>
                              <td className="text-white/40 text-xs">{p.date_paiement ? new Date(p.date_paiement).toLocaleDateString('fr-FR') : '—'}</td>
                              <td><span className={p.statut === 'complete' ? 'badge-accepted' : 'badge-pending'}>{p.statut}</span></td>
                              <td>
                                {p.recu_pdf_path && (
                                  <a href={`/api/caisse/paiement/${p.id}/recu`} target="_blank" className="text-brand-400 hover:text-brand-300 flex items-center gap-1 text-xs">
                                    <Download size={12} /> PDF
                                  </a>
                                )}
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SAISIE PAIEMENT */}
              {active === 'saisie' && (
                <div className="max-w-xl space-y-5">
                  <p className="text-white/50 text-sm">Enregistrez manuellement un paiement (espèces, virement, chèque).</p>

                  {/* Student search */}
                  <div>
                    <label className="form-label">Rechercher l'étudiant *</label>
                    {selectedStudent ? (
                      <div className="flex items-center justify-between glass-card p-4">
                        <div>
                          <div className="text-white font-semibold">{selectedStudent.prenom} {selectedStudent.nom}</div>
                          <div className="text-brand-400 text-sm font-mono">{selectedStudent.matricule}</div>
                          <div className="text-white/40 text-xs">{selectedStudent.filiere?.nom} — {selectedStudent.license?.nom}</div>
                        </div>
                        <button onClick={() => { setSelectedStudent(null); setForm((f) => ({ ...f, student_id: '' })) }} className="text-white/40 hover:text-white"><X size={16} /></button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input className="form-input pl-9" placeholder="Nom, prénom ou matricule..." value={searchStudent} onChange={(e) => setSearchStudent(e.target.value)} />
                        {students.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-20 mt-1 glass-card border border-white/20 overflow-hidden">
                            {students.map((s) => (
                              <button key={s.id} onClick={() => handleSelectStudent(s)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left">
                                <div>
                                  <div className="text-white text-sm">{s.prenom} {s.nom}</div>
                                  <div className="text-white/40 text-xs">{s.matricule} — {s.filiere?.nom}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Type de paiement *</label>
                    <select className="form-input" value={form.type} onChange={(e) => {
                      const t = e.target.value
                      setForm((f) => ({
                        ...f, type: t,
                        montant: t === 'inscription' ? selectedStudent?.license?.frais_inscription : selectedStudent?.license?.frais_mensuel || '',
                      }))
                    }}>
                      <option value="inscription">Frais d'inscription</option>
                      <option value="mensualite">Mensualité</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>

                  {form.type === 'mensualite' && (
                    <div>
                      <label className="form-label">Mois concerné *</label>
                      <select className="form-input" value={form.mois} onChange={(e) => setForm({ ...form, mois: e.target.value })}>
                        <option value="">-- Sélectionner le mois --</option>
                        {getCurrentMoisOptions().map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="form-label">Montant (FCFA) *</label>
                    <input className="form-input" type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} placeholder="150000" />
                  </div>

                  <div>
                    <label className="form-label">Méthode de paiement *</label>
                    <select className="form-input" value={form.methode} onChange={(e) => setForm({ ...form, methode: e.target.value })}>
                      <option value="especes">Espèces</option>
                      <option value="wave">Wave</option>
                      <option value="virement">Virement bancaire</option>
                      <option value="cheque">Chèque</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Notes (optionnel)</label>
                    <textarea className="form-input resize-none" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setActive('dashboard')} className="btn-secondary flex-1">Annuler</button>
                    <button onClick={handleSubmitPayment} disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                      {submitting ? <div className="spinner w-4 h-4" /> : <CheckCircle size={16} />}
                      Enregistrer & générer le reçu
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
