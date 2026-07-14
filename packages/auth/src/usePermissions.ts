import { useAuth } from './useAuth'

export function usePermissions() {
  const { roles, permissions, profile } = useAuth()

  const hasRole = (role: string | string[]) => {
    const allRoles = [...roles]
    if (profile?.role) allRoles.push(profile.role)

    if (allRoles.includes('super_admin')) return true // Super admin override
    const rolesToCheck = Array.isArray(role) ? role : [role]
    return rolesToCheck.some((r) => allRoles.includes(r))
  }

  const hasPermission = (action: string, resource: string) => {
    if ((profile?.role as string) === 'super_admin' || roles.includes('super_admin')) return true // Super admin override
    const permissionString = `${action}:${resource}`
    return permissions.includes(permissionString)
  }

  return { hasRole, hasPermission }
}
