import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  X, Search, UserCheck, AlertTriangle, CheckCircle2,
  GraduationCap, Wallet, Mail, ArrowRight, RefreshCw,
  BookOpen, ShieldCheck, User, Clock
} from 'lucide-react'
import {
  getAdminStudents, getFilieres, reinscrireStudent,
  getStudentDossierHistorique
} from '../services/api'

export default function ReinscriptionModal({ isOpen, onClose, onSuccess, initialStudent = null, isDark = false }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyData, setHistoryData] = useState(null)

  const [filieres, setFilieres] = useState([])
  const [targetFiliereId, setTargetFiliereId] = useState('')
  const [targetLicenseId, setTargetLicenseId] = useState('')
  const [targetAnnee, setTargetAnnee] = useState('2026-2027')
  const [fraisReinscription, setFraisReinscription] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Load filieres & initial student
  useEffect(() => {
    if (isOpen) {
      getFilieres().then(({ data }) => setFilieres(data)).catch(() => {})
      if (initialStudent) {
        setSelectedStudent(initialStudent)
        setStudentEmail(initialStudent.email || '')
        if (initialStudent.filiere_id) setTargetFiliereId(initialStudent.filiere_id)
        if (initialStudent.license_id) setTargetLicenseId(initialStudent.license_id)
        setLoadingHistory(true)
        getStudentDossierHistorique(initialStudent.id)
          .then(({ data }) => setHistoryData(data))
          .catch(() => {})
          .finally(() => setLoadingHistory(false))
      } else {
        setSelectedStudent(null)
        setHistoryData(null)
        setSearchQuery('')
        setSearchResults([])
      }
    }
  }, [isOpen, initialStudent])

  // Live search for students
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(() => {
      setSearching(true)
      getAdminStudents({ search: searchQuery.trim(), per_page: 10 })
        .then(({ data }) => {
          const list = data.data || data || []
          setSearchResults(list)
        })
        .catch(() => {})
        .finally(() => setSearching(false))
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // When a student is selected
  const handleSelectStudent = (student) => {
    setSelectedStudent(student)
    setSearchResults([])
    setSearchQuery(`${student.prenom} ${student.nom} (${student.matricule})`)
    setLoadingHistory(true)

    // Pre-fill target filiere and search for next level
    if (student.filiere_id) {
      setTargetFiliereId(String(student.filiere_id))
    }

    getStudentDossierHistorique(student.id)
      .then(({ data }) => {
        setHistoryData(data)
      })
      .catch(() => toast.error('Erreur chargement historique'))
      .finally(() => setLoadingHistory(false))
  }

  // Update available licenses for chosen filiere
  const selectedFiliere = filieres.find(f => String(f.id) === String(targetFiliereId))
  const availableLicenses = selectedFiliere?.licenses || []

  // Auto-switch fee when license/filiere changes
  useEffect(() => {
    if (targetLicenseId) {
      const lic = availableLicenses.find(l => String(l.id) === String(targetLicenseId))
      if (lic) {
        const montant = lic.frais_reinscription || lic.frais_inscription || 0
        setFraisReinscription(String(montant))
      }
    } else {
      setFraisReinscription('')
    }
  }, [targetLicenseId, availableLicenses])

  // Submit re-inscription
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedStudent) {
      toast.error('Veuillez sélectionner un étudiant.')
      return
    }
    if (!targetFiliereId || !targetLicenseId) {
      toast.error('Veuillez sélectionner la filière et la nouvelle classe.')
      return
    }
    if (!targetAnnee) {
      toast.error("Veuillez spécifier l'année académique de réinscription.")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        student_id: selectedStudent.id,
        filiere_id: targetFiliereId,
        license_id: targetLicenseId,
        annee_scolaire: targetAnnee,
        frais_reinscription: fraisReinscription ? parseFloat(fraisReinscription) : null,
        email: studentEmail,
        send_email: sendEmail,
      }
      const { data } = await reinscrireStudent(payload)
      toast.success(data.message || 'Réinscription effectuée avec succès !', { duration: 5000 })
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la réinscription')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-3xl my-8 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-isiblue-700 via-isiblue-600 to-indigo-700 px-6 py-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white shadow-inner">
              <RefreshCw size={22} className="animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Réinscription d'un Ancien Étudiant</h2>
              <p className="text-xs text-blue-100">Passage de niveau, contrôle financier & bascule de filière</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Step 1: Search & Select */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              1. Rechercher l'étudiant à réinscrire
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (selectedStudent) setSelectedStudent(null)
                }}
                placeholder="Tapez le nom, prénom ou matricule (ex: ISI-2024-...)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-isiblue-500 focus:bg-white transition"
              />
              {searching && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-isiblue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Results dropdown */}
            {searchResults.length > 0 && !selectedStudent && (
              <div className="border border-slate-200 rounded-xl bg-white shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => handleSelectStudent(st)}
                    className="p-3 hover:bg-isiblue-50/60 cursor-pointer flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-isiblue-100 text-isiblue-700 font-bold text-xs flex items-center justify-center">
                        {(st.prenom?.[0] || '') + (st.nom?.[0] || '')}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{st.nom_complet || `${st.prenom} ${st.nom}`}</div>
                        <div className="text-xs text-slate-500">{st.matricule} • {st.filiere?.nom || 'Filière N/A'} ({st.annee_scolaire || 'N/A'})</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {st.license?.nom || 'Classe N/A'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Student details & financial check */}
          {selectedStudent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Profile Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-isiblue-600 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-md">
                    {(selectedStudent.prenom?.[0] || '') + (selectedStudent.nom?.[0] || '')}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{selectedStudent.prenom} {selectedStudent.nom}</h3>
                    <p className="text-xs text-slate-500">
                      Matricule : <span className="font-mono font-bold text-isiblue-600">{selectedStudent.matricule}</span> • 
                      Classe actuelle : <span className="font-semibold text-slate-700">{selectedStudent.license?.nom || 'N/A'}</span> ({selectedStudent.annee_scolaire})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedStudent(null); setHistoryData(null); setSearchQuery(''); }}
                  className="text-xs text-slate-500 hover:text-red-600 underline font-medium"
                >
                  Changer d'étudiant
                </button>
              </div>

              {/* Financial Clearance Audit */}
              {loadingHistory ? (
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <div className="w-4 h-4 border-2 border-isiblue-600 border-t-transparent rounded-full animate-spin" />
                  Vérification de la situation financière antérieure...
                </div>
              ) : historyData ? (() => {
                const soldeRestant = Number(historyData?.caisse_data?.solde_restant ?? historyData?.solde_restant ?? selectedStudent?.compta_solde_restant ?? selectedStudent?.solde_restant ?? 0)
                const moisNonPayes = historyData?.caisse_data?.mois_non_payes ?? historyData?.mois_non_payes ?? []
                const totalPaye = Number(historyData?.caisse_data?.total_paye ?? historyData?.total_paye ?? selectedStudent?.compta_total_paye ?? selectedStudent?.total_paye ?? 0)
                const estEnRegle = historyData?.caisse_data?.est_en_regle ?? (soldeRestant <= 0 && moisNonPayes.length === 0)

                return (
                  <div>
                    {!estEnRegle || soldeRestant > 0 || moisNonPayes.length > 0 ? (
                      <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-red-950 flex items-start gap-3.5 shadow-sm">
                        <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={22} />
                        <div className="text-xs space-y-2 flex-1">
                          <div className="font-black text-red-800 text-sm flex items-center justify-between">
                            <span>⚠️ Arriérés non soldés détectés sur les années antérieures</span>
                            <span className="px-2.5 py-0.5 rounded-full bg-red-200 text-red-800 text-xs font-mono font-bold">
                              Dû : {soldeRestant.toLocaleString()} FCFA
                            </span>
                          </div>
                          <div className="bg-white/80 p-2.5 rounded-xl border border-red-200 space-y-1">
                            <div className="text-slate-700">
                              <span className="font-bold text-red-700">Mois impayé(s) :</span>{' '}
                              <span className="font-mono font-bold text-red-900">
                                {moisNonPayes.length > 0 ? moisNonPayes.join(', ') : 'Arriérés de scolarité'}
                              </span>
                              {moisNonPayes.length > 0 && <span className="text-slate-500 ml-1 font-semibold">({moisNonPayes.length} mois)</span>}
                            </div>
                            <div className="text-slate-600 text-[11px]">
                              Total déjà réglé sur son parcours : <span className="font-bold text-emerald-700">{totalPaye.toLocaleString()} FCFA</span>.
                            </div>
                          </div>
                          <div className="text-[11px] text-red-700 font-medium flex items-center gap-1.5">
                            <span>ℹ️ L'étudiant doit d'abord régler ces arriérés avant de pouvoir finaliser sa réinscription pour 2026-2027.</span>
                          </div>
                          {onOpenEncaissement && (
                            <button
                              type="button"
                              onClick={() => onOpenEncaissement(selectedStudent, soldeRestant, moisNonPayes)}
                              className="mt-1 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                            >
                              💳 Encaisser le reliquat ({soldeRestant.toLocaleString()} FCFA)
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center gap-3">
                        <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />
                        <div className="text-xs">
                          <span className="font-bold text-emerald-800">Situation financière antérieure en règle :</span> Aucun mois impayé détecté. Total réglé : <span className="font-bold">{totalPaye.toLocaleString()} FCFA</span>. Réinscription autorisée.
                        </div>
                      </div>
                    )}
                  </div>
                )
              })() : null}

              {/* Step 2: Choose Target Class & Progression */}
              <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  2. Nouvelle Inscription pour l'année 2026-2027
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Filiere */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Filière de réinscription
                    </label>
                    <select
                      value={targetFiliereId}
                      onChange={(e) => {
                        setTargetFiliereId(e.target.value)
                        setTargetLicenseId('')
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-isiblue-500"
                      required
                    >
                      <option value="">-- Sélectionner une filière --</option>
                      {filieres.map((f) => (
                        <option key={f.id} value={f.id}>{f.nom} ({f.code})</option>
                      ))}
                    </select>
                  </div>

                  {/* Level / Class */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nouvelle Classe / Niveau
                    </label>
                    <select
                      value={targetLicenseId}
                      onChange={(e) => setTargetLicenseId(e.target.value)}
                      disabled={!targetFiliereId}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-isiblue-500 disabled:opacity-50"
                      required
                    >
                      <option value="">-- Choisir la classe --</option>
                      {availableLicenses.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nom} {l.frais_reinscription ? `(Réinsc: ${Number(l.frais_reinscription).toLocaleString()} FCFA)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Academic Year */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Année Académique
                    </label>
                    <input
                      type="text"
                      value={targetAnnee}
                      onChange={(e) => setTargetAnnee(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800"
                      required
                    />
                  </div>

                  {/* Reinscription Fee */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Montant Frais de Réinscription (FCFA)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={fraisReinscription}
                        onChange={(e) => setFraisReinscription(e.target.value)}
                        placeholder="200000"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-isiblue-700"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        FCFA
                      </span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email de l'étudiant (pour envoi des identifiants & accès portail)
                    </label>
                    <input
                      type="email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="etudiant@suptech.sn ou email personnel"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-isiblue-500"
                    />
                  </div>

                {/* Email Portal Invite Option */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className="w-4 h-4 rounded text-isiblue-600 focus:ring-isiblue-500 border-slate-300"
                    />
                    <span>Envoyer automatiquement un email d'invitation avec accès au portail étudiant</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Email : {selectedStudent.email || 'Automatique'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedStudent || !targetLicenseId}
              className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-isiblue-600 to-indigo-600 hover:from-isiblue-700 hover:to-indigo-700 rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2 transition"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Réinscription en cours...
                </>
              ) : (
                <>
                  <UserCheck size={16} />
                  Valider la Réinscription 2026-2027
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
