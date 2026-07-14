/**
 * Central registry for all granular permissions in the Admin Portal.
 * These map to the `action` and `resource` columns in the `permissions` table.
 */

export const PERMISSIONS = {
  // Core System
  DASHBOARD_VIEW: { action: 'view', resource: 'dashboard' },
  SETTINGS_MANAGE: { action: 'manage', resource: 'settings' },
  ANALYTICS_VIEW: { action: 'view', resource: 'analytics' },
  LOGS_VIEW: { action: 'view', resource: 'audit_logs' },

  // User Management
  USERS_VIEW: { action: 'view', resource: 'users' },
  USERS_MANAGE: { action: 'manage', resource: 'users' },
  ROLES_MANAGE: { action: 'manage', resource: 'roles' },
  PERMISSIONS_MANAGE: { action: 'manage', resource: 'permissions' },

  // Growth Engine
  WAITLIST_VIEW: { action: 'view', resource: 'waitlist' },
  WAITLIST_MANAGE: { action: 'manage', resource: 'waitlist' },
  REFERRALS_VIEW: { action: 'view', resource: 'referrals' },
  REFERRALS_MANAGE: { action: 'manage', resource: 'referrals' },
  GAMIFICATION_MANAGE: { action: 'manage', resource: 'gamification' },

  // Communications
  EMAILS_MANAGE: { action: 'manage', resource: 'emails' },
  ANNOUNCEMENTS_MANAGE: { action: 'manage', resource: 'announcements' },
  NOTIFICATIONS_MANAGE: { action: 'manage', resource: 'notifications' },

  // Engagement
  SURVEYS_VIEW: { action: 'view', resource: 'surveys' },
  SURVEYS_MANAGE: { action: 'manage', resource: 'surveys' },
  FEATURE_REQUESTS_MANAGE: { action: 'manage', resource: 'feature_requests' },

  // Verification Management
  VERIFICATION_VIEW:   { action: 'view',   resource: 'verification' },
  VERIFICATION_MANAGE: { action: 'manage', resource: 'verification' },
} as const

export type PermissionKey = keyof typeof PERMISSIONS
export type PermissionDef = { action: string, resource: string }
