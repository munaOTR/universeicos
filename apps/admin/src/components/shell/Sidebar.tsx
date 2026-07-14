import { Link, useLocation } from 'react-router-dom'
import { ROUTES } from '@universe/constants'
import { ADMIN_NAVIGATION, NavModule } from '../../config/navigation'
import { useAuth, usePermissions } from '@universe/auth'
import { Menu01Icon, ArrowLeft01Icon } from 'hugeicons-react'

// Helper to group nav items by module
function groupNavItems(items: typeof ADMIN_NAVIGATION) {
  return items.reduce((acc, item) => {
    if (!acc[item.module]) {
      acc[item.module] = []
    }
    acc[item.module].push(item)
    return acc
  }, {} as Record<NavModule, typeof ADMIN_NAVIGATION>)
}

const MODULE_LABELS: Record<NavModule, string> = {
  core: 'Core System',
  growth: 'Growth Engine',
  communications: 'Communications',
  system: 'Settings & Analytics',
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const { user, profile } = useAuth()
  const { hasPermission } = usePermissions()

  const navGroups = groupNavItems(ADMIN_NAVIGATION)

  return (
    <aside 
      className={`
        fixed md:static inset-y-0 left-0 z-50 
        flex flex-col border-r border-zinc-200 bg-white
        transition-all duration-300 ease-in-out h-full
        ${collapsed ? 'w-16 md:w-20' : 'w-64'}
      `}
    >
      <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-zinc-200">
        {!collapsed && (
          <Link to={ROUTES.ADMIN} className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">U</span>
            </div>
            Admin
          </Link>
        )}
        <button 
          onClick={onToggle}
          className={`p-1.5 rounded-md hover:bg-zinc-100 text-zinc-500 transition-colors ${collapsed ? 'mx-auto' : ''}`}
        >
          {collapsed ? <Menu01Icon size={20} /> : <ArrowLeft01Icon size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {Object.entries(navGroups).map(([moduleKey, items]) => {
          // Filter items based on granular permissions
          const visibleItems = items.filter(item => 
            item.isEnabled && hasPermission(item.permission.action, item.permission.resource)
          )

          if (visibleItems.length === 0) return null

          return (
            <div key={moduleKey} className="space-y-1">
              {!collapsed && (
                <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                  {MODULE_LABELS[moduleKey as NavModule]}
                </h3>
              )}
              {visibleItems.map(item => {
                const Icon = item.icon
                const isActive = location.pathname.startsWith(item.href) && 
                               (item.href !== ROUTES.ADMIN || location.pathname === ROUTES.ADMIN)
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => {
                      // Call onToggle (which closes sidebar in mobile mode) if we're on mobile
                      if (window.innerWidth < 768) {
                        // In AdminLayout, onToggle for mobile sets mobileSidebarOpen(false)
                        onToggle()
                      }
                    }}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-zinc-900 text-white shadow-sm' 
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                      }
                      ${collapsed ? 'justify-center px-0' : ''}
                    `}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} variant={isActive ? 'solid' : 'stroke'} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div className="p-4 border-t border-zinc-200">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 font-bold text-xs uppercase">
              {user?.email?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">
                {user?.email || 'admin@universeicos.app'}
              </p>
              <p className="text-xs text-zinc-500 capitalize">{profile?.role?.replace('_', ' ') || 'Admin'}</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto h-9 w-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 font-bold text-xs uppercase">
            {user?.email?.charAt(0) || 'A'}
          </div>
        )}
      </div>
    </aside>
  )
}

