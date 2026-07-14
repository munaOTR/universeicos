import { useState, useEffect, useMemo } from 'react'
import { getSupabaseClient } from '@universe/database'
import { PageHeader } from '../components/shared/PageHeader'
import { DataTable } from '../components/tables/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@universe/ui'
import { Download01Icon } from 'hugeicons-react'
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart'
import { Card, CardHeader, CardTitle, CardContent } from '@universe/ui'

interface Referral {
  id: string
  referrer_id: string
  referred_email: string
  code_used: string
  status: string
  created_at: string
  profiles?: { full_name: string | null; email: string }
}

interface TopReferrer {
  referral_code: string
  full_name: string | null
  email: string
  count: number
  points: number
}

export function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([])
  const [chartData, setChartData] = useState<{ day: string; referrals: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, conversionRate: 0 })

  useEffect(() => {
    let channel: any;

    const fetchData = async () => {
      setLoading(true)
      const supabase = getSupabaseClient()

      const [{ data: refs }, { data: profiles }] = await Promise.all([
        supabase.from('referrals').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name, email, referral_code, points').order('points', { ascending: false }).limit(10)
      ])

      if (refs) {
        setReferrals(refs as Referral[])
        const completed = refs.filter((r: Referral) => r.status === 'completed').length
        const pending = refs.filter((r: Referral) => r.status === 'pending').length
        setStats({
          total: refs.length,
          completed,
          pending,
          conversionRate: refs.length > 0 ? Math.round((completed / refs.length) * 100) : 0
        })

        // Process referrals to daily counts for the last 7 days
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const countsByDay: Record<string, number> = {}
        
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          countsByDay[days[d.getDay()]] = 0
        }

        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        sevenDaysAgo.setHours(0, 0, 0, 0)

        refs.forEach((r: any) => {
          const d = new Date(r.created_at)
          if (d >= sevenDaysAgo) {
            const dayName = days[d.getDay()]
            if (countsByDay[dayName] !== undefined) {
              countsByDay[dayName]++
            }
          }
        })
        
        setChartData(Object.entries(countsByDay).map(([day, referrals]) => ({ day, referrals })))
      }

      if (profiles) {
        // Count referrals per user
        const referralCounts = (refs || []).reduce((acc: Record<string, number>, r: any) => {
          if (r.referrer_id) acc[r.referrer_id] = (acc[r.referrer_id] || 0) + 1
          return acc
        }, {})
        setTopReferrers(
          profiles.map((p: any) => ({
            referral_code: p.referral_code || '',
            full_name: p.full_name,
            email: p.email,
            count: referralCounts[p.id] || 0,
            points: p.points || 0,
          })).filter((p: TopReferrer) => p.count > 0).slice(0, 5)
        )
      }

      setLoading(false)

      if (!channel) {
        channel = supabase.channel(`referrals_realtime_${Date.now()}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals' }, () => {
            fetchData()
          })
          .subscribe()
      }
    }
    
    fetchData()

    return () => {
      if (channel) {
        getSupabaseClient().removeChannel(channel)
      }
    }
  }, [])

  const columns = useMemo<ColumnDef<Referral>[]>(() => [
    {
      accessorKey: 'referred_email',
      header: 'Referred Email',
      cell: info => <span className="font-medium text-zinc-900 text-sm">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'code_used',
      header: 'Code Used',
      cell: info => <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-700">{(info.getValue() as string) || '—'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: info => {
        const s = info.getValue() as string
        return <Badge variant={s === 'completed' ? 'success' : s === 'pending' ? 'warning' : 'default'} className="capitalize">{s}</Badge>
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: info => <span className="text-zinc-500 text-sm whitespace-nowrap">{new Date(info.getValue() as string).toLocaleDateString()}</span>,
    },
  ], [])

  // Removed mockChartData

  return (
    <div className="space-y-6">
      <PageHeader title="Referrals" description="Track referral performance, top referrers, and conversion metrics." />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Referrals', value: loading ? '—' : stats.total.toLocaleString() },
          { label: 'Completed', value: loading ? '—' : stats.completed.toLocaleString() },
          { label: 'Pending', value: loading ? '—' : stats.pending.toLocaleString() },
          { label: 'Conversion Rate', value: loading ? '—' : `${stats.conversionRate}%` },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm font-medium">Referral Activity (Last 7 Days)</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-zinc-500">Loading chart...</div>
            ) : (
              <TimeSeriesChart data={chartData} xKey="day" yKey="referrals" height={220} />
            )}
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Top Referrers</CardTitle></CardHeader>
          <CardContent>
            {topReferrers.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-6">No referral data yet.</p>
            ) : (
              <div className="space-y-3">
                {topReferrers.map((r, i) => (
                  <div key={r.referral_code} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-zinc-400 w-4 shrink-0">#{i + 1}</span>
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs uppercase shrink-0">
                      {r.full_name?.charAt(0) || r.email?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{r.full_name || r.email}</p>
                      <p className="text-xs text-zinc-500">{r.count} referrals · {r.points} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Referral List */}
      <DataTable
        columns={columns}
        data={referrals}
        searchKey="referred_email"
        searchPlaceholder="Search referrals by email..."
        loading={loading}
      />
    </div>
  )
}
