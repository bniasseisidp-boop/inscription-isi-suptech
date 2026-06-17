import { useEffect, useRef } from 'react'

export default function AnimatedBackgroundWhite() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let t = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // ── Vortex particles ──────────────────────────────────────────────────
    const COLORS = [
      [59, 130, 246],   // blue
      [99, 102, 241],   // indigo
      [139, 92, 246],   // violet
      [16, 185, 129],   // emerald
      [245, 158, 11],   // amber
      [236, 72, 153],   // pink
      [14, 165, 233],   // sky
    ]

    // Create spiral particles
    const spirals = Array.from({ length: 3 }, (_, si) => ({
      cx: canvas.width * (0.2 + si * 0.3),
      cy: canvas.height * (0.3 + (si % 2) * 0.4),
      particles: Array.from({ length: 60 }, (_, i) => ({
        angle: (i / 60) * Math.PI * 2 * 4,
        radius: 10 + i * 2.5,
        speed: 0.012 + Math.random() * 0.008,
        size: 2 + Math.random() * 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        opacity: 0.3 + Math.random() * 0.5,
        decay: 0.003 + Math.random() * 0.005,
      })),
    }))

    // Floating orbs
    const orbs = Array.from({ length: 6 }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 60 + Math.random() * 120,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      color: COLORS[i % COLORS.length],
      phase: Math.random() * Math.PI * 2,
      speed: 0.008 + Math.random() * 0.006,
    }))

    // Ring waves
    const waves = Array.from({ length: 4 }, (_, i) => ({
      x: canvas.width * (0.15 + i * 0.25),
      y: canvas.height * (0.2 + (i % 2) * 0.6),
      maxR: 180 + i * 60,
      color: COLORS[i % COLORS.length],
      phase: (i / 4) * Math.PI * 2,
      speed: 0.006 + i * 0.002,
    }))

    // Trailing comet particles
    const comets = Array.from({ length: 20 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      r: 1.5 + Math.random() * 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      tail: [],
      maxTail: 12 + Math.floor(Math.random() * 12),
    }))

    const draw = () => {
      t += 0.012

      // Clear with slight fade for motion blur
      ctx.fillStyle = 'rgba(248, 250, 255, 0.25)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // ── Animated gradient blobs ─────────────────────────────────────────
      orbs.forEach((orb) => {
        orb.x += orb.vx + Math.sin(t * orb.speed + orb.phase) * 0.8
        orb.y += orb.vy + Math.cos(t * orb.speed + orb.phase) * 0.6
        if (orb.x < -orb.r) orb.x = canvas.width + orb.r
        if (orb.x > canvas.width + orb.r) orb.x = -orb.r
        if (orb.y < -orb.r) orb.y = canvas.height + orb.r
        if (orb.y > canvas.height + orb.r) orb.y = -orb.r

        const pulse = 1 + Math.sin(t * 1.5 + orb.phase) * 0.25
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r * pulse)
        grad.addColorStop(0, `rgba(${orb.color.join(',')},0.18)`)
        grad.addColorStop(0.5, `rgba(${orb.color.join(',')},0.07)`)
        grad.addColorStop(1, `rgba(${orb.color.join(',')},0)`)
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.r * pulse, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      })

      // ── Ring waves ──────────────────────────────────────────────────────
      waves.forEach((wave) => {
        const wavePhase = t * wave.speed + wave.phase
        for (let ri = 0; ri < 3; ri++) {
          const r = ((wavePhase + ri * 0.5) % 1) * wave.maxR
          const alpha = (1 - r / wave.maxR) * 0.15
          ctx.beginPath()
          ctx.arc(wave.x, wave.y, r, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(${wave.color.join(',')},${alpha})`
          ctx.lineWidth = 2
          ctx.stroke()
        }
      })

      // ── Vortex spirals ──────────────────────────────────────────────────
      spirals.forEach((spiral, si) => {
        // Update center with gentle drift
        spiral.cx += Math.sin(t * 0.3 + si) * 0.4
        spiral.cy += Math.cos(t * 0.25 + si) * 0.3

        spiral.particles.forEach((p, i) => {
          // Rotate each particle around the spiral center
          p.angle += p.speed * (1 + i * 0.003)
          const wobble = Math.sin(t * 2 + p.angle) * 8
          const x = spiral.cx + Math.cos(p.angle) * (p.radius + wobble)
          const y = spiral.cy + Math.sin(p.angle) * (p.radius * 0.6 + wobble)

          // Shrink towards center over time → creates flowing effect
          const localOp = Math.abs(Math.sin(t * 1.2 + i * 0.15)) * p.opacity

          ctx.beginPath()
          ctx.arc(x, y, p.size, 0, Math.PI * 2)
          const [r, g, b] = p.color
          ctx.fillStyle = `rgba(${r},${g},${b},${localOp})`
          ctx.fill()

          // Connection to next particle
          if (i < spiral.particles.length - 1) {
            const next = spiral.particles[i + 1]
            const nx = spiral.cx + Math.cos(next.angle) * (next.radius + wobble)
            const ny = spiral.cy + Math.sin(next.angle) * (next.radius * 0.6 + wobble)
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(nx, ny)
            ctx.strokeStyle = `rgba(${r},${g},${b},${localOp * 0.3})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        })

        // Draw vortex eye
        const eyeR = 8 + Math.sin(t * 2 + si) * 4
        const eyeGrad = ctx.createRadialGradient(spiral.cx, spiral.cy, 0, spiral.cx, spiral.cy, eyeR * 3)
        const ec = COLORS[(si * 2) % COLORS.length]
        eyeGrad.addColorStop(0, `rgba(${ec.join(',')},0.4)`)
        eyeGrad.addColorStop(1, `rgba(${ec.join(',')},0)`)
        ctx.beginPath()
        ctx.arc(spiral.cx, spiral.cy, eyeR * 3, 0, Math.PI * 2)
        ctx.fillStyle = eyeGrad
        ctx.fill()
      })

      // ── Comets with tails ───────────────────────────────────────────────
      comets.forEach((c) => {
        c.tail.unshift({ x: c.x, y: c.y })
        if (c.tail.length > c.maxTail) c.tail.pop()

        // Draw tail
        c.tail.forEach((pt, i) => {
          const alpha = (1 - i / c.maxTail) * 0.6
          const size = c.r * (1 - i / c.maxTail)
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, Math.max(0.1, size), 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${c.color.join(',')},${alpha})`
          ctx.fill()
        })

        // Move
        c.x += c.vx
        c.y += c.vy
        c.vx += (Math.random() - 0.5) * 0.1
        c.vy += (Math.random() - 0.5) * 0.1
        c.vx *= 0.99
        c.vy *= 0.99

        if (c.x < 0 || c.x > canvas.width)  { c.vx *= -1; c.x = Math.max(0, Math.min(canvas.width, c.x)) }
        if (c.y < 0 || c.y > canvas.height) { c.vy *= -1; c.y = Math.max(0, Math.min(canvas.height, c.y)) }
      })

      // ── Big diagonal light sweep ────────────────────────────────────────
      const sweepX = ((t * 0.05) % 1.4 - 0.2) * canvas.width * 1.4
      const sweepGrad = ctx.createLinearGradient(sweepX - 80, 0, sweepX + 80, canvas.height)
      sweepGrad.addColorStop(0, 'rgba(99,102,241,0)')
      sweepGrad.addColorStop(0.5, 'rgba(99,102,241,0.04)')
      sweepGrad.addColorStop(1, 'rgba(99,102,241,0)')
      ctx.fillStyle = sweepGrad
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'linear-gradient(135deg, #f0f6ff 0%, #f8f5ff 40%, #f0fdf8 80%, #fef9f0 100%)' }}
    />
  )
}
