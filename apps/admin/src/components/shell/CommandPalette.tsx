import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search01Icon, Cancel01Icon } from 'hugeicons-react'
import { ADMIN_NAVIGATION } from '../../config/navigation'
import { useAuth } from '@universe/auth'

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()
  const role = user?.user_metadata?.role || 'admin'

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    const handleCustomEvent = () => setIsOpen(true)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-admin-command-bar', handleCustomEvent)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-admin-command-bar', handleCustomEvent)
    }
  }, [])

  if (!isOpen) return null

  const filteredItems = ADMIN_NAVIGATION.filter(
    (item) =>
      item.isEnabled &&
      (item as { roles?: string[] }).roles?.includes(role || '') &&
      item.label.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (href: string) => {
    navigate(href)
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[20vh] px-4">
      <div 
        className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm" 
        onClick={() => setIsOpen(false)}
      />
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 border-b border-zinc-100">
          <Search01Icon size={20} className="text-zinc-400 shrink-0" />
          <input
            autoFocus
            className="w-full bg-transparent p-4 outline-none text-zinc-900 placeholder:text-zinc-400"
            placeholder="Search commands, users, or jump to..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 shrink-0 transition-colors"
          >
            <Cancel01Icon size={20} />
          </button>
        </div>

        <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto p-2">
          {filteredItems.length > 0 ? (
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Navigation
              </div>
              {filteredItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.href}
                    onClick={() => handleSelect(item.href)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  >
                    <Icon size={18} className="shrink-0" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-500 text-sm">
              No results found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
