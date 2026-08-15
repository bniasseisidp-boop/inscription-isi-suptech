import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Html5Qrcode } from 'html5-qrcode'
import {
  Search, QrCode, Users, LogOut, CheckCircle, XCircle,
  AlertTriangle, RefreshCw, GraduationCap, Hash, Camera, CameraOff, UserCog, X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getPublicStudents, verifyQR, verifyMatriculeAccueil, updateMyPassword } from '../services/api'
import LightPremiumBackground from '../components/LightPremiumBackground'

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
          className="absolute -top-10 right-0 text-white/80 hover:text-white flex items-center gap-2 text-sm">
          <CameraOff size={16}/> Fermer la caméra
        </button>

        <div className="light-card p-4 border-2 border-isiblue-500/40">
          <div className="flex items-center gap-2 mb-3">
            <Camera size={16} className="text-isiblue-500 animate-pulse"/>
            <span className="text-isiblue-700 font-semibold text-sm">Scanner le QR code</span>
          </div>

          {error ? (
            <div className="py-8 text-center">
              <CameraOff size={40} className="text-red-500 mx-auto mb-3"/>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black">
              {/* div ciblé par html5-qrcode */}
              <div id="qr-cam-region" className="w-full"/>
              {/* Cadre de visée */}
              {ready && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-52 h-52 relative">
                    <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-isigold-400 rounded-tl-lg"/>
                    <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-isigold-400 rounded-tr-lg"/>
                    <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-isigold-400 rounded-bl-lg"/>
                    <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-isigold-400 rounded-br-lg"/>
                    {/* Ligne de scan animée */}
                    <motion.span
                      className="absolute left-0 right-0 h-0.5 bg-isigold-400/80"
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-slate-500 text-xs text-center mt-3">
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
      className="light-card-hover p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-isiblue-600 to-isiblue-400 flex items-center justify-center overflow-hidden flex-shrink-0">
        {student.photo
          ? <img src={student.photo} alt={student.nom} className="w-full h-full object-cover"/>
          : <GraduationCap size={20} className="text-white"/>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-slate-900 font-semibold text-sm truncate">{student.nom}</div>
        <div className="text-isiblue-500 text-xs font-mono">{student.matricule}</div>
        <div className="text-slate-500 text-xs truncate">{student.filiere} — {student.license}</div>
        {!student.a_jour && student.mois_non_payes?.length > 0 && (
          <div className="text-red-500 text-[11px] font-semibold mt-0.5">
            ⚠ {student.mois_non_payes.length} mois impayé{student.mois_non_payes.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${student.a_jour ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}/>
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
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
        <div className="relative light-card p-8 max-w-sm w-full border-2 border-red-400/60 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><XCircle size={20}/></button>
          <XCircle size={56} className="text-red-500 mx-auto mb-4"/>
          <h3 className="text-red-600 font-bold text-xl mb-2">Introuvable</h3>
          <p className="text-slate-500 text-sm">{message}</p>
        </div>
      </motion.div>
    )
  }

  const statut         = etudiant.statut_paiement
  const isOk           = statut === 'a_jour'
  const isInscNonPayee = statut === 'inscription_non_payee'
  const borderColor    = isOk ? 'border-green-500/60' : 'border-red-500/60'
  const bgStatus       = isOk ? 'bg-green-500/15 text-green-700' : 'bg-red-500/15 text-red-700'
  const statusIcon     = isOk ? <CheckCircle size={22} className="text-green-600"/> : <XCircle size={22} className="text-red-600"/>
  const statusMsg      = isOk
    ? '✅ À JOUR — ACCÈS AUTORISÉ'
    : isInscNonPayee
      ? '⛔ INSCRIPTION NON PAYÉE — DIRIGER VERS LA CAISSE'
      : '⛔ MENSUALITÉS EN RETARD — DIRIGER VERS LA CAISSE'

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative light-card p-6 max-w-md w-full border-2 ${borderColor}`}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><XCircle size={20}/></button>

        {/* Photo + nom */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-isiblue-600 to-isiblue-400 overflow-hidden flex-shrink-0">
            {etudiant.photo
              ? <img src={etudiant.photo} className="w-full h-full object-cover"/>
              : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/60">
                  {etudiant.nom?.[0] ?? '?'}
                </div>
            }
          </div>
          <div>
            <h3 className="text-slate-900 font-black text-lg leading-tight">{etudiant.nom}</h3>
            <div className="text-isiblue-500 font-mono text-sm">{etudiant.matricule}</div>
            <div className="text-slate-500 text-xs mt-0.5">{etudiant.filiere} — {etudiant.license}</div>
          </div>
        </div>

        {/* Infos */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <div className="text-slate-400 text-xs">Filière</div>
            <div className="text-slate-900 text-sm font-semibold mt-0.5">{etudiant.filiere || '—'}</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <div className="text-slate-400 text-xs">Niveau</div>
            <div className="text-slate-900 text-sm font-semibold mt-0.5">{etudiant.license || '—'}</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 col-span-2">
            <div className="text-slate-400 text-xs">Année scolaire</div>
            <div className="text-slate-900 text-sm font-semibold mt-0.5">{etudiant.annee}</div>
          </div>
        </div>

        {/* Mois en retard */}
        {!isOk && etudiant.mois_non_payes?.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-red-600 font-semibold text-xs mb-2">
              <AlertTriangle size={14}/>
              {etudiant.mois_non_payes.length} mois impayés — doit régler à la caisse
            </div>
            <div className="flex flex-wrap gap-1.5">
              {etudiant.mois_non_payes.map(m => (
                <span key={m} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-mono">{m}</span>
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
  const { logout, user } = useAuth()
  const navigate       = useNavigate()
  const matriculeRef   = useRef(null)

  const [showMonProfil, setShowMonProfil] = useState(false)
  const [pwdForm, setPwdForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [changingPwd, setChangingPwd] = useState(false)
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
      setShowMonProfil(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur — vérifiez votre mot de passe actuel.')
    } finally {
      setChangingPwd(false)
    }
  }

  const [students, setStudents]           = useState([])
  const [filtered, setFiltered]           = useState([])
  const [search, setSearch]               = useState('')
  const [loading, setLoading]             = useState(true)
  const [filterFiliere, setFilterFiliere] = useState('')
  const [onlyNonAJour, setOnlyNonAJour] = useState(false)
  const filieres = [...new Set(students.map(s => s.filiere).filter(Boolean))]
  const nonAJourCount = students.filter(s => !s.a_jour).length

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
    if (onlyNonAJour) result = result.filter(s => !s.a_jour)
    setFiltered(result)
  }, [search, filterFiliere, onlyNonAJour, students])

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
    <div className="min-h-screen bg-white relative">
      <LightPremiumBackground/>

      {/* Topbar */}
      <div className="relative sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/isi-logo.png" alt="ISI SUPTECH" className="h-9 w-auto object-contain"/>
          <div>
            <div className="text-isiblue-700 font-bold text-sm">ISI SUPTECH</div>
            <div className="text-isigold-600 text-xs font-medium">Espace Accueil</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-slate-500 text-sm">
            <span className="text-slate-900 font-semibold">{students.length}</span> étudiants inscrits
          </div>
          <button onClick={() => setShowMonProfil(true)} className="flex items-center gap-2 text-slate-400 hover:text-isiblue-600 text-sm transition-colors">
            <UserCog size={16}/> Mon profil
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-500 text-sm transition-colors">
            <LogOut size={16}/> Déconnexion
          </button>
        </div>
      </div>

      {showMonProfil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-isiblue-700 font-bold text-lg flex items-center gap-2"><UserCog size={18} className="text-isigold-600"/> Mon profil</h2>
              <button onClick={() => setShowMonProfil(false)} className="p-2 rounded-xl text-slate-400 hover:text-isiblue-700 hover:bg-slate-100 transition-all"><X size={18}/></button>
            </div>
            <div className="text-sm text-slate-700 font-semibold">{user?.name}</div>
            <div className="text-xs text-slate-400 mb-4">{user?.email} · Accueil</div>
            <h3 className="text-isiblue-700 font-semibold text-sm mb-3">Modifier le mot de passe</h3>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-slate-500 text-xs mb-1.5">Mot de passe actuel</label>
                <input type="password" required value={pwdForm.current_password}
                  onChange={e => setPwdForm(f => ({ ...f, current_password: e.target.value }))}
                  className="form-input-light"/>
              </div>
              <div>
                <label className="block text-slate-500 text-xs mb-1.5">Nouveau mot de passe</label>
                <input type="password" required minLength={8} value={pwdForm.password}
                  onChange={e => setPwdForm(f => ({ ...f, password: e.target.value }))}
                  className="form-input-light"/>
              </div>
              <div>
                <label className="block text-slate-500 text-xs mb-1.5">Confirmer le nouveau mot de passe</label>
                <input type="password" required minLength={8} value={pwdForm.password_confirmation}
                  onChange={e => setPwdForm(f => ({ ...f, password_confirmation: e.target.value }))}
                  className="form-input-light"/>
              </div>
              <button type="submit" disabled={changingPwd} className="btn-primary w-full text-sm">
                {changingPwd ? <div className="spinner w-4 h-4 mx-auto"/> : 'Mettre à jour le mot de passe'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Colonne gauche : Vérifications ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* 1. Scanner caméra */}
            <div className="light-card p-5 border-2 border-isiblue-500/20">
              <h3 className="text-isiblue-700 font-bold mb-1 flex items-center gap-2">
                <Camera size={17} className="text-green-600"/> Scanner par caméra
              </h3>
              <p className="text-slate-500 text-xs mb-3">
                Utilisez la caméra pour scanner automatiquement le QR code de la carte étudiant.
              </p>
              <button
                onClick={() => setCameraOpen(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-900/20"
              >
                <Camera size={18}/> Ouvrir la caméra
              </button>
            </div>

            {/* 2. Vérification par matricule */}
            <div className="light-card p-5">
              <h3 className="text-isiblue-700 font-bold mb-1 flex items-center gap-2">
                <Hash size={17} className="text-isiblue-500"/> Vérifier par matricule
              </h3>
              <p className="text-slate-500 text-xs mb-3">
                Saisissez le matricule pour vérifier le statut de paiement.
              </p>
              <div className="flex gap-2">
                <input
                  ref={matriculeRef}
                  className="form-input-light font-mono flex-1"
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
            <div className="light-card p-5">
              <h3 className="text-isiblue-700 font-bold mb-1 flex items-center gap-2">
                <QrCode size={17} className="text-isigold-600"/> QR code manuel
              </h3>
              <p className="text-slate-500 text-xs mb-3">
                Scanner pistolaire ou copier-coller les données du QR.
              </p>
              <textarea
                className="form-input-light resize-none font-mono text-xs"
                rows={3}
                placeholder="Données QR code..."
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleVerifyQR())}
              />
              <button
                onClick={handleVerifyQR}
                disabled={scanning || !qrInput.trim()}
                className="btn-secondary-light w-full mt-2 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {scanning ? <div className="spinner w-4 h-4"/> : <QrCode size={15}/>}
                Vérifier
              </button>
            </div>

            {/* Stats filières */}
            <div className="light-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-isiblue-700 font-semibold text-sm flex items-center gap-2">
                  <Users size={14}/> Étudiants actifs
                </h3>
                <button onClick={loadStudents} className="text-slate-400 hover:text-isiblue-600 transition-colors">
                  <RefreshCw size={13}/>
                </button>
              </div>
              <div className="text-3xl font-black text-isiblue-500 mb-1">{students.length}</div>
              <div className="text-slate-500 text-xs mb-3">étudiants inscrits</div>
              <div className="space-y-1.5">
                {filieres.slice(0, 5).map(f => (
                  <div key={f} className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs truncate">{f}</span>
                    <span className="text-slate-900 text-xs font-bold ml-2 flex-shrink-0">
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
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input className="form-input-light pl-9" placeholder="Rechercher nom, matricule, filière..."
                  value={search} onChange={e => setSearch(e.target.value)}/>
              </div>
              <select className="form-input-light w-auto min-w-[160px]"
                value={filterFiliere} onChange={e => setFilterFiliere(e.target.value)}>
                <option value="">Toutes les filières</option>
                {filieres.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <button onClick={() => setOnlyNonAJour(v => !v)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  onlyNonAJour
                    ? 'bg-red-500 border-red-500 text-white'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}>
                <AlertTriangle size={14}/> Non en règle {nonAJourCount > 0 && `(${nonAJourCount})`}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><div className="spinner"/></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Users size={48} className="mx-auto mb-4 opacity-40"/>
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
