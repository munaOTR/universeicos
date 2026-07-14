import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@universe/ui'
import { getSupabaseClient } from '@universe/database'
import { toast } from 'sonner' 

const supabase = getSupabaseClient()

type Campaign = {
  id: string
  name: string
  subject: string
  status: string
  priority: string
  sent_count: number
  scheduled_at: string | null
  created_at: string
  template_id: string | null
}

type Template = { id: string; name: string; slug: string }
type Audience = { id: string; name: string; description: string }

const STATUS_COLORS: Record<string, string> = {
  draft:     'bg-zinc-100 text-zinc-600',
  scheduled: 'bg-blue-100 text-blue-700',
  sending:   'bg-amber-100 text-amber-700',
  sent:      'bg-emerald-100 text-emerald-700',
  archived:  'bg-zinc-200 text-zinc-500',
}

export function CampaignsTab() {
  const [campaigns,    setCampaigns]    = useState<Campaign[]>([])
  const [templates,    setTemplates]    = useState<Template[]>([])
  const [audiences,    setAudiences]    = useState<Audience[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showForm,     setShowForm]     = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting,     setDeleting]     = useState(false)

  const [form, setForm] = useState({
    name: '', subject: '', template_id: '', audience_id: '',
    priority: 'bulk', scheduled_at: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    const [ca, te, au] = await Promise.all([
      supabase.from('email_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('email_templates').select('id,name,slug').eq('is_active', true),
      supabase.from('audiences').select('id,name,description'),
    ])
    if (ca.data) setCampaigns(ca.data)
    if (te.data) setTemplates(te.data)
    if (au.data) setAudiences(au.data)
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!form.name || !form.subject) {
      toast.error('Name and subject are required')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.from('email_campaigns').insert({
      name:         form.name,
      subject:      form.subject,
      template_id:  form.template_id || null,
      audience:     form.audience_id || 'all',
      priority:     form.priority,
      status:       form.scheduled_at ? 'scheduled' : 'draft',
      scheduled_at: form.scheduled_at || null,
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Campaign created!')
      setShowForm(false)
      setForm({ name: '', subject: '', template_id: '', audience_id: '', priority: 'bulk', scheduled_at: '' })
      load()
    }
    setSubmitting(false)
  }

  const archive = async (id: string) => {
    await supabase.from('email_campaigns').update({ status: 'archived' }).eq('id', id)
    load()
  }

  const duplicate = async (c: Campaign) => {
    await supabase.from('email_campaigns').insert({
      name: `${c.name} (Copy)`, subject: c.subject,
      template_id: c.template_id, status: 'draft', priority: c.priority,
    })
    toast.success('Campaign duplicated')
    load()
  }

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return
    const campaign = campaigns.find(c => c.id === confirmDelete)
    if (campaign && (campaign.status === 'sending' || campaign.status === 'sent')) {
      toast.error('Cannot delete a campaign that has already been sent or is currently sending.')
      setConfirmDelete(null)
      return
    }
    setDeleting(true)
    const { error } = await supabase.from('email_campaigns').delete().eq('id', confirmDelete)
    if (error) {
      toast.error('Failed to delete campaign', { description: error.message })
    } else {
      toast.success('Campaign deleted')
      setCampaigns(prev => prev.filter(c => c.id !== confirmDelete))
    }
    setConfirmDelete(null)
    setDeleting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Campaigns</h2>
          <p className="text-sm text-zinc-500">Create and manage email broadcast campaigns.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Campaign'}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="border-primary-200 bg-primary-50/30">
          <CardHeader><CardTitle className="text-base">New Campaign</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Campaign Name *</label>
                <input
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. July Product Update"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Email Subject *</label>
                <input
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Big news from Universe 🚀"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Email Template</label>
                <select
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={form.template_id}
                  onChange={e => setForm(f => ({ ...f, template_id: e.target.value }))}
                >
                  <option value="">Select a template…</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Audience</label>
                <select
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={form.audience_id}
                  onChange={e => setForm(f => ({ ...f, audience_id: e.target.value }))}
                >
                  <option value="">All Users</option>
                  {audiences.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Priority</label>
                <select
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                >
                  <option value="bulk">Bulk</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Schedule (optional)</label>
                <input
                  type="datetime-local"
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={form.scheduled_at}
                  onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Campaign'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Banner */}
      {confirmDelete && (
        <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-red-800">Delete campaign permanently?</p>
            <p className="text-xs text-red-600 mt-0.5">
              "{campaigns.find(c => c.id === confirmDelete)?.name}" will be permanently removed. This cannot be undone.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setConfirmDelete(null)}
              className="text-xs font-medium text-zinc-600 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirmed}
              disabled={deleting}
              className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              {deleting ? 'Deleting…' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      )}

      {/* Campaign List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-zinc-500">Loading campaigns…</div>
          ) : campaigns.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-zinc-400 text-sm">No campaigns yet. Create your first one above.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-100">
                <tr>
                  <th className="px-4 py-3 text-left">Campaign</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-right">Sent</th>
                  <th className="px-4 py-3 text-left">Scheduled</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900">{c.name}</div>
                      <div className="text-xs text-zinc-400 truncate max-w-[220px]">{c.subject}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[c.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-zinc-600">{c.priority}</td>
                    <td className="px-4 py-3 text-right font-mono">{c.sent_count?.toLocaleString() ?? 0}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => duplicate(c)} className="text-xs text-zinc-500 hover:text-zinc-900 px-2 py-1 rounded hover:bg-zinc-100">
                          Duplicate
                        </button>
                        {c.status !== 'archived' && (
                          <button onClick={() => archive(c.id)} className="text-xs text-zinc-400 hover:text-amber-700 px-2 py-1 rounded hover:bg-amber-50">
                            Archive
                          </button>
                        )}
                        {(c.status === 'draft' || c.status === 'archived') && (
                          <button
                            onClick={() => setConfirmDelete(c.id)}
                            className="text-xs text-zinc-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
