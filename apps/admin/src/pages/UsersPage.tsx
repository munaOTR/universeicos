import { useState, useEffect, useMemo, useCallback } from 'react'
import { getSupabaseClient } from '@universe/database'
import type { UserWithVerification, UserRole } from '@universe/types'
import { PageHeader } from '../components/shared/PageHeader'
import { RoleSelect } from '../components/shared/RoleSelect'
import { AdminInviteModal } from '../components/users/AdminInviteModal'
import { UserProfilePanel } from '../components/users/UserProfilePanel'
import { BulkReminderModal } from '../components/users/BulkReminderModal'
import { VerificationBadge, getVerificationStatus } from '../components/users/VerificationBadge'
import { Spinner, toast } from '@universe/ui'
import {
  Download01Icon,
  MailAdd01Icon,
  Search01Icon,
  FilterIcon,
  Mail01Icon,
} from 'hugeicons-react'

// ── Filter state ─────────────────────────────────────────────────────────────

type VerificationFilter =
  | 'all'
  | 'verified'
  | 'unverified'
  | 'pending'
  | 'reminder_sent'
  | 'eligible'

const VERIFICATION_FILTER_LABELS: Record<VerificationFilter, string> = {
  all:           'All',
  verified:      'Verified',
  unverified:    'Unverified',
  pending:       'Pending',
  reminder_sent: 'Reminder Sent',
  eligible:      'Eligible',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function getInitials(name: string | null, email: string) {
  return (name?.charAt(0) ?? email.charAt(0) ?? '?').toUpperCase()
}

// ── Main component ────────────────────────────────────────────────────────────

export function UsersPage() {
  const [users, setUsers]                 = useState<UserWithVerification[]>([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [vFilter, setVFilter]             = useState<VerificationFilter>('all')
  const [roleFilter, setRoleFilter]       = useState<string>('all')
  const [selectedUser, setSelectedUser]   = useState<UserWithVerification | null>(null)
  const [showInviteModal, setShowInviteModal]   = useState(false)
  const [showBulkModal, setShowBulkModal]       = useState(false)

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.rpc('get_users_with_verification_status', {
      p_limit: 500,
      p_offset: 0,
    })
    if (error) {
      toast.error('Failed to load users', { description: error.message })
    }
    if (data) {
      setUsers(data as UserWithVerification[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // ── Optimistic role update ─────────────────────────────────────────────────

  const handleRoleChanged = useCallback((userId: string, newRole: UserRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
  }, [])

  // ── Client-side filtering ──────────────────────────────────────────────────

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim()

    return users.filter(user => {
      // Search
      if (q) {
        const matches =
          user.email?.toLowerCase().includes(q) ||
          user.full_name?.toLowerCase().includes(q) ||
          user.university?.toLowerCase().includes(q) ||
          user.department?.toLowerCase().includes(q)
        if (!matches) return false
      }

      // Role filter
      if (roleFilter !== 'all' && user.role !== roleFilter) return false

      // Verification filter
      const status = getVerificationStatus(user.email_confirmed_at, user.created_at)
      switch (vFilter) {
        case 'verified':
          if (status !== 'verified') return false
          break
        case 'unverified':
          if (status !== 'unverified') return false
          break
        case 'pending':
          if (status !== 'pending') return false
          break
        case 'reminder_sent':
          if (user.reminder_count === 0) return false
          break
        case 'eligible':
          if (!user.is_eligible_for_reminder) return false
          break
        default:
          break
      }

      return true
    })
  }, [users, search, vFilter, roleFilter])

  const eligibleCount = useMemo(() => users.filter(u => u.is_eligible_for_reminder).length, [users])

  // ── CSV Export ─────────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) return
    const headers = ['ID', 'Name', 'Email', 'University', 'Faculty', 'Department', 'Role', 'Points', 'Verified', 'Verification Date', 'Reminders Sent', 'Joined']
    const rows = filteredUsers.map(u => [
      u.id,
      `"${u.full_name ?? ''}"`,
      `"${u.email ?? ''}"`,
      `"${u.university ?? ''}"`,
      `"${u.faculty ?? ''}"`,
      `"${u.department ?? ''}"`,
      u.role,
      u.points,
      u.email_confirmed_at ? 'Yes' : 'No',
      u.email_confirmed_at ? new Date(u.email_confirmed_at).toISOString() : '',
      u.reminder_count,
      new Date(u.created_at).toISOString(),
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `universe_users_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Users"
        description="Manage all signed up students and administrators."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {eligibleCount > 0 && (
              <button
                onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 border border-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors text-sm shadow-sm"
              >
                <Mail01Icon size={16} />
                <span>Send Reminders ({eligibleCount})</span>
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 font-medium rounded-lg hover:bg-zinc-50 transition-colors text-sm shadow-sm"
            >
              <Download01Icon size={16} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 border border-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm shadow-sm"
            >
              <MailAdd01Icon size={16} />
              <span>Invite Admin</span>
            </button>
          </div>
        }
      />

      {/* Search + Role Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search01Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or university…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 text-zinc-900 placeholder-zinc-400"
          />
        </div>

        {/* Role filter */}
        <div className="relative">
          <FilterIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="pl-8 pr-8 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-zinc-700 appearance-none cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="admin">Admins</option>
            <option value="moderator">Moderators</option>
            <option value="super_admin">Super Admins</option>
          </select>
        </div>
      </div>

      {/* Verification Filter Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(VERIFICATION_FILTER_LABELS) as VerificationFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setVFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              vFilter === f
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            {VERIFICATION_FILTER_LABELS[f]}
            {f === 'eligible' && eligibleCount > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                vFilter === f ? 'bg-white/20' : 'bg-amber-100 text-amber-700'
              }`}>
                {eligibleCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Spinner size="lg" className="text-primary-500" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="text-sm font-medium text-zinc-600">No users found</p>
            <p className="text-xs text-zinc-400 mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-0 text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-48">
                    Student
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Verification
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                    University
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">
                    Joined
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredUsers.map(user => {
                  const status = getVerificationStatus(user.email_confirmed_at, user.created_at)
                  return (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="hover:bg-zinc-50 cursor-pointer transition-colors group"
                    >
                      {/* Student */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center text-xs font-bold text-primary-700 uppercase shrink-0">
                            {getInitials(user.full_name, user.email)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-zinc-900 truncate leading-tight max-w-[120px]">
                              {user.full_name ?? '—'}
                            </p>
                            <p className="text-[11px] text-zinc-400 truncate max-w-[120px]">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Verification */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <VerificationBadge status={status} size="sm" />
                          {user.reminder_count > 0 && (
                            <span className="text-[10px] text-zinc-400">
                              {user.reminder_count} reminder{user.reminder_count !== 1 ? 's' : ''} sent
                            </span>
                          )}
                        </div>
                      </td>

                      {/* University */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span
                          className="text-zinc-600 text-sm truncate block max-w-[160px]"
                          title={user.university ?? undefined}
                        >
                          {user.university ?? '—'}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-zinc-500 text-sm whitespace-nowrap">
                          {formatDate(user.created_at)}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <RoleSelect
                          userId={user.id}
                          currentRole={user.role as UserRole}
                          onRoleChanged={handleRoleChanged}
                        />
                      </td>

                      {/* Points */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="font-mono text-sm font-medium text-zinc-800">
                          {user.points.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && filteredUsers.length > 0 && (
          <div className="px-4 py-3 border-t border-zinc-100 flex items-center justify-between">
            <p className="text-xs text-zinc-400">
              Showing <strong>{filteredUsers.length.toLocaleString()}</strong> of{' '}
              <strong>{users.length.toLocaleString()}</strong> users
            </p>
            <p className="text-xs text-zinc-400">
              {users.filter(u => u.email_confirmed_at).length.toLocaleString()} verified
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showInviteModal && (
        <AdminInviteModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => { setShowInviteModal(false); fetchUsers() }}
        />
      )}

      {showBulkModal && (
        <BulkReminderModal
          onClose={() => setShowBulkModal(false)}
          onSuccess={(count) => {
            setShowBulkModal(false)
            toast.success(`${count} reminder emails queued`)
            fetchUsers()
          }}
        />
      )}

      {selectedUser && (
        <UserProfilePanel
          userId={selectedUser.id}
          onClose={() => setSelectedUser(null)}
          onUpdate={fetchUsers}
        />
      )}
    </div>
  )
}
