import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from '@universe/ui'
import { getSupabaseClient } from '@universe/database'
import { useAuth } from '@universe/auth'
import { toast } from 'sonner'

type CategoryPref = {
  category: string
  label: string
  description: string
  channel: string
  isEnabled: boolean
}

export function SettingsPage() {
  const { user } = useAuth()
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState<CategoryPref[]>([
    { category: 'marketing', label: 'Marketing & Updates', description: 'Receive product news and major announcements.', channel: 'email', isEnabled: true },
    { category: 'referral_updates', label: 'Referral Alerts', description: 'Get notified when someone joins using your link.', channel: 'email', isEnabled: true },
    { category: 'surveys', label: 'Surveys', description: 'Invitations to give feedback and earn points.', channel: 'email', isEnabled: true },
    { category: 'beta_updates', label: 'Beta Program', description: 'Updates on beta access and exclusive features.', channel: 'email', isEnabled: true },
  ])

  useEffect(() => {
    if (!user) return

    const loadPrefs = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('communication_preferences')
        .select('*')
        .eq('user_id', user.id)

      if (!error && data) {
        setPrefs(current => current.map(p => {
          const remote = data.find(d => d.category === p.category && d.channel === p.channel)
          if (remote) {
            return { ...p, isEnabled: remote.is_enabled }
          }
          return p // default is true as initialized
        }))
      }
      setLoading(false)
    }

    loadPrefs()
  }, [user, supabase])

  const togglePref = async (index: number) => {
    if (!user) return
    const target = prefs[index]
    const newVal = !target.isEnabled
    
    // Optimistic update
    const newPrefs = [...prefs]
    newPrefs[index].isEnabled = newVal
    setPrefs(newPrefs)

    setSaving(true)
    const { error } = await supabase
      .from('communication_preferences')
      .upsert({
        user_id: user.id,
        category: target.category,
        channel: target.channel,
        is_enabled: newVal,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, category, channel' })

    if (error) {
      toast.error('Failed to update preference')
      // Revert optimistic
      const reverted = [...prefs]
      reverted[index].isEnabled = !newVal
      setPrefs(reverted)
    } else {
      toast.success('Preferences updated')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your account preferences and security.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Communication Preferences</CardTitle>
          <CardDescription>
            Choose what updates you want to receive. Critical security and account emails cannot be disabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading preferences...</p>
          ) : (
            prefs.map((pref, i) => (
              <div key={`${pref.category}-${pref.channel}`} className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{pref.label}</p>
                  <p className="text-xs text-zinc-500">{pref.description}</p>
                </div>
                <button
                  disabled={saving}
                  onClick={() => togglePref(i)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${pref.isEnabled ? 'bg-primary-600' : 'bg-zinc-200'} ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="sr-only">Toggle {pref.label}</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${pref.isEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-red-100">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-900">Delete Account</p>
              <p className="text-xs text-zinc-500">Permanently delete your data and remove access.</p>
            </div>
            <Button variant="destructive" size="sm">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
