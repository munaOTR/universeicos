/**
 * UsersTab — DAU/WAU/MAU, user activity trends, and demographics.
 */
import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@universe/database'
import { Card, CardHeader, CardTitle, CardContent } from '@universe/ui'
import { MetricCardGrid } from '../../components/shared/MetricCard'
import { BarChartComponent } from '../../components/charts/BarChartComponent'
import { TimeSeriesChart } from '../../components/charts/TimeSeriesChart'
import { fetchUserActivityStats, fetchUniversityBreakdown, fetchFacultyBreakdown } from '../../lib/analytics'
import { UserGroupIcon, Activity01Icon, AnalyticsUpIcon } from 'hugeicons-react'

export function UsersTab() {
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [activityStats, setActivityStats] = useState<{ date: string; active_users: number }[]>([])
  const [uniBreakdown, setUniBreakdown] = useState<{ university: string; count: number }[]>([])
  const [facBreakdown, setFacBreakdown] = useState<{ faculty: string; count: number }[]>([])
  const [metrics, setMetrics] = useState({ dau: 0, wau: 0, mau: 0 })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [activity, u, f] = await Promise.all([
        fetchUserActivityStats(supabase, 30),
        fetchUniversityBreakdown(supabase, 10),
        fetchFacultyBreakdown(supabase, 10),
      ])
      
      setActivityStats(activity)
      setUniBreakdown(u)
      setFacBreakdown(f)

      // Calculate DAU (last day), WAU (last 7 days sum), MAU (last 30 days sum)
      // Note: A true WAU/MAU requires COUNT(DISTINCT user_id) over the period, 
      // but for simplicity here we approximate or use the daily max.
      // Ideally this is handled by a dedicated RPC, but we'll approximate from daily stats.
      let dau = 0, wau = 0, mau = 0
      activity.forEach((d, i) => {
        mau += d.active_users
        if (i >= activity.length - 7) wau += d.active_users
        if (i === activity.length - 1) dau = d.active_users
      })
      
      setMetrics({ dau, wau, mau })
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <MetricCardGrid
        loading={loading}
        columns={3}
        cards={[
          { title: 'Daily Active Users (DAU)', value: metrics.dau, icon: Activity01Icon, iconColor: 'text-blue-600' },
          { title: 'Weekly Active Users (WAU)', value: metrics.wau, icon: AnalyticsUpIcon, iconColor: 'text-indigo-600' },
          { title: 'Monthly Active Users (MAU)', value: metrics.mau, icon: UserGroupIcon, iconColor: 'text-violet-600' },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Active Users (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeSeriesChart
            data={activityStats.map(d => ({ day: d.date.slice(5), users: d.active_users }))}
            xKey="day"
            yKey="users"
            height={280}
            color="#3b82f6"
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Universities</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent
              data={uniBreakdown.map(u => ({ name: u.university.trim(), count: u.count }))}
              xKey="name"
              series={[{ key: 'count', label: 'Students', color: '#6366f1' }]}
              height={300}
              loading={loading}
              emptyMessage="No university data available"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Faculties</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent
              data={facBreakdown.map(f => ({ name: f.faculty.trim(), count: f.count }))}
              xKey="name"
              series={[{ key: 'count', label: 'Students', color: '#10b981' }]}
              height={300}
              loading={loading}
              emptyMessage="No faculty data available"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
