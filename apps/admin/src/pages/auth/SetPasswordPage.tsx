import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabaseClient } from '@universe/database'
import { Button, Input, Label, toast } from '@universe/ui'
import { ROUTES } from '@universe/constants'

export function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if we have an active session (which happens automatically when clicking the invite link)
    const supabase = getSupabaseClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error('Invalid or expired invitation link.')
        navigate('/')
      }
    })
  }, [navigate])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setIsSubmitting(true)
    const supabase = getSupabaseClient()

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    setIsSubmitting(false)

    if (error) {
      toast.error('Failed to set password', {
        description: error.message,
      })
      return
    }

    toast.success('Password set successfully! Welcome to Universe.')
    navigate(ROUTES.ADMIN)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900">Set Your Password</h1>
          <p className="text-zinc-500 text-sm mt-2">Create a secure password for your admin account</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Set Password'}
          </Button>
        </form>
      </div>
    </div>
  )
}
