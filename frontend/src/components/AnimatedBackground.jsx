import { useEffect, useRef } from 'react'

export default function AnimatedBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Stars
    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.3 + 0.05,
      opacity: Math.random(),
      pulse: Math.random() * Math.PI * 2,
    }))

    // Floating orbs
    const orbs = Array.from({ length: 6 }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 80 + Math.random() * 120,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      hue: 210 + i * 10,
    }))

    // Connection lines between nearby stars
    const drawConnections = () => {
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x
          const dy = stars[i].y - stars[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(59,130,246,${0.08 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(stars[i].x, stars[i].y)
            ctx.lineTo(stars[j].x, stars[j].y)
            ctx.stroke()
          }
        }
      }
    }

    let t = 0
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      grad.addColorStop(0, '#020817')
      grad.addColorStop(0.5, '#050a14')
      grad.addColorStop(1, '#0a1628')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Orbs
      orbs.forEach((o) => {
        o.x += o.vx; o.y += o.vy
        if (o.x < -o.r) o.x = canvas.width + o.r
        if (o.x > canvas.width + o.r) o.x = -o.r
        if (o.y < -o.r) o.y = canvas.height + o.r
        if (o.y > canvas.height + o.r) o.y = -o.r

        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r)
        g.addColorStop(0, `hsla(${o.hue},70%,50%,0.06)`)
        g.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
      })

      // Stars
      t += 0.01
      stars.forEach((s) => {
        s.y -= s.speed
        if (s.y < -5) { s.y = canvas.height + 5; s.x = Math.random() * canvas.width }
        const alpha = 0.4 + 0.5 * Math.sin(s.pulse + t * 2)
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(148,197,253,${alpha})`
        ctx.fill()
      })

      drawConnections()
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
      style={{ mixBlendMode: 'screen' }}
    />
  )
}
