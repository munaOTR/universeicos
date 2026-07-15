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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      throw new Error('No authorization header provided')
    }

    // 1. Verify caller's identity
    if (!supabaseUrl) throw new Error('Server Config Error: SUPABASE_URL missing')
    if (!Deno.env.get('SUPABASE_ANON_KEY')) throw new Error('Server Config Error: SUPABASE_ANON_KEY missing')
    if (!supabaseServiceKey) throw new Error('Server Config Error: SUPABASE_SERVICE_ROLE_KEY missing')

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError) throw new Error(`Auth Error: ${userError.message}`)
    if (!user) throw new Error('Auth Error: No user returned from token')

    // 2. Verify caller is super_admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) throw new Error(`Profile fetch error: ${profileError.message}`)
    if (profile?.role !== 'super_admin') {
      throw new Error(`Forbidden: Only super admins can invite other admins (Your role: ${profile?.role})`)
    }

    // 3. Parse request payload
    const bodyText = await req.text()
    if (!bodyText) throw new Error('Empty request body')
    const { email, role, granular_roles = [] } = JSON.parse(bodyText)

    if (!email || !role) {
      throw new Error('Email and role are required')
    }

    // 4. Use service_role to invite user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user already exists
    const { data: existingUserId, error: existError } = await adminClient.rpc('get_user_id_by_email', { p_email: email })
    
    let targetUserId = null;

    if (existingUserId) {
      // User exists! Promote them to admin instead of inviting
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({ role: role })
        .eq('id', existingUserId)
      
      if (updateError) throw new Error(`Failed to promote user: ${updateError.message}`)
      
      targetUserId = existingUserId;

      // Ensure their user_roles are updated if you have a separate table for that
      // For now, profiles.role handles the primary admin check according to 0008_admin_roles.sql
    } else {
      // User doesn't exist, invite them
      const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          role: role,
          granular_roles: granular_roles,
          invited_by: user.id
        }
      })

      if (inviteError) throw inviteError
      targetUserId = inviteData.user.id
    }

    // 5. Log to audit_logs
    const { error: auditError } = await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      action: 'insert',
      resource: 'admin_invitation',
      details: {
        invited_email: email,
        assigned_role: role,
        granular_roles: granular_roles
      }
    })
    if (auditError) throw new Error(`Audit log error: ${auditError.message}`)

    // 6. Emit domain event for Communication Infrastructure
    const { error: commError } = await adminClient.from('communication_events').insert({
      event_type: existingUserId ? 'admin.promoted' : 'admin.invited',
      channel: 'email',
      priority: 'high',
      payload: {
        category: 'auth',
        template_slug: existingUserId ? 'admin-promoted' : 'admin-invitation',
        recipient_email: email,
        template_data: {
          role: role,
          inviterName: profile?.full_name || 'An Admin'
        }
      }
    })
    if (commError) throw new Error(`Communication event error: ${commError.message}`)

    return new Response(
      JSON.stringify({ success: true, message: existingUserId ? 'User successfully promoted to admin' : 'Invitation sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
