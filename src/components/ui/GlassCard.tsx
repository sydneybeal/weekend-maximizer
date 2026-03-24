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
        'glass-card rounded-2xl',
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
    <p className={cn('section-label', className)}>
      {children}
    </p>
  )
}
