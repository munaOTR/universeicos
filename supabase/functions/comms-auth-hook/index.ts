import { serve } from "std/http/server.ts"
import { createClient } from "@supabase/supabase-js"
import { render } from "npm:@react-email/render@0.0.12"
import React from "npm:react@18.2.0"

// Import all auth email templates
import { WelcomeEmail } from "../../../packages/email/src/templates/auth/WelcomeEmail.tsx"
import { VerifyEmail } from "../../../packages/email/src/templates/auth/VerifyEmail.tsx"
import { MagicLinkEmail } from "../../../packages/email/src/templates/auth/MagicLinkEmail.tsx"
import { ResetPasswordEmail } from "../../../packages/email/src/templates/auth/ResetPasswordEmail.tsx"
import { PasswordChangedEmail } from "../../../packages/email/src/templates/auth/PasswordChangedEmail.tsx"
import { AdminInvitationEmail } from "../../../packages/email/src/templates/auth/AdminInvitationEmail.tsx"
import { AccountActivatedEmail } from "../../../packages/email/src/templates/auth/AccountActivatedEmail.tsx"
import { AccountSuspendedEmail } from "../../../packages/email/src/templates/auth/AccountSuspendedEmail.tsx"
import { Resend } from "npm:resend@2.0.0"

/**
 * comms-auth-hook
 *
 * Supabase Custom Email Hook — replaces all of Supabase's built-in email
 * delivery with Universe-branded React Email templates dispatched via Resend.
 *
 * Configure in Supabase Dashboard → Authentication → Hooks → Send Email Hook.
 * Set the hook endpoint to this function's URL.
 *
 * Payload schema (from Supabase):
 * {
 *   user: { id, email, ... },
 *   email_data: {
 *     token: string,        -- OTP or token
 *     token_hash: string,   -- hashed token for link construction
 *     redirect_to: string,  -- original redirect URL
 *     email_action_type: "signup" | "recovery" | "magiclink" | "invite" | "email_change" | ...
 *     site_url: string,
 *     verification_link?: string  -- pre-built link (available in some hook types)
 *   }
 * }
 */
serve(async (req) => {
  // Must return 200 even for hook failures to avoid Supabase blocking auth
  const respond = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const supabaseKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!resendApiKey) {
      console.error('[comms-auth-hook] RESEND_API_KEY not set')
      return respond({ error: 'missing resend key' }, 500)
    }

    const resend   = new Resend(resendApiKey)
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.json()
    const { user, email_data } = body

    if (!user?.email || !email_data?.email_action_type) {
      return respond({ error: 'invalid hook payload' }, 400)
    }

    const actionType: string = email_data.email_action_type
    const firstName = user.user_metadata?.full_name?.split(' ')[0] || user.email.split('@')[0]

    // Use redirect_to if available and valid, otherwise fallback to siteUrl
    let baseUrl = 'https://universeicos.app'
    
    if (email_data.redirect_to) {
      try {
        const url = new URL(email_data.redirect_to)
        baseUrl = url.origin
      } catch (e) {
        // Fallback to siteUrl if redirect_to is invalid
        baseUrl = email_data.site_url || baseUrl
      }
    } else {
      baseUrl = email_data.site_url || baseUrl
    }
    
    // If the request came from the admin app or is for an admin invite, ensure we use the admin subdomain
    if (actionType === 'invite' || baseUrl.includes('admin') || baseUrl.includes('5174')) {
      baseUrl = baseUrl.includes('5174') ? 'http://localhost:5174' : 'https://admin.universeicos.app'
    } else if (baseUrl.includes('cjfwpypmzvmetkwgceom.supabase.co')) {
      // Safety catch: If Supabase passes its own API URL due to a config error, fallback to localhost for dev or prod for prod
      baseUrl = 'http://localhost:5173'
    }

    const actionUrl = `${baseUrl}/auth/callback?token_hash=${email_data.token_hash}&type=${actionType}`

    let subject = ''
    let html    = ''
    let text    = ''

    switch (actionType) {
      case 'signup':
      case 'email_change': {
        subject = 'Verify your Universe email'
        const el = React.createElement(VerifyEmail, {
          name:           firstName,
          verificationUrl: actionUrl,
          email:          user.email,
        })
        html = render(el)
        text = render(el, { plainText: true })
        break
      }

      case 'recovery': {
        subject = 'Reset your Universe password'
        const el = React.createElement(ResetPasswordEmail, {
          name:          firstName,
          resetUrl:      actionUrl,
        })
        html = render(el)
        text = render(el, { plainText: true })
        break
      }

      case 'magiclink': {
        subject = 'Your Universe login link'
        const el = React.createElement(MagicLinkEmail, {
          name:      firstName,
          loginUrl:  actionUrl,
          email:     user.email,
        })
        html = render(el)
        text = render(el, { plainText: true })
        break
      }

      case 'invite': {
        subject = "You've been invited to Universe"
        const role        = user.user_metadata?.role || 'admin'
        const inviterName = user.user_metadata?.invited_by_name || 'The Universe Team'
        const el = React.createElement(AdminInvitationEmail, {
          name:         firstName,
          inviterName,
          role,
          setupUrl:     actionUrl,
        })
        html = render(el)
        text = render(el, { plainText: true })
        break
      }

      default: {
        // Unknown action type — let Supabase handle it with its default
        console.warn(`[comms-auth-hook] Unhandled action type: ${actionType}`)
        return respond({ message: 'unhandled action, fallback to default' })
      }
    }

    // Send via Resend
    const { error: sendError } = await resend.emails.send({
      from:    'Universe <hello@universeicos.app>',
      to:      user.email,
      subject,
      html,
      text,
    })

    if (sendError) {
      console.error('[comms-auth-hook] Resend error:', sendError)
      // Still return 200 so Supabase doesn't block the auth flow
      return respond({ error: sendError.message, fallback: true })
    }

    // Log this auth email in our communication infrastructure
    await supabase.from('email_logs').insert({
      event_type:     actionType,
      provider_name:  'resend',
      recipient_email: user.email,
      metadata: {
        action_type: actionType,
        user_id:     user.id,
        sent_via:    'auth-hook',
      },
    })

    return respond({ success: true })

  } catch (error) {
    console.error('[comms-auth-hook] Unexpected error:', error)
    // Return 200 to avoid blocking auth flow — log the error
    return respond({ error: error.message, fallback: true })
  }
})
