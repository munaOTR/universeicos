import React, { createContext, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@universe/database'
import type { Session, User } from '@supabase/supabase-js'
import type { Database } from '@universe/types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  roles: string[]
  permissions: string[]
  isLoading: boolean
  error: Error | null
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const supabase = getSupabaseClient()

  const { data: sessionData, isLoading: isLoadingSession, error: sessionError } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    },
    staleTime: Infinity,
  })

  const user = sessionData?.user ?? null

  const { data: profileData, isLoading: isLoadingProfile, error: profileError } = useQuery({
    queryKey: ['auth', 'profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const { data: accessData, isLoading: isLoadingAccess, error: accessError } = useQuery({
    queryKey: ['auth', 'access', user?.id],
    queryFn: async () => {
      if (!user) return { roles: [], permissions: [] }
      
      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          roles (
            name,
            role_permissions (
              permissions (
                resource,
                action
              )
            )
          )
        `)
        .eq('user_id', user.id)
      
      if (rolesError) throw rolesError

      const roles = new Set<string>()
      const permissions = new Set<string>()

      userRoles?.forEach((ur: any) => {
        const role = ur.roles
        if (role) {
          roles.add(role.name)
          role.role_permissions?.forEach((rp: any) => {
            const perm = rp.permissions
            if (perm) {
              permissions.add(`${perm.action}:${perm.resource}`)
            }
          })
        }
      })

      return {
        roles: Array.from(roles),
        permissions: Array.from(permissions)
      }
    },
    enabled: !!user,
  })

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData(['auth', 'session'], session)
      if (!session) {
        // Clear related queries on logout
        queryClient.removeQueries({ queryKey: ['auth', 'profile'] })
        queryClient.removeQueries({ queryKey: ['auth', 'access'] })
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, queryClient])

  const isLoading = isLoadingSession || (!!user && (isLoadingProfile || isLoadingAccess))
  const error = (sessionError || profileError || accessError) as Error | null

  const value: AuthContextType = {
    session: sessionData ?? null,
    user,
    profile: profileData ?? null,
    roles: accessData?.roles ?? [],
    permissions: accessData?.permissions ?? [],
    isLoading,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
