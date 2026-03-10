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
import { formatPrice } from '../../lib/utils.js'
import { GlassCard, SectionLabel } from '../ui/GlassCard.js'

interface PriceComparisonChartProps {
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
      <p className="text-sm font-bold price-text text-white">{formatPrice(payload[0].value)}</p>
    </div>
  )
}

export function PriceComparisonChart({ results }: PriceComparisonChartProps) {
  const data = results
    .filter((r) => r.bestOffer)
    .map((r) => ({
      city: r.destinationCity,
      price: r.bestOffer!.price,
      score: (r.bestOffer as { score?: number })?.score ?? 0,
    }))
    .sort((a, b) => a.price - b.price)

  if (data.length === 0) return null

  const minPrice = Math.min(...data.map((d) => d.price))

  return (
    <GlassCard className="p-5">
      <SectionLabel className="mb-4">Price Comparison</SectionLabel>
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
            tickFormatter={(v) => `$${Math.round(v / 100) * 100}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="price" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.city}
                fill={
                  entry.price === minPrice
                    ? 'url(#bestGradient)'
                    : 'rgba(59,130,246,0.35)'
                }
              />
            ))}
          </Bar>
          <defs>
            <linearGradient id="bestGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}
