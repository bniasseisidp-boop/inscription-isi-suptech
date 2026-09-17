import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  X,
  GraduationCap,
  Wallet,
  User,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  ChevronRight,
  Award,
  BookOpen,
  CreditCard,
  Calendar,
  Clock,
  RefreshCw,
  Eye,
  ShieldCheck,
  Mail,
  Pencil,
  Check,
  Edit3,
  Save,
  AlertCircle
} from 'lucide-react'
import {
  getStudentDossierHistorique, updateStudentHistoricalNotes, downloadBulletinBlob, downloadAttestationInscriptionBlob,
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
  onOpenQuickPay = null,
  isDark = false
}) {
  const [activeTab, setActiveTab] = useState('notes') // 'notes' | 'caisse' | 'identite'
  const [loading, setLoading] = useState(false)
  const [dossierData, setDossierData] = useState(null)
  const [selectedSemestreId, setSelectedSemestreId] = useState('ALL')
  const [selectedAnnee, setSelectedAnnee] = useState(null)
  const [downloadingDoc, setDownloadingDoc] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editedNotes, setEditedNotes] = useState({})
  const [savingNotes, setSavingNotes] = useState(false)

  const handleNoteChange = (matId, field, val) => {
    setEditedNotes(prev => ({
      ...prev,
      [matId]: {
        ...(prev[matId] || {}),
        [field]: val
      }
    }))
  }

  const handleSaveNotes = async () => {
    if (Object.keys(editedNotes).length === 0) {
      setEditMode(false)
      return
    }
    setSavingNotes(true)
    try {
      const { data } = await updateStudentHistoricalNotes(st.id, { notes: editedNotes })
      setDossierData(data)
      setEditMode(false)
      setEditedNotes({})
      toast.success('Notes modifiées et moyennes recalculées avec succès !')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur lors de la mise à jour des notes')
    } finally {
      setSavingNotes(false)
    }
  }

  const loadDossierForYear = (targetYear = null) => {
    if (!student?.id) return
    setLoading(true)
    const params = targetYear ? { annee: targetYear } : {}
    getStudentDossierHistorique(student.id, params)
      .then(({ data }) => {
        setDossierData(data)
        if (data.active_year) {
          setSelectedAnnee(data.active_year)
        }
      })
      .catch(() => {
        toast.error('Erreur lors du chargement du dossier étudiant')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (isOpen && student?.id) {
      setActiveTab('notes')
      setSelectedSemestreId('ALL')
      setSelectedAnnee(null)
      loadDossierForYear(null)
    } else {
      setDossierData(null)
    }
  }, [isOpen, student?.id])

  if (!isOpen || !student) return null

  const st = dossierData?.student || student
  const canonical = dossierData?.canonical || {}
  const semestres = dossierData?.semestres_data || []
  const caisse = dossierData?.caisse_data || {}
  const paiements = caisse.paiements || []

  // Extract authentic metrics
  const s1Moy = canonical.moyenne_s1 !== undefined ? canonical.moyenne_s1 : (semestres[0]?.moyenne_semestre || 0)
  const s1Cred = canonical.credits_s1 !== undefined ? canonical.credits_s1 : (semestres[0]?.credits_obtenus || 0)
  const s1App = canonical.appreciation_s1 || semestres[0]?.appreciation || (s1Moy >= 14 ? 'Bien' : (s1Moy >= 12 ? 'Assez bien' : (s1Moy >= 10 ? 'Passable' : 'Insuffisant')))

  const s2Moy = canonical.moyenne_s2 !== undefined ? canonical.moyenne_s2 : (semestres[1]?.moyenne_semestre || 0)
  const s2Cred = canonical.credits_s2 !== undefined ? canonical.credits_s2 : (semestres[1]?.credits_obtenus || 0)
  const s2App = canonical.appreciation_s2 || semestres[1]?.appreciation || (s2Moy >= 16 ? 'Très bon travail' : (s2Moy >= 14 ? 'Bien' : (s2Moy >= 10 ? 'Passable' : 'Insuffisant')))

  const genMoy = canonical.moyenne_generale !== undefined ? canonical.moyenne_generale : ((s1Moy + s2Moy) > 0 ? ((s1Moy + s2Moy) / 2).toFixed(2) : 0)
  const genCred = canonical.credits_total !== undefined ? canonical.credits_total : (s1Cred + s2Cred)
  const statVal = canonical.statut_validation || (genCred >= 60 ? 'VALIDÉ / ADMIS (60/60 ECTS)' : (genMoy >= 10 ? 'VALIDÉ PAR COMPENSATION' : 'AJOURNÉ / SESSION 2'))

  // Filter semestres based on selected filter
  const visibleSemestres = selectedSemestreId === 'ALL'
    ? semestres
    : semestres.filter(s => String(s.id) === String(selectedSemestreId))

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
        res = await downloadBulletinBlob(st.id, semId, { annee_scolaire: activeYear })
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
                    <CheckCircle2 size={12} /> Soldé (0 FCFA)
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

                {/* Multi-Year Career Switcher Bar */}
        {dossierData?.annees_cursus && dossierData.annees_cursus.length > 1 && (
          <div className="bg-gradient-to-r from-slate-100 to-blue-50/60 border-b border-slate-200 px-6 py-3 flex items-center gap-3 shrink-0 overflow-x-auto z-10">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 shrink-0 uppercase tracking-wide">
              <GraduationCap size={18} className="text-isiblue-600 shrink-0" />
              Cursus ({dossierData.annees_cursus.length} années) :
            </span>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {dossierData.annees_cursus.map((c) => {
                const isSel = (selectedAnnee === c.annee) || (!selectedAnnee && c.annee === dossierData.active_year);
                return (
                  <button
                    key={c.annee}
                    type="button"
                    onClick={() => loadDossierForYear(c.annee)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-sm ${
                      isSel
                        ? 'bg-isiblue-600 text-white shadow-md ring-2 ring-isiblue-400 scale-[1.02]'
                        : 'bg-white hover:bg-isiblue-50 hover:border-isiblue-300 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>🎓 {c.annee}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${isSel ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      {c.niveau_court || c.niveau}
                    </span>
                    {c.moyenne > 0 && (
                      <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-black ${isSel ? 'bg-emerald-500/40 text-emerald-100 border border-emerald-400/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                        {c.moyenne}/20
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
                  {/* Exact 3 KPI summary cards from visualiseur_etudiants.html */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Card 1: Moyenne S1 */}
                    <div className="p-4 rounded-2xl border border-sky-200 bg-sky-50/60 shadow-sm flex flex-col justify-between">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                        MOYENNE S1
                      </div>
                      <div className="my-2">
                        <div className="text-3xl font-black text-emerald-700">
                          {s1Moy > 0 ? `${s1Moy} / 20` : '0.00 / 20'}
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1.5 font-medium">
                          <span className="text-slate-600">{s1Cred} / 30 Crédits ECTS</span>
                          <span className="font-bold text-isiblue-800">{s1App}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadDoc('bulletin', 'S1')}
                        disabled={downloadingDoc === 'bulletin-S1'}
                        className="w-full mt-2 py-1.5 px-3 rounded-lg bg-white/80 hover:bg-white text-isiblue-700 border border-sky-200 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                      >
                        <Download size={13} />
                        {downloadingDoc === 'bulletin-S1' ? 'Génération...' : 'Bulletin Semestre 1'}
                      </button>
                    </div>

                    {/* Card 2: Moyenne S2 */}
                    <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/60 shadow-sm flex flex-col justify-between">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                        MOYENNE S2
                      </div>
                      <div className="my-2">
                        <div className="text-3xl font-black text-emerald-700">
                          {s2Moy > 0 ? `${s2Moy} / 20` : '0.00 / 20'}
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1.5 font-medium">
                          <span className="text-slate-600">{s2Cred} / 30 Crédits ECTS</span>
                          <span className="font-bold text-purple-800">{s2App}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadDoc('bulletin', 'S2')}
                        disabled={downloadingDoc === 'bulletin-S2'}
                        className="w-full mt-2 py-1.5 px-3 rounded-lg bg-white/80 hover:bg-white text-purple-700 border border-purple-200 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                      >
                        <Download size={13} />
                        {downloadingDoc === 'bulletin-S2' ? 'Génération...' : 'Bulletin Semestre 2'}
                      </button>
                    </div>

                    {/* Card 3: Moyenne Générale Annuelle */}
                    <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 shadow-sm flex flex-col justify-between">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                        MOYENNE GÉNÉRALE ANNUELLE
                      </div>
                      <div className="my-2">
                        <div className="text-3xl font-black text-emerald-700">
                          {genMoy > 0 ? `${genMoy} / 20` : '0.00 / 20'}
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1.5 font-medium">
                          <span className="text-slate-600">{genCred} / 60 Crédits ECTS</span>
                          <span className="font-extrabold text-emerald-800">{statVal}</span>
                        </div>
                      </div>
                      <div className="w-full mt-2 py-1.5 px-3 rounded-lg bg-emerald-100/70 text-emerald-900 border border-emerald-200 text-center text-xs font-bold">
                        {genCred >= 60 ? '🏆 Année validée avec succès' : (genMoy >= 10 ? '✅ Validé par compensation' : '⚠️ Session de rattrapage')}
                      </div>
                    </div>
                  </div>

                  {/* Semester Filter Tabs */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <BookOpen size={16} className="text-isiblue-600" />
                      Unités d'Enseignement & Matières
                    </h3>
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
                                {!editMode ? (
                                  <button
                                    type="button"
                                    onClick={() => setEditMode(true)}
                                    className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-[11px] flex items-center gap-1 transition"
                                    title="Modifier les notes de ce module"
                                  >
                                    <Edit3 size={12} />
                                    Modifier
                                  </button>
                                ) : (
                                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                    ✏️ Saisie en cours
                                  </span>
                                )}
                                <span className="text-xs font-bold">
                                  Moyenne UE : <strong className={mod.valide ? 'text-emerald-700' : 'text-amber-700'}>
                                    {mod.moyenne_ue > 0 ? `${mod.moyenne_ue} / 20` : 'Non calculée'}
                                  </strong>
                                </span>
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                  mod.valide ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {mod.statut}
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
                                  {mod.matieres?.map(mat => {
                                    const editedCc = editedNotes[mat.id]?.cc
                                    const editedExam = editedNotes[mat.id]?.exam
                                    const ccVal = editedCc !== undefined ? editedCc : (mat.cc !== null ? mat.cc : '')
                                    const examVal = editedExam !== undefined ? editedExam : (mat.examen !== null ? mat.examen : '')

                                    const numCc = ccVal !== '' ? parseFloat(ccVal) : null
                                    const numExam = examVal !== '' ? parseFloat(examVal) : null
                                    let liveMoy = mat.moyenne
                                    let liveApp = mat.appreciation
                                    let liveVal = mat.valide

                                    if (numCc !== null || numExam !== null) {
                                      const c = numCc !== null ? numCc : 0
                                      const e = numExam !== null ? numExam : 0
                                      liveMoy = Number(((c * 0.4) + (e * 0.6)).toFixed(2))
                                      liveVal = liveMoy >= 10
                                      liveApp = liveMoy >= 18 ? 'Excellent' : (liveMoy >= 16 ? 'Très bien' : (liveMoy >= 14 ? 'Bien' : (liveMoy >= 12 ? 'Assez bien' : (liveMoy >= 10 ? 'Passable' : 'Insuffisant'))))
                                    }

                                    return (
                                      <tr key={mat.id} className="hover:bg-slate-50/50 transition">
                                        <td className="p-3 font-semibold text-slate-900">
                                          {mat.nom}
                                          {mat.code && <span className="text-[10px] text-slate-400 font-mono ml-2">({mat.code})</span>}
                                        </td>
                                        <td className="p-3 text-center text-slate-600 font-bold">{mat.coeff}</td>
                                        <td className="p-3 text-center text-slate-600">{mat.credits}</td>
                                        <td className="p-3 text-center font-mono">
                                          {editMode ? (
                                            <input
                                              type="number"
                                              min="0" max="20" step="0.25"
                                              placeholder="CC"
                                              className="w-16 px-1.5 py-1 text-center font-bold bg-white border border-isiblue-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-isiblue-400 focus:outline-none"
                                              value={ccVal}
                                              onChange={e => handleNoteChange(mat.id, 'cc', e.target.value)}
                                            />
                                          ) : (
                                            mat.cc !== null ? `${mat.cc} / 20` : '—'
                                          )}
                                        </td>
                                        <td className="p-3 text-center font-mono">
                                          {editMode ? (
                                            <input
                                              type="number"
                                              min="0" max="20" step="0.25"
                                              placeholder="Exam"
                                              className="w-16 px-1.5 py-1 text-center font-bold bg-white border border-isiblue-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-isiblue-400 focus:outline-none"
                                              value={examVal}
                                              onChange={e => handleNoteChange(mat.id, 'exam', e.target.value)}
                                            />
                                          ) : (
                                            mat.examen !== null ? `${mat.examen} / 20` : '—'
                                          )}
                                        </td>
                                        <td className="p-3 text-center">
                                          <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                                            liveVal ? 'bg-emerald-50 text-emerald-700' : (liveMoy > 0 ? 'bg-amber-50 text-amber-700' : 'text-slate-400')
                                          }`}>
                                            {liveMoy !== null ? `${liveMoy} / 20` : '—'}
                                          </span>
                                        </td>
                                        <td className="p-3 text-right font-medium text-slate-600">
                                          {liveApp}
                                        </td>
                                      </tr>
                                    )
                                  })}
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

                  {/* Arrears Notice & Action */}
                  {caisse.solde_restant > 0 ? (
                    <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="text-amber-600 shrink-0" size={24} />
                        <div>
                          <div className="text-sm font-bold text-amber-900">
                            Arriérés à encaisser avant réinscription : {safeFmt(caisse?.solde_restant)} FCFA
                          </div>
                          <p className="text-xs text-amber-700 mt-0.5">
                            Cet étudiant doit régler son reliquat avant la finalisation de sa réinscription.
                          </p>
                        </div>
                      </div>
                      {onOpenQuickPay && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose()
                            onOpenQuickPay(st)
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
                        >
                          <CreditCard size={14} /> Encaisser le reliquat
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-emerald-600 shrink-0" size={24} />
                        <div>
                          <div className="text-sm font-bold text-emerald-900">
                            Scolarité entièrement soldée (0 FCFA restant)
                          </div>
                          <p className="text-xs text-emerald-700 mt-0.5">
                            L'étudiant est 100% en règle financièrement et éligible pour la réinscription.
                          </p>
                        </div>
                      </div>
                      {onOpenReinscription && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose()
                            onOpenReinscription(st)
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition flex items-center gap-1.5"
                        >
                          <RefreshCw size={14} /> Réinscrire en 2026-2027
                        </button>
                      )}
                    </div>
                  )}

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
                                  {p.recu_numero || `#${p.id || pIdx + 1}`}
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
                  {/* Detailed Student Identity */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <User size={14} className="text-isiblue-600" /> État Civil & Coordonnées
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                          <span className="text-slate-500">Nom complet :</span>
                          <span className="font-bold text-slate-900">{st.nom_complet || `${st.prenom} ${st.nom}`}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                          <span className="text-slate-500">Date & Lieu de naissance :</span>
                          <span className="font-semibold text-slate-800">
                            {st.date_naissance ? `${st.date_naissance} à ${st.lieu_naissance || '—'}` : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                          <span className="text-slate-500">Nationalité & Sexe :</span>
                          <span className="font-semibold text-slate-800">{st.nationalite || 'Sénégalaise'} ({st.sexe || 'N/A'})</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                          <span className="text-slate-500">Téléphone étudiant :</span>
                          <span className="font-mono font-bold text-isiblue-700">{st.telephone || '—'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                          <span className="text-slate-500">Email :</span>
                          <span className="font-medium text-slate-800">{st.email || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Adresse / Domicile :</span>
                          <span className="font-medium text-slate-800">{st.adresse || '—'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <GraduationCap size={14} className="text-isiblue-600" /> Cursus & Inscription
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                          <span className="text-slate-500">Matricule permanent :</span>
                          <span className="font-mono font-bold text-isiblue-700">{st.matricule}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                          <span className="text-slate-500">Année scolaire :</span>
                          <span className="font-bold text-slate-900">{st.annee_scolaire}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                          <span className="text-slate-500">Filière d'études :</span>
                          <span className="font-bold text-slate-900">{st.filiere?.nom || '—'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                          <span className="text-slate-500">Classe / Cycle :</span>
                          <span className="font-bold text-slate-900">{st.license?.nom || st.niveau_entree || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Date d'inscription :</span>
                          <span className="font-semibold text-slate-800">
                            {st.created_at ? new Date(st.created_at).toLocaleDateString('fr-FR') : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Official Documents Download Hub */}
                  <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <FileText size={16} className="text-isiblue-600" /> Documents Administratifs Officiels (PDF)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => handleDownloadDoc('attestation')}
                        disabled={downloadingDoc === 'attestation'}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-isiblue-50/50 hover:border-isiblue-300 transition text-left flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-isiblue-700">
                            Attestation d'Inscription
                          </div>
                          <div className="text-[10px] text-slate-500">Format officiel Direction</div>
                        </div>
                        <Download size={15} className="text-slate-400 group-hover:text-isiblue-600 transition" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadDoc('certificat')}
                        disabled={downloadingDoc === 'certificat'}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-isiblue-50/50 hover:border-isiblue-300 transition text-left flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-isiblue-700">
                            Certificat de Scolarité
                          </div>
                          <div className="text-[10px] text-slate-500">Format officiel LMD</div>
                        </div>
                        <Download size={15} className="text-slate-400 group-hover:text-isiblue-600 transition" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadDoc('fiche')}
                        disabled={downloadingDoc === 'fiche'}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-isiblue-50/50 hover:border-isiblue-300 transition text-left flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-isiblue-700">
                            Fiche d'Inscription
                          </div>
                          <div className="text-[10px] text-slate-500">Dossier administratif complet</div>
                        </div>
                        <Download size={15} className="text-slate-400 group-hover:text-isiblue-600 transition" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Dossier LMD • ISI SUPTECH • Année {st.annee_scolaire}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition"
          >
            Fermer le dossier
          </button>
        </div>
      </motion.div>
    </div>
  )
}