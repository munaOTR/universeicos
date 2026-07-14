import { useState } from 'react'
import { getSupabaseClient } from '@universe/database'
import type { UserRole } from '@universe/types'
import { toast } from '@universe/ui'
import { ArrowDown01Icon, Cancel01Icon, CheckmarkCircle01Icon } from 'hugeicons-react'

interface RoleOption {
  value: UserRole
  label: string
  color: string
}

const ROLE_OPTIONS: RoleOption[] = [
  { value: 'super_admin', label: 'Super Admin', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'admin',       label: 'Admin',       color: 'bg-red-100 text-red-700 border-red-200'         },
  { value: 'moderator',   label: 'Moderator',   color: 'bg-amber-100 text-amber-700 border-amber-200'   },
  { value: 'student',     label: 'Student',     color: 'bg-zinc-100 text-zinc-600 border-zinc-200'      },
]

export function getRoleBadgeClass(role: UserRole): string {
  return ROLE_OPTIONS.find(r => r.value === role)?.color ?? 'bg-zinc-100 text-zinc-600'
}

interface RoleSelectProps {
  userId: string
  currentRole: UserRole
  /** Called after a successful role change so the parent table can update */
  onRoleChanged: (userId: string, newRole: UserRole) => void
}

export function RoleSelect({ userId, currentRole, onRoleChanged }: RoleSelectProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSelect = async (newRole: UserRole) => {
    if (newRole === currentRole) {
      setOpen(false)
      return
    }

    setSaving(true)
    setOpen(false)

    const supabase = getSupabaseClient()
    const { error } = await supabase.rpc('set_user_role', {
      target_user_id: userId,
      new_role: newRole,
    })

    setSaving(false)

    if (error) {
      toast.error('Role change failed', { description: error.message })
    } else {
      toast.success(`Role updated to ${newRole.replace('_', ' ')}`)
      onRoleChanged(userId, newRole)
    }
  }

  const current = ROLE_OPTIONS.find(r => r.value === currentRole)

  return (
    <div className="relative">
      <button
        disabled={saving}
        onClick={() => setOpen(v => !v)}
        className={`
          inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider
          transition-all cursor-pointer hover:opacity-80 disabled:opacity-50
          ${current?.color ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'}
        `}
      >
        {saving ? (
          <span className="animate-pulse">Saving…</span>
        ) : (
          <>
            {current?.label ?? currentRole}
            <ArrowDown01Icon size={11} />
          </>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute left-0 top-full mt-1.5 z-40 w-40 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden">
            {ROLE_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-zinc-50 transition-colors"
              >
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${option.color}`}>
                  {option.label}
                </span>
                {currentRole === option.value && (
                  <CheckmarkCircle01Icon size={14} className="text-zinc-500 shrink-0" />
                )}
              </button>
            ))}
            <div className="border-t border-zinc-100">
              <button
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-50 transition-colors"
              >
                <Cancel01Icon size={12} /> Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
