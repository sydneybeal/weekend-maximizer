import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  size: number
  baseOpacity: number
  twinkleSpeed: number
  twinkleOffset: number
  color: string
}

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Mix of dim distant stars, mid stars, and a few bright ones
    const stars: Star[] = Array.from({ length: 220 }, () => {
      const tier = Math.random()
      // 70% small dim, 25% medium, 5% bright
      const size  = tier < 0.70 ? Math.random() * 0.6 + 0.2
                  : tier < 0.95 ? Math.random() * 0.8 + 0.7
                  :               Math.random() * 1.0 + 1.4

      const baseOpacity = tier < 0.70 ? Math.random() * 0.25 + 0.05
                        : tier < 0.95 ? Math.random() * 0.35 + 0.20
                        :               Math.random() * 0.30 + 0.55

      // Occasionally give a star a slight blue or cyan tint
      const r = Math.random()
      const color = r < 0.08  ? '180, 220, 255'   // cool blue
                  : r < 0.14  ? '160, 240, 255'   // cyan
                  : r < 0.17  ? '255, 240, 200'   // warm white
                  :             '255, 255, 255'    // pure white

      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size,
        baseOpacity,
        twinkleSpeed:  Math.random() * 0.008 + 0.002,
        twinkleOffset: Math.random() * Math.PI * 2,
        color,
      }
    })

    let frame = 0
    let animId: number

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const star of stars) {
        // Gentle sine-wave twinkle — amplitude is small so stars don't flash
        const twinkle = Math.sin(frame * star.twinkleSpeed + star.twinkleOffset) * 0.25 + 0.75
        const opacity = star.baseOpacity * twinkle

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${star.color}, ${opacity})`
        ctx.fill()

        // Add a soft glow halo on brighter stars
        if (star.size > 1.4) {
          const grd = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3)
          grd.addColorStop(0, `rgba(${star.color}, ${opacity * 0.4})`)
          grd.addColorStop(1, `rgba(${star.color}, 0)`)
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2)
          ctx.fillStyle = grd
          ctx.fill()
        }
      }

      frame++
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
