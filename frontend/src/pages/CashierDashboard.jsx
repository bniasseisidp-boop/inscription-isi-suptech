import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Wallet, Search, Plus, Download, LogOut, LayoutDashboard, TrendingUp,
  Clock, CheckCircle, RefreshCw, X, Users, AlertCircle, Filter,
  AlertTriangle, CreditCard, ChevronDown, ChevronRight, Check, BookOpen, FileDown, UserSearch, Pencil, Eye,
  UserCog, Menu,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  getCashierPayments, recordManualPayment, updateManualPayment, recordManualPaymentMultiMois, getCashierStats,
  getAdminStudents, getEtudiantsAttentePaiement, getMoisDesactives,
  downloadReceiptBlob, getImpayesMois, getFilieres, downloadImpayesPdfBlob, downloadBrouillardBlob,
  getCashierStudents, getCashierStudentSuivi, getInscriptionDetails,
  demanderModificationPaiement, getStatutDemandeModification,
  updateMyPassword, updateMyPhoto,
} from '../services/api'
import LightPremiumBackground from '../components/LightPremiumBackground'

/* ── helpers ──────────────────────────────────────────────────────────────── */
function fmt(n) { return Number(n || 0).toLocaleString('fr-FR') }

function StatBox({ label, value, sub, color = 'brand' }) {
  const c = { brand: 'text-isiblue-500', green: 'text-emerald-600', yellow: 'text-isigold-600' }
  return (
    <div className="light-card p-5">
      <div className={`text-xs uppercase tracking-wider mb-1 font-semibold ${c[color]}`}>{label}</div>
      <div className="text-3xl font-black text-slate-900">{value}</div>
      {sub && <div className="text-slate-500 text-xs mt-0.5">{sub}</div>}
    </div>
  )
}

/* ── Quick-pay modal ──────────────────────────────────────────────────────── */
function QuickPayModal({ student, onClose, onSuccess }) {
  const [type, setType]             = useState(student.inscription_payee ? 'mensualite' : 'inscription')
  const [methode, setMethode]       = useState('especes')
  const [montant, setMontant]       = useState('')
  const [notes, setNotes]           = useState('')
  const [moisSelectionne, setMoisSelectionne] = useState(null)
  const [multiMode, setMultiMode]   = useState(false)
  const [moisMulti, setMoisMulti]   = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [suivi, setSuivi]           = useState(null)
  const [inscDetail, setInscDetail] = useState(null)
  const [loadingSuivi, setLoadingSuivi] = useState(false)

  useEffect(() => {
    setLoadingSuivi(true)
    const p1 = student.inscription_payee
      ? getCashierStudentSuivi(student.id).then(({ data }) => setSuivi(data)).catch(() => {})
      : Promise.resolve()
    const p2 = !student.inscription_payee
      ? getInscriptionDetails(student.id).then(({ data }) => {
          setInscDetail(data)
          setMontant(data.restant || data.total_du || '')
        }).catch(() => {
          setMontant(student.license?.frais_inscription || '')
        })
      : Promise.resolve()
    Promise.all([p1, p2]).finally(() => setLoadingSuivi(false))
  }, [student.id])

  useEffect(() => {
    if (type === 'inscription') {
      setMontant(inscDetail?.restant || inscDetail?.total_du || student.license?.frais_inscription || '')
    } else if (type === 'mensualite') {
      const avance = Math.round(suivi?.avance_paiement ?? 0)
      const frais = Math.round(Number(student.license?.frais_mensuel || 0))
      setMontant(Math.round(Math.max(0, frais - avance)) || frais || '')
    } else {
      setMontant('')
    }
    setMoisSelectionne(null)
  }, [type])

  const moisImpayesDus = suivi?.mois?.filter(m => !m.paye && (m.en_retard || m.actuel)) || []
  const avancePaiement = suivi?.avance_paiement ?? 0

  const submit = async () => {
    if (!montant) { toast.error('Montant requis'); return }
    if (type === 'mensualite' && multiMode && moisMulti.length === 0) { toast.error('Sélectionnez au moins un mois'); return }
    if (type === 'mensualite' && !multiMode && !moisSelectionne) { toast.error('Sélectionnez le mois à payer'); return }
    setSubmitting(true)
    try {
      if (type === 'mensualite' && multiMode) {
        await recordManualPaymentMultiMois({
          student_id: student.id,
          mois: moisMulti,
          montant_total: montant,
          methode,
          notes,
        })
      } else {
        await recordManualPayment({
          student_id: student.id,
          type,
          montant,
          mois: type === 'mensualite' ? moisSelectionne : null,
          methode,
          notes,
        })
      }
      toast.success('✅ Paiement enregistré — email + reçu PDF envoyés !')
      onSuccess()
    } catch (e) {
      toast.error(e.response?.data?.message || "Erreur lors de l'enregistrement")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-isiblue-50 flex-shrink-0">
              {student.photo
                ? <img src={`/storage/${student.photo}`} alt={student.nom} className="w-full h-full object-cover"/>
                : <div className="w-full h-full flex items-center justify-center text-isiblue-400 font-black text-sm">
                    {(student.prenom?.[0] || '') + (student.nom?.[0] || '')}
                  </div>
              }
            </div>
            <div>
              <h3 className="text-slate-900 font-bold">{student.prenom} {student.nom}</h3>
              <div className="text-isiblue-500 text-xs font-mono">{student.matricule}</div>
              <p className="text-slate-500 text-xs">{student.filiere?.nom} — {student.license?.nom}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1"><X size={18}/></button>
        </div>

        {/* Body — scrollable */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">

          {/* Financial quick summary */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <p className="text-slate-500 text-xs mb-1">Inscription</p>
              <p className="text-slate-900 font-bold text-sm">{fmt(inscDetail?.total_du ?? student.license?.frais_inscription)} FCFA</p>
              {student.inscription_payee
                ? <p className="text-emerald-600 text-xs">✓ Payée</p>
                : <p className="text-amber-600 text-xs">⚠ Non réglée</p>}
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <p className="text-slate-500 text-xs mb-1">Mensualité</p>
              <p className="text-slate-900 font-bold text-sm">{fmt(student.license?.frais_mensuel)} FCFA/mois</p>
              {suivi
                ? <p className="text-xs text-slate-500">{suivi.mois_payes}/{suivi.mois_total} mois payés</p>
                : avancePaiement !== 0 && (
                  <p className={`text-xs font-semibold ${avancePaiement > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {avancePaiement > 0 ? `Avance : +${fmt(avancePaiement)}` : `Déficit : ${fmt(avancePaiement)}`} FCFA
                  </p>
                )
              }
            </div>
          </div>

          {/* Inscription fee breakdown — shown when type = inscription */}
          {type === 'inscription' && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-isiblue-50 border-b border-slate-100">
                <p className="text-isiblue-600 text-xs font-bold uppercase tracking-wider">Détail des frais d'inscription</p>
              </div>
              {loadingSuivi && !inscDetail
                ? <div className="p-3 text-slate-400 text-xs">Chargement…</div>
                : (
                  <div className="divide-y divide-slate-100">
                    {[
                      { label: 'Frais de scolarité',    val: inscDetail?.frais_scolarite },
                      { label: 'Participation AMEA',    val: inscDetail?.frais_amea },
                      { label: 'Tenue scolaire',        val: inscDetail?.frais_tenue },
                      { label: 'Assurance scolaire',    val: inscDetail?.frais_assurance },
                      { label: `Dernier mois (avance)${inscDetail?.dernier_mois_cle ? ' — ' + inscDetail.dernier_mois_cle : ''}`,
                        val: inscDetail?.frais_dernier_mois },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex justify-between items-center px-3 py-1.5">
                        <span className="text-slate-500 text-xs">{label}</span>
                        <span className="text-slate-900 text-xs font-semibold">{fmt(val)} FCFA</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center px-3 py-2 bg-isiblue-50">
                      <span className="text-isiblue-600 text-xs font-bold uppercase">Total dû</span>
                      <span className="text-isiblue-600 text-sm font-black">{fmt(inscDetail?.total_du)} FCFA</span>
                    </div>
                    {(inscDetail?.deja_paye ?? 0) > 0 && (
                      <div className="flex justify-between items-center px-3 py-1.5">
                        <span className="text-emerald-600/70 text-xs">Déjà versé</span>
                        <span className="text-emerald-600 text-xs font-semibold">{fmt(inscDetail.deja_paye)} FCFA</span>
                      </div>
                    )}
                    {(inscDetail?.restant ?? 0) > 0 && (
                      <div className="flex justify-between items-center px-3 py-2 bg-red-50">
                        <span className="text-red-600 text-xs font-bold">Solde restant</span>
                        <span className="text-red-600 text-sm font-black">{fmt(inscDetail.restant)} FCFA</span>
                      </div>
                    )}
                  </div>
                )
              }
            </div>
          )}

          {/* Months in arrears alert */}
          {moisImpayesDus.length > 0 && type !== 'inscription' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-xs font-bold mb-2 flex items-center gap-1.5">
                <AlertTriangle size={12}/> {moisImpayesDus.length} mois impayé{moisImpayesDus.length > 1 ? 's' : ''} — arriéré dû
              </p>
              <div className="flex flex-wrap gap-1.5">
                {moisImpayesDus.map(m => (
                  <button key={m.cle}
                    onClick={() => {
                      setType('mensualite')
                      setMoisSelectionne(m.cle)
                      const avance = Math.round(suivi?.avance_paiement ?? 0)
                      const frais = Math.round(Number(student.license?.frais_mensuel) || 0)
                      setMontant(Math.round(Math.max(0, frais - avance)) || frais || '')
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                      moisSelectionne === m.cle
                        ? 'bg-red-500 border-red-400 text-white'
                        : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                    }`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Avance/déficit banner for mensualite */}
          {type === 'mensualite' && avancePaiement !== 0 && (
            <div className={`rounded-xl p-3 text-xs font-semibold border ${
              avancePaiement > 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              {avancePaiement > 0
                ? <>Avance disponible : <strong>+{fmt(Math.round(avancePaiement))} FCFA</strong> — Montant à payer ce mois : <strong>{fmt(Math.round(Math.max(0, (Number(student.license?.frais_mensuel) || 0) - avancePaiement)))} FCFA</strong></>
                : <>Déficit reporté : <strong>{fmt(Math.round(avancePaiement))} FCFA</strong> — Montant à régulariser : <strong>{fmt(Math.round((Number(student.license?.frais_mensuel) || 0) + Math.abs(avancePaiement)))} FCFA</strong></>
              }
            </div>
          )}

          {/* Type */}
          <div>
            <label className="form-label-light text-xs">Type de paiement *</label>
            <select className="form-input-light text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              {!student.inscription_payee && <option value="inscription">Frais d'inscription</option>}
              <option value="mensualite">Mensualité</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          {/* Month selection for mensualite */}
          {type === 'mensualite' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="form-label-light text-xs mb-0">{multiMode ? 'Mois concernés (paiement anticipé) *' : 'Mois concerné *'}</label>
                <button type="button" onClick={() => { setMultiMode(v => !v); setMoisMulti([]); setMoisSelectionne(null); setMontant('') }}
                  className={`text-[10px] px-2 py-1 rounded-lg border font-semibold transition-all ${
                    multiMode ? 'bg-isiblue-50 border-isiblue-200 text-isiblue-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                  }`}>
                  {multiMode ? '✓ Paiement anticipé' : 'Payer plusieurs mois'}
                </button>
              </div>
              {loadingSuivi ? (
                <div className="form-input-light text-sm text-slate-400">Chargement des mois…</div>
              ) : suivi?.mois ? (
                <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {suivi.mois.map(m => {
                    const isPaid     = m.paye       // bloqué (payé complet OU partiel)
                    const isPartiel  = m.partiel    // bloqué mais paiement partiel (déficit reporté)
                    const isRetard   = m.en_retard
                    const isActuel   = m.actuel
                    const isFutur    = m.futur
                    const isSelected = multiMode ? moisMulti.includes(m.cle) : moisSelectionne === m.cle
                    return (
                      <button key={m.cle}
                        disabled={isPaid}
                        onClick={() => {
                          const frais = Math.round(Number(student.license?.frais_mensuel || 0))
                          if (multiMode) {
                            setMoisMulti(prev => {
                              const next = prev.includes(m.cle) ? prev.filter(c => c !== m.cle) : [...prev, m.cle].sort()
                              setMontant(next.length * frais || '')
                              return next
                            })
                          } else {
                            setMoisSelectionne(m.cle)
                            const avance = Math.round(suivi?.avance_paiement ?? 0)
                            setMontant(Math.round(Math.max(0, frais - avance)) || frais)
                          }
                        }}
                        className={`text-xs px-2 py-2 rounded-lg border text-center transition-all font-medium ${
                          isPaid && !isPartiel ? 'bg-emerald-50 border-emerald-200 text-emerald-400 cursor-not-allowed'
                          : isPartiel ? 'bg-amber-50 border-amber-200 text-amber-400 cursor-not-allowed'
                          : isSelected ? 'bg-isiblue-500 border-isiblue-500 text-white'
                          : isRetard ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                          : isActuel ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                          : isFutur  ? 'bg-isiblue-50/70 border-isiblue-100 text-isiblue-400 hover:bg-isiblue-50 hover:text-isiblue-500'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}>
                        {isPaid && !isPartiel ? '✓ ' : isPartiel ? '½ ' : isRetard ? '⚠ ' : isFutur ? '◷ ' : ''}{m.label.split(' ')[0]}
                        <div className="text-[9px] opacity-60">{isPartiel ? 'partiel' : m.label.split(' ')[1]}</div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <select className="form-input-light text-sm" value={moisSelectionne || ''} onChange={e => setMoisSelectionne(e.target.value)}>
                  <option value="">-- Sélectionner un mois --</option>
                </select>
              )}
              {!multiMode && moisSelectionne && (() => {
                const selectedMoisInfo = suivi?.mois?.find(m => m.cle === moisSelectionne)
                return (
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-isiblue-600 text-xs font-semibold">
                      Mois sélectionné : {selectedMoisInfo?.label || moisSelectionne}
                    </p>
                    {selectedMoisInfo?.futur && (
                      <span className="text-[9px] bg-isiblue-50 border border-isiblue-200 text-isiblue-600 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                        Anticipé
                      </span>
                    )}
                  </div>
                )
              })()}
              {multiMode && moisMulti.length > 0 && (
                <p className="mt-1 text-isiblue-600 text-xs font-semibold">
                  {moisMulti.length} mois sélectionné{moisMulti.length > 1 ? 's' : ''} — le montant versé sera réparti dans l'ordre ; un solde partiel sera reporté sur le mois suivant.
                </p>
              )}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="form-label-light text-xs">Montant versé (FCFA) *</label>
            <input className="form-input-light text-sm" type="number" value={montant}
              onChange={(e) => setMontant(e.target.value)} placeholder="150000" />
            {type === 'inscription' && inscDetail?.total_du && (
              <p className="text-slate-500 text-xs mt-1">Total inscription : {fmt(inscDetail.total_du)} FCFA</p>
            )}
          </div>

          {/* Method */}
          <div>
            <label className="form-label-light text-xs">Méthode de paiement *</label>
            <select className="form-input-light text-sm" value={methode} onChange={(e) => setMethode(e.target.value)}>
              <option value="especes">💵 Espèces</option>
              <option value="wave">📱 Wave</option>
              <option value="virement">🏦 Virement bancaire</option>
              <option value="cheque">📄 Chèque</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="form-label-light text-xs">Notes (optionnel)</label>
            <textarea className="form-input-light text-sm resize-none" rows={2}
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 pt-0 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary-light flex-1 text-sm py-2.5">Annuler</button>
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

/* ── Edit payment modal (correction erreur de caisse) ────────────────────── */
function EditPaymentModal({ payment, onClose, onSuccess }) {
  const [montant, setMontant] = useState(payment.montant)
  const [methode, setMethode] = useState(payment.methode || 'especes')
  const [notes, setNotes]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [motif, setMotif]     = useState('')
  const [requesting, setRequesting] = useState(false)
  const [demande, setDemande] = useState(undefined) // undefined = chargement, null = aucune

  const refreshDemande = () => {
    getStatutDemandeModification(payment.id)
      .then(({ data }) => setDemande(data.demande))
      .catch(() => setDemande(null))
  }
  useEffect(() => { refreshDemande() }, [payment.id])

  const demanderPermission = async () => {
    setRequesting(true)
    try {
      await demanderModificationPaiement(payment.id, { motif })
      toast.success("Demande envoyée à l'administrateur")
      refreshDemande()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur lors de la demande')
    } finally {
      setRequesting(false)
    }
  }

  const submit = async () => {
    if (!montant || Number(montant) <= 0) { toast.error('Montant invalide'); return }
    setSubmitting(true)
    try {
      await updateManualPayment(payment.id, { montant: Number(montant), methode, notes })
      toast.success('Paiement corrigé — reçu régénéré')
      onSuccess()
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur lors de la correction')
    } finally {
      setSubmitting(false)
    }
  }

  const peutCorriger = demande?.statut === 'approuve'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative light-card p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2"><Pencil size={17} className="text-isiblue-500"/> Corriger le paiement</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18}/></button>
        </div>
        <p className="text-slate-500 text-sm mb-4">
          {payment.student?.prenom} {payment.student?.nom} — {payment.type === 'inscription' ? "Frais d'inscription" : payment.type === 'mensualite' ? `Mensualité ${payment.mois || ''}` : 'Autre'}
        </p>

        {demande === undefined ? (
          <div className="py-6 text-center text-slate-400 text-sm">Vérification des droits…</div>
        ) : !peutCorriger ? (
          <div className="space-y-3">
            {demande?.statut === 'en_attente' ? (
              <div className="p-3 rounded-xl bg-isigold-100/60 border border-isigold-300 text-sm text-isigold-700">
                ⏳ Demande envoyée — en attente de validation par l'administrateur.
              </div>
            ) : (
              <>
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                  🔒 Modification verrouillée — une autorisation de l'administrateur est requise pour corriger ce paiement.
                </div>
                <div>
                  <label className="form-label-light">Motif de la demande (optionnel)</label>
                  <textarea className="form-input-light resize-none" rows={2} value={motif} onChange={(e) => setMotif(e.target.value)}
                    placeholder="Ex: erreur de saisie du montant"/>
                </div>
              </>
            )}
            <div className="flex gap-3 mt-2">
              <button onClick={onClose} className="btn-secondary-light flex-1 text-sm py-2.5">Fermer</button>
              {demande?.statut !== 'en_attente' && (
                <button onClick={demanderPermission} disabled={requesting} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5">
                  {requesting ? <div className="spinner w-4 h-4"/> : 'Demander la permission'}
                </button>
              )}
              {demande?.statut === 'en_attente' && (
                <button onClick={refreshDemande} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5">
                  Rafraîchir
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="p-2.5 mb-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
              ✓ Autorisation accordée par l'administrateur — modification à usage unique.
            </div>
            <div className="space-y-3">
              <div>
                <label className="form-label-light">Montant correct (FCFA) *</label>
                <input type="number" className="form-input-light" value={montant} onChange={(e) => setMontant(e.target.value)}/>
                <p className="text-slate-400 text-xs mt-1">Ancien montant : {fmt(payment.montant)} FCFA</p>
              </div>
              <div>
                <label className="form-label-light">Mode de paiement *</label>
                <select className="form-input-light" value={methode} onChange={(e) => setMethode(e.target.value)}>
                  <option value="especes">Espèces</option>
                  <option value="virement">Virement</option>
                  <option value="cheque">Chèque</option>
                  <option value="wave">Wave</option>
                </select>
              </div>
              <div>
                <label className="form-label-light">Raison de la correction (optionnel)</label>
                <textarea className="form-input-light resize-none" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: erreur de saisie du montant"/>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={onClose} className="btn-secondary-light flex-1 text-sm py-2.5">Annuler</button>
              <button onClick={submit} disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5">
                {submitting ? <div className="spinner w-4 h-4"/> : <Check size={15}/>}
                Corriger
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

/* ── Aperçu PDF inline (reçu) sans téléchargement ────────────────────────── */
function PdfPreviewModal({ url, label, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-2xl overflow-hidden w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <span className="font-semibold text-sm text-slate-700">{label}</span>
          <div className="flex items-center gap-1">
            <a href={url} download className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all" title="Télécharger"><Download size={16}/></a>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all"><X size={18}/></button>
          </div>
        </div>
        <iframe src={url} className="flex-1 w-full bg-slate-100" title={label}/>
      </motion.div>
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function CashierDashboard() {
  const { logout, user, updateUser } = useAuth()
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
  const [editingPayment, setEditingPayment] = useState(null)

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

  const [brouillardDate, setBrouillardDate] = useState(new Date().toISOString().slice(0, 10))
  const [loadingBrouillard, setLoadingBrouillard] = useState(false)
  const handleDownloadBrouillard = async () => {
    setLoadingBrouillard(true)
    try {
      const { data } = await downloadBrouillardBlob(brouillardDate)
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = `brouillard_ISI_${brouillardDate}.pdf`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch {
      toast.error('Impossible de générer le brouillard')
    } finally {
      setLoadingBrouillard(false)
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
      loadInscrits()
      if (active === 'paiements') loadPayments()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const [previewPdf, setPreviewPdf] = useState(null)

  const handleViewRecu = async (paymentId) => {
    try {
      const { data } = await downloadReceiptBlob(paymentId)
      const url = URL.createObjectURL(data)
      setPreviewPdf({ url, label: 'Reçu de paiement' })
    } catch {
      toast.error('Impossible d\'afficher le reçu')
    }
  }

  const handleDownloadRecu = async (paymentId) => {
    try {
      const { data } = await downloadReceiptBlob(paymentId)
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url; a.download = `recu_${paymentId}.pdf`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch {
      toast.error('Impossible de télécharger le reçu')
    }
  }

  const onQuickPaySuccess = () => {
    setQuickPay(null)
    loadStats()
    loadAttente()
    loadInscrits()
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
    { id: 'profil',     label: 'Mon profil',        icon: UserCog },
  ]

  const [pwdForm, setPwdForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [changingPwd, setChangingPwd] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const { data } = await updateMyPhoto(formData)
      updateUser(data.user)
      toast.success('Photo mise à jour !')
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'envoi de la photo")
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }
  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwdForm.password !== pwdForm.password_confirmation) {
      toast.error('Les mots de passe ne correspondent pas.')
      return
    }
    setChangingPwd(true)
    try {
      await updateMyPassword(pwdForm)
      toast.success('Mot de passe mis à jour !')
      setPwdForm({ current_password: '', password: '', password_confirmation: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur — vérifiez votre mot de passe actuel.')
    } finally {
      setChangingPwd(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex relative">
      <LightPremiumBackground/>

      {quickPay && (
        <QuickPayModal
          student={quickPay}
          onClose={() => setQuickPay(null)}
          onSuccess={onQuickPaySuccess}
        />
      )}

      {editingPayment && (
        <EditPaymentModal
          payment={editingPayment}
          onClose={() => setEditingPayment(null)}
          onSuccess={loadPayments}
        />
      )}

      {previewPdf && (
        <PdfPreviewModal url={previewPdf.url} label={previewPdf.label}
          onClose={() => { URL.revokeObjectURL(previewPdf.url); setPreviewPdf(null) }}/>
      )}

      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)}/>
      )}

      {/* Sidebar */}
      <div className={`w-64 flex-shrink-0 bg-white/95 backdrop-blur-xl border-r border-slate-200 flex flex-col fixed top-0 left-0 h-full z-40 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-isiblue-500 to-isiblue-400 flex items-center justify-center">
                <Wallet size={20} className="text-white"/>
              </div>
              <div>
                <div className="text-isiblue-700 font-bold">ISI SUPTECH</div>
                <div className="text-isigold-600 text-xs font-medium">Caisse</div>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-isiblue-700 hover:bg-slate-100 lg:hidden">
              <X size={18}/>
            </button>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} onClick={() => { setActive(item.id); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active === item.id
                    ? 'bg-isiblue-50 text-isiblue-700 border border-isiblue-200'
                    : 'text-slate-500 hover:text-isiblue-600 hover:bg-slate-50'
                }`}>
                <Icon size={17} className={active === item.id ? 'text-isigold-500' : ''}/>{item.label}
                {item.id === 'impayes' && impayesMois.length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{impayesMois.length}</span>
                )}
              </button>
            )
          })}
        </nav>
        <div className="p-3 border-t border-slate-200">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
            <LogOut size={17}/> Déconnexion
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 lg:ml-64 relative z-10 min-w-0">
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-isiblue-700 hover:bg-slate-100 lg:hidden flex-shrink-0">
              <Menu size={20}/>
            </button>
            <h1 className="text-isiblue-700 font-semibold truncate">
              {NAV.find(n => n.id === active)?.label}
            </h1>
          </div>
          <div className="text-isigold-600 text-xs font-semibold uppercase tracking-wider flex-shrink-0">Caisse</div>
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
                      className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all">
                      <AlertTriangle size={16}/> Voir les impayés du mois
                    </button>
                    <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-slate-200 ml-auto shadow-sm">
                      <input type="date" value={brouillardDate} onChange={(e) => setBrouillardDate(e.target.value)}
                        className="bg-transparent text-slate-800 text-sm focus:outline-none"/>
                      <button onClick={handleDownloadBrouillard} disabled={loadingBrouillard}
                        className="flex items-center gap-1.5 text-xs bg-isiblue-50 text-isiblue-600 hover:bg-isiblue-100 border border-isiblue-200 px-3 py-1.5 rounded-lg transition-all font-semibold disabled:opacity-50">
                        {loadingBrouillard ? <RefreshCw size={13} className="animate-spin"/> : <FileDown size={13}/>}
                        Brouillard du jour
                      </button>
                    </div>
                  </div>

                  {/* Pending students */}
                  <div className="light-card overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-isiblue-700 font-semibold flex items-center gap-2">
                        <Users size={17} className="text-isigold-500"/>
                        Étudiants en attente de paiement d'inscription
                        {etudiantsAttente.length > 0 && (
                          <span className="ml-1 bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold">
                            {etudiantsAttente.length}
                          </span>
                        )}
                      </h3>
                      <button onClick={loadAttente} className="text-slate-400 hover:text-isiblue-600">
                        <RefreshCw size={14}/>
                      </button>
                    </div>
                    {loadingAttente ? (
                      <div className="py-10 flex justify-center"><div className="spinner"/></div>
                    ) : etudiantsAttente.length === 0 ? (
                      <div className="py-10 text-center text-slate-400 text-sm">Aucun étudiant en attente</div>
                    ) : (
                      <table className="data-table-light">
                        <thead>
                          <tr><th>Étudiant</th><th>Filière / Niveau</th><th>Matricule</th><th>Montant</th><th>Action rapide</th></tr>
                        </thead>
                        <tbody>
                          {etudiantsAttente.map(s => (
                            <tr key={s.id}>
                              <td>
                                <div className="text-slate-900 text-sm font-semibold">{s.prenom} {s.nom}</div>
                                <div className="text-slate-400 text-xs">{s.user?.email}</div>
                              </td>
                              <td>
                                <div className="text-slate-700 text-sm">{s.filiere?.nom}</div>
                                <div className="text-slate-400 text-xs">{s.license?.nom}</div>
                              </td>
                              <td className="text-isiblue-500 font-mono text-sm">{s.matricule || '—'}</td>
                              <td className="text-amber-700 font-bold text-sm">
                                {s.license?.frais_inscription ? fmt(s.license.frais_inscription) + ' FCFA' : '—'}
                              </td>
                              <td>
                                <button onClick={() => setQuickPay(s)}
                                  className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-lg transition-all font-semibold">
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
                  <div className="light-card overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-isiblue-700 font-semibold flex items-center gap-2">
                        <Check size={17} className="text-emerald-600"/>
                        Étudiants inscrits
                        {etudiantsInscrits.length > 0 && (
                          <span className="ml-1 bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-bold">
                            {etudiantsInscrits.length}
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2">
                        <button onClick={loadInscrits} className="text-slate-400 hover:text-isiblue-600"><RefreshCw size={14}/></button>
                        <button onClick={() => setActive('etudiants')} className="text-isiblue-500 hover:text-isiblue-600 text-xs flex items-center gap-1">
                          Voir tous <ChevronRight size={13}/>
                        </button>
                      </div>
                    </div>
                    {loadingInscrits ? (
                      <div className="py-10 flex justify-center"><div className="spinner"/></div>
                    ) : etudiantsInscrits.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-sm">Aucun étudiant inscrit pour le moment</div>
                    ) : (
                      <table className="data-table-light">
                        <thead>
                          <tr><th>Étudiant</th><th>Filière / Niveau</th><th>Matricule</th><th>Mensualité</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                          {etudiantsInscrits.slice(0, 10).map(s => (
                            <tr key={s.id}>
                              <td>
                                <div className="text-slate-900 text-sm font-semibold">{s.prenom} {s.nom}</div>
                                <div className="text-slate-400 text-xs">{s.user?.email}</div>
                              </td>
                              <td>
                                <div className="text-slate-700 text-sm">{s.filiere?.nom}</div>
                                <div className="text-slate-400 text-xs">{s.license?.nom}</div>
                              </td>
                              <td className="text-isiblue-500 font-mono text-sm">{s.matricule || '—'}</td>
                              <td className="text-slate-700 text-sm">
                                {s.license?.frais_mensuel ? fmt(s.license.frais_mensuel) + ' FCFA/mois' : '—'}
                              </td>
                              <td>
                                <button onClick={() => setQuickPay(s)}
                                  className="flex items-center gap-1.5 text-xs bg-isiblue-50 text-isiblue-600 hover:bg-isiblue-100 border border-isiblue-200 px-3 py-2 rounded-lg transition-all font-semibold">
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
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <input className="form-input-light pl-9 py-2 text-sm" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadPayments()} />
                    </div>
                    <button onClick={loadPayments} className="btn-secondary-light text-sm py-2 px-4 flex items-center gap-2">
                      <RefreshCw size={14}/> Actualiser
                    </button>
                  </div>
                  <div className="light-card overflow-hidden">
                    <table className="data-table-light">
                      <thead>
                        <tr><th>Étudiant</th><th>Type</th><th>Montant</th><th>Méthode</th><th>Saisi par</th><th>Date</th><th>Statut</th><th>Reçu</th></tr>
                      </thead>
                      <tbody>
                        {loading
                          ? <tr><td colSpan={8} className="text-center py-10"><div className="spinner mx-auto"/></td></tr>
                          : payments.length === 0
                          ? <tr><td colSpan={8} className="text-center py-8 text-slate-400">Aucun paiement</td></tr>
                          : payments.map((p) => (
                            <tr key={p.id}>
                              <td>
                                <div className="text-slate-900 text-sm">{p.student?.prenom} {p.student?.nom}</div>
                                <div className="text-slate-400 text-xs font-mono">{p.student?.matricule}</div>
                              </td>
                              <td className="text-slate-700 text-sm">{
                                p.type === 'inscription' ? "Frais d'inscription" :
                                p.type === 'mensualite' ? `Mensualité ${p.mois || ''}` : 'Autre'
                              }</td>
                              <td className="text-slate-900 font-bold">{fmt(p.montant)} FCFA</td>
                              <td className="text-slate-600 text-sm">{p.methode?.toUpperCase()}</td>
                              <td className="text-slate-500 text-xs">{p.saiseur?.name || 'Wave'}</td>
                              <td className="text-slate-400 text-xs">{p.date_paiement ? new Date(p.date_paiement).toLocaleDateString('fr-FR') : '—'}</td>
                              <td><span className={p.statut === 'complete' ? 'badge-accepted' : 'badge-pending'}>{p.statut}</span></td>
                              <td>
                                <div className="flex items-center gap-3">
                                  <button onClick={() => handleViewRecu(p.id)}
                                    className="text-isiblue-500 hover:text-isiblue-600 flex items-center gap-1 text-xs transition-colors">
                                    <Eye size={12}/> Voir
                                  </button>
                                  <button onClick={() => handleDownloadRecu(p.id)}
                                    className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-xs transition-colors">
                                    <Download size={12}/> PDF
                                  </button>
                                  <button onClick={() => setEditingPayment(p)} title="Corriger ce paiement (autorisation admin requise)"
                                    className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-xs transition-colors">
                                    <Pencil size={12}/> Corriger
                                  </button>
                                </div>
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
                  <p className="text-slate-500 text-sm">Enregistrez manuellement un paiement (espèces, virement, chèque).</p>

                  {/* Pending shortcut */}
                  {etudiantsAttente.length > 0 && !selectedStudent && (
                    <div className="light-card p-4 border border-amber-200">
                      <p className="text-amber-700 text-xs font-bold mb-3 flex items-center gap-1.5">
                        <Clock size={13}/> {etudiantsAttente.length} étudiant{etudiantsAttente.length > 1 ? 's' : ''} en attente d'inscription — Sélection rapide
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {etudiantsAttente.map(s => (
                          <button key={s.id} onClick={() => {
                            setSelectedStudent(s)
                            setForm(f => ({ ...f, student_id: s.id, type: 'inscription', montant: s.license?.frais_inscription || '' }))
                          }} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-200 transition-all text-left">
                            <div>
                              <span className="text-slate-900 text-sm font-semibold">{s.prenom} {s.nom}</span>
                              <span className="text-slate-400 text-xs ml-2">{s.filiere?.nom}</span>
                            </div>
                            <span className="text-amber-700 text-xs font-bold">{fmt(s.license?.frais_inscription)} FCFA</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Student search */}
                  <div>
                    <label className="form-label-light">Rechercher l'étudiant *</label>
                    {selectedStudent ? (
                      <div className="flex items-center justify-between light-card p-4 border border-emerald-200">
                        <div>
                          <div className="text-slate-900 font-semibold">{selectedStudent.prenom} {selectedStudent.nom}</div>
                          <div className="text-isiblue-500 text-sm font-mono">{selectedStudent.matricule}</div>
                          <div className="text-slate-400 text-xs">{selectedStudent.filiere?.nom} — {selectedStudent.license?.nom}</div>
                        </div>
                        <button onClick={() => { setSelectedStudent(null); setForm(f => ({ ...f, student_id: '' })) }}
                          className="text-slate-400 hover:text-slate-700"><X size={16}/></button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input className="form-input-light pl-9" placeholder="Nom, prénom ou matricule…" value={searchStudent} onChange={(e) => setSearchStudent(e.target.value)} />
                        {students.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-20 mt-1 light-card border border-slate-200 overflow-hidden">
                            {students.map((s) => (
                              <button key={s.id} onClick={() => handleSelectStudent(s)}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                                <div>
                                  <div className="text-slate-900 text-sm">{s.prenom} {s.nom}</div>
                                  <div className="text-slate-400 text-xs">{s.matricule} — {s.filiere?.nom}</div>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${s.statut_inscription === 'en_attente_paiement' ? 'bg-amber-50 text-amber-700' : 'badge-accepted'}`}>
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
                    <label className="form-label-light">Type de paiement *</label>
                    <select className="form-input-light" value={form.type} onChange={(e) => {
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
                      <label className="form-label-light">Mois concerné *</label>
                      <select className="form-input-light" value={form.mois} onChange={(e) => setForm({ ...form, mois: e.target.value })}>
                        <option value="">-- Sélectionner --</option>
                        {getCurrentMoisOptions().map((o) => {
                          const dis = moisDesactives.includes(o.value)
                          return <option key={o.value} value={o.value} disabled={dis}>{dis ? `🚫 ${o.label} (désactivé)` : o.label}</option>
                        })}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="form-label-light">Montant (FCFA) *</label>
                    <input className="form-input-light" type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} placeholder="150000" />
                  </div>

                  <div>
                    <label className="form-label-light">Méthode de paiement *</label>
                    <select className="form-input-light" value={form.methode} onChange={(e) => setForm({ ...form, methode: e.target.value })}>
                      <option value="especes">💵 Espèces</option>
                      <option value="wave">📱 Wave</option>
                      <option value="virement">🏦 Virement bancaire</option>
                      <option value="cheque">📄 Chèque</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label-light">Notes (optionnel)</label>
                    <textarea className="form-input-light resize-none" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setActive('dashboard')} className="btn-secondary-light flex-1">Annuler</button>
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
                  <div className="light-card p-4">
                    <div className="flex flex-wrap gap-3 items-end">
                      <div className="flex-1 min-w-[180px]">
                        <label className="form-label-light text-xs mb-1">Filière</label>
                        <select className="form-input-light text-sm py-2"
                          value={browserFiliereId}
                          onChange={(e) => setBrowserFiliereId(e.target.value)}>
                          <option value="">Toutes les filières</option>
                          {filieres.map(f => (
                            <option key={f.id} value={f.id}>{f.nom}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label className="form-label-light text-xs mb-1">Recherche</label>
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                          <input className="form-input-light pl-8 text-sm py-2"
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
                    <div className="py-16 text-center text-slate-400">
                      <Users size={40} className="mx-auto mb-3 opacity-30"/>
                      <p>Aucun étudiant trouvé — affinez les filtres et recherchez</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-slate-400 text-xs">{browserStudents.length} étudiant{browserStudents.length > 1 ? 's' : ''} trouvé{browserStudents.length > 1 ? 's' : ''}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {browserStudents.map((s) => {
                          const photoUrl = s.photo
                            ? `/storage/${s.photo}`
                            : null
                          return (
                            <div key={s.id} className="light-card p-4 flex flex-col gap-3 hover:border-isiblue-300 transition-all border border-slate-100">
                              {/* Photo + identity */}
                              <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-isiblue-50 flex-shrink-0">
                                  {photoUrl ? (
                                    <img src={photoUrl} alt={s.nom} className="w-full h-full object-cover"/>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-isiblue-400 text-xl font-black">
                                      {(s.prenom?.[0] || '') + (s.nom?.[0] || '')}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-slate-900 font-bold text-sm truncate">{s.prenom} {s.nom}</div>
                                  <div className="text-isiblue-500 font-mono text-xs">{s.matricule || '—'}</div>
                                  <div className="text-slate-400 text-xs truncate">{s.filiere?.nom}</div>
                                </div>
                              </div>

                              {/* Info row */}
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-slate-50 rounded-lg p-2">
                                  <div className="text-slate-400">Niveau</div>
                                  <div className="text-slate-900 font-semibold truncate">{s.license?.nom || '—'}</div>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-2">
                                  <div className="text-slate-400">Inscription</div>
                                  <div className={`font-semibold ${s.inscription_payee ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {s.inscription_payee ? '✓ Payée' : '⚠ Non réglée'}
                                  </div>
                                </div>
                              </div>

                              {/* Mensualité info */}
                              <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2">
                                <span className="text-slate-400">Mensualité</span>
                                <span className="text-slate-900 font-bold">{fmt(s.license?.frais_mensuel)} FCFA/mois</span>
                              </div>

                              {/* Action */}
                              <button
                                onClick={() => setBrowserSelected(s)}
                                className="w-full flex items-center justify-center gap-2 text-sm bg-isiblue-50 text-isiblue-600 hover:bg-isiblue-100 border border-isiblue-200 py-2.5 rounded-xl transition-all font-semibold">
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
                    <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-slate-200 shadow-sm">
                      <Filter size={14} className="text-slate-400"/>
                      <select className="bg-transparent text-slate-800 text-sm focus:outline-none"
                        value={filtreImpMois}
                        onChange={(e) => { setFiltreImpMois(e.target.value); loadImpayesMois(e.target.value) }}>
                        {getCurrentMoisOptions().map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={() => loadImpayesMois(filtreImpMois)}
                      className="text-slate-400 hover:text-isiblue-600 flex items-center gap-1.5 text-sm">
                      <RefreshCw size={14}/> Actualiser
                    </button>
                    {impayesMois.length > 0 && (
                      <>
                        <span className="text-red-600 text-sm font-bold flex items-center gap-1.5">
                          <AlertTriangle size={14}/> {impayesMois.length} étudiant{impayesMois.length > 1 ? 's' : ''} n'ont pas payé
                        </span>
                        <button onClick={handleDownloadImpayesPdf}
                          className="flex items-center gap-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-3 py-2 rounded-lg transition-all font-semibold ml-auto">
                          <FileDown size={13}/> Télécharger liste PDF
                        </button>
                      </>
                    )}
                  </div>

                  <div className="light-card overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                      <h3 className="text-isiblue-700 font-semibold flex items-center gap-2">
                        <AlertTriangle size={16} className="text-red-500"/>
                        Mensualités impayées
                      </h3>
                      <p className="text-slate-400 text-xs mt-1">
                        Liste des étudiants actifs n'ayant pas réglé leur mensualité pour le mois sélectionné.
                        Accessible dès le 5 du mois pour retenir l'accès.
                      </p>
                    </div>
                    {loadingImp ? (
                      <div className="py-10 flex justify-center"><div className="spinner"/></div>
                    ) : impayesMois.length === 0 ? (
                      <div className="py-10 text-center">
                        <CheckCircle size={40} className="text-emerald-500 mx-auto mb-3"/>
                        <p className="text-emerald-700 font-semibold">Tous les étudiants sont à jour !</p>
                        <p className="text-slate-400 text-sm mt-1">Aucun impayé pour ce mois.</p>
                      </div>
                    ) : (
                      <table className="data-table-light">
                        <thead>
                          <tr><th>#</th><th>Étudiant</th><th>Matricule</th><th>Filière / Niveau</th><th>Mensualité due</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                          {impayesMois.map((s, i) => (
                            <tr key={s.id}>
                              <td className="text-slate-400 text-xs">{i + 1}</td>
                              <td>
                                <div className="text-slate-900 text-sm font-semibold">{s.prenom} {s.nom}</div>
                                <div className="text-slate-400 text-xs">{s.user?.email}</div>
                              </td>
                              <td className="text-isiblue-500 font-mono text-sm">{s.matricule || '—'}</td>
                              <td>
                                <div className="text-slate-700 text-sm">{s.filiere?.nom}</div>
                                <div className="text-slate-400 text-xs">{s.license?.nom}</div>
                              </td>
                              <td>
                                <span className="text-red-600 font-bold text-sm">{fmt(s.license?.frais_mensuel)} FCFA</span>
                              </td>
                              <td>
                                <button onClick={() => setQuickPay({ ...s, inscription_payee: true })}
                                  className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-all font-semibold">
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

              {active === 'profil' && (
                <div className="space-y-6 max-w-lg">
                  <div className="light-card p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-isiblue-600 to-isigold-500 flex items-center justify-center flex-shrink-0">
                        {user?.photo_url ? (
                          <img src={user.photo_url} alt={user.name} className="w-full h-full object-cover"/>
                        ) : (
                          <span className="text-white font-bold text-lg">{(user?.name || 'C')[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <div className="text-slate-900 text-sm font-semibold">{user?.name}</div>
                        <div className="text-slate-400 text-xs mb-2">{user?.email} · Caisse</div>
                        <label className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer bg-isiblue-500/10 text-isiblue-500 hover:bg-isiblue-500/20 transition-colors">
                          {uploadingPhoto ? 'Envoi...' : 'Changer la photo'}
                          <input type="file" accept="image/*" className="hidden" disabled={uploadingPhoto} onChange={handlePhotoChange}/>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="light-card p-5">
                    <h3 className="text-isiblue-700 font-semibold mb-4">Modifier le mot de passe</h3>
                    <form onSubmit={handleChangePassword} className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold mb-1 block text-slate-500">Mot de passe actuel</label>
                        <input type="password" required value={pwdForm.current_password}
                          onChange={e => setPwdForm(f => ({ ...f, current_password: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-isiblue-500/30"/>
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block text-slate-500">Nouveau mot de passe</label>
                        <input type="password" required minLength={8} value={pwdForm.password}
                          onChange={e => setPwdForm(f => ({ ...f, password: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-isiblue-500/30"/>
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block text-slate-500">Confirmer le nouveau mot de passe</label>
                        <input type="password" required minLength={8} value={pwdForm.password_confirmation}
                          onChange={e => setPwdForm(f => ({ ...f, password_confirmation: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-isiblue-500/30"/>
                      </div>
                      <button type="submit" disabled={changingPwd}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm text-white bg-isiblue-600 hover:bg-isiblue-700 transition-colors disabled:opacity-50">
                        {changingPwd ? <div className="spinner w-4 h-4"/> : 'Mettre à jour le mot de passe'}
                      </button>
                    </form>
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
