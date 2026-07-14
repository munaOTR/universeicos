import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@universe/database'
import { Card, CardHeader, CardTitle, CardContent } from '@universe/ui'
import { VerticalBarChartComponent } from '../../components/charts/BarChartComponent'
import { fetchQueueSummary } from '../../lib/analytics'

const supabase = getSupabaseClient()

export function QueueMonitorTab() {
  const [loading, setLoading] = useState(true)
  const [queueSummary, setQueueSummary] = useState<Record<string, number>>({})

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const q = await fetchQueueSummary(supabase)
      setQueueSummary(q)
      setLoading(false)
    }
    load()
    // Poll every 10s
    const interval = setInterval(async () => {
      const q = await fetchQueueSummary(supabase)
      setQueueSummary(q)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const chartData = Object.entries(queueSummary).map(([status, count]) => ({ status, count }))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Realtime Queue Status</CardTitle>
          <span className="text-xs text-zinc-500 animate-pulse flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 block" /> Live
          </span>
        </CardHeader>
        <CardContent>
          <VerticalBarChartComponent
            data={chartData}
            xKey="status"
            series={[{ key: 'count', label: 'Items', color: '#6366f1' }]}
            height={350}
            loading={loading}
            emptyMessage="Queue is empty"
          />
        </CardContent>
      </Card>
    </div>
  )
}
