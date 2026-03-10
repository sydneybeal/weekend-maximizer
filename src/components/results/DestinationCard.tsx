import { motion } from 'framer-motion'
import { Plane, Clock, ArrowRight, Wifi, WifiOff, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import type { DestinationResult } from '../../types/flights.js'
import type { ScoredOffer } from '../../lib/scoring.js'
import { RecommendationBadge } from './RecommendationBadge.js'
import { GlassCard } from '../ui/GlassCard.js'
import { formatPrice, formatDuration, airlineNameFromCode } from '../../lib/utils.js'
import { cn } from '../../lib/utils.js'

interface DestinationCardProps {
  result: DestinationResult
  index: number
  onClick: () => void
}

export function DestinationCard({ result, index, onClick }: DestinationCardProps) {
  if (result.isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <GlassCard className="p-5 space-y-3">
          <div className="skeleton h-5 w-3/4" />
          <div className="skeleton h-8 w-1/2" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-2/3" />
        </GlassCard>
      </motion.div>
    )
  }

  const best = result.bestOffer as ScoredOffer | undefined

  if (!best && !result.isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <GlassCard className="p-5 flex flex-col items-center justify-center text-center gap-2 min-h-[160px]">
          <WifiOff className="w-8 h-8 text-white/15" />
          <p className="text-sm font-medium text-white/40">{result.destinationCity}</p>
          <p className="text-xs text-white/25">No flights found</p>
        </GlassCard>
      </motion.div>
    )
  }

  if (!best) return null

  // stops === -1 means the API didn't report transfers — don't assume nonstop
  const nonstop = best.outbound.stops === 0 && best.inbound.stops === 0
  const stopsKnown = best.outbound.stops >= 0

  // Compute trip dates and night count from the offer's actual departure/return times
  const depDate = new Date(best.outbound.departureTime)
  const retDate = new Date(best.inbound.departureTime)
  const nights = Math.round((retDate.getTime() - depDate.getTime()) / 86400000)
  const dateRange = `${format(depDate, 'MMM d')} – ${format(retDate, 'MMM d')}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 24 }}
      whileHover={{ y: -3 }}
    >
      <GlassCard
        onClick={onClick}
        className="p-5 cursor-pointer group transition-all duration-200 hover:border-white/15 hover:shadow-lg hover:shadow-electric-blue/10"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-electric-cyan transition-colors">
              {result.destinationCity}
            </h3>
            <p className="text-[11px] text-white/40 font-mono">{result.destination}</p>
          </div>
          {best.label && (
            <RecommendationBadge label={best.label} color={best.labelColor} />
          )}
        </div>

        {/* Price */}
        <div className="mb-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold price-text text-white">
              {formatPrice(best.price)}
            </span>
            <span className="text-xs text-white/30">/ person</span>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">
            from <span className="text-white/60 font-mono">{best.origin}</span>
          </p>
        </div>

        {/* Flight details */}
        <div className="space-y-1.5 text-[12px]">
          {/* Actual trip dates */}
          <div className="flex items-center gap-2 text-white/70">
            <Calendar className="w-3.5 h-3.5 text-electric-cyan/60 shrink-0" />
            <span className="font-medium">{dateRange}</span>
            <span className="text-white/30">·</span>
            <span className="text-white/50">{nights > 0 ? `${nights} nights` : '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-white/50">
            <Clock className="w-3.5 h-3.5 text-white/25 shrink-0" />
            <span>{formatDuration(best.outbound.durationMinutes)} out</span>
            <span className="text-white/20">·</span>
            <span>{formatDuration(best.inbound.durationMinutes)} back</span>
          </div>
          <div className="flex items-center gap-2 text-white/60">
            <Plane className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <span>{airlineNameFromCode(best.airline)}</span>
          </div>
          <div className="flex items-center gap-2">
            {stopsKnown && nonstop ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-electric-green shrink-0" />
                <span className="text-electric-green text-[11px] font-medium">Nonstop</span>
              </>
            ) : stopsKnown ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-white/20 shrink-0" />
                <span className="text-white/40">
                  {best.outbound.stops} stop{best.outbound.stops !== 1 ? 's' : ''}
                </span>
              </>
            ) : null}
          </div>
        </div>

        {/* Score bar */}
        {result.offers.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-white/25 uppercase tracking-widest">Score</span>
              <span className="text-[11px] font-mono text-white/40">{best.score}/100</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  best.score >= 90
                    ? 'bg-gradient-to-r from-electric-cyan to-electric-green'
                    : best.score >= 75
                    ? 'bg-gradient-to-r from-electric-blue to-electric-cyan'
                    : 'bg-gradient-to-r from-electric-violet to-electric-blue'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${best.score}%` }}
                transition={{ delay: index * 0.06 + 0.3, duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* View flights CTA */}
        <div className="mt-3 flex items-center gap-1 text-[11px] text-electric-blue/60 group-hover:text-electric-cyan transition-colors">
          <span>View {result.offers.length} flights</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </GlassCard>
    </motion.div>
  )
}
