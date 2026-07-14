import { useState, useEffect, useRef } from 'react'
import { getSupabaseClient } from '@universe/database'

export interface PlatformHealthStatus {
  database: 'healthy' | 'degraded' | 'down'
  queueWorker: 'healthy' | 'degraded' | 'down'
  authService: 'healthy' | 'degraded' | 'down'
  queueDepth: number
  lastUpdated: Date
}

const supabase = getSupabaseClient()

export function usePlatformHealth() {
  const [health, setHealth] = useState<PlatformHealthStatus>({
    database: 'healthy',
    queueWorker: 'healthy',
    authService: 'healthy',
    queueDepth: 0,
    lastUpdated: new Date()
  })
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    const checkHealth = async () => {
      try {
        const [dbCheck, authCheck, queueStats] = await Promise.all([
          supabase.from('profiles').select('id').limit(1),
          supabase.auth.getSession(),
          supabase.rpc('get_queue_status_summary')
        ])

        if (!mountedRef.current) return

        let queueDepth = 0
        if (!queueStats.error && queueStats.data) {
          const pendingRow = ((queueStats.data || []) as { status: string; count: number }[]).find(r => r.status === 'pending')
          if (pendingRow) queueDepth = Number(pendingRow.count)
        }

        setHealth({
          database: dbCheck.error ? 'down' : 'healthy',
          authService: authCheck.error ? 'down' : 'healthy',
          queueWorker: queueDepth > 1000 ? 'degraded' : 'healthy',
          queueDepth,
          lastUpdated: new Date()
        })
      } catch (err) {
        console.error('Health check failed', err)
        if (mountedRef.current) {
          setHealth(prev => ({
            ...prev,
            database: 'down',
            lastUpdated: new Date()
          }))
        }
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000)

    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [])

  return { health, loading }
}

