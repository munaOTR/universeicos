import React, { ElementType } from 'react'
import { PermissionDef, PERMISSIONS } from './permissions'
import { StatWidget } from '../components/widgets/StatWidget'
import { 
  UserGroupIcon, 
  LinkSquare01Icon,
  Time02Icon,
  Message01Icon,
  Megaphone01Icon,
  Mail01Icon,
  ServerStack01Icon,
  DatabaseIcon,
  Shield01Icon,
  CheckmarkCircle01Icon,
  MailOpen01Icon,
  CheckmarkBadge01Icon,
} from 'hugeicons-react'

export type WidgetSize = 'small' | 'medium' | 'large' | 'full'

export interface DashboardWidget {
  id: string
  title: string
  description?: string
  component: React.FC<any>
  size: WidgetSize
  permission?: PermissionDef
  defaultEnabled: boolean
  category: 'core' | 'growth' | 'communications' | 'system' | 'verification'
}

import { SupabaseClient } from '@supabase/supabase-js'

// Factory to create standardized stat widgets quickly
const createStatWidget = (
  id: string, 
  title: string, 
  icon: ElementType, 
  fetchData: (supabase: SupabaseClient) => Promise<{ value: number | string, subtext?: string }>, 
  permission?: PermissionDef,
  category: 'core' | 'growth' | 'communications' | 'system' | 'verification' = 'core'
): DashboardWidget => ({
  id,
  title,
  component: () => <StatWidget title={title} icon={icon} fetchData={fetchData} />,
  size: 'small',
  permission,
  defaultEnabled: true,
  category
})

export const WIDGET_REGISTRY: DashboardWidget[] = [
  // ── Core ──────────────────────────────────────────────────────────────────
  createStatWidget('total_users', 'Total Students', UserGroupIcon, async (supabase) => {
    const { count, error } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
    return { value: error ? 0 : count || 0 }
  }, PERMISSIONS.USERS_VIEW, 'core'),

  createStatWidget('today_signups', 'Today\'s Signups', Time02Icon, async (supabase) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count, error } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString())
    return { value: error ? 0 : count || 0, subtext: 'Since midnight' }
  }, PERMISSIONS.USERS_VIEW, 'core'),

  // ── Verification ──────────────────────────────────────────────────────────
  createStatWidget('verified_students', 'Verified Students', CheckmarkCircle01Icon, async (supabase) => {
    const { data, error } = await supabase.rpc('get_verification_stats')
    if (error || !data) return { value: 0, subtext: 'Email confirmed' }
    const stats = data as { verified_count: number; total_users: number; verification_rate: number }
    return {
      value: stats.verified_count,
      subtext: `${stats.verification_rate}% of total — ${stats.total_users.toLocaleString()} registered`,
    }
  }, PERMISSIONS.VERIFICATION_VIEW, 'verification'),

  createStatWidget('unverified_students', 'Unverified Students', MailOpen01Icon, async (supabase) => {
    const { data, error } = await supabase.rpc('get_verification_stats')
    if (error || !data) return { value: 0, subtext: 'Awaiting verification' }
    const stats = data as { unverified_count: number; verification_rate: number }
    return {
      value: stats.unverified_count,
      subtext: `${(100 - stats.verification_rate).toFixed(1)}% unverified`,
    }
  }, PERMISSIONS.VERIFICATION_VIEW, 'verification'),

  createStatWidget('verification_rate', 'Verification Rate', CheckmarkBadge01Icon, async (supabase) => {
    const { data, error } = await supabase.rpc('get_verification_stats')
    if (error || !data) return { value: '0%', subtext: 'Verified ÷ Registered' }
    const stats = data as { verification_rate: number; verified_last_7d: number }
    return {
      value: `${stats.verification_rate}%`,
      subtext: `+${stats.verified_last_7d} verified this week`,
    }
  }, PERMISSIONS.VERIFICATION_VIEW, 'verification'),

  createStatWidget('reminder_queue', 'Reminder Queue', Mail01Icon, async (supabase) => {
    const { data, error } = await supabase.rpc('get_verification_stats')
    if (error || !data) return { value: 0, subtext: 'Eligible for reminder' }
    const stats = data as { eligible_for_reminder: number; reminders_sent_total: number }
    return {
      value: stats.eligible_for_reminder,
      subtext: `${stats.reminders_sent_total.toLocaleString()} reminders sent total`,
    }
  }, PERMISSIONS.VERIFICATION_MANAGE, 'verification'),

  // ── Growth ────────────────────────────────────────────────────────────────
  createStatWidget('total_referrals', 'Total Referrals', LinkSquare01Icon, async (supabase) => {
    const { count, error } = await supabase.from('referrals').select('id', { count: 'exact', head: true })
    return { value: error ? 0 : count || 0 }
  }, PERMISSIONS.REFERRALS_VIEW, 'growth'),

  // ── Communications ────────────────────────────────────────────────────────
  createStatWidget('pending_surveys', 'Pending Surveys', Message01Icon, async (supabase) => {
    const { count, error } = await supabase.from('surveys').select('id', { count: 'exact', head: true }).eq('is_active', false)
    return { value: error ? 0 : count || 0, subtext: 'Awaiting publish' }
  }, PERMISSIONS.SURVEYS_VIEW, 'communications'),

  createStatWidget('total_announcements', 'Announcements', Megaphone01Icon, async (supabase) => {
    const { count, error } = await supabase.from('announcements').select('id', { count: 'exact', head: true })
    return { value: error ? 0 : count || 0 }
  }, PERMISSIONS.ANNOUNCEMENTS_MANAGE, 'communications'),

  createStatWidget('active_campaigns', 'Email Campaigns', Mail01Icon, async (supabase) => {
    const { count, error } = await supabase.from('email_campaigns').select('id', { count: 'exact', head: true })
    return { value: error ? 0 : count || 0 }
  }, PERMISSIONS.EMAILS_MANAGE, 'communications'),

  // ── System ────────────────────────────────────────────────────────────────
  createStatWidget('system_health', 'System Health', ServerStack01Icon, async (supabase) => {
    const { error } = await supabase.from('audit_logs').select('id').limit(1)
    if (error) {
      return { value: 'Degraded', subtext: 'Issues detected' }
    }
    return { value: '100%', subtext: 'All systems operational' }
  }, PERMISSIONS.SETTINGS_MANAGE, 'system'),

  createStatWidget('database_status', 'Database Status', DatabaseIcon, async (supabase) => {
    const { error } = await supabase.from('profiles').select('id').limit(1)
    return { value: error ? 'Degraded' : 'Healthy', subtext: error ? error.message : 'Latency < 50ms' }
  }, PERMISSIONS.SETTINGS_MANAGE, 'system'),

  createStatWidget('admin_actions', 'Recent Admin Actions', Shield01Icon, async (supabase) => {
    const { count, error } = await supabase.from('audit_logs').select('id', { count: 'exact', head: true })
    return { value: error ? 0 : count || 0, subtext: 'Total logged events' }
  }, PERMISSIONS.LOGS_VIEW, 'system'),
]
