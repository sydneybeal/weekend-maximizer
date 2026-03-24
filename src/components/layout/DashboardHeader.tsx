import { useState, useEffect } from 'react'
import { Plane } from 'lucide-react'

export function DashboardHeader() {
  return (
    <header className="border-b border-white/5 bg-navy-900/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-blue to-electric-cyan flex items-center justify-center shadow-lg shadow-electric-blue/30">
              <Plane className="w-5 h-5 text-white fill-white" style={{ transform: 'rotate(-45deg)' }} />
            </div>
            <div className="absolute -inset-1 rounded-xl bg-electric-blue/20 blur-md -z-10" />
          </div>
          <div>
            <h1
              className="text-xl leading-none text-white tracking-wide"
              style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: '0.05em' }}
            >
              WEEKEND MAXIMIZER
            </h1>
            <p className="text-[10px] text-electric-cyan/50 leading-tight mt-0.5 font-mono uppercase tracking-widest">
              Flight Intelligence System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <MissionClock />
          <ApiStatusPill />
        </div>
      </div>
    </header>
  )
}

function MissionClock() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const utc = time.toUTCString().slice(17, 25)

  return (
    <div className="flex items-center gap-2 glass rounded-full px-3 py-1.5">
      <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">UTC</span>
      <span className="text-[12px] font-mono text-white/50 tabular-nums">{utc}</span>
    </div>
  )
}

function ApiStatusPill() {
  return (
    <div className="flex items-center gap-2 glass rounded-full px-3 py-1.5">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-electric-green opacity-60" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-electric-green" />
      </span>
      <span className="text-[11px] font-medium text-white/50 tracking-wide">Amadeus</span>
    </div>
  )
}
