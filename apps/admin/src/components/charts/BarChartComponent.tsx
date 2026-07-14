/**
 * BarChartComponent
 * Recharts BarChart wrapper with consistent Universe styling.
 * Supports single and multi-series, loading/empty states, and tooltips.
 */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

interface BarSeries {
  key: string
  label: string
  color: string
}

interface BarChartComponentProps {
  data: any[]
  xKey: string
  series: BarSeries[]
  height?: number
  horizontal?: boolean
  loading?: boolean
  emptyMessage?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-zinc-800 mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }} className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-bold ml-1">{entry.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  )
}

export function BarChartComponent({
  data,
  xKey,
  series,
  height = 280,
  loading = false,
  emptyMessage = 'No data available',
}: BarChartComponentProps) {
  if (loading) {
    return (
      <div style={{ height }} className="w-full flex items-center justify-center">
        <div className="space-y-2 w-full px-4">
          {[80, 60, 75, 50, 90, 65, 70].map((h, i) => (
            <div key={i} className="flex items-end gap-2 animate-pulse">
              <div className="w-16 text-xs text-zinc-300 shrink-0">—</div>
              <div className="h-4 bg-zinc-100 rounded" style={{ width: `${h}%` }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="w-full flex items-center justify-center bg-zinc-50 border border-dashed border-zinc-200 rounded-lg text-sm text-zinc-400">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey={xKey}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 12 }}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f4f4f5' }} />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: '12px' }} />}
          {series.map(s => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[0, 4, 4, 0]} maxBarSize={28} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * VerticalBarChart — vertical orientation variant
 */
export function VerticalBarChartComponent({
  data,
  xKey,
  series,
  height = 280,
  loading = false,
  emptyMessage = 'No data available',
}: BarChartComponentProps) {
  if (loading) {
    return (
      <div style={{ height }} className="w-full animate-pulse flex items-end gap-2 px-4 pb-4">
        {[60, 80, 50, 90, 70, 85, 65].map((h, i) => (
          <div key={i} className="flex-1 bg-zinc-100 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="w-full flex items-center justify-center bg-zinc-50 border border-dashed border-zinc-200 rounded-lg text-sm text-zinc-400">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
          <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} dy={8} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f4f4f5' }} />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: '12px' }} />}
          {series.map(s => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={40} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
