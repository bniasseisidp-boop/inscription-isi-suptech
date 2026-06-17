import { useEffect, useRef } from 'react'

export default function AnimatedBackground() {
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

    // Nebula blobs (colorful, large)
    const nebulae = [
      { x: 0.15, y: 0.2,  r: 0.35, color: [139, 92, 246],  speed: 0.0008 }, // violet
      { x: 0.75, y: 0.15, r: 0.28, color: [236, 72, 153],   speed: 0.0006 }, // pink
      { x: 0.5,  y: 0.6,  r: 0.40, color: [59, 130, 246],   speed: 0.0007 }, // blue
      { x: 0.85, y: 0.7,  r: 0.25, color: [16, 185, 129],   speed: 0.0009 }, // teal
      { x: 0.2,  y: 0.8,  r: 0.30, color: [245, 158, 11],   speed: 0.0005 }, // amber
      { x: 0.6,  y: 0.3,  r: 0.22, color: [99, 102, 241],   speed: 0.0010 }, // indigo
    ]

    // Stars
    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.8 + 0.2,
      brightness: Math.random(),
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.5,
    }))

    // Shooting stars
    const shooters = []
    const spawnShooter = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.5,
      vx: 4 + Math.random() * 6,
      vy: 2 + Math.random() * 3,
      life: 1,
      len: 60 + Math.random() * 80,
    })

    // Floating particles
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 0.8 + Math.random() * 2.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.2 - Math.random() * 0.5,
      color: nebulae[Math.floor(Math.random() * nebulae.length)].color,
      opacity: 0.4 + Math.random() * 0.5,
    }))

    const draw = () => {
      t += 0.01
      const W = canvas.width, H = canvas.height

      // Deep dark bg
      ctx.fillStyle = '#06050f'
      ctx.fillRect(0, 0, W, H)

      // Nebulae
      nebulae.forEach((n, i) => {
        const cx = (n.x + Math.sin(t * n.speed * 100 + i) * 0.04) * W
        const cy = (n.y + Math.cos(t * n.speed * 100 + i * 1.3) * 0.04) * H
        const r  = n.r * Math.min(W, H) * (1 + Math.sin(t * n.speed * 50 + i) * 0.1)

        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        g.addColorStop(0,   `rgba(${n.color.join(',')},0.12)`)
        g.addColorStop(0.4, `rgba(${n.color.join(',')},0.06)`)
        g.addColorStop(1,   `rgba(${n.color.join(',')},0)`)
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
      })

      // Stars (twinkle)
      stars.forEach(s => {
        const twinkle = 0.4 + Math.abs(Math.sin(t * s.speed + s.phase)) * 0.6
        ctx.beginPath()
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${twinkle * s.brightness})`
        ctx.fill()
        // Glow for brighter stars
        if (s.brightness > 0.7) {
          const sg = ctx.createRadialGradient(s.x*W, s.y*H, 0, s.x*W, s.y*H, s.r*5)
          sg.addColorStop(0, `rgba(200,210,255,${twinkle * 0.15})`)
          sg.addColorStop(1, 'rgba(200,210,255,0)')
          ctx.beginPath()
          ctx.arc(s.x*W, s.y*H, s.r*5, 0, Math.PI * 2)
          ctx.fillStyle = sg
          ctx.fill()
        }
      })

      // Shooting stars
      if (Math.random() < 0.005) shooters.push(spawnShooter())
      for (let i = shooters.length - 1; i >= 0; i--) {
        const s = shooters[i]
        s.x += s.vx; s.y += s.vy; s.life -= 0.025
        if (s.life <= 0) { shooters.splice(i, 1); continue }
        const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx*s.len/s.vx, s.y - s.vy*s.len/s.vx)
        grad.addColorStop(0, `rgba(255,255,255,${s.life})`)
        grad.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(s.x - s.len * (s.vx / Math.hypot(s.vx, s.vy)),
                   s.y - s.len * (s.vy / Math.hypot(s.vx, s.vy)))
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5 * s.life
        ctx.stroke()
      }

      // Floating colored particles
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
