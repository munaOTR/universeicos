/**
 * VerificationOverviewCard
 *
 * Large dashboard card showing:
 *  - Verification rate with visual bar
 *  - Verified / Unverified / Eligible KPIs
 *  - Recent verifications list
 *  - Quick-action: Send Bulk Reminders
 */
import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@universe/database'
import { Card, CardHeader, CardTitle, CardContent, Spinner } from '@universe/ui'
import { BulkReminderModal } from '../users/BulkReminderModal'
import { VerificationBadge } from '../users/VerificationBadge'
import {
  CheckmarkCircle01Icon,
  MailOpen01Icon,
  Mail01Icon,
  ArrowRight01Icon,
} from 'hugeicons-react'
import type { VerificationStats } from '@universe/types'

interface RecentVerification {
  id: string
  full_name: string | null
  email: string
  university: string | null
  email_confirmed_at: string
}

export function VerificationOverviewCard() {
  const [stats, setStats]             = useState<VerificationStats | null>(null)
  const [recent, setRecent]           = useState<RecentVerification[]>([])
  const [loading, setLoading]         = useState(true)
  const [showBulkModal, setShowBulkModal] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = getSupabaseClient()
    const [{ data: statsData }, { data: usersData }] = await Promise.all([
      supabase.rpc('get_verification_stats'),
      supabase.rpc('get_users_with_verification_status', { p_limit: 5, p_offset: 0 }),
    ])

    if (statsData) setStats(statsData as VerificationStats)

    // Recent verifications = latest users where email_confirmed_at is not null
    if (usersData) {
      const verified = (usersData as RecentVerification[])
        .filter(u => u.email_confirmed_at)
        .sort((a, b) => new Date(b.email_confirmed_at).getTime() - new Date(a.email_confirmed_at).getTime())
        .slice(0, 5)
      setRecent(verified)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const rate = stats?.verification_rate ?? 0

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">Email Verification Health</CardTitle>
          <button
            onClick={() => setShowBulkModal(true)}
            disabled={loading || (stats?.eligible_for_reminder ?? 0) === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Mail01Icon size={13} />
            Send Reminders
          </button>
        </CardHeader>

        <CardContent className="space-y-5">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner size="lg" className="text-primary-500" />
            </div>
          ) : (
            <>
              {/* Verification Rate Bar */}
              <div className="space-y-2">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-bold text-zinc-900">{rate}%</span>
                    <span className="text-xs text-zinc-500 ml-2">verification rate</span>
                  </div>
                  <span className="text-xs text-zinc-400">
                    {stats?.verified_last_7d ?? 0} verified this week
                  </span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(rate, 100)}%` }}
                  />
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                  <CheckmarkCircle01Icon size={16} className="text-emerald-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-emerald-700">
                    {(stats?.verified_count ?? 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium">Verified</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                  <MailOpen01Icon size={16} className="text-amber-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-amber-700">
                    {(stats?.unverified_count ?? 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-amber-600 font-medium">Unverified</p>
                </div>
                <div className="bg-primary-50 rounded-xl p-3 text-center border border-primary-100">
                  <Mail01Icon size={16} className="text-primary-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-primary-700">
                    {(stats?.eligible_for_reminder ?? 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-primary-600 font-medium">Eligible</p>
                </div>
              </div>

              {/* Recent Verifications */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Recent Verifications
                </p>
                {recent.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-3">No recent verifications.</p>
                ) : (
                  <div className="divide-y divide-zinc-50">
                    {recent.map(user => (
                      <div key={user.id} className="flex items-center justify-between py-2 gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs uppercase shrink-0">
                            {user.full_name?.charAt(0) ?? user.email.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-900 truncate">
                              {user.full_name ?? user.email}
                            </p>
                            <p className="text-[11px] text-zinc-400 truncate">
                              {user.university ?? 'Unknown university'}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <VerificationBadge status="verified" size="sm" />
                          <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                            {new Date(user.email_confirmed_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer stats */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs text-zinc-500">
                <span>{(stats?.reminders_sent_total ?? 0).toLocaleString()} reminders sent total</span>
                <span className="flex items-center gap-1">
                  {(stats?.conversions_total ?? 0).toLocaleString()} conversions
                  <ArrowRight01Icon size={12} />
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {showBulkModal && (
        <BulkReminderModal
          onClose={() => setShowBulkModal(false)}
          onSuccess={(count) => {
            setShowBulkModal(false)
            fetchData()
          }}
        />
      )}
    </>
  )
}
