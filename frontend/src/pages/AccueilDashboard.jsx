import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Search, QrCode, Users, LogOut, CheckCircle, XCircle, AlertTriangle, RefreshCw, GraduationCap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getPublicStudents, verifyQR } from '../services/api'

// â”€â”€ Student card (accueil view) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StudentCard({ student, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card-hover p-4 flex items-center gap-4"
    >
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center overflow-hidden flex-shrink-0">
        {student.photo
          ? <img src={student.photo} alt={student.nom} className="w-full h-full object-cover" />
          : <GraduationCap size={22} className="text-white" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-semibold truncate">{student.nom}</div>
        <div className="text-brand-400 text-xs font-mono">{student.matricule}</div>
        <div className="text-white/50 text-xs mt-0.5 truncate">{student.filiere} â€” {student.license}</div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="w-2 h-2 rounded-full bg-green-400 ml-auto mb-1 animate-pulse" />
        <div className="text-white/30 text-xs">{student.annee}</div>
      </div>
    </motion.div>
  )
}

// â”€â”€ QR Scanner result â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function QRResult({ result, onClose }) {
  if (!result) return null
  const { valide, etudiant, message } = result

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative glass-card p-8 max-w-md w-full border-2 ${
        !valide ? 'border-red-500/50' :
        etudiant?.statut_paiement === 'non_a_jour' ? 'border-yellow-500/50' : 'border-green-500/50'
      }`}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white"><XCircle size={20} /></button>

        {!valide ? (
          <div className="text-center">
            <XCircle size={60} className="text-red-400 mx-auto mb-4" />
            <h3 className="text-red-300 font-bold text-xl mb-2">QR Code invalide</h3>
            <p className="text-white/60">{message}</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 overflow-hidden flex-shrink-0">
                {etudiant.photo
                  ? <img src={etudiant.photo} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-3xl">ðŸ‘¤</div>
                }
              </div>
              <div>
                <h3 className="text-white font-black text-xl">{etudiant.nom}</h3>
                <div className="text-brand-400 font-mono text-sm">{etudiant.matricule}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                ['FiliÃ¨re', etudiant.filiere],
                ['Niveau', etudiant.license],
                ['AnnÃ©e', etudiant.annee],
              ].map(([label, val]) => (
                <div key={label} className="bg-white/5 rounded-lg p-3">
                  <div className="text-white/40 text-xs">{label}</div>
                  <div className="text-white font-medium text-sm mt-0.5">{val}</div>
                </div>
              ))}
              <div className={`rounded-lg p-3 ${etudiant.statut_paiement === 'a_jour' ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
                <div className="text-white/40 text-xs">Paiements</div>
                <div className={`font-bold text-sm mt-0.5 ${etudiant.statut_paiement === 'a_jour' ? 'text-green-300' : 'text-red-300'}`}>
                  {etudiant.statut_paiement === 'a_jour' ? 'âœ… Ã€ jour' : 'âš  Non Ã  jour'}
                </div>
              </div>
            </div>

            {etudiant.statut_paiement === 'non_a_jour' && etudiant.mois_non_payes?.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-400 font-semibold text-sm mb-2">
                  <AlertTriangle size={16} />
                  {etudiant.mois_non_payes.length} mois impayÃ©s
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {etudiant.mois_non_payes.slice(0, 6).map((m) => (
                    <span key={m} className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">{m}</span>
                  ))}
                </div>
              </div>
            )}

            <div className={`mt-4 text-center py-3 rounded-xl font-bold text-lg ${
              etudiant.statut_paiement === 'a_jour'
                ? 'bg-green-500/20 text-green-300'
                : 'bg-red-500/20 text-red-300'
            }`}>
              {etudiant.statut_paiement === 'a_jour' ? 'âœ… ACCÃˆS AUTORISÃ‰' : 'â›” VÃ‰RIFIER PAIEMENTS'}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// â”€â”€ Main AccueilDashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AccueilDashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [qrInput, setQrInput]   = useState('')
  const [qrResult, setQrResult] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [filterFiliere, setFilterFiliere] = useState('')
  const filieres = [...new Set(students.map((s) => s.filiere).filter(Boolean))]

  const handleLogout = async () => { await logout(); navigate('/') }

  const loadStudents = () => {
    setLoading(true)
    getPublicStudents()
      .then(({ data }) => { setStudents(data); setFiltered(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadStudents() }, [])

  useEffect(() => {
    let result = students
    if (search) result = result.filter((s) =>
      s.nom?.toLowerCase().includes(search.toLowerCase()) ||
      s.matricule?.toLowerCase().includes(search.toLowerCase()) ||
      s.filiere?.toLowerCase().includes(search.toLowerCase())
    )
    if (filterFiliere) result = result.filter((s) => s.filiere === filterFiliere)
    setFiltered(result)
  }, [search, filterFiliere, students])

  const handleVerifyQR = async () => {
    if (!qrInput.trim()) return
    setScanning(true)
    try {
      const { data } = await verifyQR(qrInput.trim())
      setQrResult(data)
    } catch {
      toast.error('Erreur de vÃ©rification')
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="min-h-screen bg-space-950">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-space-900/90 backdrop-blur-xl border-b border-white/10 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center">
            <span className="text-white font-black text-xs">ISI</span>
          </div>
          <div>
            <div className="text-white font-bold text-sm">ISI SUPTECH</div>
            <div className="text-blue-400 text-xs">Espace Accueil</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-white/40 text-sm">
            <span className="text-white font-semibold">{students.length}</span> Ã©tudiants inscrits
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-white/40 hover:text-red-400 text-sm transition-colors">
            <LogOut size={16} /> DÃ©connexion
          </button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* QR Verification */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-card p-5 neon-border">
              <h3 className="text-white font-bold mb-1 flex items-center gap-2"><QrCode size={18} className="text-brand-400" /> VÃ©rification QR</h3>
              <p className="text-white/40 text-xs mb-4">Scannez ou saisissez les donnÃ©es du QR code Ã©tudiant.</p>

              <textarea
                className="form-input resize-none text-sm font-mono text-xs"
                rows={4}
                placeholder="Collez ici les donnÃ©es du QR code..."
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
              />

              <button
                onClick={handleVerifyQR}
                disabled={scanning || !qrInput.trim()}
                className="btn-primary w-full mt-3 flex items-center justify-center gap-2 text-sm"
              >
                {scanning ? <div className="spinner w-4 h-4" /> : <QrCode size={16} />}
                VÃ©rifier la carte
              </button>

              <div className="mt-3 text-white/30 text-xs text-center">
                Ou utilisez un scanner physique connectÃ© au clavier
              </div>
            </div>

            {/* Stats */}
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2"><Users size={15} /> PrÃ©sence aujourd'hui</h3>
              <div className="text-4xl font-black text-brand-400 mb-1">{students.length}</div>
              <div className="text-white/50 text-sm">Ã©tudiants actifs dans l'Ã©cole</div>
              <div className="mt-3 space-y-2">
                {filieres.slice(0, 5).map((f) => (
                  <div key={f} className="flex items-center justify-between text-sm">
                    <span className="text-white/60">{f}</span>
                    <span className="text-white font-semibold">{students.filter((s) => s.filiere === f).length}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Student list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input className="form-input pl-9 py-2.5 text-sm" placeholder="Rechercher un Ã©tudiant..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select className="form-input py-2.5 text-sm w-auto" value={filterFiliere} onChange={(e) => setFilterFiliere(e.target.value)}>
                <option value="">Toutes les filiÃ¨res</option>
                {filieres.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <button onClick={loadStudents} className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2"><RefreshCw size={14} /></button>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <Users size={48} className="mx-auto mb-4 opacity-30" />
                <p>Aucun Ã©tudiant trouvÃ©</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                {filtered.map((s, i) => (
                  <StudentCard key={s.id} student={s} delay={i * 0.03} />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      <AnimatePresence>
        {qrResult && <QRResult result={qrResult} onClose={() => setQrResult(null)} />}
      </AnimatePresence>
    </div>
  )
}
