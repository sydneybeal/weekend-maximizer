import { motion } from 'framer-motion'
import { Plane } from 'lucide-react'
import type { DestinationResult } from '../../types/flights.js'
import type { ScoredOffer } from '../../lib/scoring.js'
import { DestinationCard } from './DestinationCard.js'
import { SortFilterBar } from './SortFilterBar.js'
import { useResultsStore, BUDGET_AIRLINE_CODES } from '../../hooks/useResultsStore.js'

interface ResultsGridProps {
  results: DestinationResult[]
  isLoading: boolean
}

export function ResultsGrid({ results, isLoading }: ResultsGridProps) {
  const { sortKey, filterKey, excludeBudget, openDrawer } = useResultsStore()

  // Apply filters — budget filter strips budget carriers from each destination's offers
  // then re-picks the best offer; nonstop filter hides destinations with no nonstop best
  const filtered = results
    .map((r) => {
      if (!excludeBudget) return r
      const nonBudgetOffers = r.offers.filter((o) => !BUDGET_AIRLINE_CODES.has(o.airline))
      const bestOffer = nonBudgetOffers[0] ?? undefined
      return { ...r, offers: nonBudgetOffers, bestOffer }
    })
    .filter((r) => {
      if (filterKey === 'nonstop') {
        return r.bestOffer?.outbound.stops === 0 && r.bestOffer?.inbound.stops === 0
      }
      // Hide destinations where budget filter removed all offers
      if (excludeBudget && r.offers.length === 0 && !r.isLoading) return false
      return true
    })

  // Apply sort
  const sorted = [...filtered].sort((a, b) => {
    const aOffer = a.bestOffer as ScoredOffer | undefined
    const bOffer = b.bestOffer as ScoredOffer | undefined

    // Push loading/empty to end
    if (!aOffer && !bOffer) return 0
    if (!aOffer) return 1
    if (!bOffer) return -1

    switch (sortKey) {
      case 'price':
        return aOffer.price - bOffer.price
      case 'duration':
        return (
          aOffer.outbound.durationMinutes + aOffer.inbound.durationMinutes -
          (bOffer.outbound.durationMinutes + bOffer.inbound.durationMinutes)
        )
      case 'stops':
        return aOffer.outbound.stops - bOffer.outbound.stops
      case 'score':
      default:
        return (bOffer.score ?? 0) - (aOffer.score ?? 0)
    }
  })

  if (!isLoading && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center">
          <Plane className="w-8 h-8 text-white/15" />
        </div>
        <div>
          <p className="text-white/40 font-medium">No results yet</p>
          <p className="text-sm text-white/25 mt-1">
            Add your cities and dates, then hit search
          </p>
        </div>
      </div>
    )
  }

  const completedResults = sorted.filter((r) => !r.isLoading)
  const loadingResults = sorted.filter((r) => r.isLoading)

  return (
    <div className="space-y-4">
      {sorted.length > 0 && (
        <SortFilterBar resultCount={completedResults.length} />
      )}

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
        layout
      >
        {sorted.map((result, i) => (
          <DestinationCard
            key={result.destination}
            result={result}
            index={i}
            onClick={() =>
              openDrawer(result.destination, result.offers)
            }
          />
        ))}
      </motion.div>
    </div>
  )
}
