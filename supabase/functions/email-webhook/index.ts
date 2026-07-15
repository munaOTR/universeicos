import { serve } from "std/http/server.ts"
import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error("Missing Authorization header")
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.json()
    const { event, userId, metadata = {} } = body

    if (!userId || !event) {
      throw new Error("Missing userId or event in request body")
    }

    // Determine event type and template slug
    let eventType = ''
    let templateSlug = ''
    let category = 'transactional'
    let priority = 'medium'

    if (event === 'welcome') {
      eventType = 'auth.welcome'
      templateSlug = 'welcome'
      category = 'auth'
      priority = 'high'
    } else if (event === 'referral_success') {
      eventType = 'referral.success'
      templateSlug = 'referral-success'
      priority = 'medium'
    } else {
      throw new Error(`Unknown event type: ${event}`)
    }

    // Insert into communication_events to trigger the comms-event-handler asynchronously
    const { error: insertError } = await supabase
      .from('communication_events')
      .insert({
        event_type: eventType,
        user_id: userId,
        channel: 'email',
        priority: priority,
        payload: {
          category: category,
          template_slug: templateSlug,
          template_data: metadata
        }
      })

    if (insertError) {
      throw insertError
    }

    return new Response(JSON.stringify({ success: true, message: 'Event emitted' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
