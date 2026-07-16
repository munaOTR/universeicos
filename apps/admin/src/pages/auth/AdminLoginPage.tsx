import React, { useState } from 'react'
import { getSupabaseClient } from '@universe/database'
import { Button, Input, Label, toast, Modal } from '@universe/ui'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTES } from '@universe/constants'

export function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const isBootstrap = searchParams.get('bootstrap') === 'true'

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    if (!navigator.onLine) {
      toast.error('Network Error', {
        description: 'Please check your internet connection and try again.',
      })
      return
    }

    setIsSubmitting(true)
    const supabase = getSupabaseClient()

    // 1. Check if account is already locked
    const { data: statusData, error: statusError } = await supabase.rpc('check_account_status', {
      user_email: email,
    })
    if (!statusError && statusData?.is_locked) {
      setIsSubmitting(false)
      toast.error('Account Locked', {
        description: 'Too many failed login attempts. Please try again in 15 minutes.',
      })
      return
    }

    // 2. Attempt login
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // 3. Record outcome
    await supabase.rpc('record_login_attempt', { user_email: email, is_success: !error })

    setIsSubmitting(false)

    if (error) {
      // Keep local tracking to log security alert
      const newAttempts = failedAttempts + 1
      setFailedAttempts(newAttempts)

      toast.error('Authentication failed', {
        description: error.message,
      })

      if (newAttempts >= 5) {
        await supabase.rpc('log_security_event', {
          p_event_type: 'security_alert',
          p_email: email,
          p_metadata: { reason: 'Multiple failed login attempts', attempts: newAttempts },
        })
      }
      return
    }

    toast.success('Login successful')
    setFailedAttempts(0)
    navigate(ROUTES.ADMIN)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail) return
    setIsSubmitting(true)

    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      // Must redirect to /auth/callback so verifyOtp() can process the recovery
      // token client-side before navigating onward to /auth/set-password.
      redirectTo: `${window.location.origin}/auth/callback`,
    })

    setIsSubmitting(false)
    if (error) {
      toast.error('Failed to send reset link', { description: error.message })
    } else {
      toast.success('Check your email!', {
        description: 'We sent you a secure password reset link.',
      })
      setShowForgotPassword(false)
    }
  }

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail) return
    setIsSubmitting(true)

    const supabase = getSupabaseClient()

    // First, verify via RPC if this super_admin actually needs bootstrap
    const { data: needsBootstrap, error: rpcError } = await supabase.rpc('check_bootstrap_status', {
      p_email: resetEmail,
    })

    if (rpcError || !needsBootstrap) {
      setIsSubmitting(false)
      toast.error('Bootstrap failed', {
        description: 'Account is not eligible for bootstrap or does not exist.',
      })
      return
    }

    // If valid, send recovery link
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      // Must redirect to /auth/callback so verifyOtp() can process the recovery
      // token client-side before navigating onward to /auth/set-password.
      redirectTo: `${window.location.origin}/auth/callback`,
    })

    setIsSubmitting(false)
    if (error) {
      toast.error('Failed to send setup link', { description: error.message })
    } else {
      toast.success('Check your email!', {
        description: 'We sent you a secure link to initialize your password.',
      })
      setResetEmail('')
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        {isBootstrap ? (
          <>
            <div className="mb-8 text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🛡️</span>
              </div>
              <h1 className="text-2xl font-bold text-zinc-900">Super Admin Setup</h1>
              <p className="text-zinc-500 text-sm mt-2">Initialize your master password</p>
            </div>

            <form onSubmit={handleBootstrap} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="bootstrap-email">Super Admin Email</Label>
                <Input
                  id="bootstrap-email"
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="admin@universeicos.app"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full mt-4 bg-amber-600 hover:bg-amber-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Verifying...' : 'Initialize Account'}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-zinc-900">Admin Portal</h1>
              <p className="text-zinc-500 text-sm mt-2">Sign in to manage Universe</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Work Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@universeicos.app"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email)
                      setShowForgotPassword(true)
                    }}
                    className="text-xs font-medium text-primary-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </>
        )}
      </div>

      <Modal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        title="Reset Password"
      >
        <div className="p-6 text-center space-y-6">
          <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Reset your password</h2>
            <p className="text-zinc-500 mt-2 text-sm">
              Enter your admin email address and we'll send you a link to reset your password.
            </p>
          </div>
          <form onSubmit={handleResetPassword} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="reset-email">Email Address</Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                placeholder="admin@universeicos.app"
                required
                autoFocus
              />
            </div>
            <div className="pt-2 space-y-3">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Sending link...' : 'Send Reset Link'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-zinc-500"
                onClick={() => setShowForgotPassword(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
}
