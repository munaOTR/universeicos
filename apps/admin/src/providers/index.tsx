import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { Toaster } from 'sonner'
import { AuthProvider } from '@universe/auth'
import type { ReactNode } from 'react'

// ── Query Client ──────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// ── Error Fallback ────────────────────────────────────────────────────────────

function GlobalErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-zinc-50 p-8 text-center">
      <div className="text-4xl">⚠️</div>
      <h1 className="text-xl font-semibold text-zinc-900">Something went wrong</h1>
      <p className="max-w-sm text-sm text-zinc-500">{(error as Error)?.message || String(error)}</p>
      <button
        onClick={resetErrorBoundary}
        className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}

// ── Providers ─────────────────────────────────────────────────────────────────

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            className: 'font-sans text-sm',
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
