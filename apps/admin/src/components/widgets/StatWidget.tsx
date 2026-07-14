import { useEffect, useState, ElementType } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Spinner } from '@universe/ui'
import { getSupabaseClient } from '@universe/database'

interface StatWidgetProps {
  title: string
  icon: ElementType
  fetchData: (supabase: ReturnType<typeof getSupabaseClient>) => Promise<{ value: string | number, subtext?: string }>
}

export function StatWidget({ title, icon: Icon, fetchData }: StatWidgetProps) {
  const [data, setData] = useState<{ value: string | number, subtext?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = getSupabaseClient()
        const result = await fetchData(supabase)
        setData(result)
      } catch (e) {
        console.error(`Error loading widget ${title}:`, e)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [fetchData, title])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon size={16} className="text-zinc-500" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-8 items-center"><Spinner size="sm" /></div>
        ) : error ? (
          <div className="text-sm text-red-500">Failed to load</div>
        ) : (
          <>
            <div className="text-2xl font-bold">{data?.value}</div>
            {data?.subtext && <p className="text-xs text-zinc-500 mt-1">{data.subtext}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}
