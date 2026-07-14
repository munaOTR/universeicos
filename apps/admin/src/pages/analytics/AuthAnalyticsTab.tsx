/**
 * AuthAnalyticsTab — Login activity, magic links, security events, and Verification Analytics.
 */
import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@universe/database'
import { Card, CardHeader, CardTitle, CardContent, Spinner } from '@universe/ui'
import { MetricCardGrid } from '../../components/shared/MetricCard'
import { TimeSeriesChart } from '../../components/charts/TimeSeriesChart'
import { fetchAuthStats, fetchAuthTimeseries } from '../../lib/analytics'
import { Login01Icon, Link04Icon, Shield01Icon, Alert01Icon, CheckmarkCircle01Icon, Mail01Icon, Award01Icon } from 'hugeicons-react'
import type { VerificationStats } from '@universe/types'

const supabase = getSupabaseClient()

export function AuthAnalyticsTab() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ login: 0, magic_link_requested: 0, password_reset: 0, logout: 0 })
  const [chartData, setChartData] = useState<{ date: string; count: number }[]>([])
  
  // Verification metrics
  const [vStats, setVStats] = useState<VerificationStats | null>(null)
  const [vChartData, setVChartData] = useState<{ date: string; verified: number; reminders: number }[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [s, c, vS, vC] = await Promise.all([
          fetchAuthStats(supabase, 30),
          fetchAuthTimeseries(supabase, 30),
          supabase.rpc('get_verification_stats'),
          supabase.rpc('get_verification_timeseries', { p_days: 30 })
        ])
        setStats(s)
        setChartData(c)
        if (vS.data) setVStats(vS.data as VerificationStats)
        if (vC.data) {
          setVChartData(((vC.data || []) as { date: string; verified_count: number; reminder_count: number }[]).map(d => ({
            date: d.date,
            verified: Number(d.verified_count),
            reminders: Number(d.reminder_count)
          })))
        }
      } catch (err) {
        console.error('Error loading analytics:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const reminderConversionRate = vStats && vStats.reminders_sent_total > 0
    ? Math.round((vStats.conversions_total / vStats.reminders_sent_total) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* General Auth Stats */}
      <MetricCardGrid
        loading={loading}
        columns={4}
        cards={[
          { title: 'Logins (30d)', value: stats.login, icon: Login01Icon, iconColor: 'text-blue-600' },
          { title: 'Magic Links Sent', value: stats.magic_link_requested, icon: Link04Icon, iconColor: 'text-indigo-600' },
          { title: 'Password Resets', value: stats.password_reset, icon: Shield01Icon, iconColor: 'text-amber-600' },
          { title: 'Failed Logins', value: 0, icon: Alert01Icon, iconColor: 'text-red-600', subtext: 'Coming soon' },
        ]}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Login Activity (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <TimeSeriesChart
              data={chartData.map(d => ({ day: d.date.slice(5), logins: d.count }))}
              xKey="day"
              yKey="logins"
              height={260}
              color="#3b82f6"
            />
          </CardContent>
        </Card>

        {/* Verification Conversion Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Verification Conversion Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex h-[260px] items-center justify-center"><Spinner /></div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                  <p className="text-xs text-zinc-500 font-medium uppercase">Overall Verification Rate</p>
                  <p className="text-2xl font-bold text-zinc-950 mt-1">{vStats?.verification_rate}%</p>
                  <p className="text-xs text-zinc-400 mt-1">{vStats?.verified_count} of {vStats?.total_users} students</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                  <p className="text-xs text-zinc-500 font-medium uppercase">Reminder Conversion Rate</p>
                  <p className="text-2xl font-bold text-zinc-950 mt-1">{reminderConversionRate}%</p>
                  <p className="text-xs text-zinc-400 mt-1">{vStats?.conversions_total} converted of {vStats?.reminders_sent_total} sent</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                  <p className="text-xs text-zinc-500 font-medium uppercase">Reminders Sent</p>
                  <p className="text-2xl font-bold text-zinc-950 mt-1">{vStats?.reminders_sent_total}</p>
                  <p className="text-xs text-zinc-400 mt-1">Total campaign triggers</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                  <p className="text-xs text-zinc-500 font-medium uppercase">Conversion Success</p>
                  <p className="text-2xl font-bold text-zinc-950 mt-1">{vStats?.conversions_total}</p>
                  <p className="text-xs text-zinc-400 mt-1">Verified after nudge</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verification & Reminder Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Verification vs. Reminder Activity (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-[280px] items-center justify-center"><Spinner /></div>
          ) : (
            <TimeSeriesChart
              data={vChartData.map(d => ({ day: d.date.slice(5), Verifications: d.verified, Reminders: d.reminders }))}
              xKey="day"
              yKey="Verifications" // default primary key
              height={280}
              color="#10b981"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

