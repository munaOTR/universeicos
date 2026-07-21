import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ROUTES } from '@universe/constants'
import { AdminLayout } from './layouts/AdminLayout'
import { RequireAuth, RoleGuard, GuestRoute } from '@universe/auth'
import { Spinner, RouteErrorFallback } from '@universe/ui'

// Auth Pages
import { AdminLoginPage } from './pages/auth/AdminLoginPage'
import { AuthCallback } from './pages/auth/AuthCallback'
import { SetPasswordPage } from './pages/auth/SetPasswordPage'

// Admin Pages (Lazy loaded)
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage }))
)
const UsersPage = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })))
const GamificationPage = lazy(() =>
  import('./pages/GamificationPage').then(m => ({ default: m.GamificationPage }))
)
const WaitlistPage = lazy(() =>
  import('./pages/WaitlistPage').then(m => ({ default: m.WaitlistPage }))
)
const ReferralsPage = lazy(() =>
  import('./pages/ReferralsPage').then(m => ({ default: m.ReferralsPage }))
)
const AnnouncementsPage = lazy(() =>
  import('./pages/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage }))
)
const SurveysPage = lazy(() =>
  import('./pages/SurveysPage').then(m => ({ default: m.SurveysPage }))
)
const EmailsPage = lazy(() =>
  import('./pages/email-center/EmailCenterPage').then(m => ({ default: m.EmailCenterPage }))
)
const AnalyticsPage = lazy(() =>
  import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage }))
)
const MonitoringPage = lazy(() =>
  import('./pages/MonitoringPage').then(m => ({ default: m.MonitoringPage }))
)
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage }))
)
const LogsPage = lazy(() => import('./pages/LogsPage').then(m => ({ default: m.LogsPage })))

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-zinc-50 p-4 text-center">
      <h1 className="text-4xl font-bold text-zinc-900 mb-2">404</h1>
      <p className="text-zinc-500 mb-6">Page not found</p>
      <a href={ROUTES.ADMIN} className="text-primary-600 hover:underline">
        Go to Dashboard
      </a>
    </div>
  )
}

function ComingSoonPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-primary-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-zinc-900 mb-2">{title}</h2>
      <p className="text-zinc-500 text-sm max-w-sm">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        Coming in Phase 2
      </span>
    </div>
  )
}

const suspenseFallback = (
  <div className="flex min-h-dvh items-center justify-center bg-zinc-50">
    <Spinner size="lg" className="text-primary-600" />
  </div>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <GuestRoute redirectTo={ROUTES.ADMIN}>
        <AdminLoginPage />
      </GuestRoute>
    ),
    errorElement: <RouteErrorFallback />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallback />,
  },
  {
    path: '/auth/set-password',
    element: <SetPasswordPage />,
  },
  {
    path: ROUTES.ADMIN,
    element: (
      <RequireAuth redirectTo="/">
        <RoleGuard role={['admin', 'super_admin', 'moderator']} fallback={<NotFoundPage />}>
          <Suspense fallback={suspenseFallback}>
            <AdminLayout />
          </Suspense>
        </RoleGuard>
      </RequireAuth>
    ),
    errorElement: <RouteErrorFallback />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: ROUTES.ADMIN_USERS, element: <UsersPage /> },
      { path: ROUTES.ADMIN_GAMIFICATION, element: <GamificationPage /> },
      { path: ROUTES.ADMIN_WAITLIST, element: <WaitlistPage /> },
      { path: ROUTES.ADMIN_REFERRALS, element: <ReferralsPage /> },
      { path: ROUTES.ADMIN_ANNOUNCEMENTS, element: <AnnouncementsPage /> },
      { path: ROUTES.ADMIN_SURVEYS, element: <SurveysPage /> },
      { path: ROUTES.ADMIN_EMAILS, element: <EmailsPage /> },
      { path: ROUTES.ADMIN_ANALYTICS, element: <AnalyticsPage /> },
      { path: ROUTES.ADMIN_MONITORING, element: <MonitoringPage /> },
      { path: ROUTES.ADMIN_SETTINGS, element: <SettingsPage /> },
      { path: ROUTES.ADMIN_LOGS, element: <LogsPage /> },
      {
        path: '/admin/notifications',
        element: (
          <ComingSoonPage
            title="Push Notifications"
            description="Send targeted push notifications to students on web and mobile. Planned for Phase 2 of the Universe platform."
          />
        ),
      },
      {
        path: '/admin/feature-requests',
        element: (
          <ComingSoonPage
            title="Feature Requests"
            description="Review, prioritize, and respond to student feature suggestions. Planned for Phase 2 of the Universe platform."
          />
        ),
      },
    ],
  },
])
