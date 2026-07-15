import { serve } from "std/http/server.ts"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "npm:resend@2.0.0"
import { render } from "npm:@react-email/render@0.0.12"
import React from "npm:react@18.2.0"
import { TEMPLATE_REGISTRY } from "./templateRegistry.ts"

// Helper for backoff
export function calculateBackoffSeconds(attempt: number, baseSeconds = 30, maxSeconds = 3600): number {
  const delay = baseSeconds * Math.pow(2, attempt - 1)
  return Math.min(delay, maxSeconds)
}

const PRIORITY_LIMITS: Record<string, number> = {
  critical: 7, high: 5, medium: 3, low: 2, bulk: 1
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Optional: check internal auth/service role for security if triggered via HTTP
  const authHeader = req.headers.get('Authorization')
  const expectedAuth = `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
  // Support either Bearer token or direct cron trigger without auth if using native pg_net correctly inside DB
  if (authHeader && authHeader !== expectedAuth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const resendApiKey = Deno.env.get('RESEND_API_KEY')!
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  const resend = new Resend(resendApiKey)

  try {
    // 1. Check quotas
    const { data: quota } = await supabase
      .from('provider_quotas')
      .select('*')
      .eq('provider_name', 'resend')
      .single()

    let blockLowPriority = false
    if (quota) {
      const remainingDaily = quota.daily_limit - quota.daily_used
      if (remainingDaily <= quota.reserve_buffer) {
        blockLowPriority = true
      }
      if (remainingDaily <= 0) {
        return new Response(JSON.stringify({ skipped: true, reason: 'quota_exhausted' }), { status: 200 })
      }
    }

    // 2. Fetch and LOCK batch securely using RPC
    const { data: queueItems, error: rpcError } = await supabase.rpc('get_next_queue_batch', {
      p_limit: 20,
      p_block_low_priority: blockLowPriority
    })

    if (rpcError) throw rpcError

    if (!queueItems || queueItems.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), { status: 200 })
    }

    let successCount = 0

    // 3. Process items
    for (const item of queueItems) {
      try {
        let htmlContent = item.rendered_html
        let textContent = ''

        // Dynamic Runtime Rendering if HTML is missing
        if (!htmlContent && item.template_id) {
          const { data: templateRecord } = await supabase
            .from('email_templates')
            .select('slug, component_name')
            .eq('id', item.template_id)
            .single()

          if (!templateRecord) {
            throw new Error(`Template not found for ID: ${item.template_id}`)
          }

          const TemplateComponent = TEMPLATE_REGISTRY[templateRecord.slug]
          if (!TemplateComponent) {
            throw new Error(`Component not registered for slug: ${templateRecord.slug}`)
          }

          // Render HTML and fallback plain text
          htmlContent = render(React.createElement(TemplateComponent, item.template_data))
          textContent = render(React.createElement(TemplateComponent, item.template_data), { plainText: true })
        }

        if (!htmlContent) {
           throw new Error(`No HTML content or template provided.`)
        }

        // Dispatch via Resend
        const { data, error } = await resend.emails.send({
          from: 'Universe <hello@universeicos.app>',
          to: item.recipient_email,
          subject: item.subject,
          html: htmlContent,
          text: textContent || undefined,
        })

        if (error) {
          throw error
        }

        // Success -> Mark delivered
        await supabase.from('email_queue').update({
          status: 'delivered',
          provider_message_id: data?.id,
          provider_response: data,
          delivered_at: new Date().toISOString(),
          error_message: null
        }).eq('id', item.id)

        successCount++
      } catch (err) {
        // Failure handling & retry backoff
        const maxAttempts = PRIORITY_LIMITS[item.priority] || 3
        const newAttempts = item.attempts + 1
        
        if (newAttempts >= maxAttempts) {
          await supabase.from('email_queue').update({
            status: 'dead_letter',
            error_message: err.message,
            attempts: newAttempts
          }).eq('id', item.id)
        } else {
          const delaySeconds = calculateBackoffSeconds(newAttempts)
          const nextAttemptAt = new Date(Date.now() + delaySeconds * 1000).toISOString()
          
          await supabase.from('email_queue').update({
            status: 'retrying',
            error_message: err.message,
            attempts: newAttempts,
            next_attempt_at: nextAttemptAt
          }).eq('id', item.id)
        }
      }
    }

    // Update quota usage
    if (successCount > 0) {
      await supabase.rpc('increment_provider_quota', { p_provider: 'resend', p_amount: successCount })
    }

    return new Response(JSON.stringify({ processed: queueItems.length, success: successCount }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Queue worker error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
