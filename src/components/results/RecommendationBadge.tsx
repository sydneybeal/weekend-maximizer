import { cn } from '../../lib/utils.js'

interface RecommendationBadgeProps {
  label: string
  color: string
}

export function RecommendationBadge({ label, color }: RecommendationBadgeProps) {
  if (!label) return null

  const colorMap: Record<string, string> = {
    cyan: 'bg-electric-cyan/15 text-electric-cyan border-electric-cyan/25',
    blue: 'bg-electric-blue/15 text-electric-blue border-electric-blue/25',
    violet: 'bg-electric-violet/15 text-electric-violet border-electric-violet/25',
    green: 'bg-electric-green/15 text-electric-green border-electric-green/25',
    amber: 'bg-electric-amber/15 text-electric-amber border-electric-amber/25',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border tracking-wide',
        colorMap[color] ?? colorMap.blue
      )}
    >
      {label}
    </span>
  )
}
