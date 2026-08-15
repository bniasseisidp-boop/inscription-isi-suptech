import { useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import useInstallPrompt from '../hooks/useInstallPrompt'

export default function InstallAppButton({ className = '' }) {
  const { installed, canInstall, isIos, promptInstall } = useInstallPrompt()
  const [showIosHelp, setShowIosHelp] = useState(false)

  if (installed || (!canInstall && !isIos)) return null

  return (
    <>
      <button
        onClick={() => (canInstall ? promptInstall() : setShowIosHelp(true))}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-isigold-100/60 text-isiblue-700 hover:bg-isigold-100 border border-isigold-300 transition-all ${className}`}
      >
        <Download size={17} className="text-isigold-600" />
        Installer l'application
      </button>

      {showIosHelp && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowIosHelp(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-isiblue-700 font-bold text-sm">Installer l'application</h3>
              <button onClick={() => setShowIosHelp(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={16}/></button>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              Appuyez sur <Share size={14} className="inline text-isiblue-600 -mt-0.5" /> <strong>Partager</strong> en bas de Safari, puis sur <strong>« Sur l'écran d'accueil »</strong>.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
