import { getSupabaseClient } from '@universe/database'

export async function fetchGlobalLeaderboard(limit = 100) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, points, university, avatar_url')
    .order('points', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }

  return data
}

export async function fetchUniversityLeaderboard(university: string, limit = 100) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, points, university, avatar_url')
    .eq('university', university)
    .order('points', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching university leaderboard:', error)
    return []
  }

  return data
}
