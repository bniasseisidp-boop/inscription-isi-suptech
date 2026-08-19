import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  LogOut, Clock, BookOpen, Users, X, UserCog, Save, CheckCircle2, CircleSlash, Lock,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  getProfEmploiDuTemps, getProfMatieres, getProfRoster,
  getProfPresences, saisirProfPresences, getProfNotes, saisirProfNotes,
  updateMyPassword, updateMyPhoto,
} from '../services/api'
import LightPremiumBackground from '../components/LightPremiumBackground'

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const JOURS_LABELS = { lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi', jeudi: 'Jeudi', vendredi: 'Vendredi', samedi: 'Samedi' }

/* ── Onglet Emploi du temps ───────────────────────────────────────────────── */
function EmploiDuTempsTab() {
  const [creneaux, setCreneaux] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfEmploiDuTemps()
      .then(({ data }) => setCreneaux(data))
      .catch(() => toast.error('Erreur chargement emploi du temps'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-16 flex justify-center"><div className="spinner"/></div>
  if (creneaux.length === 0) return <div className="light-card p-8 text-center text-slate-400 text-sm">Aucun créneau ne vous a encore été assigné.</div>

  return (
    <div className="space-y-4">
      {JOURS.map(jour => {
        const items = creneaux.filter(c => c.jour === jour)
        if (items.length === 0) return null
        return (
          <div key={jour} className="light-card overflow-hidden">
            <div className="p-3 bg-isiblue-600 text-white font-bold text-sm">{JOURS_LABELS[jour]}</div>
            <div className="divide-y divide-slate-100">
              {items.map(c => (
                <div key={c.id} className="p-3 flex items-center gap-3">
                  <div className="w-24 flex-shrink-0 text-xs font-mono text-isiblue-700 font-bold">
                    {c.heure_debut?.slice(0, 5)}–{c.heure_fin?.slice(0, 5)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{c.matiere?.nom}</div>
                    <div className="text-xs text-slate-400 truncate">
                      {c.matiere?.module?.semestre?.license?.filiere?.nom} — {c.matiere?.module?.semestre?.libelle}
                      {c.salle && ` · Salle ${c.salle}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Panneau Présences ────────────────────────────────────────────────────── */
function PresencesPanel({ matiere }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [etudiants, setEtudiants] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getProfPresences(matiere.id, { date })
      .then(({ data }) => setEtudiants(data.etudiants))
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false))
  }, [matiere.id, date])

  useEffect(() => { load() }, [load])

  const setPresent = (id, present) => setEtudiants(list => list.map(e => e.id === id ? { ...e, present } : e))

  const handleSave = async () => {
    setSaving(true)
    try {
      await saisirProfPresences(matiere.id, {
        date,
        presences: etudiants.filter(e => e.present !== null).map(e => ({ student_id: e.id, present: e.present })),
      })
      toast.success('Présences enregistrées !')
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-500">Date :</label>
        <input type="date" className="form-input-light w-auto" value={date} onChange={e => setDate(e.target.value)}/>
      </div>
      {loading ? <div className="py-8 flex justify-center"><div className="spinner"/></div> : (
        <div className="light-card overflow-hidden">
          <table className="data-table-light">
            <thead><tr><th>Matricule</th><th>Étudiant</th><th>Présence</th></tr></thead>
            <tbody>
              {etudiants.map(e => (
                <tr key={e.id}>
                  <td className="font-mono text-xs">{e.matricule}</td>
                  <td className="text-sm">{e.prenom} {e.nom}</td>
                  <td>
                    <div className="flex gap-1.5">
                      <button onClick={() => setPresent(e.id, true)}
                        className={`p-1.5 rounded-lg ${e.present === true ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-emerald-50'}`}>
                        <CheckCircle2 size={14}/>
                      </button>
                      <button onClick={() => setPresent(e.id, false)}
                        className={`p-1.5 rounded-lg ${e.present === false ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-red-50'}`}>
                        <CircleSlash size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {etudiants.length === 0 && <tr><td colSpan={3} className="text-center text-slate-400 py-6 text-sm">Aucun étudiant dans cette classe</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
        {saving ? 'Enregistrement...' : "Enregistrer l'appel"}
      </button>
    </div>
  )
}

/* ── Panneau Notes ────────────────────────────────────────────────────────── */
function NotesPanel({ matiere }) {
  const [anneeScolaire, setAnneeScolaire] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`)
  const [etudiants, setEtudiants] = useState([])
  const [verrouille, setVerrouille] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getProfNotes(matiere.id, { annee_scolaire: anneeScolaire })
      .then(({ data }) => { setEtudiants(data.etudiants); setVerrouille(data.verrouille) })
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false))
  }, [matiere.id, anneeScolaire])

  useEffect(() => { load() }, [load])

  const setNote = (id, champ, valeur) => setEtudiants(list => list.map(e => e.id === id ? { ...e, [champ]: valeur } : e))

  const handleSave = async () => {
    setSaving(true)
    try {
      await saisirProfNotes(matiere.id, {
        annee_scolaire: anneeScolaire,
        notes: etudiants.map(e => ({
          student_id: e.id,
          devoir1: e.devoir1 !== '' && e.devoir1 !== null && e.devoir1 !== undefined ? Number(e.devoir1) : null,
          devoir2: e.devoir2 !== '' && e.devoir2 !== null && e.devoir2 !== undefined ? Number(e.devoir2) : null,
          examen: e.examen !== '' && e.examen !== null && e.examen !== undefined ? Number(e.examen) : null,
        })),
      })
      toast.success('Notes enregistrées !')
      load()
    } catch (e) {
      if (e.response?.status === 423) toast.error(e.response?.data?.errors?.notes?.[0] || 'Saisie verrouillée')
      else toast.error(e.response?.data?.message || 'Erreur')
    }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-500">Année scolaire :</label>
        <input className="form-input-light w-32" value={anneeScolaire} onChange={e => setAnneeScolaire(e.target.value)}/>
      </div>
      {verrouille && (
        <div className="bg-amber-50 border border-amber-300 text-amber-700 rounded-xl p-3 text-sm flex items-center gap-2">
          <Lock size={16}/> La saisie est verrouillée pour ce semestre — les bulletins sont en cours de génération. Contactez l'administration pour toute correction.
        </div>
      )}
      {loading ? <div className="py-8 flex justify-center"><div className="spinner"/></div> : (
        <div className="light-card overflow-hidden">
          <table className="data-table-light">
            <thead><tr><th>Matricule</th><th>Étudiant</th><th>Devoir 1 /20</th><th>Devoir 2 /20</th><th>Examen /20 (60%)</th></tr></thead>
            <tbody>
              {etudiants.map(e => (
                <tr key={e.id}>
                  <td className="font-mono text-xs">{e.matricule}</td>
                  <td className="text-sm">{e.prenom} {e.nom}</td>
                  <td>
                    <input type="number" min="0" max="20" step="0.25" disabled={verrouille}
                      className="form-input-light w-20 !py-1 disabled:opacity-50"
                      value={e.devoir1 ?? ''} onChange={ev => setNote(e.id, 'devoir1', ev.target.value)}/>
                  </td>
                  <td>
                    <input type="number" min="0" max="20" step="0.25" disabled={verrouille}
                      className="form-input-light w-20 !py-1 disabled:opacity-50"
                      value={e.devoir2 ?? ''} onChange={ev => setNote(e.id, 'devoir2', ev.target.value)}/>
                  </td>
                  <td>
                    <input type="number" min="0" max="20" step="0.25" disabled={verrouille}
                      className="form-input-light w-24 !py-1 disabled:opacity-50"
                      value={e.examen ?? ''} onChange={ev => setNote(e.id, 'examen', ev.target.value)}/>
                  </td>
                </tr>
              ))}
              {etudiants.length === 0 && <tr><td colSpan={5} className="text-center text-slate-400 py-6 text-sm">Aucun étudiant dans cette classe</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <button onClick={handleSave} disabled={saving || verrouille} className="btn-primary text-sm disabled:opacity-50">
        {saving ? 'Enregistrement...' : 'Enregistrer les notes'}
      </button>
    </div>
  )
}

/* ── Modal détail d'une classe (effectif / présences / notes) ────────────── */
function ClasseModal({ matiere, onClose }) {
  const [tab, setTab] = useState('effectif')
  const [roster, setRoster] = useState([])
  const [loadingRoster, setLoadingRoster] = useState(true)

  useEffect(() => {
    getProfRoster(matiere.id)
      .then(({ data }) => setRoster(data))
      .catch(() => toast.error('Erreur chargement effectif'))
      .finally(() => setLoadingRoster(false))
  }, [matiere.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-isiblue-700 font-bold">{matiere.nom}</h2>
            <div className="text-xs text-slate-400">{matiere.module?.semestre?.license?.filiere?.nom} — {matiere.module?.semestre?.libelle}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-isiblue-700 hover:bg-slate-100"><X size={18}/></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            {[['effectif', 'Effectif', Users], ['presences', 'Présences', CheckCircle2], ['notes', 'Notes', BookOpen]].map(([k, label, Icon]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${tab === k ? 'bg-isiblue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Icon size={13}/> {label}
              </button>
            ))}
          </div>

          {tab === 'effectif' && (
            loadingRoster ? <div className="py-8 flex justify-center"><div className="spinner"/></div> : (
              <div className="light-card overflow-hidden">
                <table className="data-table-light">
                  <thead><tr><th>Matricule</th><th>Étudiant</th></tr></thead>
                  <tbody>
                    {roster.map(e => (
                      <tr key={e.id}><td className="font-mono text-xs">{e.matricule}</td><td className="text-sm">{e.prenom} {e.nom}</td></tr>
                    ))}
                    {roster.length === 0 && <tr><td colSpan={2} className="text-center text-slate-400 py-6 text-sm">Aucun étudiant dans cette classe</td></tr>}
                  </tbody>
                </table>
              </div>
            )
          )}
          {tab === 'presences' && <PresencesPanel matiere={matiere}/>}
          {tab === 'notes' && <NotesPanel matiere={matiere}/>}
        </div>
      </div>
    </div>
  )
}

/* ── Onglet Mes classes ───────────────────────────────────────────────────── */
function MesClassesTab() {
  const [matieres, setMatieres] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getProfMatieres()
      .then(({ data }) => setMatieres(data))
      .catch(() => toast.error('Erreur chargement des classes'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-16 flex justify-center"><div className="spinner"/></div>
  if (matieres.length === 0) return <div className="light-card p-8 text-center text-slate-400 text-sm">Aucune matière ne vous a encore été assignée.</div>

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {matieres.map(m => (
          <button key={m.id} onClick={() => setSelected(m)} className="light-card-hover p-4 text-left">
            <div className="text-sm font-bold text-slate-800">{m.nom}</div>
            <div className="text-xs text-slate-400 mt-1">{m.module?.semestre?.license?.filiere?.nom}</div>
            <div className="text-xs text-isiblue-600 font-semibold mt-1">{m.module?.semestre?.libelle} · Coef {m.coef}</div>
          </button>
        ))}
      </div>
      {selected && <ClasseModal matiere={selected} onClose={() => setSelected(null)}/>}
    </>
  )
}

/* ── Page principale ──────────────────────────────────────────────────────── */
export default function ProfesseurDashboard() {
  const { logout, user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('emploi')
  const [showProfil, setShowProfil] = useState(false)
  const [pwdForm, setPwdForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [changingPwd, setChangingPwd] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const handleLogout = async () => { await logout(); navigate('/') }

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
    } catch (err) { toast.error(err.response?.data?.message || "Erreur lors de l'envoi de la photo") }
    finally { setUploadingPhoto(false); e.target.value = '' }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwdForm.password !== pwdForm.password_confirmation) { toast.error('Les mots de passe ne correspondent pas.'); return }
    setChangingPwd(true)
    try {
      await updateMyPassword(pwdForm)
      toast.success('Mot de passe mis à jour !')
      setPwdForm({ current_password: '', password: '', password_confirmation: '' })
      setShowProfil(false)
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur — vérifiez votre mot de passe actuel.') }
    finally { setChangingPwd(false) }
  }

  return (
    <div className="min-h-screen bg-white relative">
      <LightPremiumBackground/>

      <div className="relative sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/isi-logo.png" alt="ISI SUPTECH" className="h-9 w-auto object-contain"/>
          <div>
            <div className="text-isiblue-700 font-bold text-sm">ISI SUPTECH</div>
            <div className="text-isigold-600 text-xs font-medium">Espace Professeur</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-slate-500 text-sm hidden sm:block">{user?.name}</div>
          <button onClick={() => setShowProfil(true)} className="flex items-center gap-2 text-slate-400 hover:text-isiblue-600 text-sm transition-colors">
            <UserCog size={16}/> Mon profil
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-500 text-sm transition-colors">
            <LogOut size={16}/> Déconnexion
          </button>
        </div>
      </div>

      {showProfil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-isiblue-700 font-bold text-lg flex items-center gap-2"><UserCog size={18} className="text-isigold-600"/> Mon profil</h2>
              <button onClick={() => setShowProfil(false)} className="p-2 rounded-xl text-slate-400 hover:text-isiblue-700 hover:bg-slate-100"><X size={18}/></button>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-isiblue-600 to-isigold-500 flex items-center justify-center flex-shrink-0">
                {user?.photo_url ? <img src={user.photo_url} alt={user.name} className="w-full h-full object-cover"/> : <span className="text-white font-bold text-lg">{(user?.name || 'P')[0].toUpperCase()}</span>}
              </div>
              <div>
                <div className="text-sm text-slate-700 font-semibold">{user?.name}</div>
                <div className="text-xs text-slate-400 mb-2">{user?.email} · Professeur</div>
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer bg-isiblue-500/10 text-isiblue-500 hover:bg-isiblue-500/20">
                  {uploadingPhoto ? 'Envoi...' : 'Changer la photo'}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingPhoto} onChange={handlePhotoChange}/>
                </label>
              </div>
            </div>
            <h3 className="text-isiblue-700 font-semibold text-sm mb-3">Modifier le mot de passe</h3>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-slate-500 text-xs mb-1.5">Mot de passe actuel</label>
                <input type="password" required value={pwdForm.current_password} onChange={e => setPwdForm(f => ({ ...f, current_password: e.target.value }))} className="form-input-light"/>
              </div>
              <div>
                <label className="block text-slate-500 text-xs mb-1.5">Nouveau mot de passe</label>
                <input type="password" required minLength={8} value={pwdForm.password} onChange={e => setPwdForm(f => ({ ...f, password: e.target.value }))} className="form-input-light"/>
              </div>
              <div>
                <label className="block text-slate-500 text-xs mb-1.5">Confirmer le nouveau mot de passe</label>
                <input type="password" required minLength={8} value={pwdForm.password_confirmation} onChange={e => setPwdForm(f => ({ ...f, password_confirmation: e.target.value }))} className="form-input-light"/>
              </div>
              <button type="submit" disabled={changingPwd} className="btn-primary w-full text-sm">
                {changingPwd ? <div className="spinner w-4 h-4 mx-auto"/> : 'Mettre à jour le mot de passe'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="relative z-10 p-6 max-w-5xl mx-auto space-y-5">
        <div className="flex flex-wrap gap-2">
          {[['emploi', 'Mon emploi du temps', Clock], ['classes', 'Mes classes', BookOpen]].map(([k, label, Icon]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === k ? 'bg-isiblue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              <Icon size={15}/> {label}
            </button>
          ))}
        </div>

        {tab === 'emploi' && <EmploiDuTempsTab/>}
        {tab === 'classes' && <MesClassesTab/>}
      </div>
    </div>
  )
}
