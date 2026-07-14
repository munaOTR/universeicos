import { useState } from 'react'
import type { ReactNode } from 'react'
import { PageHeader } from '../../components/shared/PageHeader'
import { usePermissions } from '@universe/auth'

// Tabs
import { EmailDashboardTab } from './EmailDashboardTab'
import { CampaignsTab } from './CampaignsTab'
import { TemplatesTab } from './TemplatesTab'
import { QueueTab } from './QueueTab'
import { AudiencesTab } from './AudiencesTab'
import { AnalyticsTab } from './AnalyticsTab'

type TabId = 'dashboard' | 'campaigns' | 'templates' | 'queue' | 'audiences' | 'analytics'

export function EmailCenterPage() {
  const { hasPermission } = usePermissions()
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')

  // Check permissions (assuming 'emails' is the resource and 'manage' is action)
  if (!hasPermission('manage', 'emails')) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Access Denied</h2>
        <p className="text-zinc-500">You do not have permission to access the Email Center.</p>
      </div>
    )
  }

  const tabs: { id: TabId; label: string; component: ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', component: <EmailDashboardTab /> },
    { id: 'campaigns', label: 'Campaigns', component: <CampaignsTab /> },
    { id: 'templates', label: 'Templates', component: <TemplatesTab /> },
    { id: 'queue',     label: 'Queue',     component: <QueueTab /> },
    { id: 'audiences', label: 'Audiences', component: <AudiencesTab /> },
    { id: 'analytics', label: 'Analytics', component: <AnalyticsTab /> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Email Center" 
        description="Manage transactional emails, campaigns, templates, and delivery infrastructure." 
      />

      {/* Tabs navigation */}
      <div className="border-b border-zinc-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
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

      {/* Tab content */}
      <div className="mt-4">
        {tabs.find(t => t.id === activeTab)?.component}
      </div>
    </div>
  )
}
