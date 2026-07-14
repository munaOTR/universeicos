import { Outlet, Link, useLocation } from 'react-router-dom'
import { useIsMobile } from '@universe/hooks'
import { Sidebar } from '../components/dashboard/shell/Sidebar'
import { TopHeader, MobileHeader } from '../components/dashboard/shell/TopHeader'
import { CommandBar } from '../components/dashboard/shell/CommandBar'
import { STUDENT_NAVIGATION } from '../config/navigation'

export function DashboardLayout() {
  const isMobile = useIsMobile()
  const location = useLocation()

  // For mobile tab bar, we'll pick the most important 4-5 items.
  const mobileNavItems = STUDENT_NAVIGATION.filter(
    (item) => item.isEnabled && ['home', 'leaderboard', 'referrals', 'profile'].includes(item.id)
  )

  return (
    <div className="flex min-h-dvh flex-col md:flex-row bg-zinc-50 relative">
      {/* ── Sidebar (Desktop) ─────────────────────────── */}
      {!isMobile && <Sidebar />}

      {/* ── Main Content Area ──────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0 relative">
        
        {/* Header */}
        {isMobile ? <MobileHeader /> : <TopHeader />}

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 max-w-[1400px] mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* ── Command Bar Overlay ────────────────────────── */}
      <CommandBar />

      {/* ── Bottom Navigation (Mobile) ─────────────────── */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white pb-safe flex">
          <div className="flex w-full items-center justify-around h-16 px-2">
            {mobileNavItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                    isActive ? 'text-primary-600' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <Icon size={24} variant={isActive ? 'solid' : 'stroke'} />
                  <span className="text-[10px] font-medium tracking-wide">
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
