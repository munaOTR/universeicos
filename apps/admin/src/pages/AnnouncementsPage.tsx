import { useState, useEffect, useMemo } from 'react'
import { getSupabaseClient } from '@universe/database'
import { PageHeader } from '../components/shared/PageHeader'
import { DataTable } from '../components/tables/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Badge, Button, Spinner, toast } from '@universe/ui'
import { Add01Icon, Cancel01Icon, Megaphone01Icon } from 'hugeicons-react'

interface Announcement {
  id: string
  title: string
  content: string
  target_audience: string | null
  is_published: boolean
  created_at: string
  scheduled_at: string | null
}

interface AnnouncementFormData {
  title: string
  content: string
  target_audience: string
  is_published: boolean
  scheduled_at: string
}

function AnnouncementModal({ existing, onClose, onSuccess }: {
  existing?: Announcement | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState<AnnouncementFormData>({
    title: existing?.title || '',
    content: existing?.content || '',
    target_audience: existing?.target_audience || 'all',
    is_published: existing?.is_published ?? false,
    scheduled_at: existing?.scheduled_at || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.content) return
    setLoading(true)
    const supabase = getSupabaseClient()
    const payload = {
      title: form.title,
      content: form.content,
      target_audience: form.target_audience,
      is_published: form.is_published,
      scheduled_at: form.scheduled_at || null,
    }
    const { error } = existing
      ? await supabase.from('announcements').update(payload).eq('id', existing.id)
      : await supabase.from('announcements').insert(payload)

    if (error) {
      toast.error('Failed to save announcement', { description: error.message })
    } else {
      toast.success(existing ? 'Announcement updated' : 'Announcement created')
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <Megaphone01Icon size={20} className="text-zinc-500" />
            {existing ? 'Edit Announcement' : 'Create Announcement'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-lg text-zinc-500"><Cancel01Icon size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">Title</label>
            <input
              type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Announcement title..." required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">Content</label>
            <textarea
              value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={5}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
              placeholder="Write your announcement content..." required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-700">Target Audience</label>
              <select
                value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              >
                <option value="all">All Users</option>
                <option value="waitlist">Waitlist Only</option>
                <option value="students">Signed-up Students</option>
                <option value="admins">Admins Only</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-700">Schedule (optional)</label>
              <input
                type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
              className="rounded border-zinc-300 text-primary-600"
            />
            <span className="text-sm text-zinc-700">Publish immediately</span>
          </label>
          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : existing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<Announcement | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const supabase = getSupabaseClient()
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    if (data) setItems(data as Announcement[])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) toast.error('Delete failed', { description: error.message })
    else { toast.success('Announcement deleted'); fetchData() }
  }

  const handleTogglePublish = async (item: Announcement) => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('announcements').update({ is_published: !item.is_published }).eq('id', item.id)
    if (error) toast.error('Update failed', { description: error.message })
    else { toast.success(item.is_published ? 'Unpublished' : 'Published'); fetchData() }
  }

  const columns = useMemo<ColumnDef<Announcement>[]>(() => [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: info => (
        <div>
          <p className="font-medium text-zinc-900">{info.getValue() as string}</p>
          <p className="text-xs text-zinc-500 truncate max-w-[250px]">{info.row.original.content}</p>
        </div>
      ),
    },
    {
      accessorKey: 'target_audience',
      header: 'Audience',
      cell: info => <Badge variant="default" className="capitalize">{(info.getValue() as string) || 'All'}</Badge>,
    },
    {
      accessorKey: 'is_published',
      header: 'Status',
      cell: info => (
        <Badge variant={(info.getValue() as boolean) ? 'success' : 'warning'}>
          {(info.getValue() as boolean) ? 'Published' : 'Draft'}
        </Badge>
      ),
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
            <button onClick={(e) => { e.stopPropagation(); handleTogglePublish(item) }}
              className="text-xs px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-50 text-zinc-600 transition-colors">
              {item.is_published ? 'Unpublish' : 'Publish'}
            </button>
            <button onClick={(e) => { e.stopPropagation(); setSelected(item); setShowModal(true) }}
              className="text-xs px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-50 text-zinc-600 transition-colors">
              Edit
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}
              className="text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50 text-red-600 transition-colors">
              Delete
            </button>
          </div>
        )
      },
    },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Publish platform-wide announcements to students and admins."
        action={
          <Button onClick={() => { setSelected(null); setShowModal(true) }}>
            <Add01Icon size={16} className="mr-2" /> Create Announcement
          </Button>
        }
      />
      <DataTable columns={columns} data={items} searchKey="title" searchPlaceholder="Search announcements..." loading={loading} />
      {showModal && (
        <AnnouncementModal
          existing={selected}
          onClose={() => { setShowModal(false); setSelected(null) }}
          onSuccess={() => { setShowModal(false); setSelected(null); fetchData() }}
        />
      )}
    </div>
  )
}
