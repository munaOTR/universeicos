import { Card, CardContent } from '@universe/ui'
import { Link } from 'react-router-dom'
import { ROUTES } from '@universe/constants'
import { UserCircleIcon, Share08Icon, Message01Icon, ZapIcon } from 'hugeicons-react'
import { toast } from 'sonner'
import { useAuth } from '@universe/auth'
import { useProfile } from '../../../hooks/queries'
import { APP_URL } from '@universe/constants'

export function QuickActionsWidget() {
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)

  const handleCopyLink = () => {
    if (!profile?.referral_code) return
    const link = `${APP_URL}/waitlist?ref=${profile.referral_code}`
    navigator.clipboard.writeText(link)
    toast.success('Referral link copied to clipboard!')
  }

  const actions = [
    {
      label: 'Copy Invite Link',
      icon: Share08Icon,
      onClick: handleCopyLink,
      color: 'text-primary-600',
      bg: 'bg-primary-50 hover:bg-primary-100',
    },
    {
      label: 'Update Profile',
      icon: UserCircleIcon,
      to: ROUTES.DASHBOARD_PROFILE,
      color: 'text-blue-600',
      bg: 'bg-blue-50 hover:bg-blue-100',
    },
    {
      label: 'Take Survey',
      icon: Message01Icon,
      to: ROUTES.DASHBOARD_SURVEYS,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 hover:bg-emerald-100',
    },
  ]

  return (
    <Card className="h-full bg-white border-zinc-200">
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex items-center gap-2 text-zinc-900 font-semibold mb-4">
          <ZapIcon size={18} className="text-amber-500" />
          <span>Quick Actions</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          {actions.map((action, i) => {
            const Icon = action.icon
            const content = (
              <>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 transition-colors ${action.bg}`}>
                  <Icon size={20} className={action.color} />
                </div>
                <span className="text-xs font-semibold text-zinc-700 text-center">{action.label}</span>
              </>
            )

            if (action.to) {
              return (
                <Link 
                  key={i} 
                  to={action.to}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-100 hover:border-zinc-200 transition-all hover:shadow-sm"
                >
                  {content}
                </Link>
              )
            }

            return (
              <button 
                key={i} 
                onClick={action.onClick}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-100 hover:border-zinc-200 transition-all hover:shadow-sm"
              >
                {content}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
