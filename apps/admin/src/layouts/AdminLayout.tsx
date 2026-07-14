import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/shell/Sidebar'
import { TopHeader } from '../components/shell/TopHeader'
import { CommandPalette } from '../components/shell/CommandPalette'
import { MobileWarningModal } from '../components/shell/MobileWarningModal'
import { useIsMobile } from '@universe/hooks'

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobileWarningDismissed, setMobileWarningDismissed] = useState(false)
  
  const isMobile = useIsMobile()

  return (
    <div className="flex h-dvh bg-zinc-50 overflow-hidden">
      <CommandPalette />
      
      {/* Mobile Warning Modal */}
      {isMobile && !mobileWarningDismissed && (
        <MobileWarningModal onDismiss={() => setMobileWarningDismissed(true)} />
      )}

      
      {/* Mobile Sidebar Overlay */}
      {isMobile && mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Wrapper */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50 h-full
        transform transition-transform duration-300 ease-in-out
        ${isMobile ? (mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
      `}>
        <Sidebar 
          collapsed={isMobile ? false : collapsed} 
          onToggle={() => isMobile ? setMobileSidebarOpen(false) : setCollapsed(!collapsed)} 
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <TopHeader onToggleMobileSidebar={() => setMobileSidebarOpen(true)} />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

    </div>
  )
}
