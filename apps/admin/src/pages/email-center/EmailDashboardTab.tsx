import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@universe/ui'
import { getSupabaseClient } from '@universe/database'

const supabase = getSupabaseClient()

type DeliveryStats = {
  delivered: number
  bounced: number
  deferred: number
  complained: number
  total_sent: number
}

type QueueStats = {
  pending: number
  processing: number
  delivered: number
  failed: number
  retrying: number
  dead_letter: number
  scheduled: number
  total: number
}

type QuotaInfo = {
  daily_limit: number
  daily_used: number
  monthly_limit: number
  monthly_used: number
  reserve_buffer: number
}

export function EmailDashboardTab() {
  const [queueStats, setQueueStats]     = useState<QueueStats | null>(null)
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats | null>(null)
  const [quota, setQuota]               = useState<QuotaInfo | null>(null)
  const [recentLogs, setRecentLogs]     = useState<any[]>([])
  const [loading, setLoading]           = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [qs, ds, pq, rl] = await Promise.all([
      supabase.rpc('get_queue_stats'),
      supabase.rpc('get_delivery_stats', { p_days: 30 }),
      supabase.from('provider_quotas').select('*').eq('provider_name', 'resend').single(),
      supabase.from('email_logs')
        .select('event_type, recipient_email, provider_name, created_at')
        .order('created_at', { ascending: false })
        .limit(15),
    ])
    if (qs.data) setQueueStats(qs.data)
    if (ds.data) setDeliveryStats(ds.data)
    if (pq.data) setQuota(pq.data)
    if (rl.data) setRecentLogs(rl.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const deliveryRate = deliveryStats && deliveryStats.total_sent > 0
    ? ((deliveryStats.delivered / deliveryStats.total_sent) * 100).toFixed(1)
    : null

  const quotaPercent = quota
    ? Math.round((quota.daily_used / quota.daily_limit) * 100)
    : 0

  const quotaColor = quotaPercent > 90
    ? 'bg-red-500'
    : quotaPercent > 70
    ? 'bg-amber-500'
    : 'bg-emerald-500'

  const eventBadgeColor: Record<string, string> = {
    delivered: 'bg-emerald-100 text-emerald-700',
    bounced:   'bg-red-100 text-red-700',
    complained:'bg-orange-100 text-orange-700',
    sent:      'bg-blue-100 text-blue-700',
    deferred:  'bg-amber-100 text-amber-700',
    opened:    'bg-purple-100 text-purple-700',
  }

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Delivery Rate (30d)"
          value={loading ? '...' : (deliveryRate ? `${deliveryRate}%` : 'N/A')}
          sub={`${deliveryStats?.delivered ?? 0} delivered`}
          color="text-emerald-600"
        />
        <StatCard label="Pending in Queue"
          value={loading ? '...' : String(queueStats?.pending ?? 0)}
          sub={`${queueStats?.retrying ?? 0} retrying`}
          color="text-blue-600"
        />
        <StatCard label="Dead Letters"
          value={loading ? '...' : String(queueStats?.dead_letter ?? 0)}
          sub="Emails that permanently failed"
          color="text-red-600"
        />
        <StatCard label="Bounces (30d)"
          value={loading ? '...' : String(deliveryStats?.bounced ?? 0)}
          sub={`${deliveryStats?.complained ?? 0} complaints`}
          color="text-amber-600"
        />
      </div>

      {/* Quota Bar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Daily Quota — Resend</CardTitle>
            <span className="text-xs text-zinc-500">
              {quota ? `${quota.daily_used.toLocaleString()} / ${quota.daily_limit.toLocaleString()} sent` : '—'}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-zinc-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${quotaColor}`}
              style={{ width: `${Math.min(quotaPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-400 mt-1.5">
            <span>{quotaPercent}% used</span>
            <span>Reserve buffer: {quota?.reserve_buffer ?? 0}</span>
          </div>
        </CardContent>
      </Card>

      {/* Queue Status Grid */}
      {queueStats && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Queue Status Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
              {([
                ['Pending',    queueStats.pending,    'text-zinc-700'],
                ['Processing', queueStats.processing, 'text-blue-600'],
                ['Delivered',  queueStats.delivered,  'text-emerald-600'],
                ['Retrying',   queueStats.retrying,   'text-amber-600'],
                ['Failed',     queueStats.failed,     'text-red-500'],
                ['Dead Letter',queueStats.dead_letter,'text-red-700'],
              ] as const).map(([label, count, color]) => (
                <div key={label} className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                  <div className={`text-2xl font-bold ${color}`}>{count}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Recent Email Activity</CardTitle>
          <button onClick={load} className="text-xs text-primary-600 hover:underline">Refresh</button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-zinc-400">Loading activity...</p>
          ) : recentLogs.length === 0 ? (
            <div className="py-8 text-center rounded-lg border border-dashed border-zinc-200">
              <p className="text-sm text-zinc-400">No email events yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${eventBadgeColor[log.event_type] ?? 'bg-zinc-100 text-zinc-600'}`}>
                      {log.event_type}
                    </span>
                    <span className="text-sm text-zinc-700 truncate max-w-[200px]">{log.recipient_email}</span>
                  </div>
                  <span className="text-xs text-zinc-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        <p className="text-xs text-zinc-500 mt-1">{sub}</p>
      </CardContent>
    </Card>
  )
}
