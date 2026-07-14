import { Link, useLocation } from 'react-router-dom'
import { ROUTES } from '@universe/constants'
import { STUDENT_NAVIGATION } from '../../../config/navigation'
import { useAuth } from '@universe/auth'
import { Notification01Icon, Search01Icon } from 'hugeicons-react'

export function TopHeader() {
  const { user } = useAuth()
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-md px-8 py-3 flex items-center justify-between">
      <div className="text-sm text-zinc-500">
        Welcome back, <span className="font-semibold text-zinc-900">{displayName}</span> 👋
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 text-sm transition-colors"
          onClick={() => {
            // Trigger Command Bar here (e.g., dispatch custom event or use context)
            window.dispatchEvent(new CustomEvent('open-command-bar'))
          }}
        >
          <Search01Icon size={16} />
          <span>Search...</span>
          <kbd className="hidden sm:inline-block ml-2 text-[10px] font-sans font-semibold border border-zinc-300 rounded px-1.5 py-0.5 bg-white">
            ⌘K
          </kbd>
        </button>

        <Link
          to={ROUTES.DASHBOARD_NOTIFICATIONS}
          className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors relative"
        >
          <Notification01Icon size={20} />
          {/* Example notification badge */}
          <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </Link>
      </div>
    </header>
  )
}

export function MobileHeader() {
  const location = useLocation()
  const currentNav = STUDENT_NAVIGATION.find(i => i.href === location.pathname)
  
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-md px-4 py-3 flex items-center justify-between md:hidden">
      <div className="text-base font-bold text-zinc-900">
        {currentNav?.label || 'Universe'}
      </div>
      <div className="flex items-center gap-2">
        <button 
          className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500"
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-bar'))}
        >
          <Search01Icon size={20} />
        </button>
        <Link to={ROUTES.DASHBOARD_NOTIFICATIONS} className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 relative">
          <Notification01Icon size={20} />
          <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </Link>
      </div>
    </header>
  )
}
