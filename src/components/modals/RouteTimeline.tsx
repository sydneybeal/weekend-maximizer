import { Plane } from 'lucide-react'
import type { Leg } from '../../types/flights.js'
import { formatTime, formatDuration, airlineNameFromCode } from '../../lib/utils.js'

interface RouteTimelineProps {
  leg: Leg
  label: string
}

export function RouteTimeline({ leg, label }: RouteTimelineProps) {
  const dep = leg.segments[0]
  const arr = leg.segments[leg.segments.length - 1]

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">{label}</p>
      <div className="flex items-center gap-3">
        {/* Departure */}
        <div className="text-right min-w-[48px]">
          <p className="text-base font-bold price-text text-white">
            {formatTime(dep.departureTime)}
          </p>
          <p className="text-[11px] font-mono text-white/50">{dep.departureAirport}</p>
        </div>

        {/* Line with stops */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-center w-full gap-1">
            <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-electric-blue/40" />
            <Plane className="w-3.5 h-3.5 text-electric-cyan shrink-0" style={{ transform: 'rotate(90deg)' }} />
            <div className="h-px flex-1 bg-gradient-to-r from-electric-blue/40 to-white/20" />
          </div>
          <p className="text-[10px] text-white/30">
            {formatDuration(leg.durationMinutes)}
            {leg.stops > 0 ? ` · ${leg.stops} stop${leg.stops > 1 ? 's' : ''}` : ' · Nonstop'}
          </p>
        </div>

        {/* Arrival */}
        <div className="min-w-[48px]">
          <p className="text-base font-bold price-text text-white">
            {formatTime(arr.arrivalTime)}
          </p>
          <p className="text-[11px] font-mono text-white/50">{arr.arrivalAirport}</p>
        </div>
      </div>

      {/* Stops detail */}
      {leg.stops > 0 && (
        <div className="ml-0 pl-3 border-l border-white/5 space-y-1">
          {leg.segments.map((seg, i) => (
            <p key={i} className="text-[11px] text-white/30">
              <span className="font-mono text-white/40">{seg.departureAirport} → {seg.arrivalAirport}</span>
              {' · '}{airlineNameFromCode(seg.carrier)} {seg.carrier}{seg.flightNumber}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
