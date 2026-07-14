/**
 * analytics.ts — Server-side query functions for the Analytics & Monitoring Platform.
 * All heavy aggregations are delegated to Postgres RPCs to keep the client fast.
 */
import { SupabaseClient } from '@supabase/supabase-js'

export type DateRange = '7d' | '30d' | '90d' | '1y'

export function getDateRangeStart(range: DateRange): Date {
  const d = new Date()
  const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[range]
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

// ── Overview ─────────────────────────────────────────────────────────────────

export async function fetchDashboardMetrics(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('admin_dashboard_metrics')
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function fetchSignupTimeseries(supabase: SupabaseClient, range: DateRange) {
  const startDate = getDateRangeStart(range)
  const { data, error } = await supabase.rpc('get_signup_timeseries', {
    p_start_date: startDate.toISOString(),
    p_end_date: new Date().toISOString(),
  })
  if (error) throw error
  return (data || []) as { date: string; count: number }[]
}

export async function fetchReferralTimeseries(supabase: SupabaseClient, range: DateRange) {
  const startDate = getDateRangeStart(range)
  const { data, error } = await supabase.rpc('get_referral_timeseries', {
    p_start_date: startDate.toISOString(),
    p_end_date: new Date().toISOString(),
  })
  if (error) throw error
  return (data || []) as { date: string; count: number }[]
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function fetchUserActivityStats(supabase: SupabaseClient, days: number) {
  const { data, error } = await supabase.rpc('get_user_activity_stats', { p_days: days })
  if (error) throw error
  return (data || []) as { date: string; active_users: number }[]
}

export async function fetchUniversityBreakdown(supabase: SupabaseClient, limit = 10) {
  const { data, error } = await supabase.rpc('get_university_breakdown', { p_limit: limit })
  if (error) throw error
  return (data || []) as { university: string; count: number }[]
}

export async function fetchFacultyBreakdown(supabase: SupabaseClient, limit = 10) {
  const { data, error } = await supabase
    .from('profiles')
    .select('faculty')
    .not('faculty', 'is', null)
    .is('deleted_at', null)

  if (error) throw error

  const counts: Record<string, number> = {}
  ;(data || []).forEach((p: any) => {
    if (p.faculty) counts[p.faculty] = (counts[p.faculty] || 0) + 1
  })
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([faculty, count]) => ({ faculty, count }))
}

// ── Referrals ─────────────────────────────────────────────────────────────────

export async function fetchTopReferrers(supabase: SupabaseClient, limit = 10) {
  const { data, error } = await supabase.rpc('get_top_referrers', { p_limit: limit })
  if (error) throw error
  return (data || []) as { user_id: string; full_name: string; email: string; referrals: number; points: number }[]
}

export async function fetchReferralStats(supabase: SupabaseClient) {
  const [{ count: total }, { count: completed }, { count: pending }] = await Promise.all([
    supabase.from('referrals').select('*', { count: 'exact', head: true }),
    supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])
  const t = total || 0
  return {
    total: t,
    completed: completed || 0,
    pending: pending || 0,
    conversionRate: t > 0 ? Math.round(((completed || 0) / t) * 100) : 0,
  }
}

// ── Communication ─────────────────────────────────────────────────────────────

export async function fetchCommsDeliveryStats(supabase: SupabaseClient, days: number) {
  const { data, error } = await supabase.rpc('get_comms_delivery_stats', { p_days: days })
  if (error) throw error
  return (data || []) as { date: string; sent: number; delivered: number; failed: number; retrying: number }[]
}

export async function fetchQueueSummary(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc('get_queue_status_summary')
  if (error) throw error
  const summary: Record<string, number> = {}
  ;(data || []).forEach((row: { status: string; count: number }) => {
    summary[row.status] = Number(row.count)
  })
  return summary
}

export async function fetchProviderQuotas(supabase: SupabaseClient) {
  const { data, error } = await supabase.from('provider_quotas').select('*')
  if (error) throw error
  return data || []
}

export async function fetchTemplateUsage(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('email_queue')
    .select('template_id, email_templates(name, slug)')
    .not('template_id', 'is', null)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
  if (error) throw error
  const counts: Record<string, { name: string; count: number }> = {}
  ;(data || []).forEach((row: any) => {
    const slug = row.email_templates?.slug || 'unknown'
    const name = row.email_templates?.name || 'Unknown'
    if (!counts[slug]) counts[slug] = { name, count: 0 }
    counts[slug].count++
  })
  return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 8)
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function fetchAuthStats(supabase: SupabaseClient, days: number) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('activity_logs')
    .select('activity_type, created_at')
    .gte('created_at', since)
    .in('activity_type', ['login', 'logout', 'magic_link_requested', 'password_reset'])

  if (error) throw error

  const counts = { login: 0, logout: 0, magic_link_requested: 0, password_reset: 0 }
  ;(data || []).forEach((row: any) => {
    if (row.activity_type in counts) counts[row.activity_type as keyof typeof counts]++
  })
  return counts
}

export async function fetchAuthTimeseries(supabase: SupabaseClient, days: number) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('activity_logs')
    .select('activity_type, created_at')
    .gte('created_at', since)
    .eq('activity_type', 'login')

  if (error) throw error

  const byDay: Record<string, number> = {}
  ;(data || []).forEach((row: any) => {
    const date = row.created_at.slice(0, 10)
    byDay[date] = (byDay[date] || 0) + 1
  })
  return Object.entries(byDay).sort().map(([date, count]) => ({ date, count }))
}

// ── Monitoring ─────────────────────────────────────────────────────────────────

export async function fetchPlatformAlerts(supabase: SupabaseClient, includeAcknowledged = false) {
  let query = supabase
    .from('platform_alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (!includeAcknowledged) {
    query = query.eq('is_acknowledged', false)
  }
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function fetchQueueDepthHistory(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('email_queue')
    .select('status, created_at')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  if (error) throw error
  return data || []
}

export async function fetchFraudLogs(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('fraud_logs')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data || []
}

export async function fetchSecurityEvents(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .in('action', ['delete', 'update'])
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data || []
}

// ── Waitlist ────────────────────────────────────────────────────────────────

export async function fetchWaitlistStats(supabase: SupabaseClient) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7); weekAgo.setHours(0, 0, 0, 0)

  const [{ count: total }, { count: today_count }, { count: week_count }] = await Promise.all([
    supabase.from('waitlist').select('*', { count: 'exact', head: true }),
    supabase.from('waitlist').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    supabase.from('waitlist').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
  ])

  return { total: total || 0, today: today_count || 0, week: week_count || 0 }
}

export async function fetchWaitlistTimeseries(supabase: SupabaseClient, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('waitlist')
    .select('created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  if (error) throw error

  const byDay: Record<string, number> = {}
  ;(data || []).forEach((row: any) => {
    const date = row.created_at.slice(0, 10)
    byDay[date] = (byDay[date] || 0) + 1
  })
  return Object.entries(byDay).sort().map(([date, count]) => ({ date, count }))
}
