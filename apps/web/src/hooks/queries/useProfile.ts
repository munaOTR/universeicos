import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@universe/database'

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }
      return data
    },
    enabled: !!userId,
  })
}
