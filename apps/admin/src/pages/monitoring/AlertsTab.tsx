import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@universe/database'
import { fetchPlatformAlerts } from '../../lib/analytics'
import { AlertBanner } from '../../components/shared/AlertBanner'
import { Card, CardContent } from '@universe/ui'
import { CheckmarkBadge01Icon } from 'hugeicons-react'

export function AlertsTab() {
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<any[]>([])

  const load = async () => {
    setLoading(true)
    const data = await fetchPlatformAlerts(supabase, false) // unacknowledged only
    setAlerts(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleAcknowledge = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  if (loading) {
    return <div className="text-sm text-zinc-500 animate-pulse">Loading alerts...</div>
  }

  if (alerts.length === 0) {
    return (
      <Card className="bg-emerald-50/50 border-emerald-100 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <CheckmarkBadge01Icon size={24} />
          </div>
          <h3 className="font-medium text-emerald-900 mb-1">All clear</h3>
          <p className="text-sm text-emerald-700/80">No active platform alerts requiring attention.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-zinc-900">Active Alerts ({alerts.length})</h3>
        <button onClick={load} className="text-xs text-primary-600 hover:underline">Refresh</button>
      </div>
      <div className="space-y-3">
        {alerts.map(a => (
          <AlertBanner
            key={a.id}
            id={a.id}
            title={a.title}
            message={a.message}
            severity={a.severity}
            onAcknowledge={handleAcknowledge}
          />
        ))}
      </div>
    </div>
  )
}
