import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import { usePermissions } from './usePermissions'

interface RequireAuthProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export function RequireAuth({ children, fallback, redirectTo = '/login' }: RequireAuthProps) {
  const { session, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <>{fallback ?? <div>Loading...</div>}</>
  }

  if (!session) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  return <>{children}</>
}

interface GuestRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export function GuestRoute({ children, fallback, redirectTo = '/dashboard' }: GuestRouteProps) {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return <>{fallback ?? <div>Loading...</div>}</>
  }

  if (session) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

interface RoleGuardProps {
  role: string | string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ role, children, fallback = null }: RoleGuardProps) {
  const { hasRole } = usePermissions()
  const { isLoading } = useAuth()

  if (isLoading) return null

  if (!hasRole(role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface PermissionGuardProps {
  action: string
  resource: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGuard({ action, resource, children, fallback = null }: PermissionGuardProps) {
  const { hasPermission } = usePermissions()
  const { isLoading } = useAuth()

  if (isLoading) return null

  if (!hasPermission(action, resource)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
