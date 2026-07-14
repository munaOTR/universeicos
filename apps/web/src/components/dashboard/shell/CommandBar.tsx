import { useEffect, useState, useRef } from 'react'
import { Search01Icon, Cancel01Icon } from 'hugeicons-react'
import { useNavigate } from 'react-router-dom'
import { STUDENT_NAVIGATION } from '../../../config/navigation'

export function CommandBar() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    const handleOpen = () => setIsOpen(true)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-command-bar', handleOpen)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-command-bar', handleOpen)
    }
  }, [])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setQuery('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const filteredNav = STUDENT_NAVIGATION.filter(
    (item) =>
      item.isEnabled &&
      item.label.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (href: string) => {
    setIsOpen(false)
    navigate(href)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity" 
        onClick={() => setIsOpen(false)}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/5 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center border-b border-zinc-100 px-4 py-3">
          <Search01Icon size={20} className="text-zinc-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none text-zinc-900 placeholder:text-zinc-400 text-lg"
            placeholder="Search pages, settings, etc..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={() => setIsOpen(false)} className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 transition-colors">
            <Cancel01Icon size={20} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredNav.length === 0 ? (
            <div className="p-6 text-center text-sm text-zinc-500">
              No results found for "{query}"
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Pages
              </div>
              {filteredNav.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.href}
                    onClick={() => handleSelect(item.href)}
                    className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg hover:bg-primary-50 hover:text-primary-700 text-zinc-700 transition-colors group"
                  >
                    <Icon size={18} className="text-zinc-400 group-hover:text-primary-600 transition-colors" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div className="bg-zinc-50 border-t border-zinc-100 px-4 py-3 text-xs text-zinc-500 flex items-center justify-between">
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <kbd className="font-sans font-semibold border border-zinc-300 rounded px-1 py-0.5 bg-white">↑</kbd>
              <kbd className="font-sans font-semibold border border-zinc-300 rounded px-1 py-0.5 bg-white">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-sans font-semibold border border-zinc-300 rounded px-1 py-0.5 bg-white">↵</kbd>
              to select
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
