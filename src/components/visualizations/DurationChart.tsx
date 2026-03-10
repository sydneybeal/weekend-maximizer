import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { DestinationResult } from '../../types/flights.js'
import { formatDuration } from '../../lib/utils.js'
import { GlassCard, SectionLabel } from '../ui/GlassCard.js'

interface DurationChartProps {
  results: DestinationResult[]
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-4 py-2.5">
      <p className="text-[12px] text-white/60 mb-0.5">{label}</p>
      <p className="text-sm font-bold price-text text-white">{formatDuration(payload[0].value)}</p>
      <p className="text-[11px] text-white/40">outbound</p>
    </div>
  )
}

export function DurationChart({ results }: DurationChartProps) {
  const data = results
    .filter((r) => r.bestOffer)
    .map((r) => ({
      city: r.destinationCity,
      duration: r.bestOffer!.outbound.durationMinutes,
      stops: r.bestOffer!.outbound.stops,
    }))
    .sort((a, b) => a.duration - b.duration)

  if (data.length === 0) return null

  const minDuration = Math.min(...data.map((d) => d.duration))

  return (
    <GlassCard className="p-5">
      <SectionLabel className="mb-4">Outbound Flight Duration</SectionLabel>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <XAxis
            dataKey="city"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${Math.floor(v / 60)}h`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="duration" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.city}
                fill={
                  entry.duration === minDuration
                    ? 'url(#fastGradient)'
                    : entry.stops === 0
                    ? 'rgba(16,185,129,0.35)'
                    : 'rgba(139,92,246,0.35)'
                }
              />
            ))}
          </Bar>
          <defs>
            <linearGradient id="fastGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-electric-green/50" />
          <span className="text-[10px] text-white/30">Nonstop</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-electric-violet/50" />
          <span className="text-[10px] text-white/30">With stops</span>
        </div>
      </div>
    </GlassCard>
  )
}
