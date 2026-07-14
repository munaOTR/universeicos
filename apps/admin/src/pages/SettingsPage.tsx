import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@universe/database'
import { PageHeader } from '../components/shared/PageHeader'
import { Button, toast } from '@universe/ui'
import { Settings01Icon, Alert02Icon } from 'hugeicons-react'

interface Setting {
  key: string
  value: string | boolean | number
  type: 'string' | 'boolean' | 'number'
}

const DEFAULT_SETTINGS: Record<string, Setting[]> = {
  'General': [
    { key: 'app_name', value: 'Universe', type: 'string' },
    { key: 'support_email', value: 'hello@rutherkingconsult.co.uk', type: 'string' },
    { key: 'maintenance_mode', value: false, type: 'boolean' },
  ],
  'Referral Engine': [
    { key: 'referral_points_reward', value: 100, type: 'number' },
    { key: 'max_referrals_per_user', value: 50, type: 'number' },
    { key: 'fraud_detection_enabled', value: true, type: 'boolean' },
  ],
  'Leaderboard': [
    { key: 'leaderboard_page_size', value: 50, type: 'number' },
    { key: 'survey_completion_points', value: 50, type: 'number' },
    { key: 'profile_complete_points', value: 25, type: 'number' },
  ],
  'Email': [
    { key: 'email_sender_name', value: 'Universe Team', type: 'string' },
    { key: 'email_sender_address', value: 'noreply@rutherkingconsult.co.uk', type: 'string' },
    { key: 'email_notifications_enabled', value: true, type: 'boolean' },
  ],
  'Security': [
    { key: 'require_email_verification', value: true, type: 'boolean' },
    { key: 'session_timeout_hours', value: 24, type: 'number' },
    { key: 'max_login_attempts', value: 5, type: 'number' },
  ],
  'Feature Flags': [
    { key: 'feature_marketplace', value: false, type: 'boolean' },
    { key: 'feature_study_hub', value: false, type: 'boolean' },
    { key: 'feature_messaging', value: false, type: 'boolean' },
    { key: 'feature_housing', value: false, type: 'boolean' },
    { key: 'feature_jobs', value: false, type: 'boolean' },
    { key: 'feature_ai_assistant', value: false, type: 'boolean' },
  ],
}

const RESET_CHECKLIST = [
  { id: 'students', label: 'All student accounts and their Supabase Auth records will be permanently deleted' },
  { id: 'waitlist', label: 'The entire waitlist will be cleared' },
  { id: 'referrals', label: 'All referral records will be removed' },
  { id: 'analytics', label: 'Analytics events, email logs, and audit history will be wiped' },
  { id: 'queue', label: 'Email queue and communication events will be cleared' },
  { id: 'campaigns', label: 'Draft and archived email campaigns will be deleted' },
  { id: 'preserved', label: 'I understand admin accounts, templates, and settings will be PRESERVED' },
]

export function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, Setting[]>>(DEFAULT_SETTINGS)
  const [activeSection, setActiveSection] = useState('General')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Reset state
  const [resetStep, setResetStep] = useState<'idle' | 'checklist' | 'confirm'>('idle')
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [confirmPhrase, setConfirmPhrase] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetResult, setResetResult] = useState<Record<string, number> | null>(null)

  const allChecked = RESET_CHECKLIST.every(item => checkedItems.has(item.id))
  const phraseCorrect = confirmPhrase.trim() === 'RESET UNIVERSE'

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true)
      try {
        const supabase = getSupabaseClient()
        const { data } = await supabase.from('settings').select('*')
        if (data && data.length > 0) {
          const merged = { ...DEFAULT_SETTINGS }
          data.forEach((row: any) => {
            Object.entries(merged).forEach(([section, items]) => {
              merged[section] = items.map(item =>
                item.key === row.key ? { ...item, value: row.value } : item
              )
            })
          })
          setSettings(merged)
        }
      } catch (e) {
        console.warn('Settings table may not exist yet, using defaults', e)
      }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  const updateSetting = (section: string, key: string, value: string | boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [section]: prev[section].map(s => s.key === key ? { ...s, value } : s)
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = getSupabaseClient()
      const allSettings = Object.values(settings).flat()
      for (const s of allSettings) {
        await supabase.from('settings').upsert({ key: s.key, value: String(s.value), type: s.type }, { onConflict: 'key' })
      }
      toast.success('Settings saved successfully')
    } catch (e: any) {
      toast.error('Failed to save settings', { description: e.message })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!phraseCorrect || !allChecked) return
    setResetting(true)
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.rpc('reset_site_for_launch', {
        p_confirmation: 'RESET UNIVERSE'
      })
      if (error) throw error
      setResetResult(data.summary)
      setResetStep('idle')
      setCheckedItems(new Set())
      setConfirmPhrase('')
      toast.success('Site reset complete. Platform is clean for launch! 🚀')
    } catch (e: any) {
      toast.error('Reset failed', { description: e.message })
    } finally {
      setResetting(false)
    }
  }

  const cancelReset = () => {
    setResetStep('idle')
    setCheckedItems(new Set())
    setConfirmPhrase('')
  }

  const isDangerZone = activeSection === 'Danger Zone'

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        description="Configure platform-wide settings, feature flags, and system behavior."
        action={
          !isDangerZone ? (
            <Button onClick={handleSave} disabled={saving}>
              <Settings01Icon size={16} className="mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          ) : undefined
        }
      />

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 shrink-0">
          <nav className="space-y-1">
            {Object.keys(settings).map(section => (
              <button
                key={section}
                onClick={() => { setActiveSection(section); cancelReset() }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                {section}
              </button>
            ))}
            <div className="pt-3 pb-1 px-3">
              <div className="border-t border-red-100" />
            </div>
            <button
              onClick={() => { setActiveSection('Danger Zone'); cancelReset() }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDangerZone
                  ? 'bg-red-600 text-white'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              ⚠ Danger Zone
            </button>
          </nav>
        </div>

        {/* Settings Panel */}
        <div className="flex-1 bg-white border border-zinc-200 rounded-xl shadow-sm divide-y divide-zinc-100 overflow-hidden">

          {isDangerZone ? (
            <div>
              <div className="p-4 border-b border-red-100 bg-red-50/40">
                <h3 className="font-semibold text-red-800 flex items-center gap-2">
                  <Alert02Icon size={16} className="text-red-500" />
                  Danger Zone
                </h3>
                <p className="text-xs text-red-600 mt-0.5">
                  These actions are irreversible. Proceed only when you are absolutely certain.
                </p>
              </div>

              <div className="p-6 space-y-6">

                {/* Reset Result Summary */}
                {resetResult && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-emerald-800 mb-3">✓ Reset completed successfully</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(resetResult).map(([key, count]) => (
                        <div key={key} className="flex justify-between text-xs text-emerald-700 bg-white rounded-lg px-3 py-1.5 border border-emerald-100">
                          <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="font-mono font-bold">{count}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setResetResult(null)} className="text-xs text-emerald-600 mt-3 hover:underline">
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Pre-Launch Reset Card */}
                <div className="border border-red-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-red-100">
                    <h4 className="font-semibold text-zinc-900 text-sm">Pre-Launch Site Reset</h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      Cleans all test data — students, waitlist, referrals, email queue, analytics —
                      so the platform is completely fresh for your public launch.
                      Admin accounts, email templates, brand settings, and system configuration are preserved.
                    </p>
                  </div>

                  {resetStep === 'idle' && (
                    <div className="px-5 py-4 flex items-center justify-between">
                      <div className="text-xs text-zinc-500 space-y-0.5">
                        <p>✓ Preserves: Admin accounts, templates, settings</p>
                        <p>✗ Deletes: Students, waitlist, referrals, queue, analytics</p>
                      </div>
                      <button
                        onClick={() => setResetStep('checklist')}
                        className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
                      >
                        Begin Reset
                      </button>
                    </div>
                  )}

                  {resetStep === 'checklist' && (
                    <div className="px-5 py-5 space-y-4">
                      <p className="text-sm font-medium text-zinc-800">
                        Step 1 of 2 — Acknowledge what will be deleted
                      </p>
                      <div className="space-y-2.5">
                        {RESET_CHECKLIST.map(item => (
                          <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={checkedItems.has(item.id)}
                              onChange={() => setCheckedItems(prev => {
                                const next = new Set(prev)
                                next.has(item.id) ? next.delete(item.id) : next.add(item.id)
                                return next
                              })}
                              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-xs text-zinc-700 group-hover:text-zinc-900 leading-snug">
                              {item.label}
                            </span>
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => setResetStep('confirm')}
                          disabled={!allChecked}
                          className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
                        >
                          Continue to Confirmation →
                        </button>
                        <button
                          onClick={cancelReset}
                          className="text-sm text-zinc-600 hover:text-zinc-900 px-4 py-2 rounded-lg hover:bg-zinc-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {resetStep === 'confirm' && (
                    <div className="px-5 py-5 space-y-4 bg-red-50/30">
                      <p className="text-sm font-medium text-zinc-800">
                        Step 2 of 2 — Type the confirmation phrase
                      </p>
                      <p className="text-xs text-zinc-500">
                        To confirm this irreversible action, type exactly:
                      </p>
                      <code className="block text-sm font-mono font-bold text-red-700 bg-red-100 px-3 py-2 rounded-lg">
                        RESET UNIVERSE
                      </code>
                      <input
                        type="text"
                        value={confirmPhrase}
                        onChange={e => setConfirmPhrase(e.target.value)}
                        placeholder="Type the phrase above…"
                        className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 transition-colors ${
                          confirmPhrase.length > 0 && !phraseCorrect
                            ? 'border-red-300 focus:ring-red-300 bg-red-50'
                            : phraseCorrect
                            ? 'border-emerald-400 focus:ring-emerald-300 bg-emerald-50'
                            : 'border-zinc-200 focus:ring-red-300'
                        }`}
                      />
                      {confirmPhrase.length > 0 && !phraseCorrect && (
                        <p className="text-xs text-red-500">Phrase does not match. Type exactly: RESET UNIVERSE</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleReset}
                          disabled={!phraseCorrect || resetting}
                          className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2 rounded-lg transition-colors"
                        >
                          {resetting ? '⏳ Resetting platform…' : '🚀 Execute Reset'}
                        </button>
                        <button
                          onClick={cancelReset}
                          disabled={resetting}
                          className="text-sm text-zinc-600 hover:text-zinc-900 px-4 py-2 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-40"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

          ) : (
            <>
              <div className="p-4 border-b border-zinc-100">
                <h3 className="font-semibold text-zinc-900">{activeSection}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Configure {activeSection.toLowerCase()} settings</p>
              </div>

              {loading ? (
                <div className="p-8 text-center text-zinc-500 text-sm">Loading settings...</div>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {(settings[activeSection] || []).map(setting => (
                    <div key={setting.key} className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-sm font-medium text-zinc-900 capitalize">{setting.key.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-zinc-400 font-mono">{setting.key}</p>
                      </div>
                      <div className="shrink-0">
                        {setting.type === 'boolean' ? (
                          <button
                            onClick={() => updateSetting(activeSection, setting.key, !setting.value)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              setting.value ? 'bg-primary-600' : 'bg-zinc-200'
                            }`}
                          >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                              setting.value ? 'translate-x-4.5' : 'translate-x-0.5'
                            }`} />
                          </button>
                        ) : setting.type === 'number' ? (
                          <input
                            type="number"
                            value={setting.value as number}
                            onChange={e => updateSetting(activeSection, setting.key, Number(e.target.value))}
                            className="w-24 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-right focus:border-primary-500 focus:outline-none"
                          />
                        ) : (
                          <input
                            type="text"
                            value={setting.value as string}
                            onChange={e => updateSetting(activeSection, setting.key, e.target.value)}
                            className="w-52 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
