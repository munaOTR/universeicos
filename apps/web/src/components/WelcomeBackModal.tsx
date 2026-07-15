import React, { useState } from 'react'
import { Modal, Button, Input, toast } from '@universe/ui'
import { getSupabaseClient } from '@universe/database'
import { useInteractionState } from '../hooks/useInteractionState'

interface WelcomeBackModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WelcomeBackModal({ isOpen, onClose }: WelcomeBackModalProps) {
  const { rememberedEmail, markInteraction } = useInteractionState()
  const [email, setEmail] = useState(rememberedEmail || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useDifferent, setUseDifferent] = useState(!rememberedEmail)

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    const supabase = getSupabaseClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    })

    setIsSubmitting(false)

    if (error) {
      toast.error('Failed to send login link', { description: error.message })
      return
    }

    markInteraction(email)
    toast.success('Check your email!', { description: 'We sent you a magic link to securely sign in.' })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Welcome Back">
      <div className="p-6 text-center space-y-6">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">👋</span>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Welcome Back</h2>
          <p className="text-zinc-500 mt-2">
            It looks like you've previously joined Universe. Continue securely to your dashboard.
          </p>
        </div>

        <form onSubmit={handleContinue} className="space-y-4">
          {useDifferent ? (
            <div className="text-left space-y-2">
              <label className="text-sm font-medium text-zinc-700">Email Address</label>
              <Input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="student@university.edu.ng" 
                required 
                autoFocus
              />
            </div>
          ) : (
            <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
              <p className="text-sm text-zinc-500">Continuing as</p>
              <p className="font-semibold text-zinc-900">{rememberedEmail}</p>
            </div>
          )}

          <div className="pt-2 space-y-3">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Sending link...' : 'Continue'}
            </Button>
            
            {!useDifferent && rememberedEmail && (
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  setUseDifferent(true)
                  setEmail('')
                }}
              >
                Use Different Email
              </Button>
            )}

            <Button 
              type="button" 
              variant="ghost" 
              className="w-full text-zinc-500" 
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
