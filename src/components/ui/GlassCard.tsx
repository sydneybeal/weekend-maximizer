import { cn } from '../../lib/utils.js'
import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  active?: boolean
  onClick?: () => void
}

export function GlassCard({ children, className, hover = false, active = false, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass rounded-2xl',
        hover && 'glass-hover cursor-pointer',
        active && 'glass-active',
        onClick && !hover && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2', className)}>
      {children}
    </p>
  )
}
