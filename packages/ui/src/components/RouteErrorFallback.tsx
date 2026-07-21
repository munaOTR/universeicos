import { useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { Button } from './Button'

export function RouteErrorFallback() {
  const error = useRouteError()

  let title = 'Something went wrong'
  let description =
    'We encountered an unexpected error. Please try again or return to the homepage.'
  let is404 = false

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      is404 = true
      title = 'Page not found'
      description = "The page you are looking for doesn't exist or has been moved."
    } else {
      title = `${error.status} ${error.statusText}`
      description = error.data?.message || description
    }
  } else if (error instanceof Error) {
    if (
      error.message.includes('Missing or invalid required environment variables') ||
      error.message.includes('Missing Supabase environment variables')
    ) {
      title = 'Configuration Error'
      description =
        'The application is missing required environment variables. Please check your hosting configuration.'
    } else {
      // Show the message, which helps developers identify what failed
      description = error.message || description
    }
  } else if (typeof error === 'string') {
    description = error
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${is404 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}
        >
          {is404 ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">{title}</h1>
        <p className="text-zinc-500 mb-6 text-sm whitespace-pre-wrap">{description}</p>
        <div className="space-y-3">
          <Button onClick={() => window.location.reload()} className="w-full">
            Reload Page
          </Button>
          <Button variant="ghost" onClick={() => (window.location.href = '/')} className="w-full">
            Go to Homepage
          </Button>
        </div>
      </div>
    </div>
  )
}
