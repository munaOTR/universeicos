import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabaseClient } from '@universe/database'
import { ROUTES } from '@universe/constants'
import { Spinner, toast } from '@universe/ui'

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = getSupabaseClient()
      
      // Supabase js automatically handles the hash fragments from the URL
      // if persistSession is true. We just need to check if we have a session.
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        setError(error.message)
        return
      }

      if (session) {
        toast.success('Successfully logged in!')

        // Only send the welcome email for brand-new signups (created within the last 5 minutes)
        const isNewUser = new Date(session.user.created_at).getTime() > Date.now() - 5 * 60 * 1000
        if (isNewUser) {
          // Fire welcome email asynchronously — do not await, do not block navigation
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-webhook`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ event: 'welcome', userId: session.user.id })
          }).catch(err => console.error('Failed to trigger welcome email:', err))

          navigate(ROUTES.WAITLIST_SUCCESS, { replace: true })
        } else {
          navigate(ROUTES.DASHBOARD, { replace: true })
        }
      } else {
        // No session yet — URL hash may not have been parsed. Wait briefly and retry.
        setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            toast.success('Successfully logged in!')

            const isNewUser = new Date(session.user.created_at).getTime() > Date.now() - 5 * 60 * 1000
            if (isNewUser) {
              fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-webhook`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ event: 'welcome', userId: session.user.id })
              }).catch(err => console.error('Failed to trigger welcome email:', err))

              navigate(ROUTES.WAITLIST_SUCCESS, { replace: true })
            } else {
              navigate(ROUTES.DASHBOARD, { replace: true })
            }
          } else {
            setError('Invalid or expired magic link.')
          }
        }, 1000)
      }
    }

    handleCallback()
  }, [navigate])

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
