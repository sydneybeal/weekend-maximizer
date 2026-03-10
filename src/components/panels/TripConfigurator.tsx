import { useState } from 'react'
import { Calendar, ChevronDown, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { getUpcomingLongWeekends, longWeekendDays } from '../../lib/weekends.js'
import { toYMD } from '../../lib/utils.js'
import { useSearchStore } from '../../hooks/useSearchStore.js'
import { SectionLabel } from '../ui/GlassCard.js'
import { cn } from '../../lib/utils.js'

type DateRange = { from?: Date; to?: Date }

export function TripConfigurator() {
  const { departureDate, returnDate, setDates } = useSearchStore()
  const [calOpen, setCalOpen] = useState(false)

  const weekends = getUpcomingLongWeekends(new Date(), 6)
  const highlightDays = longWeekendDays(weekends)

  // Only parse returnDate if it's a full YYYY-MM-DD string (not empty)
  const from = departureDate.length === 10 ? new Date(departureDate + 'T00:00:00') : undefined
  const to   = returnDate.length === 10    ? new Date(returnDate + 'T00:00:00')    : undefined

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range) {
      // User cleared the selection
      setDates('', '')
      return
    }
    if (range.from && range.to) {
      // Complete range — commit and close calendar
      setDates(toYMD(range.from), toYMD(range.to))
      setCalOpen(false)
    } else if (range.from) {
      // First click only — commit departure, clear return so the next click
      // sets the return date (not extends an old range)
      setDates(toYMD(range.from), '')
    }
  }

  const handleWeekendClick = (wk: { start: Date; end: Date }) => {
    setDates(toYMD(wk.start), toYMD(wk.end))
    setCalOpen(false)
  }

  const nights =
    from && to && to > from
      ? Math.round((to.getTime() - from.getTime()) / 86400000)
      : 0

  return (
    <div className="space-y-3">
      <SectionLabel>Trip Dates</SectionLabel>

      {/* Date display + toggle */}
      <button
        onClick={() => setCalOpen((p) => !p)}
        className="w-full glass rounded-xl px-3 py-2.5 flex items-center gap-3 hover:border-white/15 transition-all"
      >
        <Calendar className="w-4 h-4 text-electric-cyan shrink-0" />
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-white">
            {from ? format(from, 'MMM d') : 'Depart'}{' '}
            <span className="text-white/40">→</span>{' '}
            {to ? format(to, 'MMM d, yyyy') : <span className="text-white/40">Return</span>}
          </p>
          {nights > 0 && (
            <p className="text-[11px] text-white/40">{nights} night{nights !== 1 ? 's' : ''}</p>
          )}
          {from && !to && (
            <p className="text-[11px] text-electric-amber/70">Pick a return date</p>
          )}
        </div>
        <ChevronDown
          className={cn('w-4 h-4 text-white/30 transition-transform', calOpen && 'rotate-180')}
        />
      </button>

      {/* Calendar */}
      {calOpen && (
        <div className="glass rounded-xl p-3 overflow-hidden">
          <DayPicker
            mode="range"
            selected={{ from, to }}
            onSelect={(range) => handleRangeSelect(range as DateRange | undefined)}
            disabled={{ before: new Date() }}
            modifiers={{ longWeekend: highlightDays }}
            modifiersClassNames={{ longWeekend: 'rdp-long-weekend' }}
            className="!m-0"
          />
          <style>{`
            .rdp-root {
              --rdp-accent-color: #3b82f6;
              --rdp-background-color: rgba(59,130,246,0.15);
              color: rgba(255,255,255,0.85);
              font-size: 13px;
            }
            .rdp-day_button { color: rgba(255,255,255,0.7); }
            .rdp-selected .rdp-day_button { background: rgba(59,130,246,0.8); color: white; }
            .rdp-range_middle .rdp-day_button { background: rgba(59,130,246,0.2); color: rgba(255,255,255,0.9); }
            .rdp-long-weekend .rdp-day_button { background: rgba(6,182,212,0.15); color: #22d3ee; }
            .rdp-disabled .rdp-day_button { color: rgba(255,255,255,0.15); }
            .rdp-month_caption { color: white; }
            .rdp-weekday { color: rgba(255,255,255,0.3); }
            .rdp-nav button { color: rgba(255,255,255,0.5); }
          `}</style>
        </div>
      )}

      {/* Long weekend shortcuts */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-electric-amber" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Upcoming Long Weekends
          </p>
        </div>
        <div className="space-y-1">
          {weekends.slice(0, 5).map((wk, i) => (
            <button
              key={i}
              onClick={() => handleWeekendClick(wk)}
              className={cn(
                'w-full glass rounded-lg px-3 py-2 flex items-center justify-between transition-all hover:border-white/15',
                from && toYMD(wk.start) === departureDate && to && toYMD(wk.end) === returnDate && 'glass-active'
              )}
            >
              <span className="text-[12px] text-white/70">{wk.label}</span>
              <span
                className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                  wk.type === '4-day' || wk.type === '5-day'
                    ? 'bg-electric-cyan/15 text-electric-cyan'
                    : 'bg-white/8 text-white/40'
                )}
              >
                {wk.type}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
