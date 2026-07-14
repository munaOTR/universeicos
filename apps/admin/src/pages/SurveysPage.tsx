import { useState, useEffect, useMemo } from 'react'
import { getSupabaseClient } from '@universe/database'
import { PageHeader } from '../components/shared/PageHeader'
import { DataTable } from '../components/tables/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Badge, Button, toast } from '@universe/ui'
import { Add01Icon, Cancel01Icon, Message01Icon } from 'hugeicons-react'

interface Survey {
  id: string
  title: string
  description: string | null
  status: string
  target_audience: string | null
  created_at: string
}

interface SurveyQuestion {
  question: string
  type: 'text' | 'multiple_choice' | 'rating'
  options?: string[]
}

function SurveyModal({ existing, onClose, onSuccess }: {
  existing?: Survey | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState(existing?.title || '')
  const [description, setDescription] = useState(existing?.description || '')
  const [audience, setAudience] = useState(existing?.target_audience || 'all')
  const [questions, setQuestions] = useState<SurveyQuestion[]>([{ question: '', type: 'text' }])
  const [loading, setLoading] = useState(false)

  const addQuestion = () => setQuestions(q => [...q, { question: '', type: 'text' }])
  const removeQuestion = (i: number) => setQuestions(q => q.filter((_, idx) => idx !== i))
  const updateQuestion = (i: number, field: keyof SurveyQuestion, value: string) =>
    setQuestions(q => q.map((item, idx) => idx === i ? { ...item, [field]: value } : item))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return
    setLoading(true)
    const supabase = getSupabaseClient()
    const payload = { title, description, target_audience: audience, status: 'draft' }

    let surveyId = existing?.id
    if (existing) {
      const { error } = await supabase.from('surveys').update(payload).eq('id', existing.id)
      if (error) { toast.error('Failed to update survey', { description: error.message }); setLoading(false); return }
    } else {
      const { data, error } = await supabase.from('surveys').insert(payload).select().single()
      if (error) { toast.error('Failed to create survey', { description: error.message }); setLoading(false); return }
      surveyId = data?.id
    }

    // Insert questions
    if (surveyId && questions.some(q => q.question)) {
      const validQuestions = questions.filter(q => q.question.trim())
      await supabase.from('survey_questions').delete().eq('survey_id', surveyId)
      await supabase.from('survey_questions').insert(
        validQuestions.map((q, i) => ({ survey_id: surveyId, question_text: q.question, question_type: q.type, order_index: i }))
      )
    }

    toast.success(existing ? 'Survey updated' : 'Survey created')
    onSuccess()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <Message01Icon size={20} className="text-zinc-500" />
            {existing ? 'Edit Survey' : 'Create Survey'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-lg text-zinc-500"><Cancel01Icon size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">Survey Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="e.g. Platform Feedback Q1 2025" required />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none resize-none"
              placeholder="Brief description of this survey..." />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">Target Audience</label>
            <select value={audience} onChange={e => setAudience(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none">
              <option value="all">All Users</option>
              <option value="waitlist">Waitlist Only</option>
              <option value="students">Signed-up Students</option>
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-zinc-700">Questions</label>
              <button type="button" onClick={addQuestion} className="text-xs text-primary-600 hover:underline">+ Add Question</button>
            </div>
            {questions.map((q, i) => (
              <div key={i} className="flex gap-2 items-start bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                <div className="flex-1 space-y-2">
                  <input type="text" value={q.question} onChange={e => updateQuestion(i, 'question', e.target.value)}
                    className="w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                    placeholder={`Question ${i + 1}`} />
                  <select value={q.type} onChange={e => updateQuestion(i, 'type', e.target.value)}
                    className="rounded-md border border-zinc-200 px-2 py-1.5 text-xs focus:outline-none text-zinc-600">
                    <option value="text">Free Text</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="rating">Rating (1-5)</option>
                  </select>
                </div>
                {questions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(i)} className="text-zinc-400 hover:text-red-500 mt-1">
                    <Cancel01Icon size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : existing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<Survey | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const supabase = getSupabaseClient()
    const { data } = await supabase.from('surveys').select('*').order('created_at', { ascending: false })
    if (data) setSurveys(data as Survey[])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this survey and all its questions?')) return
    const supabase = getSupabaseClient()
    await supabase.from('survey_questions').delete().eq('survey_id', id)
    const { error } = await supabase.from('surveys').delete().eq('id', id)
    if (error) toast.error('Delete failed', { description: error.message })
    else { toast.success('Survey deleted'); fetchData() }
  }

  const handlePublish = async (survey: Survey) => {
    const supabase = getSupabaseClient()
    const newStatus = survey.status === 'published' ? 'draft' : 'published'
    const { error } = await supabase.from('surveys').update({ status: newStatus }).eq('id', survey.id)
    if (error) toast.error('Update failed', { description: error.message })
    else { toast.success(newStatus === 'published' ? 'Survey published' : 'Survey archived'); fetchData() }
  }

  const columns = useMemo<ColumnDef<Survey>[]>(() => [
    {
      accessorKey: 'title',
      header: 'Survey',
      cell: info => (
        <div>
          <p className="font-medium text-zinc-900">{info.getValue() as string}</p>
          <p className="text-xs text-zinc-500 truncate max-w-[200px]">{info.row.original.description || 'No description'}</p>
        </div>
      ),
    },
    {
      accessorKey: 'target_audience',
      header: 'Audience',
      cell: info => <Badge variant="default" className="capitalize">{(info.getValue() as string) || 'All'}</Badge>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: info => {
        const s = info.getValue() as string
        return <Badge variant={s === 'published' ? 'success' : s === 'archived' ? 'danger' : 'warning'} className="capitalize">{s}</Badge>
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: info => <span className="text-zinc-500 text-sm whitespace-nowrap">{new Date(info.getValue() as string).toLocaleDateString()}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: info => {
        const item = info.row.original
        return (
          <div className="flex items-center gap-2 justify-end">
            <button onClick={e => { e.stopPropagation(); handlePublish(item) }}
              className="text-xs px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-50 text-zinc-600 transition-colors">
              {item.status === 'published' ? 'Archive' : 'Publish'}
            </button>
            <button onClick={e => { e.stopPropagation(); setSelected(item); setShowModal(true) }}
              className="text-xs px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-50 text-zinc-600 transition-colors">Edit</button>
            <button onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
              className="text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50 text-red-600 transition-colors">Delete</button>
          </div>
        )
      },
    },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Surveys & Feedback"
        description="Build surveys, target audiences, and track responses."
        action={
          <Button onClick={() => { setSelected(null); setShowModal(true) }}>
            <Add01Icon size={16} className="mr-2" /> Create Survey
          </Button>
        }
      />
      <DataTable columns={columns} data={surveys} searchKey="title" searchPlaceholder="Search surveys..." loading={loading} />
      {showModal && (
        <SurveyModal
          existing={selected}
          onClose={() => { setShowModal(false); setSelected(null) }}
          onSuccess={() => { setShowModal(false); setSelected(null); fetchData() }}
        />
      )}
    </div>
  )
}
