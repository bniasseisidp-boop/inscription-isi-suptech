import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Clock, CheckCircle, XCircle, AlertTriangle, LogOut, User, Bell, CreditCard,
  GraduationCap, FileText, Phone, MapPin, Calendar, BookOpen, Save,
  ChevronRight, Wallet, TrendingUp, AlertCircle, Download
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  getStudentDashboard, initiatePayment, markNotificationsRead,
  getStudentPayments
} from '../services/api'
import api from '../services/api'

// ── Payment tracker month grid ──────────────────────────────────────────────
function PaymentMonthGrid({ suivi }) {
  if (!suivi || !suivi.mois) return null
  const { mois, frais_mensuel, total_paye, total_restant, mois_restants, mois_en_retard, mois_total, mois_payes, est_a_jour } = suivi

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 border border-green-500/20">
          <div className="text-green-400 text-xs font-semibold uppercase tracking-wider mb-1">Mois payés</div>
          <div className="text-3xl font-black text-white">{mois_payes}</div>
          <div className="text-white/40 text-xs">sur {mois_total} mois</div>
        </div>
        <div className={`glass-card p-4 border ${mois_en_retard > 0 ? 'border-red-500/30' : 'border-white/10'}`}>
          <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${mois_en_retard > 0 ? 'text-red-400' : 'text-white/40'}`}>En retard</div>
          <div className={`text-3xl font-black ${mois_en_retard > 0 ? 'text-red-400' : 'text-white'}`}>{mois_en_retard}</div>
          <div className="text-white/40 text-xs">{mois_en_retard > 0 ? 'mois non payés' : 'Aucun retard'}</div>
        </div>
        <div className="glass-card p-4 border border-brand-500/20">
          <div className="text-brand-400 text-xs font-semibold uppercase tracking-wider mb-1">Restant</div>
          <div className="text-2xl font-black text-white">{Number(total_restant).toLocaleString()}</div>
          <div className="text-white/40 text-xs">FCFA — {mois_restants} mois</div>
        </div>
        <div className="glass-card p-4 border border-emerald-500/20">
          <div className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">Total payé</div>
          <div className="text-2xl font-black text-white">{Number(total_paye).toLocaleString()}</div>
          <div className="text-white/40 text-xs">FCFA</div>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-white/50 mb-2">
          <span>{mois_payes} mois payés</span>
          <span>{mois_restants} mois restants</span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(mois_payes / mois_total) * 100}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full"
          />
        </div>
      </div>

      {/* Month grid */}
      <div>
        <h4 className="text-white/60 text-sm font-medium mb-3">Calendrier des paiements</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {mois.map((m, i) => (
            <motion.div
              key={m.cle}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className={`relative rounded-xl p-3 border text-center transition-all ${
                m.paye
                  ? 'bg-green-500/10 border-green-500/30'
                  : m.en_retard
                  ? 'bg-red-500/10 border-red-500/40 animate-pulse'
                  : m.actuel
                  ? 'bg-brand-500/15 border-brand-400/40'
                  : 'bg-white/3 border-white/8'
              }`}
            >
              {m.actuel && (
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                  Ce mois
                </div>
              )}
              <div className={`text-lg mb-1 ${m.paye ? 'text-green-400' : m.en_retard ? 'text-red-400' : m.actuel ? 'text-brand-400' : 'text-white/20'}`}>
                {m.paye ? '✓' : m.en_retard ? '✗' : '○'}
              </div>
              <div className="text-white text-[11px] font-semibold leading-tight">{m.label.split(' ')[0]}</div>
              <div className="text-white/40 text-[10px]">{m.label.split(' ')[1]}</div>
              <div className={`text-[10px] font-bold mt-1 ${m.paye ? 'text-green-400' : m.en_retard ? 'text-red-400' : 'text-white/50'}`}>
                {Number(m.montant).toLocaleString()}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {!est_a_jour && mois_en_retard > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-semibold text-sm">{mois_en_retard} mois en retard</p>
            <p className="text-red-400/70 text-xs mt-1">
              Montant dû : {(mois_en_retard * frais_mensuel).toLocaleString()} FCFA. Régularisez votre situation pour accéder à tous les services.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tabs complete profile ───────────────────────────────────────────────────
const PROFILE_TABS = [
  { id: 'academique',    label: 'Académique',   icon: GraduationCap },
  { id: 'personnelle',   label: 'Personnel',    icon: User },
  { id: 'tuteur',        label: 'Tuteur/Parent',icon: Phone },
  { id: 'autres',        label: 'Autres',       icon: FileText },
]

function CompleteProfileForm({ student, onSaved }) {
  const [activeTab, setActiveTab] = useState('academique')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    // Académique
    annee_bac: student.annee_bac || '',
    numero_pv_bac: student.numero_pv_bac || '',
    serie_college: student.serie_college || '',
    region_bac: student.region_bac || '',
    dernier_diplome: student.dernier_diplome || '',
    annee_dernier_diplome: student.annee_dernier_diplome || '',
    dernier_etablissement: student.dernier_etablissement || '',
    numero_ine: student.numero_ine || '',
    choix_specialites: student.choix_specialites || '',
    decouverte: student.decouverte || '',
    // Personnelles
    civilite: student.civilite || '',
    numero_cni: student.numero_cni || '',
    date_delivrance_cni: student.date_delivrance_cni || '',
    notes_personnelles: student.notes_personnelles || '',
    // Tuteur
    tuteur_nom: student.tuteur_nom || '',
    tuteur_profession: student.tuteur_profession || '',
    tuteur_telephone: student.tuteur_telephone || '',
    tuteur_email: student.tuteur_email || '',
    tuteur_identite: student.tuteur_identite || '',
    tuteur2_nom: student.tuteur2_nom || '',
    tuteur2_profession: student.tuteur2_profession || '',
    tuteur2_telephone: student.tuteur2_telephone || '',
    tuteur2_email: student.tuteur2_email || '',
    surveillance_mail: student.surveillance_mail || false,
    surveillance_telephone: student.surveillance_telephone || false,
    // Autres
    cursus_deux_ans: student.cursus_deux_ans || '',
    langues: student.langues || '',
    logiciels: student.logiciels || '',
    experiences: student.experiences || '',
    traitement_medical: student.traitement_medical || '',
    allergies: student.allergies || '',
    vaccinations: student.vaccinations || '',
    contact_urgence1: student.contact_urgence1 || '',
    tel_urgence1: student.tel_urgence1 || '',
    contact_urgence2: student.contact_urgence2 || '',
    tel_urgence2: student.tel_urgence2 || '',
    medecin_famille: student.medecin_famille || '',
    tel_medecin: student.tel_medecin || '',
  })

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await api.put('/etudiant/profil', form)
      toast.success('Profil enregistré !')
      onSaved(data.student)
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const F = ({ label, name, type = 'text', placeholder = '', options = null, textarea = false }) => (
    <div>
      <label className="form-label text-xs">{label}</label>
      {options ? (
        <select className="form-input text-sm py-2" value={form[name]} onChange={(e) => update(name, e.target.value)}>
          <option value="">-- Sélectionner --</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : textarea ? (
        <textarea className="form-input text-sm py-2 resize-none" rows={3} placeholder={placeholder} value={form[name]} onChange={(e) => update(name, e.target.value)} />
      ) : (
        <input className="form-input text-sm py-2" type={type} placeholder={placeholder} value={form[name]} onChange={(e) => update(name, e.target.value)} />
      )}
    </div>
  )

  return (
    <div className="glass-card">
      {/* Tab header */}
      <div className="flex overflow-x-auto border-b border-white/10">
        {PROFILE_TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                activeTab === t.id
                  ? 'border-brand-400 text-brand-300 bg-brand-500/5'
                  : 'border-transparent text-white/50 hover:text-white/80'
              }`}
            >
              <Icon size={15} />{t.label}
            </button>
          )
        })}
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>

            {activeTab === 'academique' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Année Baccalauréat" name="annee_bac" placeholder="2022" />
                <F label="N° PV Baccalauréat" name="numero_pv_bac" />
                <F label="Série / Collège" name="serie_college" placeholder="S2, L2..." />
                <F label="Région BAC" name="region_bac" placeholder="Dakar" />
                <F label="Dernier diplôme" name="dernier_diplome" placeholder="BAC, BTS..." />
                <F label="Année dernier diplôme" name="annee_dernier_diplome" />
                <div className="sm:col-span-2"><F label="Dernier établissement" name="dernier_etablissement" placeholder="Lycée..." /></div>
                <F label="N° INE" name="numero_ine" />
                <F label="Comment vous avez découvert ISI ?" name="decouverte" placeholder="Bouche à oreille, internet..." />
                <div className="sm:col-span-2"><F label="3 choix de spécialités" name="choix_specialites" textarea placeholder="Décrivez vos 3 choix de spécialités..." /></div>
              </div>
            )}

            {activeTab === 'personnelle' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Civilité" name="civilite" options={[{value:'M.',label:'M.'},{value:'Mme',label:'Mme'},{value:'Mlle',label:'Mlle'}]} />
                <div />
                <F label="N° Pièce d'identité / CNI" name="numero_cni" />
                <F label="Date de délivrance" name="date_delivrance_cni" type="date" />
                <div className="sm:col-span-2"><F label="Notes / informations complémentaires" name="notes_personnelles" textarea /></div>
              </div>
            )}

            {activeTab === 'tuteur' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-brand-300 font-semibold text-sm mb-3 flex items-center gap-2"><User size={14} /> Tuteur / Parent 1</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <F label="Nom complet" name="tuteur_nom" />
                    <F label="Profession" name="tuteur_profession" />
                    <F label="Téléphone" name="tuteur_telephone" type="tel" />
                    <F label="Email" name="tuteur_email" type="email" />
                    <F label="N° Identité tuteur" name="tuteur_identite" />
                  </div>
                </div>
                <div className="border-t border-white/10 pt-6">
                  <h4 className="text-brand-300 font-semibold text-sm mb-3 flex items-center gap-2"><User size={14} /> Tuteur / Parent 2 (optionnel)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <F label="Nom complet" name="tuteur2_nom" />
                    <F label="Profession" name="tuteur2_profession" />
                    <F label="Téléphone" name="tuteur2_telephone" type="tel" />
                    <F label="Email" name="tuteur2_email" type="email" />
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-white/60 text-sm mb-3">Mode de surveillance</h4>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded" checked={form.surveillance_mail} onChange={(e) => update('surveillance_mail', e.target.checked)} />
                      <span className="text-white/70 text-sm">Surveillance par email</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded" checked={form.surveillance_telephone} onChange={(e) => update('surveillance_telephone', e.target.checked)} />
                      <span className="text-white/70 text-sm">Surveillance par téléphone</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'autres' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2"><F label="Cursus des 2 dernières années" name="cursus_deux_ans" textarea /></div>
                  <div className="sm:col-span-2"><F label="Langues parlées et écrites" name="langues" placeholder="Français (courant), Anglais (intermédiaire)..." /></div>
                  <div className="sm:col-span-2"><F label="Logiciels maîtrisés (Informatique)" name="logiciels" placeholder="MS Office, Python, Photoshop..." /></div>
                  <div className="sm:col-span-2"><F label="Expériences professionnelles" name="experiences" textarea /></div>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-white/60 text-sm mb-3">Informations médicales</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <F label="Traitement médical ?" name="traitement_medical" options={[{value:'Oui',label:'Oui'},{value:'Non',label:'Non'}]} />
                    <F label="Allergies ?" name="allergies" options={[{value:'Oui',label:'Oui'},{value:'Non',label:'Non'}]} />
                    <F label="Vaccinations à jour ?" name="vaccinations" options={[{value:'Oui',label:'Oui'},{value:'Non',label:'Non'}]} />
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-white/60 text-sm mb-3">Personnes à prévenir en urgence</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <F label="Personne 1 (nom)" name="contact_urgence1" />
                    <F label="Tél. contact 1" name="tel_urgence1" type="tel" />
                    <F label="Personne 2 (nom)" name="contact_urgence2" />
                    <F label="Tél. contact 2" name="tel_urgence2" type="tel" />
                    <F label="Médecin de famille" name="medecin_famille" />
                    <F label="Tél. médecin" name="tel_medecin" type="tel" />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-end mt-6 pt-4 border-t border-white/10">
          <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <div className="spinner w-4 h-4" /> : <Save size={16} />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main StudentPortal ──────────────────────────────────────────────────────
export default function StudentPortal() {
  const { user, student: ctxStudent, logout } = useAuth()
  const navigate = useNavigate()
  const [student, setStudent] = useState(ctxStudent)
  const [suivi, setSuivi] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('accueil')
  const [payingType, setPayingType] = useState(null)
  const [initiating, setInitiating] = useState(false)

  useEffect(() => {
    getStudentDashboard()
      .then(({ data }) => {
        setStudent(data.student)
        setSuivi(data.suivi_paiements)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (activeSection === 'paiements') {
      getStudentPayments().then(({ data }) => setPayments(data.data || [])).catch(() => {})
      if (student?.inscription_payee) {
        api.get('/etudiant/suivi-paiements').then(({ data }) => setSuivi(data)).catch(() => {})
      }
    }
  }, [activeSection])

  const handlePay = async (type, mois = null) => {
    setInitiating(true)
    try {
      const { data } = await initiatePayment({ type, mois })
      window.location.href = data.checkout_url
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur lors de l\'initiation du paiement')
    } finally {
      setInitiating(false)
    }
  }

  const handleLogout = async () => { await logout(); navigate('/') }

  if (loading) return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <p className="text-white/50">Chargement...</p>
      </div>
    </div>
  )

  const statut = student?.statut_inscription
  const estAccepte = statut === 'accepte'
  const estRejete = statut === 'rejete'
  const inscriptionPayee = student?.inscription_payee

  // ── STATE 1: En attente ────────────────────────────────────────────────────
  if (!estAccepte && !estRejete) return (
    <div className="min-h-screen bg-navy-950 relative">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(30,58,95,0.3)_0%,_transparent_70%)]" />

      {/* Minimal navbar */}
      <nav className="relative z-10 border-b border-white/10 bg-navy-900/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center">
              <span className="text-white font-black text-xs">ISI</span>
            </div>
            <span className="text-white font-semibold text-sm">Espace Candidat</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </nav>

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
          <div className="glass-card p-10 text-center border border-yellow-500/20">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="text-7xl mb-6"
            >
              ⏳
            </motion.div>
            <div className="badge-pending mx-auto mb-4 w-fit">Dossier en cours d'examen</div>
            <h2 className="text-2xl font-black text-white mb-3">
              Bienvenue, {student?.prenom} !
            </h2>
            <p className="text-white/60 mb-6 text-sm leading-relaxed">
              Votre pré-inscription a bien été reçue. Notre équipe pédagogique examine votre dossier et vous contactera sous <strong className="text-white">48 heures</strong>.
            </p>

            <div className="space-y-3 text-left mb-8">
              {[
                { done: true,  label: 'Pré-inscription soumise' },
                { done: false, label: 'Examen du dossier pédagogique' },
                { done: false, label: 'Notification par email' },
                { done: false, label: 'Paiement des frais d\'inscription' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${s.done ? 'bg-green-500' : 'bg-white/10 border border-white/20'}`}>
                    {s.done ? <CheckCircle size={14} className="text-white" /> : <span className="text-white/30 text-xs">{i+1}</span>}
                  </div>
                  <span className={`text-sm ${s.done ? 'text-white font-medium' : 'text-white/40'}`}>{s.label}</span>
                </div>
              ))}
            </div>

            {student?.notifications?.length > 0 && (
              <div className="text-left space-y-2">
                {student.notifications.slice(0, 3).map((n) => (
                  <div key={n.id} className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-3">
                    <p className="text-white/80 text-sm">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="text-center mt-4 text-white/20 text-xs">Multi Brain Tech — ISI SUPTECH</div>
        </motion.div>
      </div>
    </div>
  )

  // ── STATE 2: Rejeté ────────────────────────────────────────────────────────
  if (estRejete) return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md w-full text-center">
        <div className="glass-card p-10 border border-red-500/20">
          <div className="text-7xl mb-6">😔</div>
          <h2 className="text-2xl font-black text-white mb-3">Candidature non retenue</h2>
          <p className="text-white/60 mb-4 text-sm">Votre dossier a été examiné. Malheureusement, nous ne pouvons pas donner suite à votre candidature cette année.</p>
          {student?.notes_admin && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-left mb-6">
              <p className="text-red-400 text-xs font-semibold mb-1">Motif :</p>
              <p className="text-white/70 text-sm">{student.notes_admin}</p>
            </div>
          )}
          <button onClick={handleLogout} className="btn-secondary w-full">Retour à l'accueil</button>
        </div>
      </motion.div>
    </div>
  )

  // ── STATE 3: Accepté (dashboard complet) ──────────────────────────────────
  const navItems = [
    { id: 'accueil',   label: 'Tableau de bord', icon: GraduationCap },
    { id: 'profil',    label: 'Mon profil',       icon: User },
    { id: 'paiements', label: 'Paiements',         icon: Wallet },
    { id: 'suivi',     label: 'Suivi mensuel',    icon: TrendingUp },
  ]

  return (
    <div className="min-h-screen bg-navy-950 flex">
      {/* Fixed sidebar */}
      <div className="w-64 flex-shrink-0 bg-navy-800/60 backdrop-blur-xl border-r border-white/10 flex flex-col fixed top-0 left-0 h-full z-40">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center">
              <span className="text-white font-black text-sm">ISI</span>
            </div>
            <div>
              <div className="text-white font-bold text-sm">ISI SUPTECH</div>
              <div className="text-brand-400 text-xs">Espace Étudiant</div>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                {student?.photo ? <img src={`/storage/${student.photo}`} className="w-full h-full object-cover" /> : <User size={16} className="text-white" />}
              </div>
              <div className="min-w-0">
                <div className="text-white text-sm font-semibold truncate">{student?.prenom} {student?.nom}</div>
                <div className="text-white/40 text-xs truncate">{student?.matricule}</div>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeSection === item.id
                    ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
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

      {/* Main content */}
      <div className="flex-1 ml-64 min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-navy-900/80 backdrop-blur-xl border-b border-white/10 px-6 h-16 flex items-center justify-between">
          <h1 className="text-white font-semibold">{navItems.find((n) => n.id === activeSection)?.label}</h1>
          <div className="flex items-center gap-3">
            {student?.notifications?.filter((n) => !n.lu).length > 0 && (
              <button className="relative" onClick={() => markNotificationsRead().catch(() => {})}>
                <Bell size={20} className="text-white/50 hover:text-white transition-colors" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                  {student.notifications.filter((n) => !n.lu).length}
                </span>
              </button>
            )}
            <div className="badge-accepted">{inscriptionPayee ? 'Inscrit' : 'Accepté'}</div>
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>

              {/* ── ACCUEIL ─────────────────────────────────────────────── */}
              {activeSection === 'accueil' && (
                <div className="space-y-6">
                  {/* Acceptation banner */}
                  {!inscriptionPayee && (
                    <motion.div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/30 rounded-2xl p-6">
                      <div className="flex items-start gap-4">
                        <CheckCircle size={28} className="text-green-400 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-green-300 font-bold text-lg mb-1">🎉 Félicitations ! Votre inscription est acceptée</h3>
                          <p className="text-green-400/80 text-sm mb-4">
                            Votre matricule étudiant est <strong className="text-white">{student?.matricule}</strong>.
                            Veuillez procéder au paiement des frais d'inscription pour finaliser votre dossier.
                          </p>
                          <button
                            onClick={() => handlePay('inscription')}
                            disabled={initiating}
                            className="btn-primary flex items-center gap-2"
                          >
                            {initiating ? <div className="spinner w-4 h-4" /> : <CreditCard size={16} />}
                            Payer les frais d'inscription via Wave
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Info cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="glass-card p-5">
                      <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Filière</div>
                      <div className="text-white font-bold">{student?.filiere?.nom || '—'}</div>
                      <div className="text-white/50 text-sm mt-1">{student?.license?.nom}</div>
                    </div>
                    <div className="glass-card p-5">
                      <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Année académique</div>
                      <div className="text-white font-bold">{student?.annee_scolaire}</div>
                      <div className="text-white/50 text-sm mt-1">En cours</div>
                    </div>
                    <div className="glass-card p-5">
                      <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Matricule</div>
                      <div className="text-white font-bold font-mono">{student?.matricule}</div>
                      <div className={`text-xs mt-1 ${inscriptionPayee ? 'text-green-400' : 'text-yellow-400'}`}>
                        {inscriptionPayee ? '✓ Inscription payée' : '⚠ Paiement requis'}
                      </div>
                    </div>
                  </div>

                  {/* Notifications */}
                  {student?.notifications?.length > 0 && (
                    <div>
                      <h3 className="text-white/60 text-sm font-medium mb-3">Dernières notifications</h3>
                      <div className="space-y-3">
                        {student.notifications.slice(0, 5).map((n) => (
                          <div key={n.id} className={`glass-card p-4 border-l-4 ${
                            n.type === 'success' ? 'border-green-400' :
                            n.type === 'danger'  ? 'border-red-400' :
                            n.type === 'warning' ? 'border-yellow-400' : 'border-brand-400'
                          }`}>
                            <div className="text-white font-medium text-sm">{n.titre}</div>
                            <div className="text-white/60 text-xs mt-1">{n.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick actions */}
                  {inscriptionPayee && (
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setActiveSection('suivi')} className="glass-card-hover p-5 flex items-center gap-4">
                        <TrendingUp size={22} className="text-brand-400" />
                        <div className="text-left">
                          <div className="text-white font-semibold text-sm">Suivi mensuel</div>
                          <div className="text-white/40 text-xs">Voir mes paiements</div>
                        </div>
                        <ChevronRight size={16} className="text-white/30 ml-auto" />
                      </button>
                      <button onClick={() => setActiveSection('profil')} className="glass-card-hover p-5 flex items-center gap-4">
                        <User size={22} className="text-brand-400" />
                        <div className="text-left">
                          <div className="text-white font-semibold text-sm">Mon profil</div>
                          <div className="text-white/40 text-xs">Compléter mes infos</div>
                        </div>
                        <ChevronRight size={16} className="text-white/30 ml-auto" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── PROFIL COMPLET ──────────────────────────────────────── */}
              {activeSection === 'profil' && student && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-white/50 text-sm">Complétez votre dossier académique et personnel.</p>
                    {student.profil_complet && <span className="badge-accepted">Profil complet</span>}
                  </div>
                  <CompleteProfileForm student={student} onSaved={(s) => setStudent((prev) => ({ ...prev, ...s }))} />
                </div>
              )}

              {/* ── PAIEMENTS ───────────────────────────────────────────── */}
              {activeSection === 'paiements' && (
                <div className="space-y-6">
                  {inscriptionPayee && (
                    <div className="glass-card p-5">
                      <h3 className="text-white font-semibold mb-4">Payer une mensualité</h3>
                      <div className="flex flex-wrap gap-3">
                        {suivi?.mois?.filter((m) => !m.paye).slice(0, 3).map((m) => (
                          <button
                            key={m.cle}
                            onClick={() => handlePay('mensualite', m.cle)}
                            disabled={initiating}
                            className="btn-primary text-sm py-2 px-4"
                          >
                            {m.en_retard ? '⚠ ' : ''}{m.label} — {Number(m.montant).toLocaleString()} FCFA
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                      <h3 className="text-white font-semibold">Historique des paiements</h3>
                    </div>
                    <table className="data-table">
                      <thead><tr><th>Type</th><th>Montant</th><th>Méthode</th><th>Date</th><th>Statut</th><th>Reçu</th></tr></thead>
                      <tbody>
                        {payments.length === 0 ? (
                          <tr><td colSpan={6} className="text-center text-white/30 py-8">Aucun paiement</td></tr>
                        ) : payments.map((p) => (
                          <tr key={p.id}>
                            <td>{p.libelle || p.type}</td>
                            <td className="font-semibold">{Number(p.montant).toLocaleString()} FCFA</td>
                            <td>{p.methode?.toUpperCase()}</td>
                            <td>{p.date_paiement ? new Date(p.date_paiement).toLocaleDateString('fr-FR') : '—'}</td>
                            <td><span className={p.statut === 'complete' ? 'badge-accepted' : 'badge-pending'}>{p.statut}</span></td>
                            <td>{p.recu_pdf_path && <a href={`/api/caisse/paiement/${p.id}/recu`} target="_blank" className="text-brand-400 hover:text-brand-300 flex items-center gap-1 text-xs"><Download size={12} />Reçu</a>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── SUIVI MENSUEL ───────────────────────────────────────── */}
              {activeSection === 'suivi' && (
                <div className="space-y-4">
                  {inscriptionPayee ? (
                    suivi ? (
                      <PaymentMonthGrid suivi={suivi} />
                    ) : (
                      <div className="text-center py-12 text-white/30">Chargement du suivi...</div>
                    )
                  ) : (
                    <div className="text-center py-16">
                      <AlertCircle size={48} className="text-yellow-400 mx-auto mb-4" />
                      <h3 className="text-white font-bold text-xl mb-2">Inscription non finalisée</h3>
                      <p className="text-white/50 mb-6">Payez vos frais d'inscription pour accéder au suivi mensuel.</p>
                      <button onClick={() => handlePay('inscription')} className="btn-primary">
                        Payer l'inscription via Wave
                      </button>
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
