import { serve } from "std/http/server.ts"
import { createClient } from "@supabase/supabase-js"
import { createHmac } from "std/node/crypto.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Resend uses Svix for webhook signature verification
// https://resend.com/docs/dashboard/webhooks/verify-webhook
async function verifyResendWebhookSignature(
  payload: string,
  headers: Headers,
  secret: string
): Promise<boolean> {
  try {
    const svixId        = headers.get('svix-id')
    const svixTimestamp = headers.get('svix-timestamp')
    const svixSignature = headers.get('svix-signature')

    if (!svixId || !svixTimestamp || !svixSignature) return false

    // Reject replays older than 5 minutes
    const ts = parseInt(svixTimestamp, 10)
    if (Math.abs(Date.now() / 1000 - ts) > 300) return false

    const toSign = `${svixId}.${svixTimestamp}.${payload}`
    const key = secret.startsWith('whsec_')
      ? atob(secret.replace('whsec_', ''))
      : secret

    const encoder = new TextEncoder()
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(toSign))
    const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    const expectedSig = `v1,${b64}`

    // svix-signature can contain multiple space-separated sigs
    return svixSignature.split(' ').some(s => s === expectedSig)
  } catch {
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET') ?? ''

  try {
    const rawBody = await req.text()

    // Verify signature in production if secret is set
    if (webhookSecret) {
      const valid = await verifyResendWebhookSignature(rawBody, req.headers, webhookSecret)
      if (!valid) {
        console.error('Webhook signature verification failed')
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
      }
    }

    const payload = JSON.parse(rawBody)
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Resend webhook event structure:
    // { type: "email.delivered" | "email.bounced" | "email.complained" | ..., data: { email_id, ... } }
    const eventType: string = payload.type
    const data = payload.data

    if (!eventType || !data?.email_id) {
      return new Response(JSON.stringify({ skipped: true, reason: 'missing event data' }), { status: 200 })
    }

    const simpleEvent = eventType.replace('email.', '') // 'delivered', 'bounced', etc.

    // 1. Find matching queue item by provider_message_id
    const { data: queueItem } = await supabase
      .from('email_queue')
      .select('id, campaign_id, recipient_email')
      .eq('provider_message_id', data.email_id)
      .maybeSingle()

    // 2. Log the delivery event
    await supabase.from('email_logs').insert({
      queue_id:         queueItem?.id ?? null,
      campaign_id:      queueItem?.campaign_id ?? null,
      event_type:       simpleEvent,
      provider_name:    'resend',
      provider_event_id: data.email_id,
      recipient_email:  data.to?.[0] ?? queueItem?.recipient_email,
      metadata:         data,
    })

    // 3. Update queue item status based on event
    if (queueItem?.id) {
      const statusMap: Record<string, string> = {
        delivered: 'delivered',
        bounced:   'failed',
        complained: 'failed',
      }
      const newStatus = statusMap[simpleEvent]
      if (newStatus) {
        await supabase.from('email_queue')
          .update({
            status: newStatus,
            ...(simpleEvent === 'delivered' ? { delivered_at: new Date().toISOString() } : {}),
            ...(newStatus === 'failed' ? { error_message: `Provider event: ${simpleEvent}` } : {}),
          })
          .eq('id', queueItem.id)
      }
    }

    // 4. Bounce suppression — hard bounce or spam complaint → suppress immediately
    const recipientEmail = data.to?.[0] ?? queueItem?.recipient_email
    if (recipientEmail) {
      if (simpleEvent === 'bounced' && data.bounce?.type === 'hard') {
        console.log(`Hard bounce — suppressing ${recipientEmail}`)
        await supabase.from('suppressed_emails').upsert({
          email:      recipientEmail,
          reason:     'hard_bounce',
          provider:   'resend',
          event_id:   data.email_id,
        }, { onConflict: 'email' })
      }

      if (simpleEvent === 'complained') {
        console.log(`Spam complaint — suppressing ${recipientEmail}`)
        await supabase.from('suppressed_emails').upsert({
          email:      recipientEmail,
          reason:     'complaint',
          provider:   'resend',
          event_id:   data.email_id,
        }, { onConflict: 'email' })

        // Also disable all non-auth communication preferences for this user
        // Identify user by email via profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', recipientEmail)
          .maybeSingle()

        if (profile) {
          const categories = ['marketing', 'announcements', 'surveys', 'referral_updates', 'beta_updates']
          await supabase.from('communication_preferences').upsert(
            categories.map(category => ({
              user_id:    profile.id,
              category,
              channel:    'email',
              is_enabled: false,
            })),
            { onConflict: 'user_id, category, channel' }
          )
        }
      }

      // Soft bounce tracking — suppress after 3+ soft bounces in 30 days
      if (simpleEvent === 'bounced' && data.bounce?.type === 'soft') {
        const { count } = await supabase
          .from('email_logs')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_email', recipientEmail)
          .eq('event_type', 'bounced')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

        if ((count ?? 0) >= 3) {
          console.log(`Repeated soft bounce (${count}) — suppressing ${recipientEmail}`)
          await supabase.from('suppressed_emails').upsert({
            email:    recipientEmail,
            reason:   'repeated_soft_bounce',
            provider: 'resend',
            event_id: data.email_id,
          }, { onConflict: 'email' })
        }
      }
    }

    return new Response(JSON.stringify({ success: true, event: simpleEvent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Delivery webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
