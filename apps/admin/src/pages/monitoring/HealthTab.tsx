import { Card, CardHeader, CardTitle, CardContent } from '@universe/ui'
import { usePlatformHealth } from '../../hooks/usePlatformHealth'
import { ServerStack01Icon, DatabaseIcon, Shield02Icon, Time02Icon, Mail01Icon } from 'hugeicons-react'
import { ElementType } from 'react'

export function HealthTab() {
  const { health, loading } = usePlatformHealth()

  const HealthCard = ({ title, status, icon: Icon, desc }: { title: string, status: string, icon: ElementType, desc: string }) => {
    const isHealthy = status === 'healthy'
    const color = isHealthy ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
    const dotColor = isHealthy ? 'bg-emerald-500' : 'bg-red-500'

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">{title}</h3>
                <p className="text-xs text-zinc-500">{desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${dotColor} ${isHealthy ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-medium capitalize text-zinc-700">{status}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return <div className="text-sm text-zinc-500 animate-pulse">Checking system vitals...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">System Vitals</h2>
        <span className="text-xs text-zinc-500 font-mono">Last updated: {health.lastUpdated.toLocaleTimeString()}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <HealthCard 
          title="Database Cluster" 
          desc="PostgreSQL & Connection Pooler" 
          status={health.database} 
          icon={DatabaseIcon} 
        />
        <HealthCard 
          title="Auth Service" 
          desc="GoTrue Authentication API" 
          status={health.authService} 
          icon={Shield02Icon} 
        />
        <HealthCard 
          title="Edge Workers" 
          desc="Deno Edge Functions" 
          status={health.queueWorker} 
          icon={ServerStack01Icon} 
        />
        <HealthCard 
          title="Queue Processor" 
          desc={`Processing (${health.queueDepth} pending)`} 
          status={health.queueDepth > 5000 ? 'degraded' : 'healthy'} 
          icon={Time02Icon} 
        />
        <HealthCard 
          title="Email Provider" 
          desc="Resend API" 
          status="healthy" // Hardcoded healthy for now, would ping Resend API normally
          icon={Mail01Icon} 
        />
      </div>
    </div>
  )
}
