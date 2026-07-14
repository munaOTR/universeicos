import { Link, useLocation } from 'react-router-dom'
import { ROUTES } from '@universe/constants'
import { STUDENT_NAVIGATION } from '../../../config/navigation'
import { useAuth } from '@universe/auth'
import { Logout01Icon } from 'hugeicons-react'
import { getSupabaseClient } from '@universe/database'

export function Sidebar() {
  const location = useLocation()
  const { user } = useAuth()

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'
  const initials = displayName.slice(0, 2).toUpperCase()

  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    window.location.href = ROUTES.HOME
  }

  return (
    <aside className="w-64 shrink-0 border-r border-zinc-200 bg-white flex flex-col sticky top-0 h-dvh">
      <div className="px-5 py-5 border-b border-zinc-200">
        <Link to={ROUTES.DASHBOARD} className="text-xl font-extrabold text-primary-600 tracking-tight">
          Universe
        </Link>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {['core', 'growth', 'learning', 'community', 'settings'].map(moduleName => {
          const items = STUDENT_NAVIGATION.filter(i => i.module === moduleName && i.isEnabled)
          if (items.length === 0) return null

          return (
            <div key={moduleName} className="space-y-1">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-3 pb-1">
                {moduleName}
              </h4>
              {items.map(item => {
                const isActive = location.pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-primary-600' : 'text-zinc-400'}>
                        <Icon size={20} variant={isActive ? "solid" : "stroke"} />
                      </span>
                      {item.label}
                    </div>
                    {item.badgeCount && item.badgeCount > 0 && (
                      <span className="bg-primary-100 text-primary-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {item.badgeCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div className="p-4 border-t border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 truncate">{displayName}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-zinc-400 hover:text-red-500 transition-colors"
            title="Sign out"
          >
            <Logout01Icon size={18} />
          </button>
        </div>
      </div>
    </aside>
  )
}
