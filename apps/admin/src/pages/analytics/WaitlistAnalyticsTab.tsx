/**
 * WaitlistAnalyticsTab — Waitlist growth, top universities, etc.
 */
import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@universe/database'
import { Card, CardHeader, CardTitle, CardContent } from '@universe/ui'
import { MetricCardGrid } from '../../components/shared/MetricCard'
import { TimeSeriesChart } from '../../components/charts/TimeSeriesChart'
import { fetchWaitlistStats, fetchWaitlistTimeseries, DateRange } from '../../lib/analytics'
import { UserAdd01Icon, AnalyticsUpIcon, Time02Icon } from 'hugeicons-react'

const RANGES: { label: string; value: DateRange }[] = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
]

export function WaitlistAnalyticsTab() {
  const supabase = getSupabaseClient()
  const [range, setRange] = useState<DateRange>('30d')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, today: 0, week: 0 })
  const [chartData, setChartData] = useState<{ date: string; count: number }[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [s, c] = await Promise.all([
        fetchWaitlistStats(supabase),
        fetchWaitlistTimeseries(supabase, range === '7d' ? 7 : range === '30d' ? 30 : 90),
      ])
      setStats(s)
      setChartData(c)
      setLoading(false)
    }
    load()
  }, [range])

  return (
    <div className="space-y-6">
      <MetricCardGrid
        loading={loading}
        columns={3}
        cards={[
          { title: 'Total Waitlist', value: stats.total, icon: UserAdd01Icon, iconColor: 'text-primary-600' },
          { title: 'Signups Today', value: stats.today, icon: Time02Icon, iconColor: 'text-blue-600' },
          { title: 'Signups This Week', value: stats.week, icon: AnalyticsUpIcon, iconColor: 'text-indigo-600' },
        ]}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Waitlist Growth</CardTitle>
          <div className="flex gap-1">
            {RANGES.map(r => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                  range === r.value ? 'bg-primary-600 text-white' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <TimeSeriesChart
            data={chartData.map(d => ({ day: d.date.slice(5), signups: d.count }))}
            xKey="day"
            yKey="signups"
            height={320}
            color="#8b5cf6"
          />
        </CardContent>
      </Card>
    </div>
  )
}
