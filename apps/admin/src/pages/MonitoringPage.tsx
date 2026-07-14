import { useState } from 'react'
import { PageHeader } from '../components/shared/PageHeader'
import { HealthTab } from './monitoring/HealthTab'
import { QueueMonitorTab } from './monitoring/QueueMonitorTab'
import { AlertsTab } from './monitoring/AlertsTab'
import { SecurityTab } from './monitoring/SecurityTab'

type MonitorTab = 'health' | 'queue' | 'alerts' | 'security'

const TABS: { id: MonitorTab; label: string }[] = [
  { id: 'health', label: 'Platform Health' },
  { id: 'queue', label: 'Queue Monitor' },
  { id: 'alerts', label: 'Active Alerts' },
  { id: 'security', label: 'Security & Fraud' },
]

export function MonitoringPage() {
  const [activeTab, setActiveTab] = useState<MonitorTab>('health')

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Monitoring & Health" 
        description="Realtime visibility into platform infrastructure, queues, and security." 
      />

      <div className="border-b border-zinc-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="pt-2">
        {activeTab === 'health' && <HealthTab />}
        {activeTab === 'queue' && <QueueMonitorTab />}
        {activeTab === 'alerts' && <AlertsTab />}
        {activeTab === 'security' && <SecurityTab />}
      </div>
    </div>
  )
}
