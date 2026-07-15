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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables not set")
    }

    // Verify webhook source
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    if (token !== supabaseKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const payload = await req.json()

    if (payload.type === 'INSERT' && payload.table === 'referrals' && payload.schema === 'public') {
      const record = payload.record
      const referrerId = record?.referrer_id

      if (record?.status === 'completed' && referrerId) {
        console.log(`Emitting referral_success event for referrer: ${referrerId}`)

        const supabase = createClient(supabaseUrl, supabaseKey)
        
        // Insert a communication domain event directly
        await supabase.from('communication_events').insert({
          event_type: 'referral.success',
          user_id: referrerId,
          channel: 'email',
          priority: 'medium',
          payload: {
            category: 'transactional',
            template_slug: 'referral-success',
            template_data: {}
          }
        })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Process referral error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
