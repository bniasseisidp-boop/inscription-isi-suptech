import { useState, useEffect } from 'react'
import { Power } from 'lucide-react'

export default function MaintenanceOverlay() {
  const [message, setMessage] = useState(null)

  useEffect(() => {
    const onMaintenance = (e) => setMessage(e.detail?.message || 'La plateforme est temporairement en maintenance. Merci de réessayer plus tard.')
    window.addEventListener('isi:maintenance', onMaintenance)
    return () => window.removeEventListener('isi:maintenance', onMaintenance)
  }, [])

  if (!message) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 backdrop-blur-md px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-isiblue-500/10 flex items-center justify-center mx-auto mb-5">
          <Power size={28} className="text-isiblue-500"/>
        </div>
        <h1 className="text-xl font-black text-slate-900 mb-2">Maintenance en cours</h1>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl bg-isiblue-500 text-white font-bold text-sm hover:bg-isiblue-600 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  )
}
