import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ROUTES } from '@universe/constants'
import { Spinner } from '@universe/ui'
import { RouteErrorFallback } from './components/RouteErrorFallback'

// Layouts
import { PublicLayout } from './layouts/PublicLayout'
import { DashboardLayout } from './layouts/DashboardLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { RequireAuth } from '@universe/auth'

// Public Pages
import { LandingPage } from './pages/public/LandingPage'
import { WaitlistPage } from './pages/public/WaitlistPage'
import { WaitlistSuccessPage } from './pages/public/WaitlistSuccessPage'

// Auth Pages
import { AuthCallback } from './pages/auth/AuthCallback'
import { LoginPage } from './pages/auth/LoginPage'

// Dashboard Pages — lazy loaded for code splitting will use route.lazy()

// --- Remaining Placeholder Pages ---
function RoadmapPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Roadmap</h1>
    </div>
  )
}
function FAQPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">FAQ</h1>
    </div>
  )
}
function NotificationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      <p className="text-zinc-500">No new notifications.</p>
    </div>
  )
}

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-zinc-50 p-4 text-center">
      <h1 className="text-4xl font-bold text-zinc-900 mb-2">404</h1>
      <p className="text-zinc-500 mb-6">Page not found</p>
      <a href={ROUTES.HOME} className="text-primary-600 hover:underline">
        Go Home
      </a>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <RouteErrorFallback />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: ROUTES.WAITLIST, element: <WaitlistPage /> },
      { path: ROUTES.ROADMAP, element: <RoadmapPage /> },
      { path: ROUTES.FAQ, element: <FAQPage /> },
    ],
  },
  {
    path: ROUTES.WAITLIST_SUCCESS,
    element: (
      <RequireAuth>
        <WaitlistSuccessPage />
      </RequireAuth>
    ),
    errorElement: <RouteErrorFallback />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallback />,
    errorElement: <RouteErrorFallback />,
  },
  {
    element: <AuthLayout />,
    errorElement: <RouteErrorFallback />,
    children: [{ path: ROUTES.LOGIN, element: <LoginPage /> }],
  },
  {
    element: (
      <RequireAuth>
        <Suspense
          fallback={
            <div className="flex min-h-dvh items-center justify-center bg-zinc-50">
              <Spinner size="lg" className="text-primary-500" />
            </div>
          }
        >
          <DashboardLayout />
        </Suspense>
      </RequireAuth>
    ),
    errorElement: <RouteErrorFallback />,
    children: [
      {
        path: ROUTES.DASHBOARD,
        lazy: () =>
          import('./pages/dashboard/DashboardHomePage').then(m => ({
            Component: m.DashboardHomePage,
          })),
      },
      {
        path: ROUTES.DASHBOARD_REFERRALS,
        lazy: () =>
          import('./pages/dashboard/ReferralsPage').then(m => ({ Component: m.ReferralsPage })),
      },
      {
        path: ROUTES.DASHBOARD_LEADERBOARD,
        lazy: () =>
          import('./pages/dashboard/LeaderboardPage').then(m => ({ Component: m.LeaderboardPage })),
      },
      {
        path: ROUTES.DASHBOARD_PROFILE,
        lazy: () =>
          import('./pages/dashboard/ProfilePage').then(m => ({ Component: m.ProfilePage })),
      },
      {
        path: ROUTES.DASHBOARD_NOTIFICATIONS,
        element: <NotificationsPage />,
      },
      {
        path: ROUTES.DASHBOARD_SETTINGS,
        lazy: () =>
          import('./pages/dashboard/SettingsPage').then(m => ({ Component: m.SettingsPage })),
      },
      {
        path: ROUTES.DASHBOARD_SURVEYS,
        lazy: () =>
          import('./pages/dashboard/SurveysPage').then(m => ({ Component: m.SurveysPage })),
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
