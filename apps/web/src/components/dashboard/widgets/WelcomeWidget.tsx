import { useAuth } from '@universe/auth'
import { useProfile } from '../../../hooks/queries'
import { Card, CardContent } from '@universe/ui'
import { SparklesIcon } from 'hugeicons-react'

export function WelcomeWidget() {
  const { user } = useAuth()
  const { data: profile, isLoading } = useProfile(user?.id)

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Student'

  // Calculate a mock profile completion percentage for MVP
  const fields = ['full_name', 'university', 'faculty', 'department', 'phone']
  const completedFields = profile
    ? fields.filter(f => profile[f as keyof typeof profile]).length
    : 0
  const completionPercent = Math.round((completedFields / fields.length) * 100)

  return (
    <Card className="overflow-hidden bg-white border-zinc-200">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Good day, {displayName}.
            </h2>
            <p className="text-sm text-zinc-500">Here's what's happening in your Universe today.</p>
          </div>

          {!isLoading && profile && (
            <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100 min-w-[240px]">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <SparklesIcon className="text-amber-500" size={24} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-zinc-700">Profile Completion</span>
                  <span className="text-xs font-bold text-primary-600">{completionPercent}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
