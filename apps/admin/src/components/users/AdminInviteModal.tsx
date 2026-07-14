import { useState } from 'react'
import { getSupabaseClient } from '@universe/database'
import { Button, Input, Label, toast } from '@universe/ui'
import { Cancel01Icon, Mail01Icon } from 'hugeicons-react'
import type { UserRole } from '@universe/types'

interface AdminInviteModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function AdminInviteModal({ onClose, onSuccess }: AdminInviteModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('admin')
  const [loading, setLoading] = useState(false)

  // Hardcoded for MVP, should be fetched from DB in future
  const GRANULAR_ROLES = [
    { id: 'marketing_admin', name: 'Marketing Admin' },
    { id: 'support_admin', name: 'Support Admin' },
    { id: 'content_moderator', name: 'Content Moderator' },
  ]
  const [selectedGranular, setSelectedGranular] = useState<string[]>([])

  const toggleGranular = (id: string) => {
    setSelectedGranular(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    const supabase = getSupabaseClient()

    try {
      const { data, error } = await supabase.functions.invoke('invite-admin', {
        body: { 
          email, 
          role, 
          granular_roles: selectedGranular 
        }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      toast.success('Invitation sent!', { description: `Invited ${email} as ${role}` })
      onSuccess()
    } catch (err: any) {
      toast.error('Failed to send invite', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <Mail01Icon size={20} className="text-zinc-500" />
            Invite Administrator
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors">
            <Cancel01Icon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email"
              type="email" 
              placeholder="colleague@universeicos.app" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role">Primary Role</Label>
            <select 
              id="role"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
            >
              <option value="moderator">Moderator (Limited)</option>
              <option value="admin">Admin (Standard)</option>
              <option value="super_admin">Super Admin (Full Access)</option>
            </select>
            <p className="text-xs text-zinc-500">Determines base access level across the portal.</p>
          </div>

          <div className="space-y-2">
            <Label>Granular Roles (Optional)</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto p-1">
              {GRANULAR_ROLES.map(gr => (
                <label key={gr.id} className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
                    checked={selectedGranular.includes(gr.id)}
                    onChange={() => toggleGranular(gr.id)}
                  />
                  {gr.name}
                </label>
              ))}
            </div>
            <p className="text-xs text-zinc-500">Assign specific capabilities on top of their base role.</p>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-zinc-100 mt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>

      </div>
    </div>
  )
}

