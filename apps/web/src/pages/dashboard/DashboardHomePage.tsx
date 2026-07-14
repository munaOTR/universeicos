import { WelcomeWidget } from '../../components/dashboard/widgets/WelcomeWidget'
import { ReferralOverviewWidget } from '../../components/dashboard/widgets/ReferralOverviewWidget'
import { LeaderboardMiniWidget } from '../../components/dashboard/widgets/LeaderboardMiniWidget'
import { QuickActionsWidget } from '../../components/dashboard/widgets/QuickActionsWidget'

export function DashboardHomePage() {
  // Force vite HMR cache reload
  return (
    <div className="space-y-6">
      
      {/* Top Section - Welcome */}
      <WelcomeWidget />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Wider on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ReferralOverviewWidget />
            <LeaderboardMiniWidget />
          </div>
          
          {/* Announcements or Activity Feed placeholder */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 min-h-[300px] flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
              <span className="text-zinc-400 text-xl">📢</span>
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">No new announcements</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              We'll notify you here when there are new platform updates, competitions, or rewards.
            </p>
          </div>
        </div>

        {/* Right Column (Sidebar on desktop) */}
        <div className="space-y-6">
          <QuickActionsWidget />
          
          {/* Upcoming Surveys Placeholder */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-6 text-white shadow-sm">
            <h3 className="font-bold mb-2">Help shape Universe</h3>
            <p className="text-xs text-primary-100 mb-4 leading-relaxed">
              Complete your first onboarding survey to earn 50 points and help us personalize your experience.
            </p>
            <button className="w-full bg-white text-primary-700 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-primary-50 transition-colors">
              Start Survey
            </button>
          </div>
        </div>
      </div>
      
    </div>
  )
}
