import { useAuth } from '@universe/auth'
import { useReferralStats, useProfile } from '../../hooks/queries'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@universe/ui'
import { Copy01Icon, CheckmarkBadge01Icon, Time02Icon } from 'hugeicons-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { APP_URL } from '@universe/constants'

export function ReferralsPage() {
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const { data: referrals, isLoading } = useReferralStats(user?.id)

  const handleCopyLink = () => {
    if (!profile?.referral_code) return
    const link = `${APP_URL}/waitlist?ref=${profile.referral_code}`
    navigator.clipboard.writeText(link)
    toast.success('Referral link copied to clipboard!')
  }

  const list = referrals?.list || []
  const stats = referrals?.stats || { total: 0, completed: 0, pending: 0 }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Referrals</h1>
          <p className="text-sm text-zinc-500 mt-1">Invite friends and earn points to climb the leaderboard.</p>
        </div>
        <Button onClick={handleCopyLink} className="flex items-center gap-2">
          <Copy01Icon size={18} />
          Copy Invite Link
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Total Invites</div>
            <div className="text-3xl font-extrabold text-zinc-900">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Verified</div>
            <div className="text-3xl font-extrabold text-emerald-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Pending</div>
            <div className="text-3xl font-extrabold text-orange-500">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-100 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-100 rounded w-1/4"></div>
                    <div className="h-3 bg-zinc-100 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-12 w-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Copy01Icon size={24} className="text-zinc-400" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900">No referrals yet</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Share your link to invite friends. Once they sign up and verify, they'll appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {list.map((ref, index) => {
                const referred = (Array.isArray(ref.referred) ? ref.referred[0] : ref.referred) as { full_name?: string } | undefined
                return (
                <div key={index} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold text-sm shrink-0">
                      {referred?.full_name ? referred.full_name.slice(0, 2).toUpperCase() : '??'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{referred?.full_name || 'Anonymous Student'}</p>
                      <p className="text-xs text-zinc-500">Joined {formatDistanceToNow(new Date(ref.created_at))} ago</p>
                    </div>
                  </div>
                  <div>
                    {ref.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                        <CheckmarkBadge01Icon size={14} /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold">
                        <Time02Icon size={14} /> Pending
                      </span>
                    )}
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
