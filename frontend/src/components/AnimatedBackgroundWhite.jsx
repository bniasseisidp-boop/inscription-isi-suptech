import { useEffect, useRef } from 'react'

export default function AnimatedBackgroundWhite() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const COLORS = [
      'rgba(59,130,246,',   // blue
      'rgba(99,102,241,',   // indigo
      'rgba(139,92,246,',   // violet
      'rgba(16,185,129,',   // emerald
      'rgba(245,158,11,',   // amber
      'rgba(236,72,153,',   // pink
    ]

    // Floating blobs
    const blobs = Array.from({ length: 8 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 80 + Math.random() * 120,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      color: COLORS[i % COLORS.length],
      opacity: 0.06 + Math.random() * 0.08,
    }))

    // Floating circles
    const circles = Array.from({ length: 30 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 3 + Math.random() * 8,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -0.3 - Math.random() * 0.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: 0.15 + Math.random() * 0.3,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw blobs
      blobs.forEach((b) => {
        b.x += b.vx
        b.y += b.vy
        if (b.x < -b.r) b.x = canvas.width + b.r
        if (b.x > canvas.width + b.r) b.x = -b.r
        if (b.y < -b.r) b.y = canvas.height + b.r
        if (b.y > canvas.height + b.r) b.y = -b.r

        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
        grad.addColorStop(0, `${b.color}${b.opacity})`)
        grad.addColorStop(1, `${b.color}0)`)
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      })

      // Draw floating circles
      circles.forEach((c) => {
        c.x += c.vx
        c.y += c.vy
        if (c.y < -c.r) { c.y = canvas.height + c.r; c.x = Math.random() * canvas.width }
        if (c.x < -c.r) c.x = canvas.width + c.r
        if (c.x > canvas.width + c.r) c.x = -c.r

        ctx.beginPath()
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
        ctx.fillStyle = `${c.color}${c.opacity})`
        ctx.fill()

        // Border
        ctx.beginPath()
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
        ctx.strokeStyle = `${c.color}${c.opacity * 2})`
        ctx.lineWidth = 1
        ctx.stroke()
      })

      // Connection lines between nearby circles
      for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
          const dx = circles[i].x - circles[j].x
          const dy = circles[i].y - circles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(circles[i].x, circles[i].y)
            ctx.lineTo(circles[j].x, circles[j].y)
            ctx.strokeStyle = `rgba(99,102,241,${0.08 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

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
      style={{ background: 'linear-gradient(135deg, #f8faff 0%, #eff6ff 50%, #f5f3ff 100%)' }}
    />
  )
}
