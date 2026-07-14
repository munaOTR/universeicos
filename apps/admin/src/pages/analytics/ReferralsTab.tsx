/**
 * ReferralsTab (Analytics) — Referral growth, top referrers, and conversion metrics.
 */
import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@universe/database'
import { Card, CardHeader, CardTitle, CardContent } from '@universe/ui'
import { MetricCardGrid } from '../../components/shared/MetricCard'
import { TimeSeriesChart } from '../../components/charts/TimeSeriesChart'
import { fetchReferralStats, fetchTopReferrers, fetchReferralTimeseries, DateRange } from '../../lib/analytics'
import { LinkSquare01Icon, CheckmarkBadge01Icon, SquareArrowLeft01Icon, AnalyticsUpIcon } from 'hugeicons-react'

const RANGES: { label: string; value: DateRange }[] = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: '1 year', value: '1y' },
]

export function ReferralsTab() {
  const supabase = getSupabaseClient()
  const [range, setRange] = useState<DateRange>('30d')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({ total: 0, completed: 0, pending: 0, conversionRate: 0 })
  const [topReferrers, setTopReferrers] = useState<any[]>([])
  const [chartData, setChartData] = useState<{ date: string; count: number }[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [s, t, c] = await Promise.all([
        fetchReferralStats(supabase),
        fetchTopReferrers(supabase, 10),
        fetchReferralTimeseries(supabase, range),
      ])
      setStats(s)
      setTopReferrers(t)
      setChartData(c)
      setLoading(false)
    }
    load()
  }, [range])

  return (
    <div className="space-y-6">
      <MetricCardGrid
        loading={loading}
        columns={4}
        cards={[
          { title: 'Total Referrals', value: stats.total, icon: LinkSquare01Icon, iconColor: 'text-primary-600' },
          { title: 'Completed', value: stats.completed, icon: CheckmarkBadge01Icon, iconColor: 'text-emerald-600' },
          { title: 'Pending', value: stats.pending, icon: SquareArrowLeft01Icon, iconColor: 'text-amber-600' },
          { title: 'Conversion Rate', value: `${stats.conversionRate}%`, icon: AnalyticsUpIcon, iconColor: 'text-blue-600' },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Referral Activity</CardTitle>
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
              data={chartData.map(d => ({ day: d.date.slice(5), referrals: d.count }))}
              xKey="day"
              yKey="referrals"
              height={320}
              color="#10b981"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-zinc-100 rounded w-24" />
                      <div className="h-2 bg-zinc-100 rounded w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topReferrers.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-6">No referral data yet.</p>
            ) : (
              <div className="space-y-4">
                {topReferrers.map((r, i) => (
                  <div key={r.user_id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-zinc-400 w-4 shrink-0">#{i + 1}</span>
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs uppercase shrink-0">
                      {r.full_name?.charAt(0) || r.email?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{r.full_name || r.email}</p>
                      <p className="text-xs text-zinc-500">{r.referrals} referrals · {r.points} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
