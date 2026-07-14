/**
 * @universe/constants
 * Shared application constants, route definitions, and feature flags.
 */

// ── App Info ─────────────────────────────────────────────────────────────────

export const APP_NAME = 'Universe'
export const APP_TAGLINE = 'The operating system for Nigerian university students.'
export const APP_URL = 'https://waitlist.universeicos.app'
export const APP_SUPPORT_EMAIL = 'hello@universeicos.app'

// ── Routes ───────────────────────────────────────────────────────────────────

export const ROUTES = {
  // Public
  HOME: '/',
  ABOUT: '/about',
  ROADMAP: '/roadmap',
  FAQ: '/faq',
  PRIVACY: '/privacy',
  TERMS: '/terms',

  // Auth
  WAITLIST: '/waitlist',
  WAITLIST_SUCCESS: '/waitlist/success',
  VERIFY_EMAIL: '/verify',
  LOGIN: '/login',

  // Student Dashboard
  DASHBOARD: '/dashboard',
  DASHBOARD_REFERRALS: '/dashboard/referrals',
  DASHBOARD_LEADERBOARD: '/dashboard/leaderboard',
  DASHBOARD_PROFILE: '/dashboard/profile',
  DASHBOARD_NOTIFICATIONS: '/dashboard/notifications',
  DASHBOARD_SURVEYS: '/dashboard/surveys',
  DASHBOARD_SUGGESTIONS: '/dashboard/suggestions',
  DASHBOARD_SETTINGS: '/dashboard/settings',

  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_GAMIFICATION: '/admin/gamification',
  ADMIN_WAITLIST: '/admin/waitlist',
  ADMIN_REFERRALS: '/admin/referrals',
  ADMIN_LEADERBOARD: '/admin/leaderboard',
  ADMIN_SURVEYS: '/admin/surveys',
  ADMIN_ANNOUNCEMENTS: '/admin/announcements',
  ADMIN_EMAILS: '/admin/emails',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_MONITORING: '/admin/monitoring',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_LOGS: '/admin/logs',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

// ── Navigation ────────────────────────────────────────────────────────────────

export const STUDENT_NAV_ITEMS = [
  { label: 'Home', href: ROUTES.DASHBOARD, icon: 'home' },
  { label: 'Leaderboard', href: ROUTES.DASHBOARD_LEADERBOARD, icon: 'trophy' },
  { label: 'Referrals', href: ROUTES.DASHBOARD_REFERRALS, icon: 'share' },
  { label: 'Menu', href: ROUTES.DASHBOARD_PROFILE, icon: 'menu' },
] as const

export const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', href: ROUTES.ADMIN, icon: 'dashboard' },
  { label: 'Users', href: ROUTES.ADMIN_USERS, icon: 'users' },
  { label: 'Gamification', href: ROUTES.ADMIN_GAMIFICATION, icon: 'trophy' },
  { label: 'Referrals', href: ROUTES.ADMIN_REFERRALS, icon: 'share' },
  { label: 'Surveys', href: ROUTES.ADMIN_SURVEYS, icon: 'survey' },
  { label: 'Announcements', href: ROUTES.ADMIN_ANNOUNCEMENTS, icon: 'megaphone' },
  { label: 'Analytics', href: ROUTES.ADMIN_ANALYTICS, icon: 'chart' },
  { label: 'Settings', href: ROUTES.ADMIN_SETTINGS, icon: 'settings' },
] as const

// ── Feature Flags ─────────────────────────────────────────────────────────────
// Set to true to enable a feature module. Used to progressively unlock modules.

export const FEATURES = {
  WAITLIST: true,
  REFERRALS: true,
  LEADERBOARD: true,
  SURVEYS: true,
  FEATURE_SUGGESTIONS: true,
  ANNOUNCEMENTS: true,

  // Future modules — disabled until built
  MARKETPLACE: false,
  STUDY_HUB: false,
  MESSAGING: false,
  HOUSING: false,
  JOBS: false,
  AI_ASSISTANT: false,
  COMMUNITIES: false,
  EVENTS: false,
  PAYMENTS: false,
} as const

// ── Nigerian Universities ─────────────────────────────────────────────────────

export const UNIVERSITIES = [
  'University of Lagos (UNILAG)',
  'University of Ibadan (UI)',
  'Obafemi Awolowo University (OAU)',
  'University of Nigeria, Nsukka (UNN)',
  'University of Benin (UNIBEN)',
  'Ahmadu Bello University (ABU)',
  'University of Port Harcourt (UNIPORT)',
  'Lagos State University (LASU)',
  'Federal University of Technology, Akure (FUTA)',
  'Covenant University',
  'Babcock University',
  'Landmark University',
  'Redeemer\'s University',
  'Pan-Atlantic University',
  'American University of Nigeria (AUN)',
  'African University of Science and Technology (AUST)',
  'Nnamdi Azikiwe University (NAU)',
  'University of Calabar (UNICAL)',
  'University of Ilorin (UNILORIN)',
  'University of Jos (UNIJOS)',
] as const

// ── Graduation Years ──────────────────────────────────────────────────────────

const currentYear = new Date().getFullYear()
export const GRADUATION_YEARS = Array.from({ length: 7 }, (_, i) => String(currentYear + i))

// ── Academic Structure ────────────────────────────────────────────────────────
// Maps university names → faculties → departments.
// Used in the waitlist form to provide guided dropdowns before falling back
// to free-text "Other" inputs.

export type DepartmentList = readonly string[]

export interface FacultyEntry {
  name: string
  departments: DepartmentList
}

export type UniversityAcademics = Record<string, readonly FacultyEntry[]>

export const UNIVERSITY_ACADEMICS: UniversityAcademics = {
  'University of Lagos (UNILAG)': [
    {
      name: 'Faculty of Arts',
      departments: ['English', 'History & Strategic Studies', 'Philosophy', 'Linguistics', 'French'],
    },
    {
      name: 'Faculty of Business Administration',
      departments: ['Accounting', 'Actuarial Science', 'Business Administration', 'Finance', 'Insurance'],
    },
    {
      name: 'Faculty of Engineering',
      departments: [
        'Civil Engineering',
        'Electrical/Electronics Engineering',
        'Mechanical Engineering',
        'Systems Engineering',
        'Chemical Engineering',
        'Computer Engineering',
      ],
    },
    {
      name: 'Faculty of Law',
      departments: ['Law'],
    },
    {
      name: 'Faculty of Medicine',
      departments: ['Medicine & Surgery', 'Physiotherapy', 'Nursing Science', 'Medical Laboratory Science', 'Radiography'],
    },
    {
      name: 'Faculty of Pharmacy',
      departments: ['Pharmacy'],
    },
    {
      name: 'Faculty of Science',
      departments: ['Biochemistry', 'Botany', 'Chemistry', 'Computer Science', 'Mathematics', 'Microbiology', 'Physics', 'Zoology', 'Statistics'],
    },
    {
      name: 'Faculty of Social Sciences',
      departments: ['Economics', 'Geography', 'Mass Communication', 'Political Science', 'Psychology', 'Sociology'],
    },
  ],
  'University of Ibadan (UI)': [
    {
      name: 'Faculty of Arts',
      departments: ['Archaeology & Anthropology', 'Communication & Language Arts', 'European Studies', 'History', 'Linguistics', 'Philosophy', 'Religious Studies'],
    },
    {
      name: 'Faculty of Science',
      departments: ['Botany', 'Chemistry', 'Computer Science', 'Mathematics', 'Microbiology', 'Physics', 'Zoology', 'Statistics'],
    },
    {
      name: 'Faculty of Social Sciences',
      departments: ['Economics', 'Geography', 'Political Science', 'Psychology', 'Sociology'],
    },
    {
      name: 'Faculty of Education',
      departments: ['Adult Education', 'Guidance & Counselling', 'Physical & Health Education', 'Teacher Education'],
    },
    {
      name: 'Faculty of Agriculture & Forestry',
      departments: ['Agricultural Economics', 'Agronomy', 'Animal Science', 'Crop Protection', 'Forest Resources Management', 'Soil Resources Management'],
    },
    {
      name: 'College of Medicine',
      departments: ['Anatomy', 'Biochemistry', 'Medicine', 'Nursing', 'Pathology', 'Physiology', 'Surgery'],
    },
  ],
  'Obafemi Awolowo University (OAU)': [
    {
      name: 'Faculty of Arts',
      departments: ['Dramatic Arts', 'English', 'History', 'Linguistics', 'Music', 'Philosophy', 'Visual Arts'],
    },
    {
      name: 'Faculty of Science',
      departments: ['Biochemistry', 'Botany', 'Chemistry', 'Computer Science', 'Geology', 'Mathematics', 'Microbiology', 'Physics', 'Zoology'],
    },
    {
      name: 'Faculty of Engineering & Technology',
      departments: ['Chemical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Mechanical Engineering', 'Agricultural Engineering'],
    },
    {
      name: 'Faculty of Social Sciences',
      departments: ['Demography & Social Statistics', 'Economics', 'Geography', 'Political Science', 'Psychology', 'Sociology'],
    },
    {
      name: 'Faculty of Administration',
      departments: ['Accounting', 'Business Administration', 'Public Administration'],
    },
    {
      name: 'College of Health Sciences',
      departments: ['Medicine & Surgery', 'Dentistry', 'Nursing', 'Medical Rehabilitation', 'Medical Laboratory Science', 'Pharmacy'],
    },
    {
      name: 'Faculty of Law',
      departments: ['Law'],
    },
  ],
  'Ahmadu Bello University (ABU)': [
    {
      name: 'Faculty of Arts & Islamic Studies',
      departments: ['Arabic', 'English', 'French', 'History', 'Islamic Studies', 'Philosophy', 'Theatre Arts'],
    },
    {
      name: 'Faculty of Science',
      departments: ['Biochemistry', 'Botany', 'Chemistry', 'Computer Science', 'Mathematics', 'Microbiology', 'Physics', 'Zoology'],
    },
    {
      name: 'Faculty of Engineering',
      departments: ['Chemical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Mechanical Engineering', 'Metallurgical Engineering'],
    },
    {
      name: 'Faculty of Social Sciences',
      departments: ['Economics', 'Geography', 'Political Science', 'Psychology', 'Sociology', 'Mass Communication'],
    },
    {
      name: 'Faculty of Administration',
      departments: ['Accounting', 'Business Administration', 'Public Administration'],
    },
    {
      name: 'College of Medicine',
      departments: ['Medicine & Surgery', 'Nursing', 'Pharmacy', 'Medical Laboratory Science'],
    },
  ],
  'University of Nigeria, Nsukka (UNN)': [
    {
      name: 'Faculty of Arts',
      departments: ['English & Literary Studies', 'Fine & Applied Arts', 'History & International Studies', 'Linguistics', 'Music', 'Philosophy', 'Religion'],
    },
    {
      name: 'Faculty of Biological Sciences',
      departments: ['Biochemistry', 'Botany', 'Microbiology', 'Zoology & Environmental Biology'],
    },
    {
      name: 'Faculty of Physical Sciences',
      departments: ['Chemistry', 'Computer Science', 'Geology', 'Mathematics', 'Physics & Astronomy', 'Statistics'],
    },
    {
      name: 'Faculty of Engineering',
      departments: ['Civil Engineering', 'Electrical Engineering', 'Electronic Engineering', 'Mechanical Engineering', 'Agricultural Engineering', 'Chemical Engineering'],
    },
    {
      name: 'Faculty of Social Sciences',
      departments: ['Economics', 'Geography', 'Mass Communication', 'Political Science', 'Psychology', 'Sociology'],
    },
    {
      name: 'Faculty of Law',
      departments: ['Law'],
    },
    {
      name: 'College of Medicine',
      departments: ['Medicine', 'Surgery', 'Dentistry', 'Nursing', 'Medical Rehabilitation', 'Medical Laboratory Science', 'Pharmacy'],
    },
  ],
  'Covenant University': [
    {
      name: 'College of Engineering',
      departments: ['Civil Engineering', 'Electrical Engineering', 'Mechanical Engineering', 'Petroleum Engineering', 'Computer Engineering', 'Architecture'],
    },
    {
      name: 'College of Science & Technology',
      departments: ['Biochemistry', 'Biology', 'Chemistry', 'Computer Science', 'Information Technology', 'Mathematics', 'Physics', 'Statistics'],
    },
    {
      name: 'College of Business & Social Sciences',
      departments: ['Accounting', 'Banking & Finance', 'Business Administration', 'Economics', 'Mass Communication', 'Political Science', 'Psychology', 'Sociology'],
    },
    {
      name: 'College of Law & Security Studies',
      departments: ['Law'],
    },
  ],
  'University of Port Harcourt (UNIPORT)': [
    {
      name: 'Faculty of Humanities',
      departments: ['English', 'History', 'Linguistics', 'Philosophy', 'Religious Studies', 'Theatre Arts'],
    },
    {
      name: 'Faculty of Science',
      departments: ['Biochemistry', 'Botany', 'Chemistry', 'Computer Science', 'Mathematics', 'Microbiology', 'Physics', 'Zoology'],
    },
    {
      name: 'Faculty of Engineering',
      departments: ['Chemical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Mechanical Engineering', 'Petroleum & Gas Engineering'],
    },
    {
      name: 'Faculty of Social Sciences',
      departments: ['Economics', 'Geography', 'Mass Communication', 'Political Science', 'Psychology', 'Sociology'],
    },
    {
      name: 'Faculty of Management Sciences',
      departments: ['Accounting', 'Banking & Finance', 'Business Administration', 'Insurance'],
    },
    {
      name: 'College of Health Sciences',
      departments: ['Medicine & Surgery', 'Nursing', 'Medical Laboratory Science', 'Pharmacy'],
    },
  ],
  'Lagos State University (LASU)': [
    {
      name: 'Faculty of Arts',
      departments: ['English', 'History', 'Linguistics', 'Philosophy', 'Theatre Arts'],
    },
    {
      name: 'Faculty of Science',
      departments: ['Biochemistry', 'Botany', 'Chemistry', 'Computer Science', 'Mathematics', 'Microbiology', 'Physics', 'Zoology'],
    },
    {
      name: 'Faculty of Engineering',
      departments: ['Civil Engineering', 'Electrical Engineering', 'Mechanical Engineering', 'Chemical Engineering'],
    },
    {
      name: 'Faculty of Social Sciences',
      departments: ['Economics', 'Geography', 'Mass Communication', 'Political Science', 'Psychology', 'Sociology'],
    },
    {
      name: 'Faculty of Management Sciences',
      departments: ['Accounting', 'Business Administration', 'Finance', 'Insurance', 'Marketing'],
    },
    {
      name: 'Faculty of Law',
      departments: ['Law'],
    },
  ],
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export const LEADERBOARD_PAGE_SIZE = 50
export const REFERRAL_POINTS = 100
export const SURVEY_POINTS = 50
export const PROFILE_COMPLETE_POINTS = 25
