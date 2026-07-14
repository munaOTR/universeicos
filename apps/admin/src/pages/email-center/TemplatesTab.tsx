import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@universe/ui'
import { getSupabaseClient } from '@universe/database'
import { renderToStaticMarkup } from 'react-dom/server'
import { ViewIcon, Cancel01Icon } from 'hugeicons-react'

// Import all templates
import { 
  WelcomeEmail, VerifyEmail, ResetPasswordEmail, MagicLinkEmail,
  PasswordChangedEmail, AdminInvitationEmail, AccountActivatedEmail, AccountSuspendedEmail,
  WaitlistConfirmationEmail, ReferralSuccessEmail, ReferralMilestoneEmail, BetaInvitationEmail,
  AnnouncementEmail, LaunchAnnouncementEmail, SurveyInvitationEmail
} from '@universe/email'

const REGISTRY: Record<string, any> = {
  'welcome': WelcomeEmail,
  'verify-email': VerifyEmail,
  'reset-password': ResetPasswordEmail,
  'magic-link': MagicLinkEmail,
  'password-changed': PasswordChangedEmail,
  'admin-invitation': AdminInvitationEmail,
  'account-activated': AccountActivatedEmail,
  'account-suspended': AccountSuspendedEmail,
  'waitlist-confirm': WaitlistConfirmationEmail,
  'referral-success': ReferralSuccessEmail,
  'referral-milestone': ReferralMilestoneEmail,
  'beta-invitation': BetaInvitationEmail,
  'announcement': AnnouncementEmail,
  'launch-announcement': LaunchAnnouncementEmail,
  'survey-invitation': SurveyInvitationEmail,
}

type Template = {
  id: string
  name: string
  slug: string
  subject: string
  category: string
  priority: string
  component_name: string
  is_system: boolean
  is_active: boolean
  updated_at: string
}

const CATEGORY_COLORS: Record<string, string> = {
  auth:          'bg-violet-100 text-violet-700',
  security:      'bg-red-100 text-red-700',
  transactional: 'bg-blue-100 text-blue-700',
  marketing:     'bg-emerald-100 text-emerald-700',
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'text-red-600',
  high:     'text-amber-600',
  medium:   'text-blue-600',
  low:      'text-zinc-500',
  bulk:     'text-zinc-400',
}

export function TemplatesTab() {
  const supabase = getSupabaseClient()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState('all')

  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('email_templates')
        .select('*')
        .order('category', { ascending: true })
      if (data) setTemplates(data)
      setLoading(false)
    }
    load()
  }, [])

  const handlePreview = (template: Template) => {
    const Component = REGISTRY[template.slug]
    if (Component) {
      try {
        // Create dummy data for preview based on typical variables
        const dummyProps = {
          name: 'Tobi',
          actionUrl: 'https://universeicos.app/verify',
          magicLinkUrl: 'https://universeicos.app/login?token=abc',
          referralUrl: 'https://universeicos.app/join?ref=tobi123',
          invitationUrl: 'https://universeicos.app/invite?code=123',
          surveyUrl: 'https://universeicos.app/survey/123',
          platformName: 'Universe',
          milestoneName: 'Campus Ambassador',
          referralsCount: 5,
        }
        const html = renderToStaticMarkup(<Component {...dummyProps} />)
        // Ensure doctype is prepended for proper rendering
        setPreviewHtml(`<!DOCTYPE html>${html}`)
        setPreviewTemplate(template)
      } catch (err) {
        console.error('Preview error', err)
        alert('Failed to render preview. Check console for details.')
      }
    } else {
      alert(`Component not found in registry for slug: ${template.slug}`)
    }
  }

  const filtered = filter === 'all'
    ? templates
    : templates.filter(t => t.category === filter)

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))]

  return (
    <div className="space-y-5 relative">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Template Library</h2>
        <p className="text-sm text-zinc-500">All registered React Email templates. System templates cannot be deleted.</p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              filter === cat
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
            }`}
          >
            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading templates…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(t => (
            <Card key={t.id} className={`border ${!t.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-zinc-900 text-sm leading-tight">{t.name}</h3>
                  <div className="flex gap-1 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${CATEGORY_COLORS[t.category] ?? 'bg-zinc-100 text-zinc-600'}`}>
                      {t.category}
                    </span>
                    {t.is_system && (
                      <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded">System</span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-zinc-500 italic truncate">{t.subject}</div>

                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-100">
                  <span className="font-mono">{t.slug}</span>
                  <span className={`font-semibold ${PRIORITY_COLORS[t.priority] ?? ''}`}>
                    {t.priority}
                  </span>
                </div>

                <div className="text-xs text-zinc-400 flex items-center justify-between">
                  <span>Component: <span className="font-mono text-zinc-600">{t.component_name}</span></span>
                  <button onClick={() => handlePreview(t)} className="text-primary-600 hover:text-primary-800 p-1 flex items-center gap-1 bg-primary-50 rounded text-[10px] font-bold">
                    <ViewIcon className="w-3 h-3" /> Preview
                  </button>
                </div>

                <div className="text-xs text-zinc-300">
                  Updated {new Date(t.updated_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8">
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-zinc-50 shrink-0">
              <div>
                <h3 className="font-bold text-lg text-zinc-900">{previewTemplate.name}</h3>
                <p className="text-sm text-zinc-500 font-medium mt-0.5">Subject: <span className="text-zinc-700">"{previewTemplate.subject}"</span></p>
              </div>
              <button 
                onClick={() => setPreviewTemplate(null)}
                className="p-2 rounded-full hover:bg-zinc-200 text-zinc-500 transition-colors"
              >
                <Cancel01Icon className="w-6 h-6" />
              </button>
            </div>
            
            {/* Body */}
            <div className="flex-1 bg-zinc-100 p-4 sm:p-8 overflow-hidden flex justify-center">
              <div className="bg-white w-full max-w-[600px] h-full shadow-lg border rounded-lg overflow-hidden flex flex-col">
                <div className="bg-zinc-800 text-zinc-200 px-4 py-2 text-xs flex justify-between shrink-0">
                  <span>Previewing as HTML Email</span>
                  <span>600px width</span>
                </div>
                <iframe 
                  className="w-full h-full bg-white flex-1"
                  srcDoc={previewHtml}
                  title="Email Preview"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

