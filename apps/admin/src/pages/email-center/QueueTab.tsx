import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@universe/ui'
import { getSupabaseClient } from '@universe/database'

export function QueueTab() {
  const [stats, setStats] = useState<any>(null)
  const [deadLetters, setDeadLetters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  const loadData = async () => {
    setLoading(true)
    // Fetch queue stats via our new RPC
    const { data: queueStats } = await supabase.rpc('get_queue_stats')
    setStats(queueStats)

    // Fetch dead letters
    const { data: dlq } = await supabase
      .from('email_queue')
      .select('id, recipient_email, subject, error_message, attempts, updated_at')
      .eq('status', 'dead_letter')
      .order('updated_at', { ascending: false })
      .limit(10)

    if (dlq) {
      setDeadLetters(dlq)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // Poll every 15 seconds to simulate real-time
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [])

  const retryEmail = async (id: string) => {
    await supabase.from('email_queue').update({
      status: 'pending',
      attempts: 0, // reset attempts
      next_attempt_at: new Date().toISOString()
    }).eq('id', id)
    loadData()
  }

  return (
    <div className="space-y-6">
      {/* Queue Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.processing || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Retrying</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats?.retrying || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Dead Letter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.dead_letter || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Dead Letter Queue Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Dead Letter Queue</CardTitle>
            <p className="text-sm text-zinc-500 mt-1">Emails that permanently failed to send after max retries.</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>Refresh</Button>
        </CardHeader>
        <CardContent>
          {loading && deadLetters.length === 0 ? (
             <p className="text-sm text-zinc-500">Loading dead letters...</p>
          ) : deadLetters.length === 0 ? (
             <div className="py-8 text-center bg-zinc-50 border border-dashed rounded-lg">
               <p className="text-sm text-zinc-500">The dead letter queue is empty. System healthy.</p>
             </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left text-zinc-600">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Error</th>
                    <th className="px-4 py-3">Failed At</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deadLetters.map((dl) => (
                    <tr key={dl.id} className="border-b last:border-0 hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{dl.recipient_email}</td>
                      <td className="px-4 py-3 truncate max-w-[200px]">{dl.subject}</td>
                      <td className="px-4 py-3">
                        <Badge variant="destructive" className="truncate max-w-[200px]" title={dl.error_message}>
                          {dl.error_message || 'Unknown error'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{new Date(dl.updated_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Button variant="outline" size="sm" onClick={() => retryEmail(dl.id)}>
                          Retry
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
