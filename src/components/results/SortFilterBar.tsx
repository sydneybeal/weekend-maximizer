import { SlidersHorizontal, Ban } from 'lucide-react'
import { useResultsStore } from '../../hooks/useResultsStore.js'
import type { SortKey, FilterKey } from '../../types/flights.js'
import { cn } from '../../lib/utils.js'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'score', label: 'Best Match' },
  { key: 'price', label: 'Price' },
  { key: 'duration', label: 'Duration' },
  { key: 'stops', label: 'Stops' },
]

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All Flights' },
  { key: 'nonstop', label: 'Nonstop Only' },
]

export function SortFilterBar({ resultCount, nonstopCount }: { resultCount: number; nonstopCount: number }) {
  const { sortKey, filterKey, excludeBudget, setSortKey, setFilterKey, toggleExcludeBudget } = useResultsStore()

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-white/30" />
        <span className="text-sm text-white/40">
          {resultCount} destination{resultCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Budget airline toggle */}
        <button
          onClick={toggleExcludeBudget}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all',
            excludeBudget
              ? 'bg-electric-red/20 text-electric-red border border-electric-red/30'
              : 'text-white/40 hover:text-white/60'
          )}
          title="Excludes Spirit (NK), Frontier (F9), and Allegiant (G4)"
        >
          <Ban className="w-3 h-3" />
          No Spirit / Frontier
        </button>

        <div className="w-px h-4 bg-white/10" />

        {/* Filter pills */}
        <div className="flex gap-1">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilterKey(opt.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all',
                filterKey === opt.key
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/60'
              )}
            >
              {opt.label}
              <span className="ml-1.5 text-white/25">
                ({opt.key === 'nonstop' ? nonstopCount : resultCount})
              </span>
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-white/10" />

        {/* Sort pills */}
        <div className="flex gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortKey(opt.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all',
                sortKey === opt.key
                  ? 'bg-electric-blue/20 text-electric-cyan border border-electric-blue/25'
                  : 'text-white/40 hover:text-white/60'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
