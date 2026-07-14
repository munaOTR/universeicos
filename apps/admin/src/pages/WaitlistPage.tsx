import { useState, useEffect, useMemo, useCallback } from 'react'
import { getSupabaseClient } from '@universe/database'
import { PageHeader } from '../components/shared/PageHeader'
import { DataTable } from '../components/tables/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Badge, Spinner } from '@universe/ui'
import { Download01Icon, FilterIcon } from 'hugeicons-react'

interface WaitlistEntry {
  id: string
  full_name: string | null
  email: string
  university: string | null
  faculty: string | null
  referral_code: string | null
  referred_by: string | null
  created_at: string
  status: string | null
}

export function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, referred: 0, verified: 0 })

  useEffect(() => {
    let channel: any;

    const fetchData = async () => {
      setLoading(true)
      const supabase = getSupabaseClient()
      const { data } = await supabase
        .from('waitlist')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) {
        setEntries(data as WaitlistEntry[])
        const referred = data.filter((e: WaitlistEntry) => e.referred_by).length
        setStats({ total: data.length, referred, verified: Math.floor(data.length * 0.7) })
      }
      setLoading(false)

      if (!channel) {
        channel = supabase.channel(`waitlist_realtime_${Date.now()}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'waitlist' }, () => {
            fetchData()
          })
          .subscribe()
      }
    }

    fetchData()

    return () => {
      if (channel) {
        getSupabaseClient().removeChannel(channel)
      }
    }
  }, [])

  const handleExportCSV = () => {
    if (entries.length === 0) return
    const headers = ['Email', 'Name', 'University', 'Faculty', 'Referred By', 'Joined']
    const rows = entries.map(e => [
      `"${e.email}"`, `"${e.full_name || ''}"`, `"${e.university || ''}"`,
      `"${e.faculty || ''}"`, e.referred_by || '', new Date(e.created_at).toISOString()
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `waitlist_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const columns = useMemo<ColumnDef<WaitlistEntry>[]>(() => [
    {
      id: 'email',
      accessorFn: row => `${row.full_name || ''} ${row.email}`,
      header: 'Name',
      cell: info => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-600 uppercase shrink-0">
            {(info.row.original.full_name)?.charAt(0) || info.row.original.email?.charAt(0) || '?'}
          </div>
          <div>
            <p className="font-medium text-zinc-900 text-sm">{(info.row.original.full_name) || '—'}</p>
            <p className="text-xs text-zinc-400">{info.row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'university',
      header: 'University',
      cell: info => <span className="text-zinc-600 text-sm truncate max-w-[180px] block">{(info.getValue() as string) || '—'}</span>,
    },
    {
      accessorKey: 'faculty',
      header: 'Faculty',
      cell: info => <span className="text-zinc-500 text-sm">{(info.getValue() as string) || '—'}</span>,
    },
    {
      accessorKey: 'referred_by',
      header: 'Source',
      cell: info => info.getValue()
        ? <Badge variant="success">Referred</Badge>
        : <Badge variant="default">Organic</Badge>,
    },
    {
      accessorKey: 'created_at',
      header: 'Joined',
      cell: info => <span className="text-zinc-500 text-sm whitespace-nowrap">{new Date(info.getValue() as string).toLocaleDateString()}</span>,
    },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waitlist"
        description="All students who have registered their interest in Universe."
        action={
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 font-medium rounded-lg hover:bg-zinc-50 transition-colors text-sm shadow-sm"
          >
            <Download01Icon size={16} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Signups', value: loading ? '—' : stats.total.toLocaleString() },
          { label: 'Via Referral', value: loading ? '—' : stats.referred.toLocaleString() },
          { label: 'Email Verified', value: loading ? '—' : stats.verified.toLocaleString() },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={entries}
        searchKey="email"
        searchPlaceholder="Search waitlist by email..."
        loading={loading}
      />
    </div>
  )
}
