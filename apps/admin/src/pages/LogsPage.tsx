import { useState, useEffect, useMemo } from 'react'
import { getSupabaseClient } from '@universe/database'
import { PageHeader } from '../components/shared/PageHeader'
import { DataTable } from '../components/tables/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@universe/ui'
import { Download01Icon } from 'hugeicons-react'

interface AuditLog {
  id: string
  user_id: string | null
  action: string
  resource: string
  details: Record<string, any> | null
  ip_address: string | null
  created_at: string
}

function getActionBadge(action: string) {
  if (action.includes('delete') || action.includes('suspend')) return 'danger'
  if (action.includes('create') || action.includes('insert')) return 'success'
  if (action.includes('update') || action.includes('change')) return 'warning'
  return 'default'
}

export function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    if (data) setLogs(data as AuditLog[])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleExportCSV = () => {
    if (logs.length === 0) return
    const headers = ['ID', 'User ID', 'Action', 'Resource', 'IP Address', 'Timestamp']
    const rows = logs.map(l => [l.id, l.user_id || '', l.action, l.resource, l.ip_address || '', new Date(l.created_at).toISOString()])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const columns = useMemo<ColumnDef<AuditLog>[]>(() => [
    {
      accessorKey: 'action',
      header: 'Action',
      cell: info => (
        <Badge variant={getActionBadge(info.getValue() as string)} className="capitalize text-xs font-mono">
          {(info.getValue() as string).replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'resource',
      header: 'Resource',
      cell: info => <span className="text-zinc-600 text-sm font-mono capitalize">{(info.getValue() as string).replace(/_/g, ' ')}</span>,
    },
    {
      accessorKey: 'user_id',
      header: 'Actor',
      cell: info => (
        <span className="font-mono text-xs text-zinc-400 truncate max-w-[120px] block">
          {(info.getValue() as string | null)?.slice(0, 8) + '...' || 'System'}
        </span>
      ),
    },
    {
      accessorKey: 'details',
      header: 'Details',
      cell: info => {
        const d = info.getValue() as Record<string, any> | null
        if (!d) return <span className="text-zinc-400 text-sm">—</span>
        const preview = Object.entries(d).slice(0, 2).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ')
        return <span className="text-zinc-500 text-xs truncate max-w-[200px] block" title={JSON.stringify(d)}>{preview}</span>
      },
    },
    {
      accessorKey: 'ip_address',
      header: 'IP',
      cell: info => <span className="font-mono text-xs text-zinc-400">{(info.getValue() as string) || '—'}</span>,
    },
    {
      accessorKey: 'created_at',
      header: 'Timestamp',
      cell: info => (
        <span className="text-zinc-500 text-sm whitespace-nowrap">
          {new Date(info.getValue() as string).toLocaleString()}
        </span>
      ),
    },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Immutable log of all administrative and security events across the platform."
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Events', value: loading ? '—' : logs.length.toLocaleString() },
          { label: 'Destructive Actions', value: loading ? '—' : logs.filter(l => l.action.includes('delete') || l.action.includes('suspend')).length },
          { label: 'Today', value: loading ? '—' : logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={logs}
        searchKey="action"
        searchPlaceholder="Filter by action type..."
        loading={loading}
      />
    </div>
  )
}
