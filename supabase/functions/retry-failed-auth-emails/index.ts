import { serve } from 'std/http/server.ts'
import { createClient } from '@supabase/supabase-js'
import { render } from 'npm:@react-email/render@0.0.12'
import React from 'npm:react@18.2.0'
import { Resend } from 'npm:resend@2.0.0'

// Import all auth email templates
import { WelcomeEmail } from '../../../packages/email/src/templates/auth/WelcomeEmail.tsx'
import { VerifyEmail } from '../../../packages/email/src/templates/auth/VerifyEmail.tsx'
import { MagicLinkEmail } from '../../../packages/email/src/templates/auth/MagicLinkEmail.tsx'
import { ResetPasswordEmail } from '../../../packages/email/src/templates/auth/ResetPasswordEmail.tsx'
import { PasswordChangedEmail } from '../../../packages/email/src/templates/auth/PasswordChangedEmail.tsx'
import { AdminInvitationEmail } from '../../../packages/email/src/templates/auth/AdminInvitationEmail.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Basic security check for CRON jobs
  const authHeader = req.headers.get('Authorization')
  const expectedAuth = `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
  if (authHeader && authHeader !== expectedAuth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const resendApiKey = Deno.env.get('RESEND_API_KEY')!

  const supabase = createClient(supabaseUrl, supabaseKey)
  const resend = new Resend(resendApiKey)

  try {
    // 1. Fetch pending failed auth emails (from the last 24 hours)
    const { data: failedLogs, error: fetchError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('event_type', 'failed_auth_fallback')
      .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(20)

    if (fetchError) throw fetchError

    if (!failedLogs || failedLogs.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), { status: 200 })
    }

    let successCount = 0

    // 2. Process each failed log
    for (const log of failedLogs) {
      const { metadata, recipient_email } = log
      const { action_type, token_hash, redirect_to, site_url, user_id } = metadata

      if (!token_hash || !recipient_email) {
        console.warn(`Skipping log ${log.id} due to missing token_hash or email`)
        // Update to permanently failed so we don't retry it forever
        await supabase
          .from('email_logs')
          .update({ event_type: 'failed_auth_permanent' })
          .eq('id', log.id)
        continue
      }

      // Fetch user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user_id)
        .single()
      const firstName = profile?.full_name?.split(' ')[0] || recipient_email.split('@')[0]

      // Reconstruct actionUrl
      let baseUrl = 'https://universeicos.app'
      if (redirect_to) {
        try {
          const url = new URL(redirect_to)
          baseUrl = url.origin
        } catch (e) {
          baseUrl = site_url || baseUrl
        }
      } else {
        baseUrl = site_url || baseUrl
      }

      if (action_type === 'invite' || baseUrl.includes('admin') || baseUrl.includes('5174')) {
        baseUrl = baseUrl.includes('5174')
          ? 'http://localhost:5174'
          : 'https://admin.universeicos.app'
      } else if (baseUrl.includes('cjfwpypmzvmetkwgceom.supabase.co')) {
        baseUrl = 'http://localhost:5173'
      }

      const actionUrl = `${baseUrl}/auth/callback?token_hash=${token_hash}&type=${action_type}`

      let subject = ''
      let html = ''
      let text = ''

      switch (action_type) {
        case 'signup':
        case 'email_change': {
          subject = 'Verify your Universe email'
          const el = React.createElement(VerifyEmail, {
            name: firstName,
            verificationUrl: actionUrl,
            email: recipient_email,
          })
          html = render(el)
          text = render(el, { plainText: true })
          break
        }
        case 'recovery': {
          subject = 'Reset your Universe password'
          const el = React.createElement(ResetPasswordEmail, {
            name: firstName,
            resetUrl: actionUrl,
          })
          html = render(el)
          text = render(el, { plainText: true })
          break
        }
        case 'magiclink': {
          subject = 'Your Universe login link'
          const el = React.createElement(MagicLinkEmail, {
            name: firstName,
            loginUrl: actionUrl,
            email: recipient_email,
          })
          html = render(el)
          text = render(el, { plainText: true })
          break
        }
        case 'invite': {
          subject = "You've been invited to Universe"
          const role = 'admin'
          const inviterName = 'The Universe Team'
          const el = React.createElement(AdminInvitationEmail, {
            name: firstName,
            inviterName,
            role,
            setupUrl: actionUrl,
          })
          html = render(el)
          text = render(el, { plainText: true })
          break
        }
        default: {
          console.warn(`[retry-failed-auth-emails] Unhandled action type: ${action_type}`)
          await supabase
            .from('email_logs')
            .update({ event_type: 'failed_auth_permanent' })
            .eq('id', log.id)
          continue
        }
      }

      // 3. Send via Resend
      const { error: sendError } = await resend.emails.send({
        from: 'Universe <hello@universeicos.app>',
        to: recipient_email,
        subject,
        html,
        text,
      })

      if (sendError) {
        console.error(`Failed to retry email for log ${log.id}:`, sendError)
        // If it fails again, leave it as 'failed_auth_fallback' for the next cron tick
        continue
      }

      // 4. Update log on success
      await supabase
        .from('email_logs')
        .update({
          event_type: action_type, // Change it to the actual action type (e.g. 'recovery')
          metadata: {
            ...metadata,
            retry_successful: true,
            retried_at: new Date().toISOString(),
          },
        })
        .eq('id', log.id)

      successCount++
    }

    return new Response(JSON.stringify({ processed: failedLogs.length, success: successCount }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Retry worker error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
