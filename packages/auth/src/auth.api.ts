import { getSupabaseClient } from '@universe/database'

export async function loginWithEmail(email: string, password?: string) {
  const supabase = getSupabaseClient()
  
  // Example for MVP: Only support email + password right now.
  // We can expand this later if magic link is needed.
  if (!password) {
    throw new Error('Password is required for login')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  // Log activity
  if (data.user) {
    await supabase.from('activity_logs').insert({
      user_id: data.user.id,
      activity_type: 'login',
      metadata: { method: 'email_password' }
    })
  }

  return data
}

export async function registerWithEmail(email: string, password?: string, fullName?: string) {
  const supabase = getSupabaseClient()

  if (!password) {
    throw new Error('Password is required for registration')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) throw error

  return data
}

export async function signOut() {
  const supabase = getSupabaseClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session?.user) {
    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: session.user.id,
      activity_type: 'logout',
      metadata: { method: 'user_initiated' }
    })
  }

  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(email: string) {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
  })

  if (error) throw error
}

export async function updatePassword(password: string) {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase.auth.updateUser({
    password
  })

  if (error) throw error
}
