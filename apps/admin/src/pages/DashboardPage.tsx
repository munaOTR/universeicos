import { useMemo, useState, useEffect } from 'react'
import { getSupabaseClient } from '@universe/database'
import { PageHeader } from '../components/shared/PageHeader'
import { WIDGET_REGISTRY } from '../config/widgets'
import { usePermissions } from '@universe/auth'
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart'
import { Card, CardHeader, CardTitle, CardContent } from '@universe/ui'
import { VerificationOverviewCard } from '../components/widgets/VerificationOverviewCard'

export function DashboardPage() {
  const { hasPermission } = usePermissions()

  // Filter widgets based on user permissions
  const authorizedWidgets = useMemo(() => {
    return WIDGET_REGISTRY.filter(widget => {
      if (!widget.defaultEnabled) return false
      if (!widget.permission) return true
      return hasPermission(widget.permission.action, widget.permission.resource)
    })
  }, [hasPermission])

  // Split widgets by size for layout
  const smallWidgets = authorizedWidgets.filter(w => w.size === 'small')
  const largeWidgets = authorizedWidgets.filter(w => w.size === 'large' || w.size === 'medium')

  const [chartData, setChartData] = useState<{ day: string; signups: number }[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let channel: any;

    const fetchData = async () => {
      setLoading(true)
      const supabase = getSupabaseClient()
      
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      sevenDaysAgo.setHours(0, 0, 0, 0)
      
      const [{ data: profiles }, { data: logs }] = await Promise.all([
        supabase.from('profiles').select('created_at').gte('created_at', sevenDaysAgo.toISOString()),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(5)
      ])

      // Process profiles to daily counts
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const countsByDay: Record<string, number> = {}
      
      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        countsByDay[days[d.getDay()]] = 0
      }

      if (profiles) {
        profiles.forEach((p: any) => {
          const d = new Date(p.created_at)
          const dayName = days[d.getDay()]
          if (countsByDay[dayName] !== undefined) {
            countsByDay[dayName]++
          }
        })
      }

      setChartData(Object.entries(countsByDay).map(([day, signups]) => ({ day, signups })))
      
      if (logs) {
        setActivities(logs)
      }
      
      setLoading(false)

      if (!channel) {
        channel = supabase.channel(`dashboard_realtime_${Date.now()}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
            setActivities(prev => [payload.new, ...prev].slice(0, 5))
          })
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
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

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description="Operational overview of the Universe ecosystem." 
      />

      {/* Dynamic Stat Widgets Grid */}
      {smallWidgets.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {smallWidgets.map(widget => (
            <widget.component key={widget.id} />
          ))}
        </div>
      )}
      
      {/* Main charts row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Waitlist Growth (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-sm text-zinc-500">Loading chart...</div>
            ) : (
              <TimeSeriesChart 
                data={chartData} 
                xKey="day" 
                yKey="signups" 
                height={300}
              />
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <p className="text-sm text-zinc-500">Loading activity...</p>
              ) : activities.length === 0 ? (
                <p className="text-sm text-zinc-500">No recent activity.</p>
              ) : activities.map((activity, i) => (
                <div key={activity.id || i} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-medium text-zinc-600 uppercase">
                    {activity.action?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 capitalize">
                      {activity.action?.replace(/_/g, ' ') || 'System Action'}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate max-w-[150px]">
                      {new Date(activity.created_at).toLocaleDateString()} • {activity.resource || 'System'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Overview + any other large widgets */}
      <div className="grid gap-4 md:grid-cols-2">
        <VerificationOverviewCard />
        {largeWidgets.map(widget => (
          <widget.component key={widget.id} />
        ))}
      </div>
    </div>
  )
}
