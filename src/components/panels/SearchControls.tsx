import { Search, RefreshCw, AlertCircle } from 'lucide-react'
import { useSearchStore, getSelectedOriginCodes, getSelectedDestCodes } from '../../hooks/useSearchStore.js'
import { cn } from '../../lib/utils.js'

interface SearchControlsProps {
  onSearch: () => void
  isLoading: boolean
  progress: number
  completedSearches: number
  totalSearches: number
  isDirty: boolean
}

export function SearchControls({
  onSearch,
  isLoading,
  progress,
  completedSearches,
  totalSearches,
  isDirty,
}: SearchControlsProps) {
  const { origins, destinations, searchMonths, hasSearched } = useSearchStore()

  const originCodes = getSelectedOriginCodes(origins)
  const destCodes = getSelectedDestCodes(destinations)

  const missingOrigins = originCodes.length === 0
  const missingDests = destCodes.length === 0
  const missingMonths = searchMonths.length === 0
  const disabled = missingOrigins || missingDests || missingMonths || isLoading

  const tripletCount = originCodes.length * destCodes.length * searchMonths.length
  const isRefresh = hasSearched && isDirty

  return (
    <div className="space-y-2.5">
      {/* Search button */}
      <button
        onClick={onSearch}
        disabled={disabled}
        className={cn(
          'w-full rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-semibold text-sm transition-all duration-200',
          disabled
            ? 'glass text-white/25 cursor-not-allowed'
            : isRefresh
            ? 'bg-gradient-to-r from-electric-amber/80 to-electric-cyan text-white shadow-lg hover:scale-[1.02] active:scale-[0.98]'
            : 'bg-gradient-to-r from-electric-blue to-electric-cyan text-white shadow-lg shadow-electric-blue/25 hover:scale-[1.02] active:scale-[0.98] search-btn-glow'
        )}
      >
        {isLoading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : isRefresh ? (
          <RefreshCw className="w-4 h-4" />
        ) : (
          <Search className="w-4 h-4" />
        )}
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.08em', fontSize: '14px' }}>
          {isLoading
            ? 'SEARCHING...'
            : isRefresh
            ? 'REFRESH RESULTS'
            : 'SEARCH FLIGHTS'}
        </span>
      </button>

      {/* Progress bar */}
      {isLoading && totalSearches > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-white/30">
            <span>Checking routes</span>
            <span className="price-text">{completedSearches}/{totalSearches}</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-electric-blue to-electric-cyan rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Validation hints */}
      {!isLoading && (missingOrigins || missingDests || missingMonths) && (
        <div className="flex items-start gap-2 text-[11px] text-white/35">
          <AlertCircle className="w-3.5 h-3.5 text-electric-amber/60 shrink-0 mt-0.5" />
          <span>
            {missingOrigins && missingDests
              ? 'Add origin & destination cities'
              : missingOrigins
              ? 'Add at least one origin city'
              : missingDests
              ? 'Add at least one destination'
              : 'Select at least one month to search'}
          </span>
        </div>
      )}

      {!disabled && !isLoading && (
        <p className="text-[10px] text-white/25 text-center">
          {tripletCount} search{tripletCount !== 1 ? 'es' : ''} ·{' '}
          {originCodes.length} origin{originCodes.length !== 1 ? 's' : ''} ×{' '}
          {destCodes.length} dest × {searchMonths.length} month{searchMonths.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
