import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@universe/database'

export function useReferralStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['referrals', userId],
    queryFn: async () => {
      if (!userId) return null
      const supabase = getSupabaseClient()
      
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          status,
          created_at,
          referred:profiles!referrals_referred_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calculate stats
      const total = data.length
      const completed = data.filter(r => r.status === 'completed').length
      const pending = data.filter(r => r.status === 'pending').length

      return {
        list: data,
        stats: { total, completed, pending }
      }
    },
    enabled: !!userId,
  })
}
