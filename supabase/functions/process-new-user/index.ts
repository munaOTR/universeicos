import { serve } from 'std/http/server.ts'
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify auth or webhook secret here if configured
  // For Database Webhooks, you can pass a custom header
  const authHeader = req.headers.get('Authorization')
  const expectedAuth = `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
  // Accept standard Bearer or allow if it comes from pg_net inside the same project
  if (authHeader && authHeader !== expectedAuth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const body = await req.json()
    const record = body.record // The new auth.user record from pg_net

    if (!record || !record.id) {
      return new Response(JSON.stringify({ error: 'Missing user record' }), { status: 400 })
    }

    const userId = record.id
    const email = record.email
    const rawMetaData = record.raw_user_meta_data || {}

    // Determine assigned role
    let assignedRole = 'student'
    if (['admin', 'super_admin', 'moderator', 'student'].includes(rawMetaData.role)) {
      assignedRole = rawMetaData.role
    }

    // Step 1: Process referral if valid
    if (assignedRole === 'student' && rawMetaData.ref) {
      const { data: referrerUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', rawMetaData.ref)
        .is('deleted_at', null)
        .single()

      if (referrerUser) {
        if (referrerUser.id === userId) {
          // Self-referral fraud log
          await supabase.from('fraud_logs').insert({
            user_id: userId,
            reason: 'self_referral_attempt',
            metadata: { ref_code: rawMetaData.ref },
          })
        } else {
          // Valid referral - insert and increment points
          const { error: refError } = await supabase.from('referrals').insert({
            referrer_id: referrerUser.id,
            referred_id: userId,
            status: 'completed',
          })

          if (!refError) {
            // Need to fetch current points and update, or use RPC if available
            const { data: currentProfile } = await supabase
              .from('profiles')
              .select('points')
              .eq('id', referrerUser.id)
              .single()
            if (currentProfile) {
              await supabase
                .from('profiles')
                .update({ points: currentProfile.points + 100 })
                .eq('id', referrerUser.id)
            }
          }
        }
      }
    }

    // Step 2: Insert into waitlist for students
    if (assignedRole === 'student') {
      // Get the newly generated referral code from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', userId)
        .single()
      const newReferralCode = profile?.referral_code || ''

      await supabase.from('waitlist').insert({
        user_id: userId,
        email: email,
        full_name: rawMetaData.full_name || null,
        university: rawMetaData.university || null,
        faculty: rawMetaData.faculty || null,
        department: rawMetaData.department || null,
        phone: rawMetaData.phone || null,
        graduation_year: rawMetaData.graduation_year
          ? parseInt(rawMetaData.graduation_year, 10)
          : null,
        newsletter_consent:
          rawMetaData.newsletter_consent === 'true' || rawMetaData.newsletter_consent === true,
        terms_accepted_at: rawMetaData.terms_accepted_at || null,
        referral_code: newReferralCode,
        referred_by: rawMetaData.ref || null,
        status: 'verified', // Usually waitlist defaults to pending until verified, but original trigger did 'verified' for waitlist inserts inside new_user if they are already verified
      })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error('Error processing new user:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
