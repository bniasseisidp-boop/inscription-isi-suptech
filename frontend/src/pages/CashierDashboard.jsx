import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Wallet, Search, Plus, Download, LogOut, LayoutDashboard, TrendingUp,
  Clock, CheckCircle, RefreshCw, X, Users, AlertCircle, Filter,
  AlertTriangle, CreditCard, ChevronDown, ChevronRight, Check, BookOpen, FileDown, UserSearch,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  getCashierPayments, recordManualPayment, getCashierStats,
  getAdminStudents, getEtudiantsAttentePaiement, getMoisDesactives,
  downloadReceiptBlob, getImpayesMois, getFilieres, downloadImpayesPdfBlob,
  getCashierStudents, getCashierStudentSuivi,
} from '../services/api'

/* ── helpers ──────────────────────────────────────────────────────────────── */
function fmt(n) { return Number(n || 0).toLocaleString('fr-FR') }

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

/* ── Quick-pay modal ──────────────────────────────────────────────────────── */
function QuickPayModal({ student, onClose, onSuccess }) {
  const [type, setType]           = useState(student.inscription_payee ? 'mensualite' : 'inscription')
  const [methode, setMethode]     = useState('especes')
  const [montant, setMontant]     = useState('')
  const [notes, setNotes]         = useState('')
  const [moisSelectionne, setMoisSelectionne] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [suivi, setSuivi]         = useState(null)
  const [loadingSuivi, setLoadingSuivi] = useState(false)

  useEffect(() => {
    if (student.inscription_payee) {
      setLoadingSuivi(true)
      getCashierStudentSuivi(student.id)
        .then(({ data }) => setSuivi(data))
        .catch(() => {})
        .finally(() => setLoadingSuivi(false))
    }
    // Auto-fill montant based on type
    const m = type === 'inscription'
      ? student.license?.frais_inscription
      : student.license?.frais_mensuel
    setMontant(m || '')
  }, [student.id])

  useEffect(() => {
    const m = type === 'inscription'
      ? student.license?.frais_inscription
      : type === 'mensualite'
      ? student.license?.frais_mensuel
      : ''
    setMontant(m || '')
    setMoisSelectionne(null)
  }, [type])

  const moisImpayesDus = suivi?.mois?.filter(m => !m.paye && (m.en_retard || m.actuel)) || []

  const submit = async () => {
    if (!montant) { toast.error('Montant requis'); return }
    if (type === 'mensualite' && !moisSelectionne) { toast.error('Sélectionnez le mois à payer'); return }
    setSubmitting(true)
    try {
      await recordManualPayment({
        student_id: student.id,
        type,
        montant,
        mois: type === 'mensualite' ? moisSelectionne : null,
        methode,
        notes,
      })
      toast.success('✅ Paiement enregistré — email + reçu PDF envoyés !')
      onSuccess()
    } catch (e) {
      toast.error(e.response?.data?.message || "Erreur lors de l'enregistrement")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
              {student.photo
                ? <img src={`/storage/${student.photo}`} alt={student.nom} className="w-full h-full object-cover"/>
                : <div className="w-full h-full flex items-center justify-center text-white/40 font-black text-sm">
                    {(student.prenom?.[0] || '') + (student.nom?.[0] || '')}
                  </div>
              }
            </div>
            <div>
              <h3 className="text-white font-bold">{student.prenom} {student.nom}</h3>
              <div className="text-brand-400 text-xs font-mono">{student.matricule}</div>
              <p className="text-white/40 text-xs">{student.filiere?.nom} — {student.license?.nom}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1"><X size={18}/></button>
        </div>

        {/* Body — scrollable */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">

          {/* Financial quick summary */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/4 rounded-xl p-3">
              <p className="text-white/40 text-xs mb-1">Inscription</p>
              <p className="text-white font-bold text-sm">{fmt(student.license?.frais_inscription)} FCFA</p>
              {student.inscription_payee
                ? <p className="text-green-400 text-xs">✓ Payée</p>
                : <p className="text-amber-400 text-xs">⚠ Non réglée</p>}
            </div>
            <div className="bg-white/4 rounded-xl p-3">
              <p className="text-white/40 text-xs mb-1">Mensualité</p>
              <p className="text-white font-bold text-sm">{fmt(student.license?.frais_mensuel)} FCFA/mois</p>
              {suivi && <p className="text-xs text-white/40">{suivi.mois_payes}/{suivi.mois_total} mois payés</p>}
            </div>
          </div>

          {/* Months in arrears alert */}
          {moisImpayesDus.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3">
              <p className="text-red-400 text-xs font-bold mb-2 flex items-center gap-1.5">
                <AlertTriangle size={12}/> {moisImpayesDus.length} mois impayé{moisImpayesDus.length > 1 ? 's' : ''} — arriéré dû
              </p>
              <div className="flex flex-wrap gap-1.5">
                {moisImpayesDus.map(m => (
                  <button key={m.cle}
                    onClick={() => { setType('mensualite'); setMoisSelectionne(m.cle); setMontant(student.license?.frais_mensuel || '') }}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                      moisSelectionne === m.cle
                        ? 'bg-red-500 border-red-400 text-white'
                        : 'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20'
                    }`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Type */}
          <div>
            <label className="form-label text-xs">Type de paiement *</label>
            <select className="form-input text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              {!student.inscription_payee && <option value="inscription">Frais d'inscription</option>}
              <option value="mensualite">Mensualité</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          {/* Month selection for mensualite */}
          {type === 'mensualite' && (
            <div>
              <label className="form-label text-xs">Mois concerné *</label>
              {loadingSuivi ? (
                <div className="form-input text-sm text-white/40">Chargement des mois…</div>
              ) : suivi?.mois ? (
                <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {suivi.mois.map(m => {
                    const isPaid    = m.paye
                    const isRetard  = m.en_retard
                    const isActuel  = m.actuel
                    const isFutur   = m.futur
                    const isSelected = moisSelectionne === m.cle
                    return (
                      <button key={m.cle}
                        disabled={isPaid || isFutur}
                        onClick={() => setMoisSelectionne(m.cle)}
                        className={`text-xs px-2 py-2 rounded-lg border text-center transition-all font-medium ${
                          isPaid     ? 'bg-green-500/10 border-green-500/20 text-green-500/40 cursor-not-allowed'
                          : isFutur  ? 'bg-white/3 border-white/8 text-white/20 cursor-not-allowed'
                          : isSelected ? 'bg-brand-500 border-brand-400 text-white'
                          : isRetard ? 'bg-red-500/15 border-red-500/30 text-red-300 hover:bg-red-500/25'
                          : isActuel ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        }`}>
                        {isPaid ? '✓ ' : isRetard ? '⚠ ' : ''}{m.label.split(' ')[0]}
                        <div className="text-[9px] opacity-60">{m.label.split(' ')[1]}</div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <select className="form-input text-sm" value={moisSelectionne || ''} onChange={e => setMoisSelectionne(e.target.value)}>
                  <option value="">-- Sélectionner un mois --</option>
                </select>
              )}
              {moisSelectionne && (
                <p className="text-brand-300 text-xs mt-1 font-semibold">
                  Mois sélectionné : {suivi?.mois?.find(m => m.cle === moisSelectionne)?.label || moisSelectionne}
                </p>
              )}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="form-label text-xs">Montant (FCFA) *</label>
            <input className="form-input text-sm" type="number" value={montant}
              onChange={(e) => setMontant(e.target.value)} placeholder="150000" />
          </div>

          {/* Method */}
          <div>
            <label className="form-label text-xs">Méthode de paiement *</label>
            <select className="form-input text-sm" value={methode} onChange={(e) => setMethode(e.target.value)}>
              <option value="especes">💵 Espèces</option>
              <option value="wave">📱 Wave</option>
              <option value="virement">🏦 Virement bancaire</option>
              <option value="cheque">📄 Chèque</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="form-label text-xs">Notes (optionnel)</label>
            <textarea className="form-input text-sm resize-none" rows={2}
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 pt-0 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm py-2.5">Annuler</button>
          <button onClick={submit} disabled={submitting}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5">
            {submitting
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
              : <CheckCircle size={15}/>}
            Valider &amp; Reçu PDF
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function CashierDashboard() {
  const { logout } = useAuth()
  const navigate   = useNavigate()
  const [active, setActive]       = useState('dashboard')
  const [stats, setStats]         = useState(null)
  const [payments, setPayments]   = useState([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Pending students
  const [etudiantsAttente, setEtudiantsAttente] = useState([])
  const [loadingAttente, setLoadingAttente]     = useState(false)

  // Accepted/paid students (dashboard)
  const [etudiantsInscrits, setEtudiantsInscrits] = useState([])
  const [loadingInscrits, setLoadingInscrits]     = useState(false)

  // Impayés mois
  const [impayesMois, setImpayesMois]   = useState([])
  const [loadingImp, setLoadingImp]     = useState(false)
  const [filtreImpMois, setFiltreImpMois] = useState(new Date().toISOString().slice(0, 7))
  const [showImpFilter, setShowImpFilter] = useState(false)

  // Quick-pay modal
  const [quickPay, setQuickPay] = useState(null)

  // Manual form (full saisie tab)
  const [moisDesactives, setMoisDesactives] = useState([])
  const [form, setForm]           = useState({ student_id: '', type: 'inscription', montant: '', mois: '', methode: 'especes', notes: '' })
  const [searchStudent, setSearchStudent] = useState('')
  const [students, setStudents]   = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)

  // Student browser
  const [filieres, setFilieres]               = useState([])
  const [browserFiliereId, setBrowserFiliereId] = useState('')
  const [browserLicenseId, setBrowserLicenseId] = useState('')
  const [browserSearch, setBrowserSearch]       = useState('')
  const [browserStudents, setBrowserStudents]   = useState([])
  const [browserLoading, setBrowserLoading]     = useState(false)
  const [browserSelected, setBrowserSelected]   = useState(null)

  const handleLogout = async () => { await logout(); navigate('/') }

  const loadStats = useCallback(() => {
    getCashierStats().then(({ data }) => setStats(data)).catch(() => {})
  }, [])

  const loadAttente = useCallback(() => {
    setLoadingAttente(true)
    getEtudiantsAttentePaiement()
      .then(({ data }) => setEtudiantsAttente(data))
      .catch(() => {})
      .finally(() => setLoadingAttente(false))
  }, [])

  const loadInscrits = useCallback(() => {
    setLoadingInscrits(true)
    getCashierStudents({ statut: 'accepte' })
      .then(({ data }) => setEtudiantsInscrits(data.data || []))
      .catch(() => {})
      .finally(() => setLoadingInscrits(false))
  }, [])

  const loadPayments = useCallback(() => {
    setLoading(true)
    getCashierPayments({ search })
      .then(({ data }) => setPayments(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search])

  const loadImpayesMois = useCallback((mois) => {
    setLoadingImp(true)
    getImpayesMois(mois)
      .then(({ data }) => setImpayesMois(data.data || []))
      .catch(() => {})
      .finally(() => setLoadingImp(false))
  }, [])

  useEffect(() => {
    loadStats()
    getMoisDesactives().then(({ data }) => setMoisDesactives(data)).catch(() => {})
    getFilieres().then(({ data }) => setFilieres(data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (active === 'dashboard') { loadAttente(); loadInscrits() }
    if (active === 'paiements') loadPayments()
    if (active === 'impayes') loadImpayesMois(filtreImpMois)
    if (active === 'etudiants') loadBrowserStudents()
  }, [active])

  const loadBrowserStudents = useCallback(() => {
    setBrowserLoading(true)
    const params = {}
    if (browserFiliereId) params.filiere_id = browserFiliereId
    if (browserSearch) params.search = browserSearch
    getCashierStudents(params)
      .then(({ data }) => setBrowserStudents(data.data || []))
      .catch(() => {})
      .finally(() => setBrowserLoading(false))
  }, [browserFiliereId, browserSearch])

  const handleDownloadImpayesPdf = async () => {
    try {
      const { data } = await downloadImpayesPdfBlob(filtreImpMois)
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = `impayes_ISI_${filtreImpMois}.pdf`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch {
      toast.error('Impossible de générer le PDF')
    }
  }

  // Student search autocomplete
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchStudent.length >= 2) {
        Promise.all([
          getAdminStudents({ search: searchStudent, statut: 'accepte' }).catch(() => ({ data: { data: [] } })),
          getAdminStudents({ search: searchStudent, statut: 'en_attente_paiement' }).catch(() => ({ data: { data: [] } })),
        ]).then(([r1, r2]) => {
          setStudents([...(r1.data.data || []), ...(r2.data.data || [])])
        })
      } else {
        setStudents([])
      }
    }, 400)
    return () => clearTimeout(t)
  }, [searchStudent])

  const handleSelectStudent = (s) => {
    setSelectedStudent(s)
    setForm(f => ({
      ...f,
      student_id: s.id,
      montant: f.type === 'inscription' ? s.license?.frais_inscription : s.license?.frais_mensuel,
    }))
    setStudents([])
    setSearchStudent('')
  }

  const handleSubmitPayment = async () => {
    if (!form.student_id || !form.montant) { toast.error('Remplissez tous les champs obligatoires'); return }
    setSubmitting(true)
    try {
      await recordManualPayment(form)
      toast.success('Paiement enregistré — reçu PDF généré !')
      setSelectedStudent(null)
      setForm({ student_id: '', type: 'inscription', montant: '', mois: '', methode: 'especes', notes: '' })
      loadStats()
      loadAttente()
      if (active === 'paiements') loadPayments()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownloadRecu = async (paymentId) => {
    try {
      const { data } = await downloadReceiptBlob(paymentId)
      const url = URL.createObjectURL(data)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch {
      toast.error('Impossible de télécharger le reçu')
    }
  }

  const onQuickPaySuccess = () => {
    setQuickPay(null)
    loadStats()
    loadAttente()
    if (active === 'paiements') loadPayments()
    if (active === 'impayes') loadImpayesMois(filtreImpMois)
  }

  const getCurrentMoisOptions = () => {
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 6 + i, 1)
      return { value: d.toISOString().slice(0, 7), label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) }
    })
  }

  const NAV = [
    { id: 'dashboard',  label: 'Tableau de bord',  icon: LayoutDashboard },
    { id: 'etudiants',  label: 'Étudiants',         icon: UserSearch },
    { id: 'paiements',  label: 'Paiements',         icon: TrendingUp },
    { id: 'saisie',     label: 'Saisir paiement',   icon: Plus },
    { id: 'impayes',    label: 'Impayés du mois',   icon: AlertTriangle },
  ]

  return (
    <div className="min-h-screen bg-space-950 flex">
      {quickPay && (
        <QuickPayModal
          student={quickPay}
          onClose={() => setQuickPay(null)}
          onSuccess={onQuickPaySuccess}
        />
      )}

      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 bg-space-800/70 backdrop-blur-xl border-r border-white/10 flex flex-col fixed top-0 left-0 h-full z-40">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center">
              <Wallet size={20} className="text-white"/>
            </div>
            <div>
              <div className="text-white font-bold">ISI SUPTECH</div>
              <div className="text-green-400 text-xs font-medium">Caisse</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} onClick={() => setActive(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active === item.id
                    ? 'bg-green-600/20 text-green-300 border border-green-500/30'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}>
                <Icon size={17}/>{item.label}
                {item.id === 'impayes' && impayesMois.length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{impayesMois.length}</span>
                )}
              </button>
            )
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all">
            <LogOut size={17}/> Déconnexion
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 ml-64">
        <div className="sticky top-0 z-30 bg-space-900/80 backdrop-blur-xl border-b border-white/10 px-6 h-16 flex items-center justify-between">
          <h1 className="text-white font-semibold">
            {NAV.find(n => n.id === active)?.label}
          </h1>
          <div className="text-green-300 text-xs font-semibold uppercase tracking-wider">Caisse</div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>

              {/* ── DASHBOARD ──────────────────────────────────────────────── */}
              {active === 'dashboard' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <StatBox label="Recettes aujourd'hui" value={`${fmt(stats?.total_jour)} FCFA`} color="green"/>
                    <StatBox label="Recettes ce mois"     value={`${fmt(stats?.total_mois)} FCFA`} color="brand"/>
                    <StatBox label="En attente paiement"  value={etudiantsAttente.length} color="yellow"/>
                  </div>

                  {/* Quick-action banner */}
                  <div className="flex gap-3">
                    <button onClick={() => setActive('saisie')}
                      className="btn-primary flex items-center gap-2 text-sm">
                      <Plus size={16}/> Saisir un paiement
                    </button>
                    <button onClick={() => { setActive('impayes'); loadImpayesMois(filtreImpMois) }}
                      className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
                      <AlertTriangle size={16}/> Voir les impayés du mois
                    </button>
                  </div>

                  {/* Pending students */}
                  <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Users size={17} className="text-amber-400"/>
                        Étudiants en attente de paiement d'inscription
                        {etudiantsAttente.length > 0 && (
                          <span className="ml-1 bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full font-bold">
                            {etudiantsAttente.length}
                          </span>
                        )}
                      </h3>
                      <button onClick={loadAttente} className="text-white/40 hover:text-white">
                        <RefreshCw size={14}/>
                      </button>
                    </div>
                    {loadingAttente ? (
                      <div className="py-10 flex justify-center"><div className="spinner"/></div>
                    ) : etudiantsAttente.length === 0 ? (
                      <div className="py-10 text-center text-white/30 text-sm">Aucun étudiant en attente</div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr><th>Étudiant</th><th>Filière / Niveau</th><th>Matricule</th><th>Montant</th><th>Action rapide</th></tr>
                        </thead>
                        <tbody>
                          {etudiantsAttente.map(s => (
                            <tr key={s.id}>
                              <td>
                                <div className="text-white text-sm font-semibold">{s.prenom} {s.nom}</div>
                                <div className="text-white/40 text-xs">{s.user?.email}</div>
                              </td>
                              <td>
                                <div className="text-white/80 text-sm">{s.filiere?.nom}</div>
                                <div className="text-white/40 text-xs">{s.license?.nom}</div>
                              </td>
                              <td className="text-brand-400 font-mono text-sm">{s.matricule || '—'}</td>
                              <td className="text-amber-300 font-bold text-sm">
                                {s.license?.frais_inscription ? fmt(s.license.frais_inscription) + ' FCFA' : '—'}
                              </td>
                              <td>
                                <button onClick={() => setQuickPay(s)}
                                  className="flex items-center gap-1.5 text-xs bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/20 px-3 py-2 rounded-lg transition-all font-semibold">
                                  <CreditCard size={13}/> Payer maintenant
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Accepted / paid students */}
                  <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Check size={17} className="text-green-400"/>
                        Étudiants inscrits
                        {etudiantsInscrits.length > 0 && (
                          <span className="ml-1 bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded-full font-bold">
                            {etudiantsInscrits.length}
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2">
                        <button onClick={loadInscrits} className="text-white/40 hover:text-white"><RefreshCw size={14}/></button>
                        <button onClick={() => setActive('etudiants')} className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1">
                          Voir tous <ChevronRight size={13}/>
                        </button>
                      </div>
                    </div>
                    {loadingInscrits ? (
                      <div className="py-10 flex justify-center"><div className="spinner"/></div>
                    ) : etudiantsInscrits.length === 0 ? (
                      <div className="py-8 text-center text-white/30 text-sm">Aucun étudiant inscrit pour le moment</div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr><th>Étudiant</th><th>Filière / Niveau</th><th>Matricule</th><th>Mensualité</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                          {etudiantsInscrits.slice(0, 10).map(s => (
                            <tr key={s.id}>
                              <td>
                                <div className="text-white text-sm font-semibold">{s.prenom} {s.nom}</div>
                                <div className="text-white/40 text-xs">{s.user?.email}</div>
                              </td>
                              <td>
                                <div className="text-white/80 text-sm">{s.filiere?.nom}</div>
                                <div className="text-white/40 text-xs">{s.license?.nom}</div>
                              </td>
                              <td className="text-brand-400 font-mono text-sm">{s.matricule || '—'}</td>
                              <td className="text-white/70 text-sm">
                                {s.license?.frais_mensuel ? fmt(s.license.frais_mensuel) + ' FCFA/mois' : '—'}
                              </td>
                              <td>
                                <button onClick={() => setQuickPay(s)}
                                  className="flex items-center gap-1.5 text-xs bg-brand-500/15 text-brand-300 hover:bg-brand-500/25 border border-brand-500/20 px-3 py-2 rounded-lg transition-all font-semibold">
                                  <CreditCard size={13}/> Encaisser
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* ── PAIEMENTS ──────────────────────────────────────────────── */}
              {active === 'paiements' && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
                      <input className="form-input pl-9 py-2 text-sm" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadPayments()} />
                    </div>
                    <button onClick={loadPayments} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
                      <RefreshCw size={14}/> Actualiser
                    </button>
                  </div>
                  <div className="glass-card overflow-hidden">
                    <table className="data-table">
                      <thead>
                        <tr><th>Étudiant</th><th>Type</th><th>Montant</th><th>Méthode</th><th>Saisi par</th><th>Date</th><th>Statut</th><th>Reçu</th></tr>
                      </thead>
                      <tbody>
                        {loading
                          ? <tr><td colSpan={8} className="text-center py-10"><div className="spinner mx-auto"/></td></tr>
                          : payments.length === 0
                          ? <tr><td colSpan={8} className="text-center py-8 text-white/30">Aucun paiement</td></tr>
                          : payments.map((p) => (
                            <tr key={p.id}>
                              <td>
                                <div className="text-white text-sm">{p.student?.prenom} {p.student?.nom}</div>
                                <div className="text-white/40 text-xs font-mono">{p.student?.matricule}</div>
                              </td>
                              <td className="text-white/70 text-sm">{
                                p.type === 'inscription' ? "Frais d'inscription" :
                                p.type === 'mensualite' ? `Mensualité ${p.mois || ''}` : 'Autre'
                              }</td>
                              <td className="text-white font-bold">{fmt(p.montant)} FCFA</td>
                              <td className="text-white/60 text-sm">{p.methode?.toUpperCase()}</td>
                              <td className="text-white/50 text-xs">{p.saiseur?.name || 'Wave'}</td>
                              <td className="text-white/40 text-xs">{p.date_paiement ? new Date(p.date_paiement).toLocaleDateString('fr-FR') : '—'}</td>
                              <td><span className={p.statut === 'complete' ? 'badge-accepted' : 'badge-pending'}>{p.statut}</span></td>
                              <td>
                                <button onClick={() => handleDownloadRecu(p.id)}
                                  className="text-brand-400 hover:text-brand-300 flex items-center gap-1 text-xs transition-colors">
                                  <Download size={12}/> PDF
                                </button>
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── SAISIE PAIEMENT ────────────────────────────────────────── */}
              {active === 'saisie' && (
                <div className="max-w-xl space-y-5">
                  <p className="text-white/50 text-sm">Enregistrez manuellement un paiement (espèces, virement, chèque).</p>

                  {/* Pending shortcut */}
                  {etudiantsAttente.length > 0 && !selectedStudent && (
                    <div className="glass-card p-4 border border-amber-500/20">
                      <p className="text-amber-300 text-xs font-bold mb-3 flex items-center gap-1.5">
                        <Clock size={13}/> {etudiantsAttente.length} étudiant{etudiantsAttente.length > 1 ? 's' : ''} en attente d'inscription — Sélection rapide
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {etudiantsAttente.map(s => (
                          <button key={s.id} onClick={() => {
                            setSelectedStudent(s)
                            setForm(f => ({ ...f, student_id: s.id, type: 'inscription', montant: s.license?.frais_inscription || '' }))
                          }} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/4 hover:bg-white/8 border border-white/8 hover:border-amber-500/30 transition-all text-left">
                            <div>
                              <span className="text-white text-sm font-semibold">{s.prenom} {s.nom}</span>
                              <span className="text-white/40 text-xs ml-2">{s.filiere?.nom}</span>
                            </div>
                            <span className="text-amber-300 text-xs font-bold">{fmt(s.license?.frais_inscription)} FCFA</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Student search */}
                  <div>
                    <label className="form-label">Rechercher l'étudiant *</label>
                    {selectedStudent ? (
                      <div className="flex items-center justify-between glass-card p-4 border border-green-500/20">
                        <div>
                          <div className="text-white font-semibold">{selectedStudent.prenom} {selectedStudent.nom}</div>
                          <div className="text-brand-400 text-sm font-mono">{selectedStudent.matricule}</div>
                          <div className="text-white/40 text-xs">{selectedStudent.filiere?.nom} — {selectedStudent.license?.nom}</div>
                        </div>
                        <button onClick={() => { setSelectedStudent(null); setForm(f => ({ ...f, student_id: '' })) }}
                          className="text-white/40 hover:text-white"><X size={16}/></button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
                        <input className="form-input pl-9" placeholder="Nom, prénom ou matricule…" value={searchStudent} onChange={(e) => setSearchStudent(e.target.value)} />
                        {students.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-20 mt-1 glass-card border border-white/20 overflow-hidden">
                            {students.map((s) => (
                              <button key={s.id} onClick={() => handleSelectStudent(s)}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left">
                                <div>
                                  <div className="text-white text-sm">{s.prenom} {s.nom}</div>
                                  <div className="text-white/40 text-xs">{s.matricule} — {s.filiere?.nom}</div>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${s.statut_inscription === 'en_attente_paiement' ? 'bg-amber-500/20 text-amber-300' : 'badge-accepted'}`}>
                                  {s.statut_inscription === 'en_attente_paiement' ? 'Attente paiement' : 'Actif'}
                                </span>
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
                      setForm(f => ({ ...f, type: t, montant: t === 'inscription' ? selectedStudent?.license?.frais_inscription : selectedStudent?.license?.frais_mensuel || '' }))
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
                        <option value="">-- Sélectionner --</option>
                        {getCurrentMoisOptions().map((o) => {
                          const dis = moisDesactives.includes(o.value)
                          return <option key={o.value} value={o.value} disabled={dis}>{dis ? `🚫 ${o.label} (désactivé)` : o.label}</option>
                        })}
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
                      <option value="especes">💵 Espèces</option>
                      <option value="wave">📱 Wave</option>
                      <option value="virement">🏦 Virement bancaire</option>
                      <option value="cheque">📄 Chèque</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Notes (optionnel)</label>
                    <textarea className="form-input resize-none" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setActive('dashboard')} className="btn-secondary flex-1">Annuler</button>
                    <button onClick={handleSubmitPayment} disabled={submitting}
                      className="btn-primary flex-1 flex items-center justify-center gap-2">
                      {submitting ? <div className="spinner w-4 h-4"/> : <CheckCircle size={16}/>}
                      Enregistrer &amp; générer reçu
                    </button>
                  </div>
                </div>
              )}

              {/* ── ÉTUDIANTS BROWSER ──────────────────────────────────────── */}
              {active === 'etudiants' && (
                <div className="space-y-4">
                  {browserSelected && (
                    <QuickPayModal
                      student={browserSelected}
                      onClose={() => setBrowserSelected(null)}
                      onSuccess={() => { setBrowserSelected(null); loadStats() }}
                    />
                  )}

                  {/* Filters */}
                  <div className="glass-card p-4">
                    <div className="flex flex-wrap gap-3 items-end">
                      <div className="flex-1 min-w-[180px]">
                        <label className="form-label text-xs mb-1">Filière</label>
                        <select className="form-input text-sm py-2"
                          value={browserFiliereId}
                          onChange={(e) => setBrowserFiliereId(e.target.value)}>
                          <option value="">Toutes les filières</option>
                          {filieres.map(f => (
                            <option key={f.id} value={f.id}>{f.nom}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label className="form-label text-xs mb-1">Recherche</label>
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
                          <input className="form-input pl-8 text-sm py-2"
                            placeholder="Nom, prénom, matricule…"
                            value={browserSearch}
                            onChange={(e) => setBrowserSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && loadBrowserStudents()}
                          />
                        </div>
                      </div>
                      <button onClick={loadBrowserStudents}
                        className="btn-primary text-sm py-2 px-5 flex items-center gap-2">
                        <Search size={14}/> Rechercher
                      </button>
                    </div>
                  </div>

                  {/* Student grid */}
                  {browserLoading ? (
                    <div className="py-16 flex justify-center"><div className="spinner"/></div>
                  ) : browserStudents.length === 0 ? (
                    <div className="py-16 text-center text-white/30">
                      <Users size={40} className="mx-auto mb-3 opacity-30"/>
                      <p>Aucun étudiant trouvé — affinez les filtres et recherchez</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-white/40 text-xs">{browserStudents.length} étudiant{browserStudents.length > 1 ? 's' : ''} trouvé{browserStudents.length > 1 ? 's' : ''}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {browserStudents.map((s) => {
                          const photoUrl = s.photo
                            ? `/storage/${s.photo}`
                            : null
                          return (
                            <div key={s.id} className="glass-card p-4 flex flex-col gap-3 hover:border-brand-500/30 transition-all border border-white/10">
                              {/* Photo + identity */}
                              <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                                  {photoUrl ? (
                                    <img src={photoUrl} alt={s.nom} className="w-full h-full object-cover"/>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/30 text-xl font-black">
                                      {(s.prenom?.[0] || '') + (s.nom?.[0] || '')}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-white font-bold text-sm truncate">{s.prenom} {s.nom}</div>
                                  <div className="text-brand-400 font-mono text-xs">{s.matricule || '—'}</div>
                                  <div className="text-white/40 text-xs truncate">{s.filiere?.nom}</div>
                                </div>
                              </div>

                              {/* Info row */}
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white/4 rounded-lg p-2">
                                  <div className="text-white/40">Niveau</div>
                                  <div className="text-white font-semibold truncate">{s.license?.nom || '—'}</div>
                                </div>
                                <div className="bg-white/4 rounded-lg p-2">
                                  <div className="text-white/40">Inscription</div>
                                  <div className={`font-semibold ${s.inscription_payee ? 'text-green-400' : 'text-amber-400'}`}>
                                    {s.inscription_payee ? '✓ Payée' : '⚠ Non réglée'}
                                  </div>
                                </div>
                              </div>

                              {/* Mensualité info */}
                              <div className="flex items-center justify-between text-xs border-t border-white/8 pt-2">
                                <span className="text-white/40">Mensualité</span>
                                <span className="text-white font-bold">{fmt(s.license?.frais_mensuel)} FCFA/mois</span>
                              </div>

                              {/* Action */}
                              <button
                                onClick={() => setBrowserSelected(s)}
                                className="w-full flex items-center justify-center gap-2 text-sm bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/20 py-2.5 rounded-xl transition-all font-semibold">
                                <CreditCard size={14}/> Encaisser un paiement
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── IMPAYÉS DU MOIS ────────────────────────────────────────── */}
              {active === 'impayes' && (
                <div className="space-y-4">
                  {/* Month filter */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/10">
                      <Filter size={14} className="text-white/40"/>
                      <select className="bg-transparent text-white text-sm focus:outline-none"
                        value={filtreImpMois}
                        onChange={(e) => { setFiltreImpMois(e.target.value); loadImpayesMois(e.target.value) }}>
                        {getCurrentMoisOptions().map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={() => loadImpayesMois(filtreImpMois)}
                      className="text-white/40 hover:text-white flex items-center gap-1.5 text-sm">
                      <RefreshCw size={14}/> Actualiser
                    </button>
                    {impayesMois.length > 0 && (
                      <>
                        <span className="text-red-400 text-sm font-bold flex items-center gap-1.5">
                          <AlertTriangle size={14}/> {impayesMois.length} étudiant{impayesMois.length > 1 ? 's' : ''} n'ont pas payé
                        </span>
                        <button onClick={handleDownloadImpayesPdf}
                          className="flex items-center gap-1.5 text-xs bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30 px-3 py-2 rounded-lg transition-all font-semibold ml-auto">
                          <FileDown size={13}/> Télécharger liste PDF
                        </button>
                      </>
                    )}
                  </div>

                  <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <AlertTriangle size={16} className="text-red-400"/>
                        Mensualités impayées
                      </h3>
                      <p className="text-white/40 text-xs mt-1">
                        Liste des étudiants actifs n'ayant pas réglé leur mensualité pour le mois sélectionné.
                        Accessible dès le 5 du mois pour retenir l'accès.
                      </p>
                    </div>
                    {loadingImp ? (
                      <div className="py-10 flex justify-center"><div className="spinner"/></div>
                    ) : impayesMois.length === 0 ? (
                      <div className="py-10 text-center">
                        <CheckCircle size={40} className="text-green-400 mx-auto mb-3"/>
                        <p className="text-green-300 font-semibold">Tous les étudiants sont à jour !</p>
                        <p className="text-white/30 text-sm mt-1">Aucun impayé pour ce mois.</p>
                      </div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr><th>#</th><th>Étudiant</th><th>Matricule</th><th>Filière / Niveau</th><th>Mensualité due</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                          {impayesMois.map((s, i) => (
                            <tr key={s.id}>
                              <td className="text-white/30 text-xs">{i + 1}</td>
                              <td>
                                <div className="text-white text-sm font-semibold">{s.prenom} {s.nom}</div>
                                <div className="text-white/40 text-xs">{s.user?.email}</div>
                              </td>
                              <td className="text-brand-400 font-mono text-sm">{s.matricule || '—'}</td>
                              <td>
                                <div className="text-white/80 text-sm">{s.filiere?.nom}</div>
                                <div className="text-white/40 text-xs">{s.license?.nom}</div>
                              </td>
                              <td>
                                <span className="text-red-400 font-bold text-sm">{fmt(s.license?.frais_mensuel)} FCFA</span>
                              </td>
                              <td>
                                <button onClick={() => setQuickPay({ ...s, inscription_payee: true })}
                                  className="flex items-center gap-1.5 text-xs bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/20 px-3 py-1.5 rounded-lg transition-all font-semibold">
                                  <CreditCard size={12}/> Encaisser
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
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
