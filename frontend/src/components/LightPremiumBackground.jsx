import { useEffect, useRef } from 'react'

/**
 * Fond animé "premium" pour le thème clair : fond blanc, formes bleu/or qui
 * dérivent lentement + grille de points très discrète. Remplace le fond
 * "espace" (étoiles/nébuleuses) sur les interfaces qui utilisent désormais
 * la palette blanc / bleu / jaune.
 */
export default function LightPremiumBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId, t = 0

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Grands halos qui dérivent doucement (bleu ISI + or)
    const blobs = [
      { x: 0.10, y: 0.15, r: 0.32, color: [26, 58, 143],   speed: 0.0006 }, // bleu ISI
      { x: 0.85, y: 0.10, r: 0.26, color: [234, 179, 8],   speed: 0.0005 }, // jaune/or
      { x: 0.75, y: 0.75, r: 0.36, color: [37, 99, 235],   speed: 0.0007 }, // bleu vif
      { x: 0.15, y: 0.85, r: 0.24, color: [250, 204, 21],  speed: 0.0009 }, // jaune vif
      { x: 0.50, y: 0.45, r: 0.20, color: [15, 35, 82],    speed: 0.0004 }, // bleu marine
    ]

    // Particules discrètes (points bleus/or)
    const particles = Array.from({ length: 36 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 0.8 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -0.05 - Math.random() * 0.2,
      color: Math.random() > 0.5 ? [26, 58, 143] : [234, 179, 8],
      opacity: 0.15 + Math.random() * 0.25,
    }))

    const draw = () => {
      t += 0.01
      const W = canvas.width, H = canvas.height

      // Fond blanc pur
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, H)

      // Halos bleu/or, très légers
      blobs.forEach((b, i) => {
        const cx = (b.x + Math.sin(t * b.speed * 100 + i) * 0.05) * W
        const cy = (b.y + Math.cos(t * b.speed * 100 + i * 1.3) * 0.05) * H
        const r  = b.r * Math.min(W, H) * (1 + Math.sin(t * b.speed * 50 + i) * 0.08)

        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        g.addColorStop(0,   `rgba(${b.color.join(',')},0.05)`)
        g.addColorStop(0.5, `rgba(${b.color.join(',')},0.025)`)
        g.addColorStop(1,   `rgba(${b.color.join(',')},0)`)
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
      })

      // Grille de points très discrète
      const gap = 42
      ctx.fillStyle = 'rgba(26,58,143,0.05)'
      for (let x = (t * 4) % gap; x < W; x += gap) {
        for (let y = 0; y < H; y += gap) {
          ctx.beginPath()
          ctx.arc(x, y, 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Particules flottantes
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W }
        if (p.x < -5 || p.x > W + 5) { p.x = Math.random() * W; p.y = Math.random() * H }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.color.join(',')},${p.opacity})`
        ctx.fill()
      })

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}
