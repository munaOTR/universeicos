import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabaseClient } from '@universe/database'
import { ROUTES } from '@universe/constants'
import { Spinner } from '@universe/ui'

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const supabase = getSupabaseClient()

    const searchParams = new URLSearchParams(window.location.search)
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type') as 'recovery' | 'invite' | 'signup'
    const hash = window.location.hash

    const isRecoveryOrInvite =
      type === 'recovery' ||
      type === 'invite' ||
      hash.includes('type=recovery') ||
      hash.includes('type=invite')

    const handleSuccess = () => {
      if (!mounted) return
      window.history.replaceState({}, document.title, window.location.pathname)

      if (isRecoveryOrInvite) {
        navigate('/auth/set-password', { replace: true })
      } else {
        navigate(ROUTES.ADMIN, { replace: true })
      }
    }

    if (tokenHash && type) {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ data, error }) => {
        if (!mounted) return
        if (error) setError(error.message)
        else if (data?.session) handleSuccess()
      })
    } else {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          handleSuccess()
        }
      })

      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (!mounted) return
        if (error) {
          setError(error.message)
        } else if (session) {
          handleSuccess()
        } else if (!window.location.hash.includes('access_token')) {
          setError('Invalid or expired secure link.')
        } else {
          setTimeout(() => {
            if (!mounted) return
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session) handleSuccess()
              else setError('Authentication failed during callback. Link may be expired.')
            })
          }, 3000)
        }
      })

      return () => {
        mounted = false
        subscription.unsubscribe()
      }
    }

    return () => {
      mounted = false
    }
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
