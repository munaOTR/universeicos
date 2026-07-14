import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@universe/database'
import { LEADERBOARD_PAGE_SIZE } from '@universe/constants'

export function useLeaderboard(page = 0) {
  return useQuery({
    queryKey: ['leaderboard', page],
    queryFn: async () => {
      const supabase = getSupabaseClient()
      
      const start = page * LEADERBOARD_PAGE_SIZE
      const end = start + LEADERBOARD_PAGE_SIZE - 1

      const { data, error, count } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, university, points', { count: 'exact' })
        .order('points', { ascending: false })
        .range(start, end)

      if (error) throw error

      return {
        users: data,
        totalCount: count || 0,
        totalPages: count ? Math.ceil(count / LEADERBOARD_PAGE_SIZE) : 0
      }
    },
  })
}
