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

    const payload = await req.json()
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    let userId = payload.record?.id // if triggered by DB Webhook on profiles update
    
    if (!userId && payload.userId) {
      userId = payload.userId
    }

    if (!userId) {
      throw new Error("Missing userId in payload")
    }

    // 1. Fetch user's current points
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, points')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      throw new Error(`Failed to fetch user profile: ${profileError?.message}`)
    }

    // 2. Fetch all rewards
    const { data: allRewards } = await supabase.from('rewards').select('*')
    
    // 3. Fetch user's current rewards
    const { data: userRewards } = await supabase
      .from('user_rewards')
      .select('reward_id')
      .eq('user_id', userId)
      
    const unlockedRewardIds = new Set(userRewards?.map(r => r.reward_id) || [])

    // 4. Evaluate new rewards
    const newlyUnlockedRewards = []
    if (allRewards) {
      for (const reward of allRewards) {
        if (!unlockedRewardIds.has(reward.id) && profile.points >= reward.points_required) {
          newlyUnlockedRewards.push({
            user_id: userId,
            reward_id: reward.id
          })
        }
      }
    }

    // 5. Insert new rewards
    if (newlyUnlockedRewards.length > 0) {
      const { error: insertError } = await supabase
        .from('user_rewards')
        .insert(newlyUnlockedRewards)
        
      if (insertError) {
        console.error("Error unlocking rewards:", insertError)
      }
    }

    // Badges could be evaluated here as well using similar logic

    return new Response(JSON.stringify({ 
      success: true, 
      unlocked_rewards_count: newlyUnlockedRewards.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Evaluate milestones error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
