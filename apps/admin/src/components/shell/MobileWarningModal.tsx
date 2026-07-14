import { Alert02Icon } from 'hugeicons-react'

interface MobileWarningModalProps {
  onDismiss: () => void
}

export function MobileWarningModal({ onDismiss }: MobileWarningModalProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-4">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <Alert02Icon size={24} className="text-amber-600"  />
        </div>
        
        <h2 className="text-xl font-bold text-center text-zinc-900 tracking-tight">
          Desktop Recommended
        </h2>
        
        <p className="text-sm text-zinc-600 text-center leading-relaxed">
          For the best experience and full administrative functionality, please access the Admin Dashboard using a desktop or laptop computer.
        </p>
        
        <p className="text-sm text-zinc-600 text-center leading-relaxed">
          Mobile access is limited and may not provide the complete management experience.
        </p>

        <div className="pt-2">
          <button
            onClick={onDismiss}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg px-4 py-3 text-sm font-medium transition-colors"
          >
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  )
}
