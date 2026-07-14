/**
 * OverviewTab — Business KPIs, signup growth, conversion funnel,
 * university & faculty distribution.
 */
import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@universe/database'
import { Card, CardHeader, CardTitle, CardContent } from '@universe/ui'
import { MetricCardGrid } from '../../components/shared/MetricCard'
import { TimeSeriesChart } from '../../components/charts/TimeSeriesChart'
import { DonutChartComponent } from '../../components/charts/DonutChartComponent'
import {
  fetchDashboardMetrics, fetchSignupTimeseries, fetchUniversityBreakdown, fetchFacultyBreakdown,
  DateRange,
} from '../../lib/analytics'
import {
  UserGroupIcon, LinkSquare01Icon, Mail01Icon, ChartIncreaseIcon,
} from 'hugeicons-react'

const RANGES: { label: string; value: DateRange }[] = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: '1 year', value: '1y' },
]

const FACULTY_COLORS = ['#6366f1', '#3b82f6', '#0ea5e9', '#14b8a6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export function OverviewTab() {
  const supabase = getSupabaseClient()
  const [range, setRange] = useState<DateRange>('30d')
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<any>(null)
  const [signupChart, setSignupChart] = useState<{ date: string; count: number }[]>([])
  const [uniBreakdown, setUniBreakdown] = useState<{ university: string; count: number }[]>([])
  const [facBreakdown, setFacBreakdown] = useState<{ faculty: string; count: number }[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [m, s, u, f] = await Promise.all([
        fetchDashboardMetrics(supabase),
        fetchSignupTimeseries(supabase, range),
        fetchUniversityBreakdown(supabase, 10),
        fetchFacultyBreakdown(supabase, 8),
      ])
      setMetrics(m)
      setSignupChart(s)
      setUniBreakdown(u)
      setFacBreakdown(f)
      setLoading(false)
    }
    load()
  }, [range])

  const conversionRate = metrics
    ? Math.round(((metrics.completed_referrals || 0) / Math.max(metrics.total_referrals || 1, 1)) * 100)
    : 0

  const donutData = facBreakdown.map((f, i) => ({
    name: f.faculty,
    value: f.count,
    color: FACULTY_COLORS[i % FACULTY_COLORS.length],
  }))

  const funnelSteps = metrics ? [
    { label: 'Waitlist', value: metrics.total_waitlist || 0, color: 'bg-zinc-300' },
    { label: 'Registered', value: metrics.total_users || 0, color: 'bg-primary-400' },
    { label: 'Referred', value: metrics.total_referrals || 0, color: 'bg-primary-500' },
    { label: 'Converted', value: metrics.completed_referrals || 0, color: 'bg-primary-700' },
  ] : []

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <MetricCardGrid
        loading={loading}
        columns={4}
        cards={[
          { title: 'Total Students', value: metrics?.total_users, subtext: `+${metrics?.new_users_7d || 0} this week`, icon: UserGroupIcon },
          { title: 'Waitlist Size', value: metrics?.total_waitlist, subtext: 'Pre-registered users' },
          { title: 'Total Referrals', value: metrics?.total_referrals, subtext: `${conversionRate}% conversion rate`, icon: LinkSquare01Icon },
          { title: 'Emails Delivered (24h)', value: metrics?.emails_delivered_24h, subtext: `${metrics?.emails_failed_24h || 0} failed`, icon: Mail01Icon },
        ]}
      />

      {/* Signup Growth Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Signup Growth</CardTitle>
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
            data={signupChart.map(d => ({ day: d.date.slice(5), signups: d.count }))}
            xKey="day"
            yKey="signups"
            height={240}
            color="#6366f1"
          />
        </CardContent>
      </Card>

      {/* University + Faculty */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* University Breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">University Distribution</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-1">
                  <div className="h-3 bg-zinc-100 rounded w-3/4" />
                  <div className="h-1.5 bg-zinc-100 rounded" />
                </div>
              ))
            ) : uniBreakdown.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-6">No university data yet.</p>
            ) : uniBreakdown.map(({ university, count }) => {
              const pct = Math.round((count / (uniBreakdown[0]?.count || 1)) * 100)
              return (
                <div key={university} className="space-y-1">
                  <div className="flex justify-between text-xs text-zinc-600">
                    <span className="truncate max-w-[220px]">{university.trim()}</span>
                    <span className="font-semibold shrink-0">{count}</span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-1.5">
                    <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Faculty Donut */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Faculty Distribution</CardTitle></CardHeader>
          <CardContent>
            <DonutChartComponent
              data={donutData}
              centerLabel="Students"
              centerValue={metrics?.total_users}
              height={280}
              loading={loading}
              innerRadius={50}
              outerRadius={90}
            />
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><ChartIncreaseIcon size={16} /> Conversion Funnel</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-32 animate-pulse bg-zinc-50 rounded" />
          ) : (
            <div className="flex items-end gap-3 h-32">
              {funnelSteps.map(stage => {
                const maxVal = funnelSteps[0]?.value || 1
                const h = Math.max(12, Math.round((stage.value / maxVal) * 100))
                return (
                  <div key={stage.label} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end justify-center" style={{ height: '96px' }}>
                      <div className={`w-full ${stage.color} rounded-t-lg transition-all`} style={{ height: `${h}%` }} />
                    </div>
                    <p className="text-xs font-medium text-zinc-600 text-center">{stage.label}</p>
                    <p className="text-sm font-bold text-zinc-900">{stage.value.toLocaleString()}</p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
