import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, Pencil, X, Users, BookOpen, GraduationCap, Save, Clock, Download, KeyRound, Lock, Unlock } from 'lucide-react'
import {
  getFilieres, getLicenseSemestres, createSemestre, createModule, updateModule, deleteModule,
  createMatiere, updateMatiere, deleteMatiere, getProfesseurs, createProfesseur, deleteProfesseur,
  createCreneau, deleteCreneau, saisirNotesEtudiant, getBulletin, downloadBulletinPdf,
  createProfesseurAccount, getVerrouStatus, toggleVerrouNotes, downloadEmploiDuTempsPdf,
} from '../services/api'

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

/** Gestion du cursus academique (semestres/UE/matieres/profs) + saisie des notes.
 *  Partage entre Admin et Accueil Pedagogique — reçoit la fonction de recherche
 *  d'etudiants propre a chaque interface (searchStudents). */
export default function CurriculumManager({ searchStudents }) {
  const [tab, setTab] = useState('programme') // 'programme' | 'profs' | 'notes'
  const [filieres, setFilieres] = useState([])
  const [filiereId, setFiliereId] = useState('')
  const [licenseId, setLicenseId] = useState('')
  const [semestres, setSemestres] = useState([])
  const [activeSem, setActiveSem] = useState(null)
  const [loading, setLoading] = useState(false)
  const [professeurs, setProfesseurs] = useState([])

  useEffect(() => { getFilieres().then(({ data }) => setFilieres(data)).catch(() => {}) }, [])
  useEffect(() => { getProfesseurs().then(({ data }) => setProfesseurs(data)).catch(() => {}) }, [])

  const filiere = filieres.find(f => String(f.id) === String(filiereId))
  const licenses = filiere?.licenses || []

  const loadSemestres = useCallback((lid) => {
    if (!lid) { setSemestres([]); setActiveSem(null); return }
    setLoading(true)
    getLicenseSemestres(lid)
      .then(({ data }) => { setSemestres(data); setActiveSem(data[0]?.id ?? null) })
      .catch(() => toast.error('Erreur chargement du cursus'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadSemestres(licenseId) }, [licenseId, loadSemestres])

  const refreshSemestres = () => loadSemestres(licenseId)

  const handleCreateSemestre = async () => {
    const nextGlobal = (semestres[semestres.length - 1]?.numero_global || 0) + 1
    const annee = Math.ceil(nextGlobal / 2)
    const numero = nextGlobal % 2 === 0 ? 2 : 1
    try {
      await createSemestre(licenseId, { annee, numero })
      toast.success('Semestre ajouté')
      refreshSemestres()
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
  }

  const sem = semestres.find(s => s.id === activeSem)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {[['programme', 'Programme', BookOpen], ['profs', 'Professeurs', GraduationCap], ['notes', 'Saisir les notes', Users]].map(([k, label, Icon]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === k ? 'bg-isiblue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            <Icon size={15}/> {label}
          </button>
        ))}
      </div>

      {tab !== 'profs' && (
        <div className="light-card p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Filière</label>
            <select className="form-input-light" value={filiereId} onChange={e => { setFiliereId(e.target.value); setLicenseId('') }}>
              <option value="">-- Choisir --</option>
              {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Niveau</label>
            <select className="form-input-light" value={licenseId} onChange={e => setLicenseId(e.target.value)} disabled={!filiereId}>
              <option value="">-- Choisir --</option>
              {licenses.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}
            </select>
          </div>
        </div>
      )}

      {tab === 'programme' && (
        <ProgrammeTab
          licenseId={licenseId} semestres={semestres} activeSem={activeSem} setActiveSem={setActiveSem}
          sem={sem} loading={loading} onCreateSemestre={handleCreateSemestre} onRefresh={refreshSemestres}
          professeurs={professeurs}
        />
      )}
      {tab === 'profs' && <ProfesseursTab onChange={() => getProfesseurs().then(({ data }) => setProfesseurs(data)).catch(() => {})}/>}
      {tab === 'notes' && (
        <NotesTab licenseId={licenseId} semestres={semestres} activeSem={activeSem} setActiveSem={setActiveSem} sem={sem} searchStudents={searchStudents}/>
      )}
    </div>
  )
}

/* ── Onglet Programme ─────────────────────────────────────────────────────── */
function ProgrammeTab({ licenseId, semestres, activeSem, setActiveSem, sem, loading, onCreateSemestre, onRefresh, professeurs }) {
  const [downloadingEdt, setDownloadingEdt] = useState(false)

  if (!licenseId) return <div className="light-card p-8 text-center text-slate-400 text-sm">Choisis une filière et un niveau pour voir le programme.</div>
  if (loading) return <div className="py-10 flex justify-center"><div className="spinner"/></div>

  const handleDownloadEdt = async () => {
    if (!sem) return
    setDownloadingEdt(true)
    try {
      const { data } = await downloadEmploiDuTempsPdf(sem.id)
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur génération PDF') }
    finally { setDownloadingEdt(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          {semestres.map(s => (
            <button key={s.id} onClick={() => setActiveSem(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSem === s.id ? 'bg-isiblue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {s.libelle}
            </button>
          ))}
          <button onClick={onCreateSemestre} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-isigold-100 text-isigold-700 hover:bg-isigold-200 flex items-center gap-1">
            <Plus size={13}/> Semestre
          </button>
        </div>
        {sem && (
          <button onClick={handleDownloadEdt} disabled={downloadingEdt}
            className="btn-secondary-light text-xs flex items-center gap-1.5 disabled:opacity-50">
            <Download size={13}/> {downloadingEdt ? 'Génération...' : "Télécharger l'emploi du temps (PDF)"}
          </button>
        )}
      </div>

      {sem && <SemestrePanel sem={sem} onRefresh={onRefresh} professeurs={professeurs}/>}
    </div>
  )
}

function SemestrePanel({ sem, onRefresh, professeurs }) {
  const [showAddModule, setShowAddModule] = useState(false)
  const [newModule, setNewModule] = useState({ code: '', nom: '', credits: '' })
  const totalCredits = (sem.modules || []).reduce((acc, m) => acc + Number(m.credits), 0)

  const handleAddModule = async () => {
    if (!newModule.code || !newModule.nom || !newModule.credits) { toast.error('Remplis tous les champs'); return }
    try {
      await createModule(sem.id, newModule)
      toast.success('Module ajouté')
      setNewModule({ code: '', nom: '', credits: '' })
      setShowAddModule(false)
      onRefresh()
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">Total crédits : <span className={`font-bold ${totalCredits === 30 ? 'text-emerald-600' : 'text-amber-600'}`}>{totalCredits} / 30</span></div>
        <button onClick={() => setShowAddModule(o => !o)} className="btn-secondary-light text-xs flex items-center gap-1"><Plus size={13}/> Nouvelle UE</button>
      </div>

      {showAddModule && (
        <div className="light-card p-4 flex flex-wrap gap-3 items-end border border-isiblue-200">
          <div><label className="text-xs text-slate-500 block mb-1">Code</label><input className="form-input-light" value={newModule.code} onChange={e => setNewModule(f => ({ ...f, code: e.target.value }))}/></div>
          <div className="flex-1 min-w-[180px]"><label className="text-xs text-slate-500 block mb-1">Nom de l'UE</label><input className="form-input-light" value={newModule.nom} onChange={e => setNewModule(f => ({ ...f, nom: e.target.value }))}/></div>
          <div><label className="text-xs text-slate-500 block mb-1">Crédits</label><input type="number" step="0.1" className="form-input-light w-24" value={newModule.credits} onChange={e => setNewModule(f => ({ ...f, credits: e.target.value }))}/></div>
          <button onClick={handleAddModule} className="btn-primary text-xs">Ajouter</button>
        </div>
      )}

      {(sem.modules || []).map(mod => <ModulePanel key={mod.id} mod={mod} onRefresh={onRefresh} professeurs={professeurs}/>)}
    </div>
  )
}

function ModulePanel({ mod, onRefresh, professeurs }) {
  const [showAddMatiere, setShowAddMatiere] = useState(false)
  const [newMatiere, setNewMatiere] = useState({ code: '', nom: '', cm: 0, tp: 0, td: 0, tpe: 0, vht: 0, coef: 1 })
  const [editingModule, setEditingModule] = useState(false)
  const [moduleForm, setModuleForm] = useState({ code: mod.code, nom: mod.nom, credits: mod.credits })

  const handleSaveModule = async () => {
    try { await updateModule(mod.id, moduleForm); toast.success('UE mise à jour'); setEditingModule(false); onRefresh() }
    catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
  }
  const handleDeleteModule = async () => {
    if (!window.confirm(`Supprimer l'UE "${mod.nom}" et toutes ses matières ?`)) return
    try { await deleteModule(mod.id); toast.success('UE supprimée'); onRefresh() }
    catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
  }
  const handleAddMatiere = async () => {
    if (!newMatiere.code || !newMatiere.nom) { toast.error('Code et nom requis'); return }
    try {
      await createMatiere(mod.id, newMatiere)
      toast.success('Matière ajoutée')
      setNewMatiere({ code: '', nom: '', cm: 0, tp: 0, td: 0, tpe: 0, vht: 0, coef: 1 })
      setShowAddMatiere(false)
      onRefresh()
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
  }

  return (
    <div className="light-card overflow-hidden">
      <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
        {editingModule ? (
          <div className="flex flex-wrap gap-2 items-center flex-1">
            <input className="form-input-light w-28" value={moduleForm.code} onChange={e => setModuleForm(f => ({ ...f, code: e.target.value }))}/>
            <input className="form-input-light flex-1 min-w-[160px]" value={moduleForm.nom} onChange={e => setModuleForm(f => ({ ...f, nom: e.target.value }))}/>
            <input type="number" step="0.1" className="form-input-light w-20" value={moduleForm.credits} onChange={e => setModuleForm(f => ({ ...f, credits: e.target.value }))}/>
            <button onClick={handleSaveModule} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg"><Save size={15}/></button>
            <button onClick={() => setEditingModule(false)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg"><X size={15}/></button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-isiblue-600 font-bold">{mod.code}</span>
              <span className="text-sm font-bold text-slate-800">{mod.nom}</span>
              <span className="text-xs text-slate-400">({mod.credits} crédits)</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowAddMatiere(o => !o)} className="text-isiblue-600 hover:bg-isiblue-50 p-1.5 rounded-lg" title="Ajouter matière"><Plus size={15}/></button>
              <button onClick={() => setEditingModule(true)} className="text-slate-500 hover:bg-slate-100 p-1.5 rounded-lg" title="Modifier"><Pencil size={13}/></button>
              <button onClick={handleDeleteModule} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg" title="Supprimer"><Trash2 size={13}/></button>
            </div>
          </>
        )}
      </div>

      {showAddMatiere && (
        <div className="p-3 border-b border-slate-100 bg-isiblue-50/30 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <input placeholder="Code" className="form-input-light" value={newMatiere.code} onChange={e => setNewMatiere(f => ({ ...f, code: e.target.value }))}/>
          <input placeholder="Nom de la matière" className="form-input-light sm:col-span-2" value={newMatiere.nom} onChange={e => setNewMatiere(f => ({ ...f, nom: e.target.value }))}/>
          <input type="number" step="0.25" placeholder="Coef" className="form-input-light" value={newMatiere.coef} onChange={e => setNewMatiere(f => ({ ...f, coef: e.target.value }))}/>
          {['cm', 'tp', 'td', 'tpe', 'vht'].map(k => (
            <input key={k} type="number" placeholder={k.toUpperCase()} className="form-input-light" value={newMatiere[k]} onChange={e => setNewMatiere(f => ({ ...f, [k]: e.target.value }))}/>
          ))}
          <button onClick={handleAddMatiere} className="btn-primary text-xs">Ajouter</button>
        </div>
      )}

      <table className="data-table-light">
        <thead><tr><th>Code</th><th>Matière</th><th>CM</th><th>TP</th><th>TD</th><th>TPE</th><th>VHT</th><th>Coef</th><th>Prof</th><th></th></tr></thead>
        <tbody>
          {(mod.matieres || []).map(mat => <MatiereRow key={mat.id} mat={mat} onRefresh={onRefresh} professeurs={professeurs}/>)}
          {(mod.matieres || []).length === 0 && <tr><td colSpan={10} className="text-center text-slate-400 py-4 text-xs">Aucune matière</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function MatiereRow({ mat, onRefresh, professeurs }) {
  const [editing, setEditing] = useState(false)
  const [showCreneaux, setShowCreneaux] = useState(false)
  const [form, setForm] = useState({ code: mat.code, nom: mat.nom, cm: mat.cm, tp: mat.tp, td: mat.td, tpe: mat.tpe, vht: mat.vht, coef: mat.coef, professeur_id: mat.professeur_id ?? '' })

  const handleSave = async () => {
    try { await updateMatiere(mat.id, { ...form, professeur_id: form.professeur_id || null }); toast.success('Matière mise à jour'); setEditing(false); onRefresh() }
    catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
  }
  const handleDelete = async () => {
    if (!window.confirm(`Supprimer "${mat.nom}" ?`)) return
    try { await deleteMatiere(mat.id); toast.success('Matière supprimée'); onRefresh() }
    catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
  }

  if (editing) {
    return (
      <tr>
        <td><input className="form-input-light !py-1 !px-2 text-xs w-20" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}/></td>
        <td><input className="form-input-light !py-1 !px-2 text-xs" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}/></td>
        {['cm', 'tp', 'td', 'tpe', 'vht'].map(k => (
          <td key={k}><input type="number" className="form-input-light !py-1 !px-2 text-xs w-14" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}/></td>
        ))}
        <td><input type="number" step="0.25" className="form-input-light !py-1 !px-2 text-xs w-14" value={form.coef} onChange={e => setForm(f => ({ ...f, coef: e.target.value }))}/></td>
        <td>
          <select className="form-input-light !py-1 !px-2 text-xs w-32" value={form.professeur_id} onChange={e => setForm(f => ({ ...f, professeur_id: e.target.value }))}>
            <option value="">-- Aucun --</option>
            {professeurs?.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
          </select>
        </td>
        <td className="flex gap-1">
          <button onClick={handleSave} className="text-emerald-600 p-1"><Save size={13}/></button>
          <button onClick={() => setEditing(false)} className="text-slate-400 p-1"><X size={13}/></button>
        </td>
      </tr>
    )
  }

  return (
    <>
      <tr>
        <td className="font-mono text-xs">{mat.code}</td>
        <td className="text-sm">{mat.nom}</td>
        <td className="text-xs">{mat.cm}</td>
        <td className="text-xs">{mat.tp}</td>
        <td className="text-xs">{mat.td}</td>
        <td className="text-xs">{mat.tpe}</td>
        <td className="text-xs">{mat.vht}</td>
        <td className="text-xs font-bold">{mat.coef}</td>
        <td className="text-xs text-slate-500">{mat.professeur ? `${mat.professeur.prenom} ${mat.professeur.nom}` : '—'}</td>
        <td className="flex gap-1">
          <button onClick={() => setShowCreneaux(o => !o)} className={`p-1 ${showCreneaux ? 'text-isiblue-600' : 'text-slate-400 hover:text-isiblue-600'}`} title="Emploi du temps"><Clock size={12}/></button>
          <button onClick={() => setEditing(true)} className="text-slate-400 hover:text-isiblue-600 p-1"><Pencil size={12}/></button>
          <button onClick={handleDelete} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={12}/></button>
        </td>
      </tr>
      {showCreneaux && (
        <tr>
          <td colSpan={10} className="bg-isiblue-50/30 p-0">
            <CreneauxPanel mat={mat} onRefresh={onRefresh}/>
          </td>
        </tr>
      )}
    </>
  )
}

function CreneauxPanel({ mat, onRefresh }) {
  const [form, setForm] = useState({ jour: 'lundi', heure_debut: '08:00', heure_fin: '10:00', salle: '' })
  const [saving, setSaving] = useState(false)
  const creneaux = mat.creneaux || []

  const handleAdd = async () => {
    setSaving(true)
    try {
      await createCreneau(mat.id, form)
      toast.success('Créneau ajouté')
      setForm(f => ({ ...f, salle: '' }))
      onRefresh()
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
    finally { setSaving(false) }
  }
  const handleDelete = async (id) => {
    try { await deleteCreneau(id); toast.success('Créneau supprimé'); onRefresh() }
    catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
  }

  return (
    <div className="p-3 space-y-2">
      <div className="text-xs font-semibold text-isiblue-700 flex items-center gap-1"><Clock size={12}/> Emploi du temps — {mat.nom}</div>
      {creneaux.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {creneaux.map(c => (
            <div key={c.id} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="font-semibold capitalize">{c.jour}</span>
              <span className="text-slate-500">{c.heure_debut?.slice(0, 5)}–{c.heure_fin?.slice(0, 5)}</span>
              {c.salle && <span className="text-slate-400">· {c.salle}</span>}
              <button onClick={() => handleDelete(c.id)} className="text-slate-300 hover:text-red-500"><X size={12}/></button>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-[10px] text-slate-400 block mb-0.5">Jour</label>
          <select className="form-input-light !py-1 !px-2 text-xs" value={form.jour} onChange={e => setForm(f => ({ ...f, jour: e.target.value }))}>
            {JOURS.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-400 block mb-0.5">Début</label>
          <input type="time" className="form-input-light !py-1 !px-2 text-xs" value={form.heure_debut} onChange={e => setForm(f => ({ ...f, heure_debut: e.target.value }))}/>
        </div>
        <div>
          <label className="text-[10px] text-slate-400 block mb-0.5">Fin</label>
          <input type="time" className="form-input-light !py-1 !px-2 text-xs" value={form.heure_fin} onChange={e => setForm(f => ({ ...f, heure_fin: e.target.value }))}/>
        </div>
        <div>
          <label className="text-[10px] text-slate-400 block mb-0.5">Salle</label>
          <input className="form-input-light !py-1 !px-2 text-xs w-24" placeholder="Salle" value={form.salle} onChange={e => setForm(f => ({ ...f, salle: e.target.value }))}/>
        </div>
        <button onClick={handleAdd} disabled={saving} className="btn-primary text-xs !py-1.5 disabled:opacity-50">Ajouter</button>
      </div>
    </div>
  )
}

/* ── Onglet Professeurs ───────────────────────────────────────────────────── */
function ProfesseursTab({ onChange }) {
  const [profs, setProfs] = useState([])
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', specialite: '' })
  const [showForm, setShowForm] = useState(false)

  const load = () => getProfesseurs().then(({ data }) => setProfs(data)).catch(() => {})
  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!form.nom || !form.prenom) { toast.error('Nom et prénom requis'); return }
    try {
      await createProfesseur(form)
      toast.success('Professeur ajouté')
      setForm({ nom: '', prenom: '', email: '', telephone: '', specialite: '' })
      setShowForm(false)
      load()
      onChange?.()
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
  }
  const handleDelete = async (id, nom) => {
    if (!window.confirm(`Supprimer ${nom} ?`)) return
    try { await deleteProfesseur(id); toast.success('Supprimé'); load(); onChange?.() }
    catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
  }
  const handleCreateAccount = async (prof) => {
    const email = window.prompt(`Email de connexion pour ${prof.prenom} ${prof.nom} :`, prof.email || '')
    if (!email) return
    try {
      await createProfesseurAccount(prof.id, { email })
      toast.success('Compte créé — les identifiants ont été envoyés par email.')
      load()
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur création du compte') }
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(o => !o)} className="btn-primary text-sm flex items-center gap-1.5"><Plus size={15}/> Nouveau professeur</button>
      {showForm && (
        <div className="light-card p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input placeholder="Nom" className="form-input-light" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}/>
          <input placeholder="Prénom" className="form-input-light" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}/>
          <input placeholder="Email" className="form-input-light" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}/>
          <input placeholder="Téléphone" className="form-input-light" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}/>
          <input placeholder="Spécialité" className="form-input-light sm:col-span-2" value={form.specialite} onChange={e => setForm(f => ({ ...f, specialite: e.target.value }))}/>
          <button onClick={handleAdd} className="btn-primary text-sm sm:col-span-2">Ajouter</button>
        </div>
      )}
      <div className="light-card overflow-hidden">
        <table className="data-table-light">
          <thead><tr><th>Nom</th><th>Email</th><th>Téléphone</th><th>Spécialité</th><th>Compte</th><th></th></tr></thead>
          <tbody>
            {profs.map(p => (
              <tr key={p.id}>
                <td className="font-semibold">{p.prenom} {p.nom}</td>
                <td className="text-xs text-slate-500">{p.email || '—'}</td>
                <td className="text-xs text-slate-500">{p.telephone || '—'}</td>
                <td className="text-xs text-slate-500">{p.specialite || '—'}</td>
                <td>
                  {p.user_id ? (
                    <span className="badge-accepted">Actif</span>
                  ) : (
                    <button onClick={() => handleCreateAccount(p)} className="flex items-center gap-1 text-xs font-semibold text-isiblue-600 hover:bg-isiblue-50 px-2 py-1 rounded-lg">
                      <KeyRound size={12}/> Créer un compte
                    </button>
                  )}
                </td>
                <td><button onClick={() => handleDelete(p.id, p.nom)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={13}/></button></td>
              </tr>
            ))}
            {profs.length === 0 && <tr><td colSpan={6} className="text-center text-slate-400 py-6 text-sm">Aucun professeur</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Onglet Saisie des notes ──────────────────────────────────────────────── */
function NotesTab({ licenseId, semestres, activeSem, setActiveSem, sem, searchStudents }) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [student, setStudent] = useState(null)
  const [notesForm, setNotesForm] = useState({})
  const [anneeScolaire, setAnneeScolaire] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`)
  const [saving, setSaving] = useState(false)
  const [bulletin, setBulletin] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [verrouille, setVerrouille] = useState(false)
  const [togglingVerrou, setTogglingVerrou] = useState(false)

  useEffect(() => {
    if (search.length < 2 || !searchStudents) { setResults([]); return }
    const t = setTimeout(() => {
      searchStudents(search).then(list => setResults(list || [])).catch(() => {})
    }, 350)
    return () => clearTimeout(t)
  }, [search, searchStudents])

  const loadVerrou = useCallback(() => {
    if (!sem) return
    getVerrouStatus(sem.id, { annee_scolaire: anneeScolaire })
      .then(({ data }) => setVerrouille(data.verrouille))
      .catch(() => {})
  }, [sem, anneeScolaire])

  useEffect(() => { loadVerrou() }, [loadVerrou])

  const handleToggleVerrou = async () => {
    if (!sem) return
    setTogglingVerrou(true)
    try {
      await toggleVerrouNotes(sem.id, { annee_scolaire: anneeScolaire, verrouille: !verrouille })
      setVerrouille(v => !v)
      toast.success(!verrouille ? 'Saisie des notes verrouillée pour les professeurs.' : 'Saisie des notes déverrouillée.')
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
    finally { setTogglingVerrou(false) }
  }

  const allMatieres = (sem?.modules || []).flatMap(m => m.matieres || [])

  const loadBulletin = useCallback(() => {
    if (!student || !sem) return
    getBulletin(sem.id, student.id, { annee_scolaire: anneeScolaire })
      .then(({ data }) => setBulletin(data))
      .catch(() => setBulletin(null))
  }, [student, sem, anneeScolaire])

  useEffect(() => { loadBulletin() }, [loadBulletin])

  const handleSave = async () => {
    const notes = Object.entries(notesForm)
      .filter(([, v]) => (v?.mcc ?? '') !== '' || (v?.examen ?? '') !== '')
      .map(([matiere_id, v]) => ({
        matiere_id: Number(matiere_id),
        mcc: v.mcc !== '' && v.mcc !== undefined ? Number(v.mcc) : null,
        examen: v.examen !== '' && v.examen !== undefined ? Number(v.examen) : null,
      }))
    if (notes.length === 0) { toast.error('Saisis au moins une note'); return }
    setSaving(true)
    try {
      await saisirNotesEtudiant(student.id, { annee_scolaire: anneeScolaire, notes })
      toast.success('Notes enregistrées !')
      loadBulletin()
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
    finally { setSaving(false) }
  }

  const handleDownloadPdf = async () => {
    if (!student || !sem) return
    const appreciation = window.prompt('Appréciation du conseil de classe (optionnel) :', '') ?? ''
    setDownloading(true)
    try {
      const { data } = await downloadBulletinPdf(sem.id, student.id, { annee_scolaire: anneeScolaire, appreciation: appreciation || null })
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur génération PDF') }
    finally { setDownloading(false) }
  }

  if (!licenseId) return <div className="light-card p-8 text-center text-slate-400 text-sm">Choisis une filière et un niveau.</div>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {semestres.map(s => (
            <button key={s.id} onClick={() => setActiveSem(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${activeSem === s.id ? 'bg-isiblue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {s.libelle}
            </button>
          ))}
        </div>
        {sem && (
          <button onClick={handleToggleVerrou} disabled={togglingVerrou}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${
              verrouille ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {verrouille ? <Lock size={13}/> : <Unlock size={13}/>}
            {verrouille ? 'Saisie verrouillée (profs)' : 'Verrouiller la saisie (profs)'}
          </button>
        )}
      </div>

      <div className="light-card p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[220px] relative">
            <label className="text-xs text-slate-500 block mb-1">Étudiant</label>
            {student ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <span className="text-sm font-semibold">{student.prenom} {student.nom} <span className="text-xs text-isiblue-600 font-mono">{student.matricule}</span></span>
                <button onClick={() => { setStudent(null); setNotesForm({}); setBulletin(null) }}><X size={14}/></button>
              </div>
            ) : (
              <input className="form-input-light" placeholder="Chercher un étudiant..." value={search} onChange={e => setSearch(e.target.value)}/>
            )}
            {!student && results.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                {results.map(s => (
                  <button key={s.id} onClick={() => { setStudent(s); setResults([]); setSearch('') }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm">
                    {s.prenom} {s.nom} <span className="text-xs text-slate-400">{s.matricule}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Année scolaire</label>
            <input className="form-input-light w-32" value={anneeScolaire} onChange={e => setAnneeScolaire(e.target.value)}/>
          </div>
        </div>
      </div>

      {student && sem && (
        <div className="light-card overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50/60 text-sm font-semibold text-slate-700">{sem.libelle} — Saisie des notes</div>
          <table className="data-table-light">
            <thead><tr><th>Matière</th><th>Coef</th><th>MCC / 20 (40%)</th><th>Examen / 20 (60%)</th></tr></thead>
            <tbody>
              {allMatieres.map(mat => (
                <tr key={mat.id}>
                  <td className="text-sm">{mat.nom}</td>
                  <td className="text-xs font-bold">{mat.coef}</td>
                  <td>
                    <input type="number" min="0" max="20" step="0.25" className="form-input-light w-24 !py-1"
                      value={notesForm[mat.id]?.mcc ?? ''}
                      onChange={e => setNotesForm(f => ({ ...f, [mat.id]: { ...f[mat.id], mcc: e.target.value } }))}/>
                  </td>
                  <td>
                    <input type="number" min="0" max="20" step="0.25" className="form-input-light w-24 !py-1"
                      value={notesForm[mat.id]?.examen ?? ''}
                      onChange={e => setNotesForm(f => ({ ...f, [mat.id]: { ...f[mat.id], examen: e.target.value } }))}/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 border-t border-slate-100 flex flex-wrap gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
              {saving ? 'Enregistrement...' : 'Enregistrer les notes'}
            </button>
            <button onClick={handleDownloadPdf} disabled={downloading || !bulletin} className="btn-secondary-light text-sm flex items-center gap-1.5 disabled:opacity-50">
              <Download size={14}/> {downloading ? 'Génération...' : 'Télécharger le bulletin PDF'}
            </button>
          </div>
        </div>
      )}

      {bulletin && (
        <div className="light-card p-4">
          <h4 className="font-semibold text-isiblue-700 mb-3 text-sm">Bulletin calculé — {bulletin.semestre?.libelle}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-400">Moyenne générale</div><div className="text-xl font-black text-slate-800">{bulletin.moyenne_generale ?? '—'}</div></div>
            <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-400">Crédits</div><div className="text-xl font-black text-slate-800">{bulletin.credits_obtenus} / {bulletin.credits_requis}</div></div>
            <div className={`rounded-xl p-3 ${bulletin.valide ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <div className="text-xs text-slate-400">Statut</div>
              <div className={`text-xl font-black ${bulletin.valide ? 'text-emerald-600' : 'text-red-600'}`}>{bulletin.valide ? 'Validé' : 'Non validé'}</div>
            </div>
          </div>
          <table className="data-table-light">
            <thead><tr><th>UE</th><th>Moyenne</th><th>Statut</th></tr></thead>
            <tbody>
              {bulletin.modules.map((m, i) => (
                <tr key={i}>
                  <td className="text-sm">{m.module.nom} <span className="text-xs text-slate-400 font-mono">({m.module.code})</span></td>
                  <td className="text-sm font-bold">{m.moyenne_ue ?? '—'}</td>
                  <td>{m.valide ? <span className="badge-accepted">Validé</span> : <span className="badge-pending">Non validé</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
