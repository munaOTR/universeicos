import { useState } from 'react'
import { useLeaderboard, useProfile } from '../../hooks/queries'
import { useAuth } from '@universe/auth'
import { Card, CardContent } from '@universe/ui'
import { Award01Icon } from 'hugeicons-react'

export function LeaderboardPage() {
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const [page] = useState(0) // Pagination can be added later
  const { data: leaderboard, isLoading } = useLeaderboard(page)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 mb-2">
          <Award01Icon size={32} />
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Global Leaderboard</h1>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          The top students on Universe. Earn points by referring friends, completing surveys, and participating in the community.
        </p>
      </div>

      {profile && (
        <Card className="bg-gradient-to-r from-primary-600 to-primary-700 border-none text-white shadow-md mb-8">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm font-semibold uppercase tracking-wider mb-1">Your Standing</p>
              <p className="text-3xl font-extrabold">{profile.points} pts</p>
            </div>
            <div className="text-right">
              <p className="text-primary-100 text-sm font-semibold uppercase tracking-wider mb-1">Rank</p>
              <p className="text-3xl font-extrabold">
                #{leaderboard?.users?.findIndex(u => u.id === user?.id) !== -1 
                  ? (leaderboard?.users?.findIndex(u => u.id === user?.id) ?? 0) + 1 
                  : '100+'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 text-zinc-500 font-semibold uppercase tracking-wider border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4 hidden md:table-cell">University</th>
                  <th className="px-6 py-4 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading ? (
                  [...Array(10)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><div className="h-4 w-6 bg-zinc-100 rounded animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-32 bg-zinc-100 rounded animate-pulse"></div></td>
                      <td className="px-6 py-4 hidden md:table-cell"><div className="h-4 w-48 bg-zinc-100 rounded animate-pulse"></div></td>
                      <td className="px-6 py-4 text-right"><div className="h-4 w-12 bg-zinc-100 rounded animate-pulse ml-auto"></div></td>
                    </tr>
                  ))
                ) : (
                  leaderboard?.users?.map((u, i) => {
                    const isMe = u.id === user?.id
                    return (
                      <tr key={u.id} className={`${isMe ? 'bg-primary-50/50' : 'hover:bg-zinc-50'} transition-colors`}>
                        <td className="px-6 py-4">
                          <div className={`font-bold ${
                            i === 0 ? 'text-amber-500' : 
                            i === 1 ? 'text-zinc-400' : 
                            i === 2 ? 'text-orange-400' : 'text-zinc-900'
                          }`}>
                            #{i + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-zinc-900 flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs shrink-0">
                            {u.full_name?.slice(0, 2).toUpperCase() || '??'}
                          </div>
                          {u.full_name || 'Anonymous'}
                          {isMe && <span className="text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full ml-2">You</span>}
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell text-zinc-500">{u.university || '—'}</td>
                        <td className="px-6 py-4 text-right font-bold text-zinc-900">{u.points}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
