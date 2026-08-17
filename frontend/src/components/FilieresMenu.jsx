import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, GraduationCap } from 'lucide-react'
import { DEPARTEMENTS } from '../data/departements'

/* ── Desktop : bouton "Filières" + panneau deroulant deux colonnes ────────── */
export function FilieresMenuDesktop({ triggerClassName }) {
  const [open, setOpen] = useState(false)
  const [activeDept, setActiveDept] = useState(DEPARTEMENTS[0].id)
  const ref = useRef(null)

  useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const dept = DEPARTEMENTS.find(d => d.id === activeDept)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={triggerClassName}
      >
        Filières <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[680px] max-w-[92vw] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="flex" style={{ minHeight: 280 }}>
              {/* Colonne départements */}
              <div className="w-56 flex-shrink-0 bg-slate-50 border-r border-slate-200 py-3">
                {DEPARTEMENTS.map(d => (
                  <button
                    key={d.id}
                    onMouseEnter={() => setActiveDept(d.id)}
                    onClick={() => setActiveDept(d.id)}
                    className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors flex items-center justify-between gap-2 ${
                      activeDept === d.id ? 'bg-white text-isiblue-700 border-l-2 border-isiblue-600' : 'text-slate-600 hover:bg-white/60'
                    }`}
                  >
                    <span>{d.nom.replace('Département ', '')}</span>
                    <ChevronRight size={14} className="flex-shrink-0 opacity-50"/>
                  </button>
                ))}
              </div>

              {/* Colonne programmes */}
              <div className="flex-1 p-5 grid grid-cols-2 gap-5">
                {dept.licences.length > 0 && (
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-isigold-600 mb-2">Nos Licences</div>
                    <ul className="space-y-1.5">
                      {dept.licences.map(nom => (
                        <li key={nom}>
                          <Link to="/pre-inscription" onClick={() => setOpen(false)}
                            className="text-sm text-slate-700 hover:text-isiblue-700 transition-colors block leading-snug">
                            {nom}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="space-y-5">
                  {dept.masters.length > 0 && (
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-isigold-600 mb-2">Nos Masters</div>
                      <ul className="space-y-1.5">
                        {dept.masters.map(nom => (
                          <li key={nom}>
                            <Link to="/pre-inscription" onClick={() => setOpen(false)}
                              className="text-sm text-slate-700 hover:text-isiblue-700 transition-colors block leading-snug">
                              {nom}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {dept.ingenieur && (
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-isigold-600 mb-2">Cycle Ingénieur</div>
                      <Link to="/pre-inscription" onClick={() => setOpen(false)}
                        className="text-sm text-slate-700 hover:text-isiblue-700 transition-colors flex items-center gap-1.5">
                        <GraduationCap size={14}/> {dept.ingenieur}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 text-xs text-slate-500">
              Les inscriptions démarrent selon le programme — septembre, octobre ou novembre.
              <Link to="/pre-inscription" onClick={() => setOpen(false)} className="text-isiblue-600 font-semibold ml-1">Pré-inscrivez-vous →</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Mobile : accordéon imbriqué (Département → Licences/Masters/Ingénieur) ── */
export function FilieresMenuMobile({ onNavigate }) {
  const [openDept, setOpenDept] = useState(null)

  return (
    <div className="rounded-xl overflow-hidden border border-slate-100">
      {DEPARTEMENTS.map(d => (
        <div key={d.id} className="border-b border-slate-100 last:border-0">
          <button
            onClick={() => setOpenDept(o => o === d.id ? null : d.id)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 bg-slate-50/60"
          >
            <span className="text-left">{d.nom.replace('Département ', '')}</span>
            <ChevronDown size={16} className={`flex-shrink-0 transition-transform ${openDept === d.id ? 'rotate-180' : ''}`}/>
          </button>
          <AnimatePresence>
            {openDept === d.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 py-3 space-y-4">
                  {d.licences.length > 0 && (
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-wider text-isigold-600 mb-1.5">Nos Licences</div>
                      <div className="space-y-1">
                        {d.licences.map(nom => (
                          <Link key={nom} to="/pre-inscription" onClick={onNavigate}
                            className="block text-sm text-slate-600 py-1">{nom}</Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {d.masters.length > 0 && (
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-wider text-isigold-600 mb-1.5">Nos Masters</div>
                      <div className="space-y-1">
                        {d.masters.map(nom => (
                          <Link key={nom} to="/pre-inscription" onClick={onNavigate}
                            className="block text-sm text-slate-600 py-1">{nom}</Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {d.ingenieur && (
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-wider text-isigold-600 mb-1.5">Cycle Ingénieur</div>
                      <Link to="/pre-inscription" onClick={onNavigate}
                        className="text-sm text-slate-600 py-1 flex items-center gap-1.5">
                        <GraduationCap size={13}/> {d.ingenieur}
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
      <div className="px-4 py-2.5 text-[11px] text-slate-400 bg-slate-50/60">
        Les inscriptions démarrent selon le programme — septembre, octobre ou novembre.
      </div>
    </div>
  )
}
