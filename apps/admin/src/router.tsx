import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ROUTES } from '@universe/constants'
import { AdminLayout } from './layouts/AdminLayout'
import { RequireAuth, RoleGuard, GuestRoute } from '@universe/auth'
import { Spinner } from '@universe/ui'
import { RouteErrorFallback } from './components/RouteErrorFallback'

// Auth Pages
import { AdminLoginPage } from './pages/auth/AdminLoginPage'
import { AuthCallback } from './pages/auth/AuthCallback'
import { SetPasswordPage } from './pages/auth/SetPasswordPage'

// Admin Pages (Lazy loaded) will use route.lazy()

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
    errorElement: <RouteErrorFallback />,
  },
  {
    path: '/auth/set-password',
    element: <SetPasswordPage />,
    errorElement: <RouteErrorFallback />,
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
      {
        index: true,
        lazy: () => import('./pages/DashboardPage').then(m => ({ Component: m.DashboardPage })),
      },
      {
        path: ROUTES.ADMIN_USERS,
        lazy: () => import('./pages/UsersPage').then(m => ({ Component: m.UsersPage })),
      },
      {
        path: ROUTES.ADMIN_GAMIFICATION,
        lazy: () =>
          import('./pages/GamificationPage').then(m => ({ Component: m.GamificationPage })),
      },
      {
        path: ROUTES.ADMIN_WAITLIST,
        lazy: () => import('./pages/WaitlistPage').then(m => ({ Component: m.WaitlistPage })),
      },
      {
        path: ROUTES.ADMIN_REFERRALS,
        lazy: () => import('./pages/ReferralsPage').then(m => ({ Component: m.ReferralsPage })),
      },
      {
        path: ROUTES.ADMIN_ANNOUNCEMENTS,
        lazy: () =>
          import('./pages/AnnouncementsPage').then(m => ({ Component: m.AnnouncementsPage })),
      },
      {
        path: ROUTES.ADMIN_SURVEYS,
        lazy: () => import('./pages/SurveysPage').then(m => ({ Component: m.SurveysPage })),
      },
      {
        path: ROUTES.ADMIN_EMAILS,
        lazy: () =>
          import('./pages/email-center/EmailCenterPage').then(m => ({
            Component: m.EmailCenterPage,
          })),
      },
      {
        path: ROUTES.ADMIN_ANALYTICS,
        lazy: () => import('./pages/AnalyticsPage').then(m => ({ Component: m.AnalyticsPage })),
      },
      {
        path: ROUTES.ADMIN_MONITORING,
        lazy: () => import('./pages/MonitoringPage').then(m => ({ Component: m.MonitoringPage })),
      },
      {
        path: ROUTES.ADMIN_SETTINGS,
        lazy: () => import('./pages/SettingsPage').then(m => ({ Component: m.SettingsPage })),
      },
      {
        path: ROUTES.ADMIN_LOGS,
        lazy: () => import('./pages/LogsPage').then(m => ({ Component: m.LogsPage })),
      },
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
