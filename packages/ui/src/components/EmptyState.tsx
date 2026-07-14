import type { ReactNode } from 'react'
import { cn } from '@universe/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 p-8 text-center sm:p-12',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-4xl text-zinc-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-zinc-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
