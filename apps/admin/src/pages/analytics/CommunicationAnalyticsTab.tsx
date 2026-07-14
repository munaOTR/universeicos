/**
 * CommunicationAnalyticsTab — Delivery stats, queue metrics, and provider quota.
 */
import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@universe/database'
import { Card, CardHeader, CardTitle, CardContent } from '@universe/ui'
import { MetricCardGrid } from '../../components/shared/MetricCard'
import { TimeSeriesChart } from '../../components/charts/TimeSeriesChart'
import { BarChartComponent, VerticalBarChartComponent } from '../../components/charts/BarChartComponent'
import { fetchCommsDeliveryStats, fetchQueueSummary, fetchTemplateUsage } from '../../lib/analytics'
import { Mail01Icon, CheckmarkBadge01Icon, Alert01Icon, Time02Icon } from 'hugeicons-react'

const supabase = getSupabaseClient()

export function CommunicationAnalyticsTab() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{ date: string; sent: number; delivered: number; failed: number }[]>([])
  const [queueSummary, setQueueSummary] = useState<Record<string, number>>({})
  const [templateUsage, setTemplateUsage] = useState<{ name: string; count: number }[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [s, q, t] = await Promise.all([
        fetchCommsDeliveryStats(supabase, 30),
        fetchQueueSummary(supabase),
        fetchTemplateUsage(supabase),
      ])
      setStats(s)
      setQueueSummary(q)
      setTemplateUsage(t)
      setLoading(false)
    }
    load()
  }, [])

  const totalDelivered = stats.reduce((sum, d) => sum + d.delivered, 0)
  const totalFailed = stats.reduce((sum, d) => sum + d.failed, 0)
  const totalSent = stats.reduce((sum, d) => sum + d.sent, 0)
  const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0

  return (
    <div className="space-y-6">
      <MetricCardGrid
        loading={loading}
        columns={4}
        cards={[
          { title: 'Total Delivered (30d)', value: totalDelivered, icon: CheckmarkBadge01Icon, iconColor: 'text-emerald-600' },
          { title: 'Delivery Rate', value: `${deliveryRate}%`, icon: Mail01Icon, iconColor: 'text-blue-600' },
          { title: 'Failed (30d)', value: totalFailed, icon: Alert01Icon, iconColor: 'text-red-600' },
          { title: 'Queue Pending', value: queueSummary['pending'] || 0, icon: Time02Icon, iconColor: 'text-amber-600' },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Delivery Performance (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeSeriesChart
            data={stats.map(d => ({ day: d.date.slice(5), delivered: d.delivered }))}
            xKey="day"
            yKey="delivered"
            height={280}
            color="#10b981"
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Template Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent
              data={templateUsage}
              xKey="name"
              series={[{ key: 'count', label: 'Sends', color: '#6366f1' }]}
              height={300}
              loading={loading}
              emptyMessage="No template usage data"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Queue Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <VerticalBarChartComponent
              data={Object.entries(queueSummary).map(([status, count]) => ({ status, count }))}
              xKey="status"
              series={[{ key: 'count', label: 'Emails', color: '#f59e0b' }]}
              height={300}
              loading={loading}
              emptyMessage="Queue is empty"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
