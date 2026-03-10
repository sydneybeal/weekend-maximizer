import type { FlightOffer } from '../../types/flights.js'
import type { ScoredOffer } from '../../lib/scoring.js'
import { RouteTimeline } from './RouteTimeline.js'
import { RecommendationBadge } from '../results/RecommendationBadge.js'
import { formatPrice, airlineNameFromCode } from '../../lib/utils.js'
import { Plane } from 'lucide-react'

interface FlightDetailRowProps {
  offer: FlightOffer
  rank: number
}

export function FlightDetailRow({ offer, rank }: FlightDetailRowProps) {
  const scored = offer as ScoredOffer

  return (
    <div className="glass rounded-xl p-4 space-y-4 hover:border-white/12 transition-colors">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white/30">#{rank}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Plane className="w-3.5 h-3.5 text-white/30" />
              <span className="text-[13px] font-semibold text-white">
                {airlineNameFromCode(offer.airline)}
              </span>
              <span className="text-[11px] text-white/30 font-mono">{offer.airline}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold price-text text-white">{formatPrice(offer.price)}</p>
          {scored.label && (
            <div className="mt-1">
              <RecommendationBadge label={scored.label} color={scored.labelColor} />
            </div>
          )}
        </div>
      </div>

      {/* Outbound */}
      <RouteTimeline leg={offer.outbound} label="Outbound" />

      {/* Separator */}
      <div className="border-t border-dashed border-white/5" />

      {/* Return */}
      <RouteTimeline leg={offer.inbound} label="Return" />
    </div>
  )
}
