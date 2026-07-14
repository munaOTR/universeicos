import { useState } from 'react'
import { PageHeader } from '../components/shared/PageHeader'
import { OverviewTab } from './analytics/OverviewTab'
import { UsersTab } from './analytics/UsersTab'
import { ReferralsTab } from './analytics/ReferralsTab'
import { WaitlistAnalyticsTab } from './analytics/WaitlistAnalyticsTab'
import { CommunicationAnalyticsTab } from './analytics/CommunicationAnalyticsTab'
import { AuthAnalyticsTab } from './analytics/AuthAnalyticsTab'

type AnalyticsTab = 'overview' | 'users' | 'referrals' | 'waitlist' | 'communication' | 'auth'

const TABS: { id: AnalyticsTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'referrals', label: 'Referrals' },
  { id: 'waitlist', label: 'Waitlist' },
  { id: 'communication', label: 'Communication' },
  { id: 'auth', label: 'Auth & Security' },
]

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview')

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Analytics Center" 
        description="Platform-wide growth, engagement, and operational metrics." 
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
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'referrals' && <ReferralsTab />}
        {activeTab === 'waitlist' && <WaitlistAnalyticsTab />}
        {activeTab === 'communication' && <CommunicationAnalyticsTab />}
        {activeTab === 'auth' && <AuthAnalyticsTab />}
      </div>
    </div>
  )
}
