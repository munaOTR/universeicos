/**
 * send-verification-reminder Edge Function
 *
 * Sends a verification reminder email to one or more users.
 * Requires service-role authorization.
 *
 * Body:
 *   { user_id: string, triggered_by?: string, trigger_source?: string }
 *   OR
 *   { user_ids: string[], triggered_by?: string, trigger_source?: string }
 */

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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Admin client — full auth.admin access
    const supabase = createClient(supabaseUrl, serviceKey)

    // ── Auth: caller must be an authenticated admin ──────────────────────────
    const authHeader = req.headers.get('Authorization') ?? ''
    const callerToken = authHeader.replace('Bearer ', '')

    if (!callerToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Verify caller identity
    const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user: callerUser },
      error: callerErr,
    } = await callerClient.auth.getUser()

    if (callerErr || !callerUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Verify the caller is an admin
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single()

    if (!callerProfile || !['admin', 'super_admin', 'moderator'].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin access required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // ── Parse request body ───────────────────────────────────────────────────
    const body = await req.json()
    const trigger_source: string = body.trigger_source ?? 'manual'
    const triggered_by: string = body.triggered_by ?? callerUser.id

    // Normalize to array of user_ids
    const userIds: string[] = body.user_ids ? body.user_ids : body.user_id ? [body.user_id] : []

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No user_ids provided' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // ── Resolve template ID ──────────────────────────────────────────────────
    const { data: template } = await supabase
      .from('email_templates')
      .select('id, subject')
      .eq('slug', 'verification-reminder')
      .single()

    if (!template) {
      return new Response(JSON.stringify({ error: 'Template not found: verification-reminder' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // Resolve the frontend base URL from env (set in Supabase dashboard secrets)
    const webAppUrl = Deno.env.get('WEB_APP_URL') ?? 'https://universeicos.app'

    const results: Array<{ user_id: string; success: boolean; error?: string }> = []

    for (const userId of userIds) {
      try {
        // 1. Fetch profile — only need email/full_name, skip is_verified check which can be stale.
        //    The caller already filtered via get_verification_eligible_users (auth.email_confirmed_at IS NULL).
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', userId)
          .single()

        if (profileErr || !profile) {
          results.push({ user_id: userId, success: false, error: 'Profile not found' })
          continue
        }

        // Verify the user is still unconfirmed directly from auth (single source of truth)
        const {
          data: { user: authUser },
        } = await supabase.auth.admin.getUserById(userId)
        if (authUser?.email_confirmed_at) {
          results.push({ user_id: userId, success: false, error: 'User already verified' })
          continue
        }

        // 2. Generate a fresh verification token via Supabase Auth Admin.
        //    We use `magiclink` (not `signup`) because the user already exists in auth.users —
        //    calling `signup` on an existing email causes a 500 Internal Server Error.
        //    A magic link signs the user in AND confirms their email on click, which is exactly
        //    what we need for a re-verification reminder.
        const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: profile.email,
        })

        if (linkErr || !linkData?.properties?.hashed_token) {
          results.push({
            user_id: userId,
            success: false,
            error: linkErr?.message ?? 'Failed to generate link',
          })
          continue
        }

        // 3. Build the verification URL pointing directly to our frontend callback.
        //    Supabase returns `hashed_token` in generateLink; we pass it as `token_hash` in the
        //    URL because that's what verifyOtp() expects on the client side.
        //    The type must be `magiclink` to match the token type generated above.
        const params = new URLSearchParams({
          token_hash: linkData.properties.hashed_token,
          type: 'magiclink',
        })
        const verifyUrl = `${webAppUrl}/auth/callback?${params.toString()}`

        // 4. Get reminder count for this user (personalise email copy)
        const { count: reminderCount } = await supabase
          .from('verification_reminders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)

        // 5. Queue email via queue_email RPC
        const { data: queueId, error: queueErr } = await supabase.rpc('queue_email', {
          p_recipient_email: profile.email,
          p_recipient_name: profile.full_name ?? '',
          p_subject: template.subject,
          p_template_id: template.id,
          p_template_data: {
            name: profile.full_name ?? 'Student',
            verifyUrl,
            reminderNumber: (reminderCount ?? 0) + 1,
            expiresInHours: 24,
          },
          p_priority: 'high',
          p_event_id: null,
          p_campaign_id: null,
          p_scheduled_at: null,
        })

        if (queueErr) {
          results.push({ user_id: userId, success: false, error: queueErr.message })
          continue
        }

        // 6. Record reminder in verification_reminders table
        await supabase.rpc('record_verification_reminder', {
          p_user_id: userId,
          p_triggered_by: triggered_by,
          p_trigger_source: trigger_source,
          p_queue_id: queueId,
        })

        // 7. Write audit log
        await supabase.from('audit_logs').insert({
          actor_id: triggered_by,
          action: 'update',
          resource: 'verification',
          details: {
            action: 'verification_reminder_sent',
            target_user_id: userId,
            trigger_source,
            queue_id: queueId,
          },
        })

        results.push({ user_id: userId, success: true })
      } catch (userErr: any) {
        console.error(`Error processing user ${userId}:`, userErr.message)
        results.push({ user_id: userId, success: false, error: userErr.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    // Log failures for debugging
    if (failureCount > 0) {
      console.warn(
        'Failed users:',
        results.filter(r => !r.success)
      )
    }

    // Trigger queue worker immediately to send the queued emails
    if (successCount > 0) {
      const workerUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/comms-queue-worker`
      try {
        await fetch(workerUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
        })
      } catch (err) {
        console.error('Failed to trigger queue worker:', err)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Error in send-verification-reminder:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
