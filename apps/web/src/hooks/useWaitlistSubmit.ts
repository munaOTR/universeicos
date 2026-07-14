import { useState } from 'react'
import { getSupabaseClient } from '@universe/database'
import { toast } from '@universe/ui'
import { WaitlistFormData } from '@universe/validation'

export function useWaitlistSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const submit = async (data: WaitlistFormData) => {
    setIsSubmitting(true)
    const supabase = getSupabaseClient()

    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: data.full_name,
          university: data.university,
          faculty: data.faculty ?? null,
          department: data.department ?? null,
          phone: data.phone ?? null,
          graduation_year: data.graduation_year ?? null,
          newsletter_consent: data.newsletter_consent ?? false,
          terms_accepted_at: new Date().toISOString(),
          ref: data.referral_code,
        },
      },
    })

    setIsSubmitting(false)

    if (error) {
      toast.error('Something went wrong', {
        description: error.message,
      })
      return { success: false, error }
    }

    setIsSuccess(true)
    toast.success('Check your email!', {
      description: 'We sent you a magic link to complete your waitlist registration.',
      duration: 8000,
    })

    return { success: true }
  }

  return {
    submit,
    isSubmitting,
    isSuccess,
  }
}
