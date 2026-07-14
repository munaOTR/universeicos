import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabaseClient } from '@universe/database'
import { ROUTES } from '@universe/constants'
import { Spinner } from '@universe/ui'

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const hash = window.location.hash
        const isRecoveryOrInvite = hash.includes('type=recovery') || hash.includes('type=invite')

        const supabase = getSupabaseClient()
        // Supabase js client automatically handles the hash in the URL and establishes the session
        const { error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw sessionError
        }

        // Delay slightly so token can persist before redirect
        setTimeout(() => {
          if (isRecoveryOrInvite) {
            navigate('/auth/set-password', { replace: true })
          } else {
            navigate(ROUTES.ADMIN, { replace: true })
          }
        }, 1000)

      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Authentication failed during callback')
      }
    }

    handleAuthCallback()
  }, [navigate])

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 p-4 text-center">
        <h1 className="text-xl font-bold text-red-600 mb-2">Authentication Failed</h1>
        <p className="text-zinc-600 mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800"
        >
          Return to Login
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 p-4">
      <Spinner size="lg" className="text-primary-600 mb-4" />
      <h2 className="text-lg font-medium text-zinc-900">Verifying...</h2>
    </div>
  )
}
