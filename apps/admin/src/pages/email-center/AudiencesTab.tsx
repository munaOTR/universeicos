import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@universe/ui'
import { getSupabaseClient } from '@universe/database'
import { toast } from 'sonner'

const supabase = getSupabaseClient()

type Audience = {
  id: string
  name: string
  description: string
  filters: Record<string, any>
  is_dynamic: boolean
  created_at: string
}

type FilterRule = {
  field: string
  operator: string
  value: string
}

const FILTER_FIELDS = [
  { value: 'role',          label: 'Role' },
  { value: 'status',        label: 'Account Status' },
  { value: 'university',    label: 'University' },
  { value: 'min_referrals', label: 'Min Referrals' },
  { value: 'max_referrals', label: 'Max Referrals' },
]

const OPERATORS = [
  { value: 'eq',  label: 'equals' },
  { value: 'gte', label: 'greater than or equal' },
  { value: 'lte', label: 'less than or equal' },
]

export function AudiencesTab() {
  const [audiences,  setAudiences]  = useState<Audience[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [estimating, setEstimating] = useState(false)
  const [estimate,   setEstimate]   = useState<number | null>(null)

  const [form, setForm] = useState({ name: '', description: '' })
  const [rules, setRules] = useState<FilterRule[]>([{ field: 'role', operator: 'eq', value: 'student' }])

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('audiences')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setAudiences(data)
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  const addRule = () => setRules(r => [...r, { field: 'role', operator: 'eq', value: '' }])
  const removeRule = (i: number) => setRules(r => r.filter((_, idx) => idx !== i))
  const updateRule = (i: number, key: keyof FilterRule, val: string) =>
    setRules(r => r.map((rule, idx) => idx === i ? { ...rule, [key]: val } : rule))

  // Build a JSON filter object from rules
  const buildFilters = () => {
    const filters: Record<string, any> = {}
    for (const rule of rules) {
      if (!rule.value) continue
      if (rule.operator === 'eq') {
        filters[rule.field] = rule.value
      } else {
        filters[`${rule.operator}_${rule.field}`] = Number(rule.value) || rule.value
      }
    }
    return filters
  }

  const estimateAudience = async () => {
    setEstimating(true)
    setEstimate(null)
    const filters = buildFilters()
    // Build a query based on filters
    let query = supabase.from('profiles').select('id', { count: 'exact', head: true })
    if (filters.role && filters.role !== 'any') {
      query = query.eq('role', filters.role)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    const { count } = await query
    setEstimate(count ?? 0)
    setEstimating(false)
  }

  const handleCreate = async () => {
    if (!form.name) { toast.error('Name is required'); return }
    setSubmitting(true)
    const { error } = await supabase.from('audiences').insert({
      name:        form.name,
      description: form.description,
      filters:     buildFilters(),
      is_dynamic:  true,
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Audience created!')
      setShowForm(false)
      setForm({ name: '', description: '' })
      setRules([{ field: 'role', operator: 'eq', value: 'student' }])
      setEstimate(null)
      load()
    }
    setSubmitting(false)
  }

  const deleteAudience = async (id: string) => {
    const { error } = await supabase.from('audiences').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Audience deleted')
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Audiences</h2>
          <p className="text-sm text-zinc-500">Define reusable recipient segments for campaigns.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Audience'}
        </Button>
      </div>

      {/* Builder Form */}
      {showForm && (
        <Card className="border-primary-200 bg-primary-50/30">
          <CardHeader><CardTitle className="text-base">Audience Builder</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Audience Name *</label>
                <input
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Beta Qualified Students"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
                <input
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Optional description"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            {/* Filter Rules */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-zinc-700">Filter Rules</label>
                <button onClick={addRule} className="text-xs text-primary-600 hover:underline">+ Add Rule</button>
              </div>
              <div className="space-y-2">
                {rules.map((rule, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select
                      className="border border-zinc-200 rounded-lg px-3 py-2 text-sm flex-1"
                      value={rule.field}
                      onChange={e => updateRule(i, 'field', e.target.value)}
                    >
                      {FILTER_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                    <select
                      className="border border-zinc-200 rounded-lg px-3 py-2 text-sm w-36"
                      value={rule.operator}
                      onChange={e => updateRule(i, 'operator', e.target.value)}
                    >
                      {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <input
                      className="border border-zinc-200 rounded-lg px-3 py-2 text-sm flex-1"
                      placeholder="value"
                      value={rule.value}
                      onChange={e => updateRule(i, 'value', e.target.value)}
                    />
                    {rules.length > 1 && (
                      <button onClick={() => removeRule(i)} className="text-zinc-400 hover:text-red-500 text-xs px-2">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Estimate */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={estimateAudience} disabled={estimating}>
                {estimating ? 'Estimating…' : 'Estimate Size'}
              </Button>
              {estimate !== null && (
                <span className="text-sm font-medium text-zinc-700">
                  ~<span className="text-primary-600 font-bold">{estimate.toLocaleString()}</span> recipients
                </span>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? 'Saving…' : 'Create Audience'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audiences List */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-sm text-zinc-500 col-span-3">Loading audiences…</p>
        ) : audiences.length === 0 ? (
          <div className="col-span-3 py-12 text-center rounded-lg border border-dashed border-zinc-200">
            <p className="text-zinc-400 text-sm">No custom audiences yet.</p>
          </div>
        ) : (
          audiences.map(a => (
            <Card key={a.id} className="relative group">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-900 text-sm">{a.name}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{a.description || 'No description'}</p>
                  </div>
                  {a.is_dynamic && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Dynamic</span>
                  )}
                </div>
                <div className="mt-3 bg-zinc-50 rounded-md p-2">
                  <pre className="text-xs text-zinc-500 font-mono overflow-auto max-h-16">
                    {JSON.stringify(a.filters, null, 2)}
                  </pre>
                </div>
                <button
                  onClick={() => deleteAudience(a.id)}
                  className="mt-2 text-xs text-zinc-300 hover:text-red-500 transition-colors"
                >
                  Delete
                </button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
