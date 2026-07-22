import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabaseClient } from '@universe/database'
import { ROUTES } from '@universe/constants'
import { Spinner, toast } from '@universe/ui'
import { useInteractionState } from '../../hooks/useInteractionState'

export function AuthCallback() {
  const navigate = useNavigate()

  const searchParams = new URLSearchParams(window.location.search)
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const [error, setError] = useState<string | null>(errorDescription || errorParam)
  const { markInteraction } = useInteractionState()

  useEffect(() => {
    let mounted = true

    if (errorParam || errorDescription) {
      return // Skip processing if Supabase already sent an error
    }

    const supabase = getSupabaseClient()

    const handleSuccess = (session: any) => {
      if (!mounted) return
      // Clean up the URL to prevent token leakage in history or referers
      window.history.replaceState({}, document.title, window.location.pathname)

      toast.success('Successfully logged in!')
      markInteraction(session.user.email)

      // Only send the welcome email for brand-new signups (created within the last 5 minutes)
      const isNewUser = new Date(session.user.created_at).getTime() > Date.now() - 5 * 60 * 1000
      if (isNewUser) {
        // Fire welcome email asynchronously — do not block navigation
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ event: 'welcome', userId: session.user.id }),
        }).catch(err => console.error('Failed to trigger welcome email:', err))

        navigate(ROUTES.WAITLIST_SUCCESS, { replace: true })
      } else {
        navigate(ROUTES.DASHBOARD, { replace: true })
      }
    }

    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type') as 'recovery' | 'invite' | 'signup' | 'magiclink'

    if (tokenHash && type) {
      // 1. Explicit token hash verification (Query Params)
      supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ data, error }) => {
        if (!mounted) return
        if (error) {
          const isPkceError =
            error.message.toLowerCase().includes('pkce') ||
            error.message.toLowerCase().includes('auth session missing') ||
            error.message.toLowerCase().includes('invalid token') ||
            error.message.toLowerCase().includes('not found')
          setError(
            isPkceError
              ? 'Security check failed. Please open this link in the exact same browser/device where you requested it, or request a new link.'
              : error.message
          )
        } else if (data?.session) handleSuccess(data.session)
      })
    } else {
      // 2. Hash-based resolution (Fragment processing by Supabase Auth)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          handleSuccess(session)
        }
      })

      // We also check getSession in case the event fired before we mounted
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (!mounted) return
        if (error) {
          setError(error.message)
        } else if (session) {
          handleSuccess(session)
        } else if (!window.location.hash.includes('access_token')) {
          // If there is no session and no hash to parse, the link is definitely invalid
          setError('Invalid or expired secure link.')
        } else {
          // We have a hash but no session yet, meaning onAuthStateChange is still processing.
          // Fallback timeout just in case the event listener fails to fire on weird devices.
          setTimeout(() => {
            if (!mounted) return
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session) handleSuccess(session)
              else setError('Invalid or expired secure link.')
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
  }, [navigate, markInteraction])

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-4 bg-zinc-50 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-zinc-900">Verification Failed</h2>
        <p className="mt-2 text-zinc-500">{error}</p>
        <button
          onClick={() => navigate(ROUTES.WAITLIST)}
          className="mt-6 rounded-md bg-primary-500 px-4 py-2 text-white font-medium hover:bg-primary-600"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50">
      <Spinner size="lg" className="text-primary-500 mb-4" />
      <p className="text-sm font-medium text-zinc-600">Verifying your secure link...</p>
    </div>
  )
}
