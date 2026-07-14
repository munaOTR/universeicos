/**
 * DonutChartComponent
 * Recharts PieChart in donut mode with legend, center label, and loading/empty states.
 */
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DonutSlice {
  name: string
  value: number
  color: string
}

interface DonutChartComponentProps {
  data: DonutSlice[]
  centerLabel?: string
  centerValue?: string | number
  height?: number
  loading?: boolean
  emptyMessage?: string
  innerRadius?: number
  outerRadius?: number
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-lg p-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.payload.color }} />
        <span className="font-semibold text-zinc-800">{d.name}</span>
      </div>
      <p className="text-zinc-600 mt-1">
        {d.value.toLocaleString()} <span className="text-zinc-400">({d.payload.percent}%)</span>
      </p>
    </div>
  )
}

const RADIAN = Math.PI / 180
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.06) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function DonutChartComponent({
  data,
  centerLabel,
  centerValue,
  height = 280,
  loading = false,
  emptyMessage = 'No data available',
  innerRadius = 60,
  outerRadius = 100,
}: DonutChartComponentProps) {
  if (loading) {
    return (
      <div style={{ height }} className="w-full flex items-center justify-center">
        <div
          className="rounded-full border-8 border-zinc-100 animate-pulse"
          style={{ width: outerRadius * 2, height: outerRadius * 2 }}
        />
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

  const total = data.reduce((sum, d) => sum + d.value, 0)
  const enriched = data.map(d => ({ ...d, percent: total > 0 ? +((d.value / total) * 100).toFixed(1) : 0 }))

  return (
    <div style={{ height, width: '100%' }} className="relative">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={enriched}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
          >
            {enriched.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center Label */}
      {(centerLabel || centerValue !== undefined) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginBottom: 20 }}>
          {centerValue !== undefined && (
            <span className="text-2xl font-bold text-zinc-900">{typeof centerValue === 'number' ? centerValue.toLocaleString() : centerValue}</span>
          )}
          {centerLabel && <span className="text-xs text-zinc-500 mt-0.5">{centerLabel}</span>}
        </div>
      )}
    </div>
  )
}
