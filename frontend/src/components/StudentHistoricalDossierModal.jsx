import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  X, GraduationCap, Wallet, User, FileText, CheckCircle2,
  AlertTriangle, Download, ChevronRight, Award, BookOpen,
  CreditCard, Calendar, Clock, RefreshCw, Eye, ShieldCheck, Mail
} from 'lucide-react'
import {
  getStudentDossierHistorique, downloadBulletinBlob, downloadAttestationInscriptionBlob,
  downloadCertificatScolariteBlob, downloadFicheInscriptionBlob
} from '../services/api'

function safeFmt(n) {
  return Number(n || 0).toLocaleString('fr-FR')
}

export default function StudentHistoricalDossierModal({
  isOpen,
  onClose,
  student,
  onOpenReinscription = null,
  isDark = false
}) {
  const [activeTab, setActiveTab] = useState('notes') // 'notes' | 'caisse' | 'identite'
  const [loading, setLoading] = useState(false)
  const [dossierData, setDossierData] = useState(null)
  const [selectedSemestreId, setSelectedSemestreId] = useState('ALL')
  const [downloadingDoc, setDownloadingDoc] = useState(null)

  useEffect(() => {
    if (isOpen && student?.id) {
      setLoading(true)
      setActiveTab('notes')
      setSelectedSemestreId('ALL')
      getStudentDossierHistorique(student.id)
        .then(({ data }) => {
          setDossierData(data)
        })
        .catch(() => {
          toast.error('Erreur lors du chargement du dossier étudiant')
        })
        .finally(() => setLoading(false))
    } else {
      setDossierData(null)
    }
  }, [isOpen, student?.id])

  if (!isOpen || !student) return null

  const st = dossierData?.student || student
  const semestres = dossierData?.semestres_data || []
  const caisse = dossierData?.caisse_data || {}
  const paiements = caisse.paiements || []

  // Filter semestres based on selected filter
  const visibleSemestres = selectedSemestreId === 'ALL'
    ? semestres
    : semestres.filter(s => String(s.id) === String(selectedSemestreId))

  // Calculate annual metrics
  const totalCreditsRequis = semestres.reduce((acc, s) => acc + (s.credits_requis || 30), 0)
  const totalCreditsObtenus = semestres.reduce((acc, s) => acc + (s.credits_obtenus || 0), 0)
  const moySemestres = semestres.filter(s => s.moyenne_semestre > 0)
  const moyenneGenerale = moySemestres.length > 0
    ? (moySemestres.reduce((acc, s) => acc + s.moyenne_semestre, 0) / moySemestres.length).toFixed(2)
    : 0

  const handleDownloadDoc = async (type, semestreId = null) => {
    setDownloadingDoc(type + (semestreId ? `-${semestreId}` : ''))
    try {
      let res
      let filename = `${type}_${st.matricule.replace(/[^A-Za-z0-9]/g, '_')}.pdf`

      if (type === 'bulletin') {
        const semId = semestreId || (semestres[0]?.id)
        if (!semId) {
          toast.error('Aucun semestre trouvé pour ce bulletin')
          return
        }
        res = await downloadBulletinBlob(st.id, semId)
        filename = `bulletin_${st.matricule.replace(/[^A-Za-z0-9]/g, '_')}_S${semId}.pdf`
      } else if (type === 'attestation') {
        res = await downloadAttestationInscriptionBlob(st.id)
        filename = `attestation_inscription_${st.matricule.replace(/[^A-Za-z0-9]/g, '_')}.pdf`
      } else if (type === 'certificat') {
        res = await downloadCertificatScolariteBlob(st.id)
        filename = `certificat_scolarite_${st.matricule.replace(/[^A-Za-z0-9]/g, '_')}.pdf`
      } else if (type === 'fiche') {
        res = await downloadFicheInscriptionBlob(st.id)
        filename = `fiche_inscription_${st.matricule.replace(/[^A-Za-z0-9]/g, '_')}.pdf`
      }

      if (res?.data) {
        const blob = new Blob([res.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Document téléchargé avec succès !')
      }
    } catch (err) {
      toast.error('Erreur lors du téléchargement du document')
    } finally {
      setDownloadingDoc(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-5xl my-6 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header Profile Bar */}
        <div className="bg-gradient-to-r from-isiblue-700 via-isiblue-600 to-indigo-700 px-6 py-5 text-white flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white font-black text-xl flex items-center justify-center shadow-lg">
              {(st.prenom?.[0] || '') + (st.nom?.[0] || '')}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black tracking-tight">{st.nom_complet || `${st.prenom} ${st.nom}`}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-bold">
                  {st.annee_scolaire || 'N/A'}
                </span>
                {caisse.solde_restant <= 0 ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 font-bold flex items-center gap-1 border border-emerald-400/30">
                    <CheckCircle2 size={12} /> En règle
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-100 font-bold flex items-center gap-1 border border-amber-400/30">
                    <AlertTriangle size={12} /> Reliquat : {safeFmt(caisse?.solde_restant)} FCFA
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-100 mt-1 flex items-center gap-3 flex-wrap">
                <span>Matricule : <strong className="font-mono text-white">{st.matricule}</strong></span>
                <span>•</span>
                <span>Classe : <strong className="text-white">{st.license?.nom || st.niveau_entree || 'N/A'}</strong></span>
                <span>•</span>
                <span>Filière : <strong className="text-white">{st.filiere?.nom || 'N/A'}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenReinscription && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenReinscription(st)
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5"
              >
                <RefreshCw size={14} /> Réinscrire en 2026-2027
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 flex items-center justify-between shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1 py-2">
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'notes'
                  ? 'bg-white text-isiblue-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Award size={16} /> 📊 Relevé & Notes LMD ({semestres.length} Semestres)
            </button>
            <button
              onClick={() => setActiveTab('caisse')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'caisse'
                  ? 'bg-white text-isiblue-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CreditCard size={16} /> 💰 Caisse & Reçus ({paiements.length} Reçus)
            </button>
            <button
              onClick={() => setActiveTab('identite')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'identite'
                  ? 'bg-white text-isiblue-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <User size={16} /> 🪪 Identité & Documents Officiels
            </button>
          </div>

          <div className="flex items-center gap-2 py-2">
            <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Année :</span>
            <span className="text-xs font-bold px-3 py-1 rounded-lg bg-isiblue-50 text-isiblue-800 border border-isiblue-100">
              {st.annee_scolaire}
            </span>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
              <div className="w-8 h-8 border-3 border-isiblue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold">Chargement des notes et de la situation comptable...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: NOTES & RELEVE LMD */}
              {activeTab === 'notes' && (
                <div className="space-y-6">
                  {/* Semester KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {semestres.map((sem) => (
                      <div
                        key={sem.id}
                        className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {sem.libelle}
                          </span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            sem.valide ? 'bg-emerald-100 text-emerald-800' : (sem.moyenne_semestre > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700')
                          }`}>
                            {sem.decision || 'En cours'}
                          </span>
                        </div>
                        <div className="my-3">
                          <div className="text-2xl font-black text-slate-900">
                            {sem.moyenne_semestre > 0 ? `${sem.moyenne_semestre} / 20` : 'En attente'}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {sem.credits_obtenus} / {sem.credits_requis || 30} Crédits ECTS
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadDoc('bulletin', sem.id)}
                          disabled={downloadingDoc === `bulletin-${sem.id}`}
                          className="w-full mt-2 py-1.5 px-3 rounded-lg bg-isiblue-50 hover:bg-isiblue-100 text-isiblue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                        >
                          <Download size={13} />
                          {downloadingDoc === `bulletin-${sem.id}` ? 'Génération...' : `Bulletin ${sem.libelle}`}
                        </button>
                      </div>
                    ))}

                    <div className="p-4 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                          Moyenne Générale Annuelle
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                          {moyenneGenerale >= 10 ? 'ADMIS / VALIDÉ' : (moyenneGenerale > 0 ? 'AJOURNÉ' : 'EN COURS')}
                        </span>
                      </div>
                      <div className="my-3">
                        <div className="text-2xl font-black text-indigo-950">
                          {moyenneGenerale > 0 ? `${moyenneGenerale} / 20` : 'En cours'}
                        </div>
                        <p className="text-xs text-indigo-600 mt-0.5">
                          {totalCreditsObtenus} / {totalCreditsRequis || 60} Crédits ECTS validés
                        </p>
                      </div>
                      <div className="text-xs font-semibold text-slate-500">
                        Règle LMD : Validation par Module (UE ≥ 10/20)
                      </div>
                    </div>
                  </div>

                  {/* Filter Semestres */}
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Détail des Matières par Module (UE)</h3>
                      <p className="text-xs text-slate-500">Compensation automatique au sein de chaque Unité d'Enseignement</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedSemestreId('ALL')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          selectedSemestreId === 'ALL'
                            ? 'bg-isiblue-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Tous les Semestres
                      </button>
                      {semestres.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedSemestreId(String(s.id))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            String(selectedSemestreId) === String(s.id)
                              ? 'bg-isiblue-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {s.libelle}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* UEs / Modules List */}
                  {visibleSemestres.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      Aucun module enregistré pour cette sélection.
                    </div>
                  ) : (
                    visibleSemestres.map(sem => (
                      <div key={sem.id} className="space-y-4">
                        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-isiblue-700">
                          <BookOpen size={14} />
                          {sem.libelle} — {sem.credits_obtenus} / {sem.credits_requis || 30} Crédits validés
                        </div>

                        {sem.modules?.map(mod => (
                          <div key={mod.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            {/* UE Header */}
                            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                                  {mod.code || 'UE'}
                                </span>
                                <span className="text-xs font-bold text-slate-900">{mod.nom}</span>
                                <span className="text-xs text-slate-500">({mod.credits} Crédits)</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold">
                                  Moyenne UE : <strong className={mod.valide ? 'text-emerald-700' : 'text-amber-700'}>
                                    {mod.moyenne_ue > 0 ? `${mod.moyenne_ue} / 20` : 'Non calculée'}
                                  </strong>
                                </span>
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                  mod.valide ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {mod.statut_ue}
                                </span>
                              </div>
                            </div>

                            {/* Matieres Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-slate-100/60 text-slate-600 font-semibold border-b border-slate-200">
                                  <tr>
                                    <th className="p-3">Matière / Élément Constitutif</th>
                                    <th className="p-3 text-center">Coeff</th>
                                    <th className="p-3 text-center">Crédits</th>
                                    <th className="p-3 text-center">Note CC (40%)</th>
                                    <th className="p-3 text-center">Note Exam (60%)</th>
                                    <th className="p-3 text-center">Moyenne</th>
                                    <th className="p-3 text-right">Appréciation</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {mod.matieres?.map(mat => (
                                    <tr key={mat.id} className="hover:bg-slate-50/50 transition">
                                      <td className="p-3 font-semibold text-slate-900">
                                        {mat.nom}
                                        {mat.code && <span className="text-[10px] text-slate-400 font-mono ml-2">({mat.code})</span>}
                                      </td>
                                      <td className="p-3 text-center text-slate-600 font-bold">{mat.coeff}</td>
                                      <td className="p-3 text-center text-slate-600">{mat.credits}</td>
                                      <td className="p-3 text-center font-mono">
                                        {mat.cc !== null ? `${mat.cc} / 20` : '—'}
                                      </td>
                                      <td className="p-3 text-center font-mono">
                                        {mat.examen !== null ? `${mat.examen} / 20` : '—'}
                                      </td>
                                      <td className="p-3 text-center">
                                        <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                                          mat.valide ? 'bg-emerald-50 text-emerald-700' : (mat.moyenne > 0 ? 'bg-amber-50 text-amber-700' : 'text-slate-400')
                                        }`}>
                                          {mat.moyenne !== null ? `${mat.moyenne} / 20` : '—'}
                                        </span>
                                      </td>
                                      <td className="p-3 text-right font-medium text-slate-600">
                                        {mat.appreciation}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: CAISSE & REÇUS */}
              {activeTab === 'caisse' && (
                <div className="space-y-6">
                  {/* Financial KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Scolarité Totale Due</div>
                      <div className="text-2xl font-black text-slate-900 mt-2">
                        {safeFmt(caisse?.total_du)} <span className="text-sm font-semibold">FCFA</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Frais d'inscription + mensualités annuelles</p>
                    </div>

                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">Total Réglé en Caisse</div>
                      <div className="text-2xl font-black text-emerald-700 mt-2">
                        {safeFmt(caisse?.total_paye)} <span className="text-sm font-semibold">FCFA</span>
                      </div>
                      <p className="text-xs text-emerald-600 mt-1">{paiements.length} versement(s) encaissé(s)</p>
                    </div>

                    <div className={`p-4 rounded-xl border ${
                      caisse.solde_restant <= 0 ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-200 bg-amber-50/50'
                    }`}>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Solde Restant Dû</div>
                      <div className={`text-2xl font-black mt-2 ${caisse.solde_restant <= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {safeFmt(caisse?.solde_restant)} <span className="text-sm font-semibold">FCFA</span>
                      </div>
                      <p className="text-xs font-bold mt-1">
                        {caisse.solde_restant <= 0 ? '✅ Dossier 100% en règle' : `⚠️ Reliquat de ${safeFmt(caisse?.solde_restant)} FCFA`}
                      </p>
                    </div>
                  </div>

                  {/* Receipts Table */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-900">Historique des Reçus de Caisse</h3>
                      <span className="text-xs font-semibold text-slate-500">{paiements.length} reçu(s) émis</span>
                    </div>

                    {paiements.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                        Aucun reçu de paiement enregistré pour ce dossier.
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="p-3">N° Reçu</th>
                              <th className="p-3">Date</th>
                              <th className="p-3">Nature / Type</th>
                              <th className="p-3">Mois / Libellé</th>
                              <th className="p-3 text-right">Montant</th>
                              <th className="p-3 text-center">Mode</th>
                              <th className="p-3 text-center">Statut</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {paiements.map((p, pIdx) => (
                              <tr key={p.id || pIdx} className="hover:bg-slate-50/50 transition">
                                <td className="p-3 font-mono font-bold text-isiblue-700">
                                  #{p.id || pIdx + 1}
                                </td>
                                <td className="p-3 text-slate-700">{p.date || '—'}</td>
                                <td className="p-3 font-semibold uppercase text-slate-900">{p.type || 'Mensualité'}</td>
                                <td className="p-3 font-semibold text-slate-700">{p.mois || 'Frais de scolarité'}</td>
                                <td className="p-3 text-right font-mono font-bold text-slate-950">
                                  {safeFmt(p.montant)} FCFA
                                </td>
                                <td className="p-3 text-center text-slate-600 font-medium capitalize">{p.methode || 'Espèces'}</td>
                                <td className="p-3 text-center">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                    Encaissé
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: IDENTITE & DOCUMENTS */}
              {activeTab === 'identite' && (
                <div className="space-y-6">
                  {/* General Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">État Civil & Contact</h4>
                      <div className="text-xs space-y-2 text-slate-700">
                        <div><strong>Nom & Prénom :</strong> {st.prenom} {st.nom}</div>
                        <div><strong>Sexe :</strong> {st.sexe || 'N/A'}</div>
                        <div><strong>Date de Naissance :</strong> {st.date_naissance ? new Date(st.date_naissance).toLocaleDateString('fr-FR') : 'N/A'}</div>
                        <div><strong>Lieu de Naissance :</strong> {st.lieu_naissance || 'N/A'}</div>
                        <div><strong>Nationalité :</strong> {st.nationalite || 'Sénégalaise'}</div>
                        <div><strong>Téléphone :</strong> {st.telephone || 'N/A'}</div>
                        <div><strong>Email :</strong> {st.user?.email || st.email || 'N/A'}</div>
                        <div><strong>Adresse :</strong> {st.adresse || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Inscription Académique</h4>
                      <div className="text-xs space-y-2 text-slate-700">
                        <div><strong>Matricule ISI :</strong> <span className="font-mono font-bold text-isiblue-700">{st.matricule}</span></div>
                        <div><strong>Année Scolaire :</strong> {st.annee_scolaire}</div>
                        <div><strong>Filière :</strong> {st.filiere?.nom || 'N/A'}</div>
                        <div><strong>Classe / Niveau :</strong> {st.license?.nom || st.niveau_entree || 'N/A'}</div>
                        <div><strong>Type :</strong> {st.type_inscription || 'Réinscription'}</div>
                        <div><strong>Statut dossier :</strong> <span className="font-bold text-emerald-700">Validé / Inscrit</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Official Document Generation Grid */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Génération Immédiate des Documents Officiels
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <button
                        type="button"
                        onClick={() => handleDownloadDoc('attestation')}
                        disabled={downloadingDoc === 'attestation'}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-isiblue-400 hover:shadow-md transition text-left flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <FileText size={18} className="text-isiblue-600" />
                          <Download size={14} className="text-slate-400" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Attestation d'Inscription</div>
                          <div className="text-[10px] text-slate-500">Document officiel avec QR Code</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadDoc('certificat')}
                        disabled={downloadingDoc === 'certificat'}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-isiblue-400 hover:shadow-md transition text-left flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <Award size={18} className="text-emerald-600" />
                          <Download size={14} className="text-slate-400" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Certificat de Scolarité</div>
                          <div className="text-[10px] text-slate-500">Pour démarches administratives</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadDoc('fiche')}
                        disabled={downloadingDoc === 'fiche'}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-isiblue-400 hover:shadow-md transition text-left flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <GraduationCap size={18} className="text-indigo-600" />
                          <Download size={14} className="text-slate-400" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Fiche Pédagogique</div>
                          <div className="text-[10px] text-slate-500">Récapitulatif d'inscription</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadDoc('bulletin')}
                        disabled={downloadingDoc?.startsWith('bulletin')}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-isiblue-400 hover:shadow-md transition text-left flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <BookOpen size={18} className="text-amber-600" />
                          <Download size={14} className="text-slate-400" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Bulletin Officiel</div>
                          <div className="text-[10px] text-slate-500">Notes & moyennes LMD</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}