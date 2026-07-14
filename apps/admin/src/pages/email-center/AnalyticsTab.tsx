import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@universe/ui'
import { getSupabaseClient } from '@universe/database'

const supabase = getSupabaseClient()



type DailyBucket = { date: string; delivered: number; bounced: number }

export function AnalyticsTab() {
  const [stats,     setStats]    = useState<any>(null)
  const [daily,     setDaily]    = useState<DailyBucket[]>([])
  const [loading,   setLoading]  = useState(true)
  const [range,     setRange]    = useState(30)

  const load = useCallback(async () => {
    setLoading(true)
    const [ds, dl] = await Promise.all([
      supabase.rpc('get_delivery_stats', { p_days: range }),
      // Daily buckets: group email_logs by day for the selected range
      supabase
        .from('email_logs')
        .select('event_type, created_at')
        .in('event_type', ['delivered', 'bounced'])
        .gte('created_at', new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true }),
    ])

    if (ds.data) setStats(ds.data)

    // Bucket daily data
    if (dl.data) {
      const buckets: Record<string, DailyBucket> = {}
      for (const log of dl.data) {
        const date = new Date(log.created_at).toISOString().slice(0, 10)
        if (!buckets[date]) buckets[date] = { date, delivered: 0, bounced: 0 }
        if (log.event_type === 'delivered') buckets[date].delivered++
        if (log.event_type === 'bounced')   buckets[date].bounced++
      }
      setDaily(Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date)))
    }

    setLoading(false)
  }, [range])
  useEffect(() => { load() }, [load])
  const maxVal = Math.max(...daily.map(d => d.delivered + d.bounced), 1)
  const deliveryRate = stats?.total_sent > 0
    ? ((stats.delivered / stats.total_sent) * 100).toFixed(1)
    : '0'
  const bounceRate = stats?.total_sent > 0
    ? ((stats.bounced / stats.total_sent) * 100).toFixed(2)
    : '0'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Delivery Analytics</h2>
          <p className="text-sm text-zinc-500">Email delivery and engagement statistics.</p>
        </div>
        <div className="flex gap-1">
          {[7, 14, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                range === d
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Sent',     value: stats?.total_sent   ?? 0, color: 'text-zinc-900' },
          { label: 'Delivered',      value: stats?.delivered    ?? 0, color: 'text-emerald-600' },
          { label: 'Bounced',        value: stats?.bounced      ?? 0, color: 'text-red-500' },
          { label: 'Complaints',     value: stats?.complained   ?? 0, color: 'text-orange-500' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <div className={`text-2xl font-bold ${color}`}>{loading ? '…' : value.toLocaleString()}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-zinc-500 mb-2 uppercase font-medium">Delivery Rate</div>
            <div className="text-3xl font-bold text-emerald-600">{loading ? '…' : `${deliveryRate}%`}</div>
            <div className="mt-3 w-full bg-zinc-100 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(parseFloat(deliveryRate), 100)}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-zinc-500 mb-2 uppercase font-medium">Bounce Rate</div>
            <div className="text-3xl font-bold text-red-500">{loading ? '…' : `${bounceRate}%`}</div>
            <div className="mt-3 w-full bg-zinc-100 rounded-full h-2">
              <div className="bg-red-400 h-2 rounded-full" style={{ width: `${Math.min(parseFloat(bounceRate) * 10, 100)}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Volume Chart (CSS bar chart) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Daily Volume — Last {range} Days</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-zinc-400">Loading…</p>
          ) : daily.length === 0 ? (
            <div className="py-10 text-center text-sm text-zinc-400 border border-dashed rounded-lg">
              No email activity in this period.
            </div>
          ) : (
            <div className="flex items-end gap-1 h-32 mt-2">
              {daily.map(d => {
                const total = d.delivered + d.bounced
                const pct   = Math.round((total / maxVal) * 100)
                const bouncePct = total > 0 ? Math.round((d.bounced / total) * 100) : 0
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative" title={`${d.date}: ${d.delivered} delivered, ${d.bounced} bounced`}>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-zinc-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      {d.date}<br />✅ {d.delivered} · ❌ {d.bounced}
                    </div>
                    <div
                      className="w-full rounded-t relative overflow-hidden"
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    >
                      <div className="absolute bottom-0 left-0 right-0 bg-emerald-500" style={{ height: `${100 - bouncePct}%` }} />
                      <div className="absolute bottom-0 left-0 right-0" style={{ height: `${bouncePct}%`, top: `${100 - bouncePct}%`, background: '#f87171' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div className="flex gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="inline-block w-3 h-3 rounded bg-emerald-500" /> Delivered
            </span>
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="inline-block w-3 h-3 rounded bg-red-400" /> Bounced
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
