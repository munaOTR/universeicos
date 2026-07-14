import { useLocation } from 'react-router-dom'
import { Notification01Icon, Search01Icon, Menu01Icon } from 'hugeicons-react'
import { ADMIN_NAVIGATION } from '../../config/navigation'

interface TopHeaderProps {
  onToggleMobileSidebar: () => void
}

export function TopHeader({ onToggleMobileSidebar }: TopHeaderProps) {
  const location = useLocation()
  
  // Find current active item for breadcrumb/title
  const currentNavItem = ADMIN_NAVIGATION.find(item => 
    location.pathname.startsWith(item.href) && 
    (item.href !== '/' || location.pathname === '/')
  )

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:px-6 md:px-8">
      <div className="flex items-center gap-4">
        {/* Mobile Sidebar Toggle */}
        <button 
          className="md:hidden p-2 -ml-2 text-zinc-500 hover:text-zinc-900 rounded-md hover:bg-zinc-100"
          onClick={onToggleMobileSidebar}
        >
          <Menu01Icon size={20} />
        </button>

        <h1 className="text-lg sm:text-xl font-semibold text-zinc-900 hidden sm:block">
          {currentNavItem?.label || 'Admin Portal'}
        </h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 text-sm transition-colors"
          onClick={() => {
            // Trigger global command palette
            window.dispatchEvent(new CustomEvent('open-admin-command-bar'))
          }}
        >
          <Search01Icon size={16} />
          <span className="hidden sm:inline-block">Search...</span>
          <kbd className="hidden sm:inline-block ml-2 text-[10px] font-sans font-semibold border border-zinc-300 rounded px-1.5 py-0.5 bg-white">
            ⌘K
          </kbd>
        </button>

        <button className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors relative">
          <Notification01Icon size={20} />
          {/* Unread badge placeholder */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>
      </div>
    </header>
  )
}
