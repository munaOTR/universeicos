/**
 * BulkReminderModal
 *
 * Confirmation dialog for sending verification reminders to all eligible users.
 * Shows: eligible count, estimated quota usage, confirmation workflow.
 */
import { useState, useEffect } from 'react'
import { env } from '../../config/env'
import { getSupabaseClient } from '@universe/database'
import { Button, Spinner, toast } from '@universe/ui'
import { Cancel01Icon, Mail01Icon, CheckmarkCircle01Icon, AlertCircleIcon } from 'hugeicons-react'

interface EligibleUser {
  id: string
  email: string
  full_name: string | null
  university: string | null
}

interface QuotaInfo {
  daily_limit: number
  daily_used: number
  remaining: number
}

interface BulkReminderModalProps {
  onClose: () => void
  onSuccess: (sentCount: number) => void
}

type Step = 'preview' | 'confirming' | 'sending' | 'done' | 'error'

export function BulkReminderModal({ onClose, onSuccess }: BulkReminderModalProps) {
  const [step, setStep] = useState<Step>('preview')
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([])
  const [quota, setQuota] = useState<QuotaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [sentCount, setSentCount] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true)
      const supabase = getSupabaseClient()
      const [{ data: users }, { data: quotaData }] = await Promise.all([
        supabase.rpc('get_verification_eligible_users'),
        supabase
          .from('provider_quotas')
          .select('daily_limit, daily_used')
          .eq('provider_name', 'resend')
          .single(),
      ])
      if (users) setEligibleUsers(users)
      if (quotaData)
        setQuota({ ...quotaData, remaining: quotaData.daily_limit - quotaData.daily_used })
      setLoading(false)
    }
    fetchPreview()
  }, [])

  const handleSend = async () => {
    setStep('sending')
    try {
      const supabase = getSupabaseClient()
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token
      if (!token) throw new Error('Not authenticated')

      const response = await fetch(`${env.supabaseUrl}/functions/v1/send-verification-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: env.supabaseAnonKey,
        },
        body: JSON.stringify({
          user_ids: eligibleUsers.map(u => u.id),
          trigger_source: 'bulk',
        }),
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error ?? 'Unknown error')

      const sent = result.sent ?? 0

      if (sent === 0 && result.results?.length > 0) {
        // All users failed — surface the first reason for debugging
        const firstError = result.results[0]?.error ?? 'Unknown reason'
        throw new Error(`No emails sent. First failure reason: ${firstError}`)
      }

      setSentCount(sent)
      setStep('done')
      onSuccess(sent)
    } catch (e: any) {
      setErrorMsg(e.message)
      setStep('error')
    }
  }

  const quotaWillExceed = quota ? eligibleUsers.length > quota.remaining : false

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-zinc-900/30 backdrop-blur-sm"
        onClick={step !== 'sending' ? onClose : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
                <Mail01Icon size={18} className="text-primary-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Send Bulk Reminders</h2>
                <p className="text-xs text-zinc-500">Verification reminder campaign</p>
              </div>
            </div>
            {step !== 'sending' && (
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <Cancel01Icon size={18} />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Spinner size="lg" className="text-primary-500" />
                <p className="text-sm text-zinc-500">Calculating eligible recipients…</p>
              </div>
            ) : step === 'preview' || step === 'confirming' ? (
              <div className="space-y-5">
                {/* Recipient count */}
                <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Eligible recipients</span>
                    <span className="font-bold text-zinc-900">
                      {eligibleUsers.length.toLocaleString()}
                    </span>
                  </div>
                  {quota && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Daily quota remaining</span>
                        <span
                          className={`font-semibold ${quotaWillExceed ? 'text-red-600' : 'text-emerald-600'}`}
                        >
                          {quota.remaining.toLocaleString()} / {quota.daily_limit.toLocaleString()}
                        </span>
                      </div>
                      {/* Quota bar */}
                      <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${quotaWillExceed ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{
                            width: `${Math.min(((quota.daily_used + eligibleUsers.length) / quota.daily_limit) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>

                {quotaWillExceed && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                    <AlertCircleIcon size={16} className="shrink-0 mt-0.5" />
                    <span>
                      Sending to all eligible users would exceed today&apos;s email quota. Emails
                      will be queued and processed as quota allows.
                    </span>
                  </div>
                )}

                {eligibleUsers.length === 0 ? (
                  <div className="text-center py-4">
                    <CheckmarkCircle01Icon size={32} className="text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-zinc-700">No eligible users</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      All users are either verified or were recently reminded.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600">
                    A personalized verification reminder will be sent to{' '}
                    <strong>{eligibleUsers.length.toLocaleString()} students</strong> who registered
                    more than 24 hours ago and haven't verified their email.
                  </p>
                )}
              </div>
            ) : step === 'sending' ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Spinner size="lg" className="text-primary-500" />
                <p className="text-sm text-zinc-700 font-medium">Queuing reminder emails…</p>
                <p className="text-xs text-zinc-500">This may take a moment</p>
              </div>
            ) : step === 'done' ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CheckmarkCircle01Icon size={28} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-base font-semibold text-zinc-900">Reminders Queued</p>
                  <p className="text-sm text-zinc-500 mt-1">
                    <strong>{sentCount.toLocaleString()}</strong> reminder emails have been added to
                    the queue and will be delivered shortly.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
                  <AlertCircleIcon size={28} className="text-red-600" />
                </div>
                <div>
                  <p className="text-base font-semibold text-zinc-900">Something went wrong</p>
                  <p className="text-sm text-zinc-500 mt-1">{errorMsg}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            {(step === 'preview' || step === 'confirming') && (
              <>
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handleSend}
                  disabled={eligibleUsers.length === 0}
                >
                  Send {eligibleUsers.length > 0 ? `${eligibleUsers.length.toLocaleString()} ` : ''}
                  Reminders
                </Button>
              </>
            )}
            {(step === 'done' || step === 'error') && (
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
