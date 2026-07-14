import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@universe/database'
import type { User, VerificationReminder } from '@universe/types'
import { Button, Badge, Spinner, toast } from '@universe/ui'
import {
  Cancel01Icon,
  UserCircleIcon,
  LinkSquare01Icon,
  Calendar01Icon,
  Shield01Icon,
  CheckmarkCircle01Icon,
  MailOpen01Icon,
  Clock01Icon,
  Mail01Icon,
} from 'hugeicons-react'
import { RoleSelect } from '../shared/RoleSelect'
import { VerificationBadge, getVerificationStatus } from './VerificationBadge'

interface UserWithAuth extends User {
  email_confirmed_at: string | null
  auth_provider: string
  reminder_count: number
  last_reminder_at: string | null
  is_eligible_for_reminder: boolean
}

interface UserProfilePanelProps {
  userId: string
  onClose: () => void
  onUpdate: () => void
}

function timeSince(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime()
  const days = Math.floor(ms / 86400000)
  if (days < 1) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function UserProfilePanel({ userId, onClose, onUpdate }: UserProfilePanelProps) {
  const [user, setUser]                       = useState<UserWithAuth | null>(null)
  const [loading, setLoading]                 = useState(true)
  const [actionLoading, setActionLoading]     = useState(false)
  const [reminderLoading, setReminderLoading] = useState(false)
  const [timeline, setTimeline]               = useState<any[]>([])
  const [reminders, setReminders]             = useState<VerificationReminder[]>([])

  const fetchUserDetails = useCallback(async () => {
    setLoading(true)
    const supabase = getSupabaseClient()

    // Fetch full user with auth data via RPC
    const { data: users } = await supabase.rpc('get_users_with_verification_status', {
      p_limit: 500,
      p_offset: 0,
    })

    const found = Array.isArray(users) ? users.find((u: any) => u.id === userId) : null
    if (found) setUser(found as UserWithAuth)

    // Fetch activity logs for timeline
    const { data: logs } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    if (logs) setTimeline(logs)

    // Fetch verification reminder history
    const { data: reminderData } = await supabase
      .from('verification_reminders')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
    if (reminderData) setReminders(reminderData as VerificationReminder[])

    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchUserDetails()
  }, [fetchUserDetails])

  // ── Suspend ──────────────────────────────────────────────────────────────

  const handleSuspend = async () => {
    setActionLoading(true)
    const supabase = getSupabaseClient()
    try {
      await supabase.from('audit_logs').insert({
        action: 'suspend_user',
        resource: 'users',
        details: { target_user_id: userId },
      })
      toast.success('User suspended (simulated)')
      onUpdate()
    } catch (e: any) {
      toast.error('Failed to suspend', { description: e.message })
    } finally {
      setActionLoading(false)
    }
  }

  // ── Send individual reminder ──────────────────────────────────────────────

  const handleSendReminder = async () => {
    if (!user) return
    setReminderLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token
      if (!token) throw new Error('Not authenticated')

      const supabaseUrl = (supabase as any).supabaseUrl as string

      const res = await fetch(`${supabaseUrl}/functions/v1/send-verification-reminder`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey':        (supabase as any).supabaseKey as string,
        },
        body: JSON.stringify({ user_id: userId, trigger_source: 'manual' }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Unknown error')

      toast.success('Verification reminder sent', {
        description: `Email queued to ${user.email}`,
      })

      // Refresh to show new reminder in history
      await fetchUserDetails()
      onUpdate()
    } catch (e: any) {
      toast.error('Failed to send reminder', { description: e.message })
    } finally {
      setReminderLoading(false)
    }
  }

  if (!userId) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-zinc-900/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0 border-l border-zinc-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white">
          <h2 className="text-lg font-semibold text-zinc-900">User Profile</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 rounded-lg transition-colors"
          >
            <Cancel01Icon size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-zinc-50/50">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Spinner size="lg" className="text-primary-500" />
            </div>
          ) : !user ? (
            <div className="text-center text-zinc-500">User not found.</div>
          ) : (
            <>
              {/* Profile Header */}
              <div className="flex items-start gap-4 bg-white p-4 rounded-xl border border-zinc-100 shadow-sm">
                <div className="h-16 w-16 rounded-full bg-primary-100 border-2 border-white shadow-sm flex items-center justify-center text-primary-700 font-bold text-xl uppercase shrink-0">
                  {user.full_name?.charAt(0) ?? user.email?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-zinc-900 truncate">{user.full_name ?? 'Anonymous User'}</h3>
                  <p className="text-sm text-zinc-500 truncate">{user.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <VerificationBadge
                      status={getVerificationStatus(user.email_confirmed_at, user.created_at)}
                      size="md"
                    />
                    <Badge variant="default" className="capitalize">{user.role}</Badge>
                  </div>
                </div>
              </div>

              {/* ── Verification Section ──────────────────────────────────── */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  {user.email_confirmed_at
                    ? <CheckmarkCircle01Icon size={14} className="text-emerald-500" />
                    : <MailOpen01Icon size={14} className="text-amber-500" />
                  }
                  Email Verification
                </h4>
                <div className="bg-white rounded-xl border border-zinc-100 shadow-sm divide-y divide-zinc-100">
                  <div className="flex justify-between p-3 text-sm">
                    <span className="text-zinc-500">Status</span>
                    <VerificationBadge
                      status={getVerificationStatus(user.email_confirmed_at, user.created_at)}
                      size="sm"
                    />
                  </div>
                  <div className="flex justify-between p-3 text-sm">
                    <span className="text-zinc-500">Registered</span>
                    <span className="font-medium text-zinc-900 text-right">{formatDateTime(user.created_at)}</span>
                  </div>
                  <div className="flex justify-between p-3 text-sm">
                    <span className="text-zinc-500">Verified On</span>
                    <span className="font-medium text-zinc-900 text-right">{formatDateTime(user.email_confirmed_at)}</span>
                  </div>
                  {!user.email_confirmed_at && (
                    <div className="flex justify-between p-3 text-sm">
                      <span className="text-zinc-500">Waiting</span>
                      <span className="font-medium text-zinc-900">{timeSince(user.created_at)}</span>
                    </div>
                  )}
                  <div className="flex justify-between p-3 text-sm">
                    <span className="text-zinc-500">Auth Provider</span>
                    <span className="font-medium text-zinc-900 capitalize">{user.auth_provider}</span>
                  </div>
                  <div className="flex justify-between p-3 text-sm">
                    <span className="text-zinc-500">Reminders Sent</span>
                    <span className="font-medium text-zinc-900">{user.reminder_count}</span>
                  </div>
                  {user.last_reminder_at && (
                    <div className="flex justify-between p-3 text-sm">
                      <span className="text-zinc-500">Last Reminder</span>
                      <span className="font-medium text-zinc-900 text-right">{formatDateTime(user.last_reminder_at)}</span>
                    </div>
                  )}
                </div>

                {/* Reminder CTA */}
                {!user.email_confirmed_at && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center gap-2"
                    onClick={handleSendReminder}
                    disabled={reminderLoading}
                  >
                    {reminderLoading ? (
                      <>
                        <Spinner size="sm" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Mail01Icon size={14} />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                )}

                {/* Reminder History */}
                {reminders.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Reminder History</p>
                    <div className="space-y-1.5">
                      {reminders.map((r, i) => (
                        <div key={r.id} className="flex items-center justify-between bg-white rounded-lg border border-zinc-100 px-3 py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Clock01Icon size={12} className="text-zinc-400" />
                            <span className="text-zinc-600">Reminder #{reminders.length - i}</span>
                            <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded capitalize">{r.trigger_source}</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-400">
                            {r.converted_at && (
                              <span className="text-emerald-600 font-medium">Converted</span>
                            )}
                            <span>{formatDateTime(r.sent_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Identity & Academic */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <UserCircleIcon size={14} /> Identity &amp; Academic
                </h4>
                <div className="bg-white rounded-xl border border-zinc-100 shadow-sm divide-y divide-zinc-100">
                  <div className="flex justify-between p-3 text-sm">
                    <span className="text-zinc-500">University</span>
                    <span className="font-medium text-zinc-900 text-right">{user.university ?? 'Not set'}</span>
                  </div>
                  <div className="flex justify-between p-3 text-sm">
                    <span className="text-zinc-500">Faculty</span>
                    <span className="font-medium text-zinc-900 text-right">{user.faculty ?? 'Not set'}</span>
                  </div>
                  <div className="flex justify-between p-3 text-sm">
                    <span className="text-zinc-500">Department</span>
                    <span className="font-medium text-zinc-900 text-right">{user.department ?? 'Not set'}</span>
                  </div>
                </div>
              </div>

              {/* Growth & Referrals */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <LinkSquare01Icon size={14} /> Growth &amp; Referrals
                </h4>
                <div className="bg-white rounded-xl border border-zinc-100 shadow-sm divide-y divide-zinc-100">
                  <div className="flex justify-between p-3 text-sm">
                    <span className="text-zinc-500">Total Points</span>
                    <span className="font-medium text-zinc-900">{user.points?.toLocaleString() ?? 0} pts</span>
                  </div>
                  <div className="flex justify-between p-3 text-sm">
                    <span className="text-zinc-500">Referral Code</span>
                    <span className="font-mono text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded text-xs">{user.referral_code}</span>
                  </div>
                  <div className="flex justify-between p-3 text-sm">
                    <span className="text-zinc-500">Referred By</span>
                    <span className="font-mono text-zinc-500 text-xs">{user.referred_by ?? 'None'}</span>
                  </div>
                </div>
              </div>

              {/* Administration */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <Shield01Icon size={14} /> Administration
                </h4>
                <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Primary Role</label>
                    <RoleSelect
                      userId={user.id}
                      currentRole={user.role}
                      onRoleChanged={() => onUpdate()}
                    />
                  </div>
                  <div className="pt-2 border-t border-zinc-100">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full justify-center"
                      onClick={handleSuspend}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Suspend Account'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <Calendar01Icon size={14} /> Recent Activity
                </h4>
                <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-4">
                  {timeline.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-2">No activity recorded.</p>
                  ) : (
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 before:to-transparent">
                      {timeline.map((log) => (
                        <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-4 h-4 rounded-full border border-white bg-zinc-300 group-[.is-active]:bg-primary-500 text-zinc-500 group-[.is-active]:text-primary-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2" />
                          <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                            <div className="flex items-center justify-between space-x-2 mb-1">
                              <div className="font-bold text-zinc-900 text-xs capitalize">{log.action_type?.replace('_', ' ')}</div>
                              <time className="font-caveat font-medium text-primary-600 text-[10px]">{new Date(log.created_at).toLocaleDateString()}</time>
                            </div>
                            <div className="text-zinc-500 text-[10px]">{log.details?.description ?? 'System event recorded.'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
