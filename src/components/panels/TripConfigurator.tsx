import { format, parseISO } from 'date-fns'
import { Moon } from 'lucide-react'
import { useSearchStore, getAvailableMonths } from '../../hooks/useSearchStore.js'
import { SectionLabel } from '../ui/GlassCard.js'
import { cn } from '../../lib/utils.js'

const NIGHT_OPTIONS = [3, 4, 5] as const

export function TripConfigurator() {
  const { searchMonths, tripNights, toggleMonth, setTripNights } = useSearchStore()
  const available = getAvailableMonths()

  return (
    <div className="space-y-4">
      {/* Trip length */}
      <div>
        <SectionLabel>Trip Length</SectionLabel>
        <div className="flex gap-2 mt-1.5">
          {NIGHT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setTripNights(n)}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                tripNights === n
                  ? 'bg-electric-blue/15 border border-electric-cyan/40 text-electric-cyan shadow-sm shadow-electric-cyan/20'
                  : 'glass text-white/35 hover:text-white/55 hover:border-white/10'
              )}
              style={tripNights === n ? { fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.05em' } : {}}
            >
              {n} nights
            </button>
          ))}
        </div>
        <p className="text-[10px] text-white/25 mt-1.5">
          Results show the best deal found for trips ~{tripNights} nights long
        </p>
      </div>

      {/* Month selector */}
      <div>
        <SectionLabel>Search In</SectionLabel>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {available.map((month) => {
            const selected = searchMonths.includes(month)
            const label = format(parseISO(month + '-01'), 'MMM yyyy')
            return (
              <button
                key={month}
                onClick={() => toggleMonth(month)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all',
                  selected
                    ? 'bg-electric-blue/15 border border-electric-cyan/40 text-electric-cyan shadow-sm shadow-electric-cyan/15'
                    : 'glass text-white/35 hover:text-white/55 hover:border-white/10'
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
        {searchMonths.length === 0 && (
          <p className="text-[11px] text-electric-amber/70 mt-1.5">Select at least one month</p>
        )}
        {searchMonths.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <Moon className="w-3 h-3 text-white/25" />
            <p className="text-[10px] text-white/25">
              Scanning {searchMonths.length} month{searchMonths.length !== 1 ? 's' : ''} for cheapest deals
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
