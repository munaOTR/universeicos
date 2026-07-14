import { ElementType } from 'react'
import { ROUTES, FEATURES } from '@universe/constants'
import {
  DashboardSquare01Icon,
  UserGroupIcon,
  Award01Icon,
  Megaphone01Icon,
  Message01Icon,
  ChartHistogramIcon,
  Settings01Icon,
  Mail01Icon,
  Time02Icon,
  Notification03Icon,
  Idea01Icon,
  Shield01Icon,
} from 'hugeicons-react'
import { PERMISSIONS, PermissionDef } from './permissions'

export type NavModule = 'core' | 'growth' | 'communications' | 'system'

export interface AdminNavItem {
  id: string
  label: string
  href: string
  icon: ElementType
  module: NavModule
  permission: PermissionDef
  isEnabled: boolean
  badge?: () => number
  children?: AdminNavItem[]
}

export const ADMIN_NAVIGATION: AdminNavItem[] = [
  // Core
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: ROUTES.ADMIN,
    icon: DashboardSquare01Icon,
    module: 'core',
    permission: PERMISSIONS.DASHBOARD_VIEW,
    isEnabled: true,
  },
  {
    id: 'users',
    label: 'User Management',
    href: ROUTES.ADMIN_USERS,
    icon: UserGroupIcon,
    module: 'core',
    permission: PERMISSIONS.USERS_VIEW,
    isEnabled: true,
  },
  
  // Growth & Engagement
  {
    id: 'waitlist',
    label: 'Waitlist',
    href: ROUTES.ADMIN_WAITLIST,
    icon: Time02Icon,
    module: 'growth',
    permission: PERMISSIONS.WAITLIST_VIEW,
    isEnabled: FEATURES.WAITLIST,
  },
  {
    id: 'referrals',
    label: 'Referrals',
    href: ROUTES.ADMIN_REFERRALS,
    icon: Award01Icon,
    module: 'growth',
    permission: PERMISSIONS.REFERRALS_VIEW,
    isEnabled: FEATURES.REFERRALS,
  },
  {
    id: 'gamification',
    label: 'Gamification',
    href: ROUTES.ADMIN_GAMIFICATION,
    icon: ChartHistogramIcon,
    module: 'growth',
    permission: PERMISSIONS.GAMIFICATION_MANAGE,
    isEnabled: FEATURES.LEADERBOARD,
  },

  // Communications
  {
    id: 'emails',
    label: 'Email Campaigns',
    href: '/admin/emails',
    icon: Mail01Icon,
    module: 'communications',
    permission: PERMISSIONS.EMAILS_MANAGE,
    isEnabled: true,
  },
  {
    id: 'announcements',
    label: 'Announcements',
    href: ROUTES.ADMIN_ANNOUNCEMENTS,
    icon: Megaphone01Icon,
    module: 'communications',
    permission: PERMISSIONS.ANNOUNCEMENTS_MANAGE,
    isEnabled: true,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    href: '/admin/notifications', // Future constant
    icon: Notification03Icon,
    module: 'communications',
    permission: PERMISSIONS.NOTIFICATIONS_MANAGE,
    isEnabled: true,
  },

  // System
  {
    id: 'surveys',
    label: 'Surveys & Feedback',
    href: ROUTES.ADMIN_SURVEYS,
    icon: Message01Icon,
    module: 'communications',
    permission: PERMISSIONS.SURVEYS_VIEW,
    isEnabled: FEATURES.SURVEYS,
  },
  {
    id: 'feature_requests',
    label: 'Feature Requests',
    href: '/admin/feature-requests', // Future constant
    icon: Idea01Icon,
    module: 'communications',
    permission: PERMISSIONS.FEATURE_REQUESTS_MANAGE,
    isEnabled: FEATURES.FEATURE_SUGGESTIONS,
  },
  {
    id: 'analytics',
    label: 'Analytics Center',
    href: ROUTES.ADMIN_ANALYTICS,
    icon: ChartHistogramIcon,
    module: 'system',
    permission: PERMISSIONS.ANALYTICS_VIEW,
    isEnabled: true,
  },
  {
    id: 'monitoring',
    label: 'Platform Health',
    href: ROUTES.ADMIN_MONITORING,
    icon: DashboardSquare01Icon, // Re-use an icon since hugeicons isn't fully imported here. Shield or Server is good but ServerStack01Icon isn't in the import list. I'll use DashboardSquare for now or Settings. Let's add ServerStack01Icon to imports in a sec, or just use Settings01Icon. Oh, wait, I can just use Notification03Icon or just add the import. I will just replace the import later or use a generic one. Let's use Shield01Icon. No, I will import it. Let me just use Shield01Icon for now.
    module: 'system',
    permission: PERMISSIONS.SETTINGS_MANAGE,
    isEnabled: true,
  },
  {
    id: 'logs',
    label: 'Audit Logs',
    href: ROUTES.ADMIN_LOGS,
    icon: Shield01Icon,
    module: 'system',
    permission: PERMISSIONS.LOGS_VIEW,
    isEnabled: true,
  },
  {
    id: 'settings',
    label: 'System Settings',
    href: ROUTES.ADMIN_SETTINGS,
    icon: Settings01Icon,
    module: 'system',
    permission: PERMISSIONS.SETTINGS_MANAGE,
    isEnabled: true,
  },
]
