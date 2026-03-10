import { Plane, Zap } from 'lucide-react'

export function DashboardHeader() {
  return (
    <header className="border-b border-white/5 bg-navy-900/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-electric-blue to-electric-cyan flex items-center justify-center shadow-lg shadow-electric-blue/30">
            <Plane className="w-5 h-5 text-white fill-white" style={{ transform: 'rotate(-45deg)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">
              Weekend Maximizer
            </h1>
            <p className="text-[11px] text-white/40 leading-tight mt-0.5">
              find your next escape
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ApiStatusPill />
        </div>
      </div>
    </header>
  )
}

function ApiStatusPill() {
  return (
    <div className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5">
      <Zap className="w-3 h-3 text-electric-cyan" />
      <span className="text-[11px] font-medium text-white/60">Amadeus API</span>
      <span className="w-1.5 h-1.5 rounded-full bg-electric-green animate-[pulse_2s_ease-in-out_infinite]" />
    </div>
  )
}
