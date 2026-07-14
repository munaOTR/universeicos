import { useAuth } from '@universe/auth'
import { useReferralStats } from '../../../hooks/queries'
import { Card, CardContent } from '@universe/ui'
import { Link } from 'react-router-dom'
import { ROUTES } from '@universe/constants'
import { UserGroupIcon, ArrowRight01Icon, Coins01Icon } from 'hugeicons-react'

export function ReferralOverviewWidget() {
  const { user } = useAuth()
  const { data, isLoading } = useReferralStats(user?.id)

  const stats = data?.stats || { total: 0, completed: 0, pending: 0 }
  const potentialPoints = stats.pending * 100 // 100 points per referral

  return (
    <Card className="flex flex-col h-full bg-white border-zinc-200">
      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-zinc-900 font-semibold">
            <UserGroupIcon size={18} className="text-primary-600" />
            <span>Referrals</span>
          </div>
          <Link 
            to={ROUTES.DASHBOARD_REFERRALS}
            className="text-xs font-medium text-zinc-500 hover:text-primary-600 transition-colors flex items-center gap-1"
          >
            Details <ArrowRight01Icon size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse h-8 w-24 bg-zinc-100 rounded"></div>
          </div>
        ) : (
          <div className="space-y-4 flex-1 flex flex-col justify-end">
            <div>
              <div className="text-3xl font-extrabold text-zinc-900">{stats.completed}</div>
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">Verified Friends</div>
            </div>

            {stats.pending > 0 && (
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 flex items-start gap-3">
                <Coins01Icon size={16} className="text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-orange-900">+{potentialPoints} pending points</p>
                  <p className="text-[10px] text-orange-700 mt-0.5 leading-tight">
                    {stats.pending} friends haven't verified their email yet. Remind them to check their inbox!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
