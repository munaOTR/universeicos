import { ROUTES, FEATURES } from '@universe/constants'
import {
  Home01Icon,
  Award01Icon,
  UserGroupIcon,
  UserCircleIcon,
  Settings01Icon,
  Message01Icon,
  Store01Icon,
  BookOpen01Icon,
} from 'hugeicons-react'
import type { ElementType } from 'react'

export type NavModule = 'core' | 'growth' | 'community' | 'learning' | 'settings'

export interface NavigationItem {
  id: string
  label: string
  href: string
  icon: ElementType
  module: NavModule
  isEnabled: boolean
  badgeCount?: number
  roles?: string[]
}

export const STUDENT_NAVIGATION: NavigationItem[] = [
  // Core
  {
    id: 'home',
    label: 'Home',
    href: ROUTES.DASHBOARD,
    icon: Home01Icon,
    module: 'core',
    isEnabled: true,
  },
  
  // Growth
  {
    id: 'referrals',
    label: 'Referrals',
    href: ROUTES.DASHBOARD_REFERRALS,
    icon: UserGroupIcon,
    module: 'growth',
    isEnabled: FEATURES.REFERRALS,
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    href: ROUTES.DASHBOARD_LEADERBOARD,
    icon: Award01Icon,
    module: 'growth',
    isEnabled: FEATURES.LEADERBOARD,
  },

  // Learning (Future)
  {
    id: 'surveys',
    label: 'Surveys',
    href: ROUTES.DASHBOARD_SURVEYS,
    icon: Message01Icon,
    module: 'learning',
    isEnabled: FEATURES.SURVEYS,
  },
  {
    id: 'study-hub',
    label: 'Study Hub',
    href: '#', // ROUTES.DASHBOARD_STUDY_HUB
    icon: BookOpen01Icon,
    module: 'learning',
    isEnabled: FEATURES.STUDY_HUB,
  },

  // Community (Future)
  {
    id: 'marketplace',
    label: 'Marketplace',
    href: '#', // ROUTES.DASHBOARD_MARKETPLACE
    icon: Store01Icon,
    module: 'community',
    isEnabled: FEATURES.MARKETPLACE,
  },

  // Settings
  {
    id: 'profile',
    label: 'Profile',
    href: ROUTES.DASHBOARD_PROFILE,
    icon: UserCircleIcon,
    module: 'settings',
    isEnabled: true,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: ROUTES.DASHBOARD_SETTINGS,
    icon: Settings01Icon,
    module: 'settings',
    isEnabled: true,
  },
]
