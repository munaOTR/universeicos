/**
 * @universe/types
 * Shared TypeScript types used across all apps and packages.
 * These types mirror the Supabase database schema and API contracts.
 */

export * from './database.types'

// ── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'admin' | 'moderator' | 'super_admin'

export interface User {
  id: string
  email: string
  full_name: string | null
  university: string | null
  faculty: string | null
  department: string | null
  role: UserRole
  avatar_url: string | null
  referral_code: string
  referred_by: string | null
  waitlist_position: number | null
  points: number
  is_verified: boolean
  created_at: string
  updated_at: string
}

// Extends User with live auth data from the admin RPC
export interface UserWithVerification extends User {
  email_confirmed_at: string | null
  auth_provider: string
  reminder_count: number
  last_reminder_at: string | null
  is_eligible_for_reminder: boolean
}

export interface VerificationReminder {
  id: string
  user_id: string
  triggered_by: string | null
  trigger_source: 'manual' | 'bulk' | 'auto'
  queue_id: string | null
  converted_at: string | null
  sent_at: string
  created_at: string
}

export interface VerificationStats {
  total_users: number
  verified_count: number
  unverified_count: number
  verification_rate: number
  eligible_for_reminder: number
  reminders_sent_total: number
  conversions_total: number
  verified_last_7d: number
  verified_last_30d: number
}

// ── Waitlist ─────────────────────────────────────────────────────────────────

export interface WaitlistEntry {
  id: string
  email: string
  full_name: string
  university: string | null
  faculty: string | null
  department: string | null
  referral_code: string
  referred_by: string | null
  position: number
  status: 'pending' | 'verified' | 'approved' | 'rejected'
  created_at: string
}

// ── Referrals ────────────────────────────────────────────────────────────────

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  status: 'pending' | 'completed' | 'flagged'
  created_at: string
}

export interface LeaderboardEntry {
  user_id: string
  full_name: string
  university: string | null
  avatar_url: string | null
  referral_count: number
  points: number
  rank: number
}

// ── Surveys ──────────────────────────────────────────────────────────────────

export type QuestionType = 'multiple_choice' | 'text' | 'rating' | 'boolean'

export interface SurveyQuestion {
  id: string
  text: string
  type: QuestionType
  options?: string[]
  required: boolean
}

export interface Survey {
  id: string
  title: string
  description: string | null
  questions: SurveyQuestion[]
  status: 'draft' | 'active' | 'closed'
  reward_points: number
  created_at: string
  expires_at: string | null
}

export interface SurveyResponse {
  id: string
  survey_id: string
  user_id: string
  answers: Record<string, string | string[]>
  created_at: string
}

// ── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'referral_joined'
  | 'rank_change'
  | 'milestone'
  | 'survey_available'
  | 'announcement'
  | 'feature_suggestion_approved'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  is_read: boolean
  action_url: string | null
  created_at: string
}

// ── Feature Suggestions ──────────────────────────────────────────────────────

export type SuggestionStatus = 'pending' | 'approved' | 'rejected' | 'on_roadmap' | 'completed'

export interface FeatureSuggestion {
  id: string
  user_id: string
  title: string
  description: string
  status: SuggestionStatus
  upvotes: number
  admin_note: string | null
  created_at: string
}

// ── Announcements ─────────────────────────────────────────────────────────────

export interface Announcement {
  id: string
  title: string
  body: string
  is_pinned: boolean
  target_audience: 'all' | 'university' | 'specific'
  created_by: string
  created_at: string
}

// ── API ───────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}
