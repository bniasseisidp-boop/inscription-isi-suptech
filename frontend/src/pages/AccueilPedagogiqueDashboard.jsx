import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Users, LogOut, BookOpen, Search, Plus, Download, CreditCard,
  Lock, Unlock, Eye, ChevronRight, ChevronDown, RefreshCw,
  GraduationCap, CheckCircle, XCircle, AlertTriangle, Upload,
  UserCheck, Clock, X, Camera, ExternalLink, Pencil, Trash2, Settings
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  getPedagogiqueClasses, getPedagogiqueStudents, addPedagogiqueStudent,
  getPedagogiqueStudentDetail, downloadClassListPdf, generatePedagogiqueCard,
  downloadPedagogiqueCard, togglePedagogiqueLock, updatePedagogiquePhoto,
  getPedagogiquePending, acceptPedagogiqueStudent, getFilieres,
  createPedagogiqueFiliere, updatePedagogiqueFiliere, deletePedagogiqueFiliere,
  createPedagogiqueLicense, updatePedagogiqueLicense, deletePedagogiqueLicense,
  getPedagogiqueSettings,
} from '../services/api'

const STATUT_COLORS = {
  accepte:             'text-green-400 bg-green-500/10 border-green-500/30',
  en_attente_paiement: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  en_attente:          'text-blue-400 bg-blue-500/10 border-blue-500/30',
  rejete:              'text-red-400 bg-red-500/10 border-red-500/30',
}
const STATUT_LABELS = {
  accepte: 'Inscrit', en_attente_paiement: 'Att. paiement',
  en_attente: 'En attente', rejete: 'Rejeté',
}

/* ── Modal fiche étudiant ─────────────────────────────────────────────────── */
function StudentDetailModal({ studentId, onClose, onUpdated }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [locking, setLocking] = useState(false)
  const [generatingCard, setGeneratingCard] = useState(false)
  const [downloadingCard, setDownloadingCard] = useState(false)
  const [changingPhoto, setChangingPhoto] = useState(false)
  const photoRef = useRef(null)

  useEffect(() => {
    getPedagogiqueStudentDetail(studentId)
      .then(({ data }) => setDetail(data))
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false))
  }, [studentId])

  const s = detail?.student

  const handleToggleLock = async () => {
    setLocking(true)
    try {
      const { data } = await togglePedagogiqueLock(s.id)
      setDetail(prev => ({ ...prev, student: { ...prev.student, profil_verrouille: data.profil_verrouille } }))
      toast.success(data.message)
      onUpdated?.()
    } catch { toast.error('Erreur verrouillage') }
    finally { setLocking(false) }
  }

  const handleGenerateCard = async () => {
    setGeneratingCard(true)
    try {
      await generatePedagogiqueCard(s.id)
      toast.success('Carte générée !')
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur génération carte') }
    finally { setGeneratingCard(false) }
  }

  const handleDownloadCard = async () => {
    setDownloadingCard(true)
    try {
      const { data } = await downloadPedagogiqueCard(s.id)
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url
      a.download = `carte_${s.matricule}.pdf`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      toast.success('Téléchargement lancé')
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur téléchargement') }
    finally { setDownloadingCard(false) }
  }

  const handleViewCardTab = async () => {
    try {
      const { data } = await downloadPedagogiqueCard(s.id)
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur ouverture carte') }
  }

  const handleChangePhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setChangingPhoto(true)
    const fd = new FormData(); fd.append('photo', file)
    try {
      const { data } = await updatePedagogiquePhoto(s.id, fd)
      setDetail(prev => ({ ...prev, student: { ...prev.student, photo: data.student.photo } }))
      toast.success('Photo mise à jour !')
      onUpdated?.()
    } catch { toast.error('Erreur mise à jour photo') }
    finally { setChangingPhoto(false); e.target.value = '' }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        className="relative glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-space-800/90 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold flex items-center gap-2"><Eye size={18}/> Fiche étudiant</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20}/></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="spinner"/></div>
        ) : !s ? (
          <div className="p-8 text-center text-white/40">Erreur chargement</div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Header: photo + infos */}
            <div className="flex gap-5 items-start">
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-700 to-brand-500 border-2 border-white/20">
                  {s.photo
                    ? <img src={`/storage/${s.photo}`} className="w-full h-full object-cover" alt="photo"/>
                    : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/30">
                        {s.prenom?.[0]}{s.nom?.[0]}
                      </div>
                  }
                </div>
                <label className={`text-xs cursor-pointer flex items-center gap-1 text-brand-400 hover:text-brand-300 ${changingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
                  {changingPhoto ? <div className="spinner w-3 h-3"/> : <Camera size={12}/>} Changer
                  <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handleChangePhoto}/>
                </label>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-black text-xl">{s.prenom} {s.nom}</h3>
                <div className="text-brand-400 font-mono text-sm mb-2">{s.matricule ?? '—'}</div>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs px-2 py-1 rounded-lg border font-semibold ${STATUT_COLORS[s.statut_inscription] ?? 'text-white/40'}`}>
                    {STATUT_LABELS[s.statut_inscription] ?? s.statut_inscription}
                  </span>
                  {s.profil_verrouille && (
                    <span className="text-xs px-2 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 font-semibold flex items-center gap-1">
                      <Lock size={10}/> Profil verrouillé
                    </span>
                  )}
                  {s.inscription_payee && (
                    <span className="text-xs px-2 py-1 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 font-semibold">
                      ✓ Inscription payée
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Infos */}
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Filière',      s.filiere?.nom],
                ['Niveau',       s.license?.nom],
                ['Sexe',         s.sexe === 'M' ? 'Masculin' : 'Féminin'],
                ['Téléphone',    s.telephone],
                ['Année sco.',   s.annee_scolaire],
                ['Email',        s.user?.email],
              ].map(([l, v]) => (
                <div key={l} className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="text-white/40 text-xs">{l}</div>
                  <div className="text-white text-sm font-semibold truncate mt-0.5">{v || '—'}</div>
                </div>
              ))}
            </div>

            {/* Mois en retard */}
            {detail.mois_non_payes?.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-400 font-semibold text-sm mb-2">
                  <AlertTriangle size={15}/>
                  {detail.mois_non_payes.length} mois impayés
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {detail.mois_non_payes.map(m => (
                    <span key={m} className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-mono">{m}</span>
                  ))}
                </div>
              </div>
            )}
            {detail.a_jour && s.inscription_payee && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-2 text-green-400 text-sm font-semibold">
                <CheckCircle size={16}/> À jour — aucun impayé
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-white/10">
              {s.statut_inscription === 'accepte' && (
                <>
                  <button onClick={handleGenerateCard} disabled={generatingCard}
                    className="btn-secondary text-sm flex items-center gap-1.5 disabled:opacity-50">
                    {generatingCard ? <div className="spinner w-4 h-4"/> : <CreditCard size={15}/>}
                    Générer carte
                  </button>
                  <button onClick={handleViewCardTab}
                    className="text-sm flex items-center gap-1.5 px-4 py-2 rounded-xl border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-all font-semibold">
                    <ExternalLink size={15}/>
                    Voir dans un onglet
                  </button>
                  <button onClick={handleDownloadCard} disabled={downloadingCard}
                    className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50">
                    {downloadingCard ? <div className="spinner w-4 h-4"/> : <Download size={15}/>}
                    Télécharger PDF
                  </button>
                </>
              )}
              <button onClick={handleToggleLock} disabled={locking}
                className={`text-sm flex items-center gap-1.5 px-4 py-2 rounded-xl border font-semibold transition-all disabled:opacity-50 ${
                  s.profil_verrouille
                    ? 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
                    : 'border-red-500/40 text-red-400 hover:bg-red-500/10'
                }`}>
                {locking ? <div className="spinner w-4 h-4"/> : s.profil_verrouille ? <Unlock size={15}/> : <Lock size={15}/>}
                {s.profil_verrouille ? 'Déverrouiller profil' : 'Verrouiller profil'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

/* ── Modal ajouter étudiant ───────────────────────────────────────────────── */
function AddStudentModal({ filieres, defaultFiliereId, onClose, onAdded }) {
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', telephone: '', sexe: 'M',
    date_naissance: '', lieu_naissance: '', adresse: '',
    nationalite: 'Sénégalais(e)', pays_residence: 'Sénégal',
    filiere_id: defaultFiliereId || '', license_id: '',
  })
  const [photo, setPhoto] = useState(null)
  const [saving, setSaving] = useState(false)

  const selectedFiliere = filieres.find(f => f.id == form.filiere_id)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nom || !form.prenom || !form.email || !form.filiere_id || !form.license_id) {
      toast.error('Remplissez tous les champs obligatoires')
      return
    }
    setSaving(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    if (photo) fd.append('photo', photo)
    try {
      const { data } = await addPedagogiqueStudent(fd)
      toast.success('Étudiant inscrit : ' + data.student.matricule)
      onAdded(data.student)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur inscription')
    } finally { setSaving(false) }
  }

  const F = ({ label, name, type = 'text', placeholder = '', required = false }) => (
    <div>
      <label className="form-label text-xs">{label}{required && <span className="text-red-400"> *</span>}</label>
      <input className="form-input text-sm py-2" type={type} placeholder={placeholder}
        value={form[name]} onChange={e => set(name, e.target.value)} required={required}/>
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="relative glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-space-800/90 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold flex items-center gap-2"><Plus size={18}/> Inscrire un étudiant</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0">
              {photo
                ? <img src={URL.createObjectURL(photo)} className="w-full h-full object-cover"/>
                : <GraduationCap size={22} className="text-white/30"/>
              }
            </div>
            <label className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5">
              <Upload size={13}/> Photo (optionnel)
              <input type="file" accept="image/*" className="hidden" onChange={e => setPhoto(e.target.files?.[0] || null)}/>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <F label="Nom" name="nom" required placeholder="DIALLO"/>
            <F label="Prénom" name="prenom" required placeholder="Mamadou"/>
            <F label="Email" name="email" type="email" required placeholder="email@example.com"/>
            <F label="Téléphone" name="telephone" required placeholder="77 000 00 00"/>
            <div>
              <label className="form-label text-xs">Sexe <span className="text-red-400">*</span></label>
              <select className="form-input text-sm py-2" value={form.sexe} onChange={e => set('sexe', e.target.value)}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <F label="Date de naissance" name="date_naissance" type="date" required/>
            <F label="Lieu de naissance" name="lieu_naissance" required placeholder="Dakar"/>
            <F label="Adresse" name="adresse" required placeholder="Dakar, Médina..."/>
            <F label="Nationalité" name="nationalite" placeholder="Sénégalais(e)"/>
            <F label="Pays de résidence" name="pays_residence" placeholder="Sénégal"/>

            <div>
              <label className="form-label text-xs">Filière <span className="text-red-400">*</span></label>
              <select className="form-input text-sm py-2" value={form.filiere_id}
                onChange={e => set('filiere_id', e.target.value)}>
                <option value="">-- Choisir --</option>
                {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label text-xs">Niveau <span className="text-red-400">*</span></label>
              <select className="form-input text-sm py-2" value={form.license_id}
                onChange={e => set('license_id', e.target.value)}
                disabled={!selectedFiliere}>
                <option value="">-- Choisir --</option>
                {selectedFiliere?.licenses?.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-white/10">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <div className="spinner w-4 h-4"/> : <CheckCircle size={16}/>}
              Inscrire l'étudiant
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

/* ── Page principale ──────────────────────────────────────────────────────── */
export default function AccueilPedagogiqueDashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [classes, setClasses]           = useState([])
  const [filieres, setFilieres]         = useState([])
  const [expandedFilieres, setExpandedFilieres] = useState({})
  const [selectedFiliere, setSelectedFiliere]   = useState(null)
  const [selectedLicense, setSelectedLicense]   = useState(null)
  const [activeTab, setActiveTab]       = useState('inscrits') // 'inscrits' | 'candidats'

  const [students, setStudents]         = useState([])
  const [pending, setPending]           = useState([])
  const [totalStudents, setTotalStudents] = useState(0)
  const [loadingStudents, setLoadingStudents] = useState(false)

  const [search, setSearch]             = useState('')
  const [downloadingList, setDownloadingList] = useState(false)

  const [detailStudentId, setDetailStudentId] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const [acceptingId, setAcceptingId]   = useState(null)

  const [showFilieresManagement, setShowFilieresManagement] = useState(false)
  const [mgmtFilieres, setMgmtFilieres] = useState([])
  const [filieresLocked, setFilieresLocked] = useState(false)
  const [editingLicense, setEditingLicense] = useState(null)
  const [editingFiliere, setEditingFiliere] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [newFiliere, setNewFiliere] = useState({ nom: '', code: '', description: '' })
  const [newLicense, setNewLicense] = useState({ filiere_id: '', nom: '', code: '', duree_annees: 3, mois_debut: 9, mois_fin: 6, frais_inscription: 0, frais_mensuel: 0 })

  const handleLogout = async () => { await logout(); navigate('/') }

  // Charger filières + classes + settings au montage
  useEffect(() => {
    getPedagogiqueClasses()
      .then(({ data }) => { setClasses(data); setFilieres(data) })
      .catch(() => {})
    getPedagogiqueSettings()
      .then(({ data }) => setFilieresLocked(data.filieres_locked))
      .catch(() => {})
  }, [])

  // Charger étudiants quand sélection change
  useEffect(() => {
    if (!selectedFiliere && !selectedLicense) return
    setLoadingStudents(true)
    const params = {}
    if (selectedFiliere) params.filiere_id = selectedFiliere.id
    if (selectedLicense) params.license_id = selectedLicense.id

    getPedagogiqueStudents(params)
      .then(({ data }) => {
        setStudents(data.data || data)
        setTotalStudents(data.total ?? (data.data ?? data).length)
      })
      .catch(() => {})
      .finally(() => setLoadingStudents(false))
  }, [selectedFiliere, selectedLicense])

  // Charger candidats en attente
  useEffect(() => {
    if (activeTab !== 'candidats') return
    const params = selectedFiliere ? { filiere_id: selectedFiliere.id } : {}
    getPedagogiquePending(params)
      .then(({ data }) => setPending(data.data || data))
      .catch(() => {})
  }, [activeTab, selectedFiliere])

  const handleSelectClass = (filiere, license = null) => {
    setSelectedFiliere(filiere)
    setSelectedLicense(license)
    setSearch('')
    setActiveTab('inscrits')
  }

  const handleDownloadList = async () => {
    if (!selectedFiliere) return
    setDownloadingList(true)
    try {
      const params = { filiere_id: selectedFiliere.id }
      if (selectedLicense) params.license_id = selectedLicense.id
      const { data } = await downloadClassListPdf(params)
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url
      a.download = `liste_${selectedFiliere.code}_${selectedLicense?.code ?? 'tous'}.pdf`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      toast.success('Liste téléchargée !')
    } catch { toast.error('Erreur téléchargement liste') }
    finally { setDownloadingList(false) }
  }

  const loadMgmtFilieres = () => getFilieres().then(({ data }) => setMgmtFilieres(data)).catch(() => {})

  const openFilieresManagement = () => {
    loadMgmtFilieres()
    getPedagogiqueSettings().then(({ data }) => setFilieresLocked(data.filieres_locked)).catch(() => {})
    setShowFilieresManagement(true)
  }

  const submitMgmtFiliere = async () => {
    try { await createPedagogiqueFiliere(newFiliere); toast.success('Filière créée !'); setNewFiliere({ nom:'', code:'', description:'' }); loadMgmtFilieres(); getPedagogiqueClasses().then(({ data }) => { setClasses(data); setFilieres(data) }).catch(() => {}) }
    catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
  }
  const submitMgmtLicense = async () => {
    try { await createPedagogiqueLicense(newLicense); toast.success('Niveau ajouté !'); loadMgmtFilieres() }
    catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
  }
  const handleSaveLicense = async () => {
    if (!editingLicense) return
    setSavingEdit(true)
    try {
      await updatePedagogiqueLicense(editingLicense.id, { nom: editingLicense.nom, mois_debut: Number(editingLicense.mois_debut), mois_fin: Number(editingLicense.mois_fin), frais_inscription: Number(editingLicense.frais_inscription), frais_mensuel: Number(editingLicense.frais_mensuel) })
      toast.success('Niveau mis à jour !'); setEditingLicense(null); loadMgmtFilieres()
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur') } finally { setSavingEdit(false) }
  }
  const handleDeleteLicense = async (id) => {
    if (!window.confirm('Supprimer ce niveau ?')) return
    try { await deletePedagogiqueLicense(id); toast.success('Niveau supprimé.'); loadMgmtFilieres() }
    catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
  }
  const handleSaveFiliere = async () => {
    if (!editingFiliere) return
    setSavingEdit(true)
    try {
      await updatePedagogiqueFiliere(editingFiliere.id, { nom: editingFiliere.nom, code: editingFiliere.code, description: editingFiliere.description || '' })
      toast.success('Filière mise à jour !'); setEditingFiliere(null); loadMgmtFilieres()
      getPedagogiqueClasses().then(({ data }) => { setClasses(data); setFilieres(data) }).catch(() => {})
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur') } finally { setSavingEdit(false) }
  }
  const handleDeleteFiliere = async (id) => {
    if (!window.confirm('Supprimer cette filière ? Tous ses niveaux seront aussi supprimés.')) return
    try {
      await deletePedagogiqueFiliere(id); toast.success('Filière supprimée.'); loadMgmtFilieres()
      getPedagogiqueClasses().then(({ data }) => { setClasses(data); setFilieres(data) }).catch(() => {})
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
  }

  const handleAcceptPending = async (student) => {
    setAcceptingId(student.id)
    try {
      const { data } = await acceptPedagogiqueStudent(student.id)
      toast.success('Dossier accepté — ' + data.student.matricule)
      setPending(prev => prev.filter(s => s.id !== student.id))
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
    finally { setAcceptingId(null) }
  }

  const filtered = students.filter(s =>
    !search ||
    s.nom?.toLowerCase().includes(search.toLowerCase()) ||
    s.prenom?.toLowerCase().includes(search.toLowerCase()) ||
    s.matricule?.toLowerCase().includes(search.toLowerCase())
  )

  const toggleFiliere = (id) =>
    setExpandedFilieres(p => ({ ...p, [id]: !p[id] }))

  return (
    <div className="min-h-screen bg-space-950 flex">

      {/* ── Sidebar ─────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 bg-space-800/60 backdrop-blur-xl border-r border-white/10 flex flex-col fixed top-0 left-0 h-full z-40">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-500 flex items-center justify-center">
              <BookOpen size={16} className="text-white"/>
            </div>
            <div>
              <div className="text-white font-bold text-sm">ISI SUPTECH</div>
              <div className="text-purple-400 text-xs font-medium">Accueil Pédagogique</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-white/30 text-xs font-semibold uppercase tracking-wider px-2 mb-2">Classes</div>
          {classes.length === 0 ? (
            <div className="text-white/20 text-xs text-center py-4">Aucune filière</div>
          ) : classes.map(filiere => (
            <div key={filiere.id} className="mb-1">
              <button
                onClick={() => { toggleFiliere(filiere.id); handleSelectClass(filiere, null) }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  selectedFiliere?.id === filiere.id && !selectedLicense
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}>
                {expandedFilieres[filiere.id]
                  ? <ChevronDown size={14} className="flex-shrink-0"/>
                  : <ChevronRight size={14} className="flex-shrink-0"/>
                }
                <GraduationCap size={14} className="flex-shrink-0"/>
                <span className="flex-1 text-left truncate">{filiere.nom}</span>
                <span className="text-xs opacity-50 flex-shrink-0">
                  {filiere.licenses?.reduce((acc, l) => acc + (l.nb_inscrits ?? 0), 0) ?? 0}
                </span>
              </button>

              {expandedFilieres[filiere.id] && (
                <div className="ml-4 mt-0.5 space-y-0.5">
                  {filiere.licenses?.map(license => (
                    <button key={license.id}
                      onClick={() => handleSelectClass(filiere, license)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        selectedLicense?.id === license.id
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                          : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}>
                      <span className="flex-1 text-left truncate">{license.nom}</span>
                      <span className="text-white/30">{license.nb_inscrits ?? 0}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-white/10 space-y-1">
          <button onClick={openFilieresManagement}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/40 hover:text-amber-400 hover:bg-amber-500/5 transition-all">
            <Settings size={17}/> Gérer les filières
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all">
            <LogOut size={17}/> Déconnexion
          </button>
        </div>
      </div>

      {/* ── Contenu principal ────────────────────────────── */}
      <div className="flex-1 ml-72 min-h-screen">

        {/* Topbar */}
        <div className="sticky top-0 z-30 bg-space-900/80 backdrop-blur-xl border-b border-white/10 px-6 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-white font-semibold text-sm">
              {selectedFiliere
                ? `${selectedFiliere.nom}${selectedLicense ? ' — ' + selectedLicense.nom : ''}`
                : 'Sélectionnez une classe'}
            </h1>
            {selectedFiliere && (
              <div className="text-white/30 text-xs">{totalStudents} étudiant(s)</div>
            )}
          </div>
          {selectedFiliere && (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAddModal(true)}
                className="btn-primary text-sm flex items-center gap-1.5 py-2">
                <Plus size={15}/> Inscrire
              </button>
              <button onClick={handleDownloadList} disabled={downloadingList}
                className="btn-secondary text-sm flex items-center gap-1.5 py-2 disabled:opacity-50">
                {downloadingList ? <div className="spinner w-4 h-4"/> : <Download size={15}/>}
                Liste PDF
              </button>
            </div>
          )}
        </div>

        <div className="p-6">
          {!selectedFiliere ? (
            /* Bienvenue */
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-500 flex items-center justify-center mb-5 shadow-2xl shadow-indigo-900/40">
                <BookOpen size={36} className="text-white"/>
              </div>
              <h2 className="text-white font-black text-2xl mb-2">Accueil Pédagogique</h2>
              <p className="text-white/40 max-w-sm">
                Sélectionnez une filière ou un niveau dans le menu de gauche pour gérer les étudiants.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
                {[
                  { icon: Users, label: 'Gérer les étudiants', color: 'text-indigo-400' },
                  { icon: CreditCard, label: 'Générer les cartes', color: 'text-purple-400' },
                  { icon: Download, label: 'Télécharger les listes', color: 'text-blue-400' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="glass-card p-4 text-center">
                    <Icon size={22} className={`${color} mx-auto mb-2`}/>
                    <div className="text-white/60 text-xs">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
                {[
                  { id: 'inscrits',  label: 'Inscrits', icon: UserCheck },
                  { id: 'candidats', label: 'Candidats en attente', icon: Clock },
                ].map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === id ? 'bg-indigo-600 text-white' : 'text-white/50 hover:text-white'
                    }`}>
                    <Icon size={14}/>{label}
                  </button>
                ))}
              </div>

              {/* Barre de recherche */}
              {activeTab === 'inscrits' && (
                <div className="relative max-w-sm">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
                  <input className="form-input pl-9 py-2.5 text-sm" placeholder="Rechercher nom, matricule..."
                    value={search} onChange={e => setSearch(e.target.value)}/>
                </div>
              )}

              {/* ── Liste inscrits ── */}
              {activeTab === 'inscrits' && (
                loadingStudents ? (
                  <div className="flex justify-center py-16"><div className="spinner"/></div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16 text-white/30">
                    <Users size={44} className="mx-auto mb-3 opacity-20"/>
                    <p>Aucun étudiant dans cette classe</p>
                    <button onClick={() => setShowAddModal(true)}
                      className="btn-primary text-sm mt-4 flex items-center gap-2 mx-auto">
                      <Plus size={15}/> Inscrire le premier étudiant
                    </button>
                  </div>
                ) : (
                  <div className="glass-card overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left px-4 py-3 text-white/40 text-xs font-semibold uppercase tracking-wider">Étudiant</th>
                          <th className="text-left px-4 py-3 text-white/40 text-xs font-semibold uppercase tracking-wider">Matricule</th>
                          <th className="text-left px-4 py-3 text-white/40 text-xs font-semibold uppercase tracking-wider">Statut</th>
                          <th className="text-left px-4 py-3 text-white/40 text-xs font-semibold uppercase tracking-wider">Profil</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((s, i) => (
                          <motion.tr key={s.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className="border-b border-white/5 hover:bg-white/3 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-700 to-purple-500 flex-shrink-0 flex items-center justify-center">
                                  {s.photo
                                    ? <img src={`/storage/${s.photo}`} className="w-full h-full object-cover" alt=""/>
                                    : <span className="text-white text-xs font-bold">{s.prenom?.[0]}{s.nom?.[0]}</span>
                                  }
                                </div>
                                <div>
                                  <div className="text-white font-semibold text-sm">{s.prenom} {s.nom}</div>
                                  <div className="text-white/40 text-xs">{s.filiere?.nom} — {s.license?.nom}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-brand-400">{s.matricule ?? '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-lg border font-semibold ${STATUT_COLORS[s.statut_inscription] ?? ''}`}>
                                {STATUT_LABELS[s.statut_inscription] ?? s.statut_inscription}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {s.profil_verrouille
                                ? <span className="text-amber-400 flex items-center gap-1 text-xs"><Lock size={11}/> Verrouillé</span>
                                : <span className="text-white/30 text-xs">—</span>
                              }
                            </td>
                            <td className="px-4 py-3">
                              <button onClick={() => setDetailStudentId(s.id)}
                                className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1 transition-colors">
                                <Eye size={13}/> Voir fiche
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* ── Candidats en attente ── */}
              {activeTab === 'candidats' && (
                pending.length === 0 ? (
                  <div className="text-center py-16 text-white/30">
                    <Clock size={44} className="mx-auto mb-3 opacity-20"/>
                    <p>Aucun candidat en attente</p>
                  </div>
                ) : (
                  <div className="glass-card overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left px-4 py-3 text-white/40 text-xs font-semibold uppercase">Candidat</th>
                          <th className="text-left px-4 py-3 text-white/40 text-xs font-semibold uppercase">Filière / Niveau</th>
                          <th className="text-left px-4 py-3 text-white/40 text-xs font-semibold uppercase">Date</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {pending.map((s, i) => (
                          <tr key={s.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                            <td className="px-4 py-3">
                              <div className="text-white font-semibold text-sm">{s.prenom} {s.nom}</div>
                              <div className="text-white/40 text-xs">{s.telephone}</div>
                            </td>
                            <td className="px-4 py-3 text-white/60 text-sm">{s.filiere?.nom} — {s.license?.nom}</td>
                            <td className="px-4 py-3 text-white/40 text-xs">
                              {s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button onClick={() => setDetailStudentId(s.id)}
                                  className="text-white/40 hover:text-white text-xs flex items-center gap-1">
                                  <Eye size={13}/> Fiche
                                </button>
                                <button onClick={() => handleAcceptPending(s)}
                                  disabled={acceptingId === s.id}
                                  className="btn-primary text-xs py-1 px-3 flex items-center gap-1 disabled:opacity-50">
                                  {acceptingId === s.id ? <div className="spinner w-3 h-3"/> : <CheckCircle size={12}/>}
                                  Accepter
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal gestion filières */}
      <AnimatePresence>
        {showFilieresManagement && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-space-950/95 backdrop-blur-xl overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-xl flex items-center gap-2"><Settings size={20} className="text-amber-400"/> Gestion des filières & niveaux</h2>
                <button onClick={() => setShowFilieresManagement(false)} className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"><X size={20}/></button>
              </div>
              {filieresLocked && (
                <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <Lock size={16} className="text-red-400 flex-shrink-0"/>
                  <div>
                    <div className="text-red-300 font-semibold text-sm">Modifications verrouillées</div>
                    <div className="text-red-400/70 text-xs">L'administrateur a bloqué les modifications de filières. Consultez uniquement.</div>
                  </div>
                </div>
              )}
              {!filieresLocked && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Nouvelle filière */}
                <div className="glass-card p-5">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Plus size={16} className="text-amber-400"/> Nouvelle filière</h3>
                  <div className="space-y-3">
                    <div><label className="block text-white/50 text-xs mb-1.5">Nom</label><input className="form-input" value={newFiliere.nom} onChange={e => setNewFiliere({...newFiliere, nom: e.target.value})} placeholder="Informatique"/></div>
                    <div><label className="block text-white/50 text-xs mb-1.5">Code</label><input className="form-input" value={newFiliere.code} onChange={e => setNewFiliere({...newFiliere, code: e.target.value})} placeholder="INFO"/></div>
                    <div><label className="block text-white/50 text-xs mb-1.5">Description</label><textarea className="form-input resize-none" rows={2} value={newFiliere.description} onChange={e => setNewFiliere({...newFiliere, description: e.target.value})}/></div>
                    <button onClick={submitMgmtFiliere} className="btn-primary w-full text-sm">Créer la filière</button>
                  </div>
                </div>
                {/* Nouveau niveau */}
                <div className="glass-card p-5">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Plus size={16} className="text-purple-400"/> Nouveau niveau</h3>
                  <div className="space-y-3">
                    <div><label className="block text-white/50 text-xs mb-1.5">Filière</label><select className="form-input" value={newLicense.filiere_id} onChange={e => setNewLicense({...newLicense, filiere_id: e.target.value})}><option value="">-- Choisir --</option>{mgmtFilieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}</select></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-white/50 text-xs mb-1.5">Nom</label><input className="form-input" placeholder="Licence 1" value={newLicense.nom} onChange={e => setNewLicense({...newLicense, nom: e.target.value})}/></div>
                      <div><label className="block text-white/50 text-xs mb-1.5">Code</label><input className="form-input" placeholder="L1" value={newLicense.code} onChange={e => setNewLicense({...newLicense, code: e.target.value})}/></div>
                      <div><label className="block text-white/50 text-xs mb-1.5">Durée (ans)</label><input className="form-input" type="number" value={newLicense.duree_annees} onChange={e => setNewLicense({...newLicense, duree_annees: e.target.value})}/></div>
                      <div><label className="block text-white/50 text-xs mb-1.5">Inscription (FCFA)</label><input className="form-input" type="number" value={newLicense.frais_inscription} onChange={e => setNewLicense({...newLicense, frais_inscription: e.target.value})}/></div>
                      <div className="col-span-2"><label className="block text-white/50 text-xs mb-1.5">Mensualité (FCFA)</label><input className="form-input" type="number" value={newLicense.frais_mensuel} onChange={e => setNewLicense({...newLicense, frais_mensuel: e.target.value})}/></div>
                      <div><label className="block text-white/50 text-xs mb-1.5">Mois début</label><select className="form-input" value={newLicense.mois_debut} onChange={e => setNewLicense({...newLicense, mois_debut: Number(e.target.value)})}>{['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}</select></div>
                      <div><label className="block text-white/50 text-xs mb-1.5">Mois fin</label><select className="form-input" value={newLicense.mois_fin} onChange={e => setNewLicense({...newLicense, mois_fin: Number(e.target.value)})}>{['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}</select></div>
                    </div>
                    <button onClick={submitMgmtLicense} className="btn-primary w-full text-sm">Ajouter le niveau</button>
                  </div>
                </div>
              </div>}
              {/* Liste des filières */}
              <div className="space-y-3">
                {mgmtFilieres.map(f => (
                  <div key={f.id} className="glass-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-white font-semibold">{f.nom}</span>
                        <span className="ml-2 text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">{f.code}</span>
                        {f.description && <p className="text-white/30 text-xs mt-0.5">{f.description}</p>}
                      </div>
                      {!filieresLocked && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingFiliere({ id: f.id, nom: f.nom, code: f.code, description: f.description || '' })} className="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-400 transition-colors" title="Modifier"><Pencil size={14}/></button>
                          <button onClick={() => handleDeleteFiliere(f.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors" title="Supprimer"><Trash2 size={14}/></button>
                        </div>
                      )}
                    </div>
                    {f.licenses?.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {f.licenses.map(l => (
                          <div key={l.id} className="rounded-lg p-3 bg-white/5 border border-white/10">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-sm font-medium text-white">{l.nom}</div>
                              {!filieresLocked && (
                                <div className="flex gap-1">
                                  <button onClick={() => setEditingLicense({ id: l.id, nom: l.nom, mois_debut: l.mois_debut||9, mois_fin: l.mois_fin||6, frais_inscription: l.frais_inscription, frais_mensuel: l.frais_mensuel })} className="p-1 rounded hover:bg-amber-500/10 text-amber-400 transition-colors"><Pencil size={12}/></button>
                                  <button onClick={() => handleDeleteLicense(l.id)} className="p-1 rounded hover:bg-red-500/10 text-red-400 transition-colors"><Trash2 size={12}/></button>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-white/40">Inscription : {Number(l.frais_inscription).toLocaleString()} FCFA</div>
                            <div className="text-xs text-white/40">Mensualité : {Number(l.frais_mensuel).toLocaleString()} FCFA</div>
                            {(l.mois_debut || l.mois_fin) && (
                              <div className="text-xs text-white/30 mt-1">
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

            {/* Sous-modal edit license */}
            <AnimatePresence>
              {editingLicense && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
                  <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="glass-card p-6 w-full max-w-md shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold text-lg">Modifier le niveau</h3>
                      <button onClick={() => setEditingLicense(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40"><X size={16}/></button>
                    </div>
                    <div className="space-y-3">
                      <div><label className="block text-white/50 text-xs mb-1.5">Nom du niveau</label><input className="form-input" value={editingLicense.nom} onChange={e => setEditingLicense({...editingLicense, nom: e.target.value})}/></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-white/50 text-xs mb-1.5">Mois début</label><select className="form-input" value={editingLicense.mois_debut} onChange={e => setEditingLicense({...editingLicense, mois_debut: Number(e.target.value)})}>{['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}</select></div>
                        <div><label className="block text-white/50 text-xs mb-1.5">Mois fin</label><select className="form-input" value={editingLicense.mois_fin} onChange={e => setEditingLicense({...editingLicense, mois_fin: Number(e.target.value)})}>{['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}</select></div>
                        <div><label className="block text-white/50 text-xs mb-1.5">Inscription (FCFA)</label><input className="form-input" type="number" value={editingLicense.frais_inscription} onChange={e => setEditingLicense({...editingLicense, frais_inscription: e.target.value})}/></div>
                        <div><label className="block text-white/50 text-xs mb-1.5">Mensualité (FCFA)</label><input className="form-input" type="number" value={editingLicense.frais_mensuel} onChange={e => setEditingLicense({...editingLicense, frais_mensuel: e.target.value})}/></div>
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

            {/* Sous-modal edit filière */}
            <AnimatePresence>
              {editingFiliere && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
                  <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="glass-card p-6 w-full max-w-md shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold text-lg">Modifier la filière</h3>
                      <button onClick={() => setEditingFiliere(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40"><X size={16}/></button>
                    </div>
                    <div className="space-y-3">
                      <div><label className="block text-white/50 text-xs mb-1.5">Nom</label><input className="form-input" value={editingFiliere.nom} onChange={e => setEditingFiliere({...editingFiliere, nom: e.target.value})}/></div>
                      <div><label className="block text-white/50 text-xs mb-1.5">Code</label><input className="form-input" value={editingFiliere.code} onChange={e => setEditingFiliere({...editingFiliere, code: e.target.value})}/></div>
                      <div><label className="block text-white/50 text-xs mb-1.5">Description</label><textarea className="form-input resize-none" rows={2} value={editingFiliere.description} onChange={e => setEditingFiliere({...editingFiliere, description: e.target.value})}/></div>
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={() => setEditingFiliere(null)} className="btn-secondary flex-1 text-sm">Annuler</button>
                      <button onClick={handleSaveFiliere} disabled={savingEdit} className="btn-primary flex-1 text-sm">{savingEdit ? 'Enregistrement…' : 'Enregistrer'}</button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {detailStudentId && (
          <StudentDetailModal
            studentId={detailStudentId}
            onClose={() => setDetailStudentId(null)}
            onUpdated={() => {
              if (selectedFiliere) {
                const params = { filiere_id: selectedFiliere.id }
                if (selectedLicense) params.license_id = selectedLicense.id
                getPedagogiqueStudents(params).then(({ data }) => setStudents(data.data || data)).catch(() => {})
              }
            }}
          />
        )}
        {showAddModal && (
          <AddStudentModal
            filieres={filieres}
            defaultFiliereId={selectedFiliere?.id}
            onClose={() => setShowAddModal(false)}
            onAdded={(student) => {
              setStudents(prev => [student, ...prev])
              setTotalStudents(t => t + 1)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
