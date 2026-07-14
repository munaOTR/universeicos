import { Alert01Icon, InformationCircleIcon, Cancel01Icon } from 'hugeicons-react'
import { useState } from 'react'
import { getSupabaseClient } from '@universe/database'

interface AlertBannerProps {
  id: string
  title: string
  message: string
  severity: 'critical' | 'warning' | 'info' | string
  onAcknowledge?: (id: string) => void
}

export function AlertBanner({ id, title, message, severity, onAcknowledge }: AlertBannerProps) {
  const [dismissing, setDismissing] = useState(false)
  const supabase = getSupabaseClient()

  const handleDismiss = async () => {
    setDismissing(true)
    try {
      await supabase.rpc('acknowledge_alert', { p_alert_id: id })
      if (onAcknowledge) onAcknowledge(id)
    } catch (e) {
      console.error('Failed to acknowledge alert', e)
      setDismissing(false)
    }
  }

  if (dismissing) return null

  const colors = {
    critical: 'bg-red-50 text-red-900 border-red-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    info: 'bg-blue-50 text-blue-900 border-blue-200',
  }[severity as 'critical' | 'warning' | 'info'] || 'bg-zinc-50 text-zinc-900 border-zinc-200'

  const iconColors = {
    critical: 'text-red-600',
    warning: 'text-amber-600',
    info: 'text-blue-600',
  }[severity as 'critical' | 'warning' | 'info'] || 'text-zinc-500'

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${colors}`}>
      <div className={`mt-0.5 shrink-0 ${iconColors}`}>
        {severity === 'info' ? <InformationCircleIcon size={20} /> : <Alert01Icon size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold">{title}</h4>
        <p className="text-sm mt-0.5 opacity-90">{message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="p-1 -m-1 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <Cancel01Icon size={20} />
      </button>
    </div>
  )
}
