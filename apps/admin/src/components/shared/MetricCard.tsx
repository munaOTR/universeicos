/**
 * MetricCard
 * Standardized KPI card with title, value, delta, subtext, and loading skeleton.
 */
import { ElementType } from 'react'

interface MetricCardProps {
  title: string
  value: string | number | null
  subtext?: string
  delta?: string
  deltaPositive?: boolean | null   // true=green, false=red, null=neutral
  icon?: ElementType
  iconColor?: string
  loading?: boolean
  className?: string
}

export function MetricCard({
  title,
  value,
  subtext,
  delta,
  deltaPositive = null,
  icon: Icon,
  iconColor = 'text-primary-600',
  loading = false,
  className = '',
}: MetricCardProps) {
  const deltaColor =
    deltaPositive === true ? 'text-emerald-600 bg-emerald-50' :
    deltaPositive === false ? 'text-red-600 bg-red-50' :
    'text-zinc-500 bg-zinc-100'

  if (loading) {
    return (
      <div className={`bg-white border border-zinc-200 rounded-xl p-4 shadow-sm space-y-2 animate-pulse ${className}`}>
        <div className="h-3 w-24 bg-zinc-100 rounded" />
        <div className="h-8 w-20 bg-zinc-100 rounded" />
        <div className="h-3 w-32 bg-zinc-100 rounded" />
      </div>
    )
  }

  return (
    <div className={`bg-white border border-zinc-200 rounded-xl p-4 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider leading-tight">{title}</p>
        {Icon && (
          <div className={`p-1.5 rounded-lg bg-zinc-50 ${iconColor}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-zinc-900 mt-1.5">
        {value !== null && value !== undefined ? (typeof value === 'number' ? value.toLocaleString() : value) : '—'}
      </p>
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        {delta && (
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${deltaColor}`}>
            {delta}
          </span>
        )}
        {subtext && (
          <span className="text-xs text-zinc-400">{subtext}</span>
        )}
      </div>
    </div>
  )
}

/**
 * MetricCardGrid — convenience wrapper for a responsive grid of MetricCards
 */
interface MetricCardGridProps {
  cards: Omit<MetricCardProps, 'className'>[]
  columns?: 2 | 3 | 4 | 5
  loading?: boolean
}

export function MetricCardGrid({ cards, columns = 4, loading = false }: MetricCardGridProps) {
  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 lg:grid-cols-5',
  }[columns]

  return (
    <div className={`grid gap-4 ${colClass}`}>
      {cards.map((card, i) => (
        <MetricCard key={i} {...card} loading={loading} />
      ))}
    </div>
  )
}
