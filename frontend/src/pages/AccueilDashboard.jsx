import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Html5Qrcode } from 'html5-qrcode'
import {
  Search, QrCode, Users, LogOut, CheckCircle, XCircle,
  AlertTriangle, RefreshCw, GraduationCap, Hash, Camera, CameraOff
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getPublicStudents, verifyQR, verifyMatriculeAccueil } from '../services/api'

/* ── Scanner caméra ───────────────────────────────────────────────────────── */
function CameraScanner({ onResult, onClose }) {
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)
  const didScanRef  = useRef(false)
  const scannerRef  = useRef(null)
  const REGION_ID   = 'qr-cam-region'

  useEffect(() => {
    let scanner = null
    let cancelled = false

    const start = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras()
        if (cancelled) return
        if (!cameras || cameras.length === 0) {
          setError('Aucune caméra détectée sur cet appareil.')
          return
        }
        // Préférer caméra arrière (mobile), sinon première dispo (desktop)
        const cam = cameras.find(c => /back|rear|environment/i.test(c.label)) ?? cameras[0]

        scanner = new Html5Qrcode(REGION_ID)
        scannerRef.current = scanner

        await scanner.start(
          cam.id,
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decoded) => {
            if (didScanRef.current || cancelled) return
            didScanRef.current = true
            scanner.stop().catch(() => {})
            onResult(decoded)
          },
          () => {} // ignore scan noise
        )
        if (!cancelled) setReady(true)
      } catch (err) {
        if (!cancelled) setError('Impossible d\'accéder à la caméra : ' + (err?.message ?? String(err)))
      }
    }

    // Laisser le DOM rendre le div avant d'initialiser
    const timer = setTimeout(start, 120)

    return () => {
      cancelled = true
      clearTimeout(timer)
      if (scanner) scanner.stop().catch(() => {})
    }
  }, [onResult])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-sm">
        {/* Fermer */}
        <button onClick={onClose}
          className="absolute -top-10 right-0 text-white/60 hover:text-white flex items-center gap-2 text-sm">
          <CameraOff size={16}/> Fermer la caméra
        </button>

        <div className="glass-card p-4 border-2 border-brand-500/40">
          <div className="flex items-center gap-2 mb-3">
            <Camera size={16} className="text-brand-400 animate-pulse"/>
            <span className="text-white font-semibold text-sm">Scanner le QR code</span>
          </div>

          {error ? (
            <div className="py-8 text-center">
              <CameraOff size={40} className="text-red-400 mx-auto mb-3"/>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black">
              {/* div ciblé par html5-qrcode */}
              <div id="qr-cam-region" className="w-full"/>
              {/* Cadre de visée */}
              {ready && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-52 h-52 relative">
                    <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand-400 rounded-tl-lg"/>
                    <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand-400 rounded-tr-lg"/>
                    <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand-400 rounded-bl-lg"/>
                    <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand-400 rounded-br-lg"/>
                    {/* Ligne de scan animée */}
                    <motion.span
                      className="absolute left-0 right-0 h-0.5 bg-brand-400/70"
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-white/30 text-xs text-center mt-3">
            Pointez la caméra vers le QR code de la carte étudiant
          </p>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Carte étudiant dans la liste ─────────────────────────────────────────── */
function StudentCard({ student, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="glass-card-hover p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center overflow-hidden flex-shrink-0">
        {student.photo
          ? <img src={student.photo} alt={student.nom} className="w-full h-full object-cover"/>
          : <GraduationCap size={20} className="text-white"/>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-semibold text-sm truncate">{student.nom}</div>
        <div className="text-brand-400 text-xs font-mono">{student.matricule}</div>
        <div className="text-white/40 text-xs truncate">{student.filiere} — {student.license}</div>
      </div>
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0"/>
    </motion.div>
  )
}

/* ── Modal résultat vérification ──────────────────────────────────────────── */
function VerifResult({ result, onClose }) {
  if (!result) return null
  const { valide, etudiant, message } = result

  if (!valide) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}/>
        <div className="relative glass-card p-8 max-w-sm w-full border-2 border-red-500/50 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white"><XCircle size={20}/></button>
          <XCircle size={56} className="text-red-400 mx-auto mb-4"/>
          <h3 className="text-red-300 font-bold text-xl mb-2">Introuvable</h3>
          <p className="text-white/60 text-sm">{message}</p>
        </div>
      </motion.div>
    )
  }

  const statut         = etudiant.statut_paiement
  const isOk           = statut === 'a_jour'
  const isInscNonPayee = statut === 'inscription_non_payee'
  const borderColor    = isOk ? 'border-green-500/50' : 'border-red-500/50'
  const bgStatus       = isOk ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
  const statusIcon     = isOk ? <CheckCircle size={22} className="text-green-400"/> : <XCircle size={22} className="text-red-400"/>
  const statusMsg      = isOk
    ? '✅ À JOUR — ACCÈS AUTORISÉ'
    : isInscNonPayee
      ? '⛔ INSCRIPTION NON PAYÉE — DIRIGER VERS LA CAISSE'
      : '⛔ MENSUALITÉS EN RETARD — DIRIGER VERS LA CAISSE'

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative glass-card p-6 max-w-md w-full border-2 ${borderColor}`}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white"><XCircle size={20}/></button>

        {/* Photo + nom */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 overflow-hidden flex-shrink-0">
            {etudiant.photo
              ? <img src={etudiant.photo} className="w-full h-full object-cover"/>
              : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/30">
                  {etudiant.nom?.[0] ?? '?'}
                </div>
            }
          </div>
          <div>
            <h3 className="text-white font-black text-lg leading-tight">{etudiant.nom}</h3>
            <div className="text-brand-400 font-mono text-sm">{etudiant.matricule}</div>
            <div className="text-white/50 text-xs mt-0.5">{etudiant.filiere} — {etudiant.license}</div>
          </div>
        </div>

        {/* Infos */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white/5 rounded-lg p-2.5">
            <div className="text-white/40 text-xs">Filière</div>
            <div className="text-white text-sm font-semibold mt-0.5">{etudiant.filiere || '—'}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5">
            <div className="text-white/40 text-xs">Niveau</div>
            <div className="text-white text-sm font-semibold mt-0.5">{etudiant.license || '—'}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 col-span-2">
            <div className="text-white/40 text-xs">Année scolaire</div>
            <div className="text-white text-sm font-semibold mt-0.5">{etudiant.annee}</div>
          </div>
        </div>

        {/* Mois en retard */}
        {!isOk && etudiant.mois_non_payes?.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-red-400 font-semibold text-xs mb-2">
              <AlertTriangle size={14}/>
              {etudiant.mois_non_payes.length} mois impayés — doit régler à la caisse
            </div>
            <div className="flex flex-wrap gap-1.5">
              {etudiant.mois_non_payes.map(m => (
                <span key={m} className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-mono">{m}</span>
              ))}
            </div>
          </div>
        )}

        {/* Statut final */}
        <div className={`py-3 px-4 rounded-xl font-black text-base text-center flex items-center justify-center gap-3 ${bgStatus}`}>
          {statusIcon}
          <span>{statusMsg}</span>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Page principale ──────────────────────────────────────────────────────── */
export default function AccueilDashboard() {
  const { logout }     = useAuth()
  const navigate       = useNavigate()
  const matriculeRef   = useRef(null)

  const [students, setStudents]           = useState([])
  const [filtered, setFiltered]           = useState([])
  const [search, setSearch]               = useState('')
  const [loading, setLoading]             = useState(true)
  const [filterFiliere, setFilterFiliere] = useState('')
  const filieres = [...new Set(students.map(s => s.filiere).filter(Boolean))]

  // Caméra
  const [cameraOpen, setCameraOpen] = useState(false)

  // QR manuel
  const [qrInput, setQrInput]   = useState('')
  const [scanning, setScanning] = useState(false)

  // Matricule
  const [matriculeInput, setMatriculeInput] = useState('')
  const [verifying, setVerifying]           = useState(false)

  // Résultat
  const [verifResult, setVerifResult] = useState(null)

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
    if (search) result = result.filter(s =>
      s.nom?.toLowerCase().includes(search.toLowerCase()) ||
      s.matricule?.toLowerCase().includes(search.toLowerCase()) ||
      s.filiere?.toLowerCase().includes(search.toLowerCase())
    )
    if (filterFiliere) result = result.filter(s => s.filiere === filterFiliere)
    setFiltered(result)
  }, [search, filterFiliere, students])

  /* Logique commune de vérification d'une valeur QR ou matricule */
  const processScanned = useCallback(async (value) => {
    const v = value.trim()
    if (!v) return
    try {
      let data
      // URL /qr/verify?matricule=XXX → extraire le matricule
      if (v.includes('verify?matricule=') || v.includes('verify-matricule/')) {
        const url  = new URL(v.startsWith('http') ? v : 'http://x/' + v)
        const mat  = url.searchParams.get('matricule') || v.split('/').pop()
        ;({ data } = await verifyMatriculeAccueil(decodeURIComponent(mat)))
      } else if (v.startsWith('{') || v.includes('"matricule"')) {
        ;({ data } = await verifyQR(v))
      } else {
        ;({ data } = await verifyMatriculeAccueil(v))
      }
      setVerifResult(data)
    } catch {
      toast.error('Erreur de vérification')
    }
  }, [])

  /* Résultat caméra */
  const handleCameraResult = useCallback(async (decodedText) => {
    setCameraOpen(false)
    toast.success('QR code détecté !', { duration: 1500 })
    await processScanned(decodedText)
  }, [processScanned])

  /* QR manuel */
  const handleVerifyQR = async () => {
    if (!qrInput.trim()) return
    setScanning(true)
    await processScanned(qrInput)
    setQrInput('')
    setScanning(false)
  }

  /* Matricule */
  const handleVerifyMatricule = async () => {
    const mat = matriculeInput.trim().toUpperCase()
    if (!mat) return
    setVerifying(true)
    await processScanned(mat)
    setMatriculeInput('')
    setVerifying(false)
  }

  return (
    <div className="min-h-screen bg-space-950">

      {/* Topbar */}
      <div className="sticky top-0 z-30 bg-space-900/90 backdrop-blur-xl border-b border-white/10 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center">
            <span className="text-white font-black text-xs">ISI</span>
          </div>
          <div>
            <div className="text-white font-bold text-sm">ISI SUPTECH</div>
            <div className="text-blue-400 text-xs font-medium">Espace Accueil</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-white/40 text-sm">
            <span className="text-white font-semibold">{students.length}</span> étudiants inscrits
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-white/40 hover:text-red-400 text-sm transition-colors">
            <LogOut size={16}/> Déconnexion
          </button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Colonne gauche : Vérifications ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* 1. Scanner caméra */}
            <div className="glass-card p-5 neon-border">
              <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                <Camera size={17} className="text-green-400"/> Scanner par caméra
              </h3>
              <p className="text-white/40 text-xs mb-3">
                Utilisez la caméra pour scanner automatiquement le QR code de la carte étudiant.
              </p>
              <button
                onClick={() => setCameraOpen(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-900/30"
              >
                <Camera size={18}/> Ouvrir la caméra
              </button>
            </div>

            {/* 2. Vérification par matricule */}
            <div className="glass-card p-5">
              <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                <Hash size={17} className="text-brand-400"/> Vérifier par matricule
              </h3>
              <p className="text-white/40 text-xs mb-3">
                Saisissez le matricule pour vérifier le statut de paiement.
              </p>
              <div className="flex gap-2">
                <input
                  ref={matriculeRef}
                  className="form-input text-sm font-mono flex-1"
                  placeholder="ISI-2026-00001"
                  value={matriculeInput}
                  onChange={e => setMatriculeInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyMatricule()}
                />
                <button
                  onClick={handleVerifyMatricule}
                  disabled={verifying || !matriculeInput.trim()}
                  className="btn-primary px-4 flex items-center gap-1.5 text-sm disabled:opacity-50"
                >
                  {verifying ? <div className="spinner w-4 h-4"/> : <Search size={15}/>}
                </button>
              </div>
            </div>

            {/* 3. QR code manuel (scanner pistolaire / copier-coller) */}
            <div className="glass-card p-5">
              <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                <QrCode size={17} className="text-amber-400"/> QR code manuel
              </h3>
              <p className="text-white/40 text-xs mb-3">
                Scanner pistolaire ou copier-coller les données du QR.
              </p>
              <textarea
                className="form-input resize-none text-sm font-mono text-xs"
                rows={3}
                placeholder="Données QR code..."
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleVerifyQR())}
              />
              <button
                onClick={handleVerifyQR}
                disabled={scanning || !qrInput.trim()}
                className="btn-secondary w-full mt-2 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {scanning ? <div className="spinner w-4 h-4"/> : <QrCode size={15}/>}
                Vérifier
              </button>
            </div>

            {/* Stats filières */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <Users size={14}/> Étudiants actifs
                </h3>
                <button onClick={loadStudents} className="text-white/30 hover:text-white transition-colors">
                  <RefreshCw size={13}/>
                </button>
              </div>
              <div className="text-3xl font-black text-brand-400 mb-1">{students.length}</div>
              <div className="text-white/40 text-xs mb-3">étudiants inscrits</div>
              <div className="space-y-1.5">
                {filieres.slice(0, 5).map(f => (
                  <div key={f} className="flex items-center justify-between">
                    <span className="text-white/50 text-xs truncate">{f}</span>
                    <span className="text-white text-xs font-bold ml-2 flex-shrink-0">
                      {students.filter(s => s.filiere === f).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Colonne droite : Liste étudiants ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
                <input className="form-input pl-9 py-2.5 text-sm" placeholder="Rechercher nom, matricule, filière..."
                  value={search} onChange={e => setSearch(e.target.value)}/>
              </div>
              <select className="form-input py-2.5 text-sm w-auto min-w-[160px]"
                value={filterFiliere} onChange={e => setFilterFiliere(e.target.value)}>
                <option value="">Toutes les filières</option>
                {filieres.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><div className="spinner"/></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <Users size={48} className="mx-auto mb-4 opacity-30"/>
                <p>Aucun étudiant trouvé</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                {filtered.map((s, i) => (
                  <StudentCard key={s.id} student={s} delay={i * 0.02}/>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Scanner caméra overlay */}
      <AnimatePresence>
        {cameraOpen && (
          <CameraScanner
            onResult={handleCameraResult}
            onClose={() => setCameraOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Résultat vérification */}
      <AnimatePresence>
        {verifResult && <VerifResult result={verifResult} onClose={() => setVerifResult(null)}/>}
      </AnimatePresence>
    </div>
  )
}
