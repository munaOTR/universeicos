import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@universe/database'
import { fetchFraudLogs, fetchSecurityEvents } from '../../lib/analytics'
import { Card, CardHeader, CardTitle, CardContent } from '@universe/ui'

const supabase = getSupabaseClient()

export function SecurityTab() {
  const [loading, setLoading] = useState(true)
  const [fraudLogs, setFraudLogs] = useState<any[]>([])
  const [securityEvents, setSecurityEvents] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [f, s] = await Promise.all([
        fetchFraudLogs(supabase),
        fetchSecurityEvents(supabase)
      ])
      setFraudLogs(f)
      setSecurityEvents(s)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-sm text-zinc-500 animate-pulse">Loading security data...</div>

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Fraud Detections</CardTitle></CardHeader>
        <CardContent>
          {fraudLogs.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4 text-center">No fraud events detected.</p>
          ) : (
            <div className="space-y-3">
              {fraudLogs.slice(0, 5).map(f => (
                <div key={f.id} className="text-sm p-3 bg-red-50 text-red-900 rounded-lg border border-red-100">
                  <div className="flex justify-between font-medium mb-1">
                    <span>{f.reason}</span>
                    <span className="text-xs text-red-500">{new Date(f.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs opacity-80">User: {f.profiles?.email || f.user_id}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Critical Admin Events</CardTitle></CardHeader>
        <CardContent>
          {securityEvents.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4 text-center">No critical events logged.</p>
          ) : (
            <div className="space-y-3">
              {securityEvents.slice(0, 5).map(s => (
                <div key={s.id} className="text-sm p-3 bg-zinc-50 text-zinc-800 rounded-lg border border-zinc-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                      s.action === 'delete' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {s.action.toUpperCase()}
                    </span>
                    <span className="font-mono text-xs">{s.entity_type}</span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate">By {s.admin_id}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
