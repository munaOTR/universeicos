import { useAuth } from '@universe/auth'
import { useProfile, useLeaderboard } from '../../../hooks/queries'
import { Card, CardContent } from '@universe/ui'
import { Link } from 'react-router-dom'
import { ROUTES } from '@universe/constants'
import { Award01Icon, ArrowRight01Icon } from 'hugeicons-react'

export function LeaderboardMiniWidget() {
  const { user } = useAuth()
  const { data: profile, isLoading: isProfileLoading } = useProfile(user?.id)
  const { data: leaderboard, isLoading: isLeaderboardLoading } = useLeaderboard(0)

  const isLoading = isProfileLoading || isLeaderboardLoading
  const rankIndex = leaderboard?.users?.findIndex(u => u.id === user?.id) ?? -1
  const rank = rankIndex >= 0 ? rankIndex + 1 : '100+'
  
  const topUser = leaderboard?.users?.[0]

  return (
    <Card className="flex flex-col h-full bg-white border-zinc-200">
      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-zinc-900 font-semibold">
            <Award01Icon size={18} className="text-primary-600" />
            <span>Leaderboard</span>
          </div>
          <Link 
            to={ROUTES.DASHBOARD_LEADERBOARD}
            className="text-xs font-medium text-zinc-500 hover:text-primary-600 transition-colors flex items-center gap-1"
          >
            View All <ArrowRight01Icon size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse h-8 w-24 bg-zinc-100 rounded"></div>
          </div>
        ) : (
          <div className="space-y-4 flex-1 flex flex-col justify-end">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-extrabold text-zinc-900">#{rank}</div>
                <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">Your Rank</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-zinc-900">{profile?.points || 0}</div>
                <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">Points</div>
              </div>
            </div>

            {topUser && topUser.id !== user?.id && (
              <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-xs font-bold text-zinc-400">#1</div>
                  <div className="text-xs font-semibold text-zinc-700 truncate max-w-[100px]">
                    {topUser.full_name || 'Anonymous'}
                  </div>
                </div>
                <div className="text-xs font-bold text-zinc-900">{topUser.points} pts</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
