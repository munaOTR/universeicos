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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Auth validation
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    if (token !== supabaseKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const payload = await req.json()
    
    // Support either a single event or batch from DB triggers
    if (payload.type === 'INSERT' && payload.table === 'communication_events' && payload.schema === 'public') {
      const record = payload.record
      
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // 1. Resolve user email & name
      let email = record.payload?.recipient_email
      let name = record.payload?.recipient_name
      
      if (record.user_id && (!email || !name)) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', record.user_id)
          .single()
          
        if (profile) {
          email = email || profile.email
          name = name || profile.full_name
        }
      }
      
      if (!email) {
        throw new Error(`Cannot process event ${record.id} — missing recipient email`)
      }

      // 2. Check communication preferences (if not auth/security)
      const isAuth = record.payload?.category === 'auth' || record.payload?.category === 'security'
      let isEnabled = true
      
      if (!isAuth && record.user_id && record.payload?.category) {
        const { data: pref } = await supabase.rpc('check_comm_preference', {
          p_user_id: record.user_id,
          p_category: record.payload.category,
          p_channel: record.channel || 'email'
        })
        isEnabled = !!pref
      }

      if (!isEnabled) {
        // Mark as skipped
        await supabase
          .from('communication_events')
          .update({ status: 'skipped', processed_at: new Date().toISOString() })
          .eq('id', record.id)
          
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      // 3. Resolve template ID
      let templateId = record.payload?.template_id
      if (!templateId && record.payload?.template_slug) {
        const { data: template } = await supabase
          .from('email_templates')
          .select('id')
          .eq('slug', record.payload.template_slug)
          .single()
        templateId = template?.id
      }

      // 4. Queue the email
      if (templateId || record.payload?.rendered_html) {
         await supabase.rpc('queue_email', {
          p_recipient_email: email,
          p_recipient_name: name || '',
          p_subject: record.payload?.subject || '',
          p_template_id: templateId,
          p_template_data: record.payload?.template_data || {},
          p_priority: record.priority || 'medium',
          p_event_id: record.id,
          p_campaign_id: record.payload?.campaign_id,
          p_scheduled_at: record.payload?.scheduled_at
        })
      }

      // 5. Mark event as processed
      await supabase
        .from('communication_events')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('id', record.id)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    
    return new Response(JSON.stringify({ success: true, skipped: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error handling communication event:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
