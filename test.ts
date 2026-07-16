import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve('apps/admin/.env.local')
const env = dotenv.parse(fs.readFileSync(envPath))

const supabaseUrl = env['VITE_SUPABASE_URL']
const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY']

const adminClient = createClient(supabaseUrl, serviceKey)

async function run() {
  const { data: users, error: err } = await adminClient.rpc('get_verification_eligible_users')
  console.log('Users:', users)

  if (users && users.length > 0) {
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: 'signup',
      email: users[0].email,
    })
    console.log('Link result:', { linkData, linkErr })

    // Check templates
    const { data: template } = await adminClient
      .from('email_templates')
      .select('id, subject')
      .eq('slug', 'verification-reminder')
      .single()
    console.log('Template:', template)

    if (template) {
      const { data: qData, error: qErr } = await adminClient.rpc('queue_email', {
        p_recipient_email: users[0].email,
        p_recipient_name: 'Test',
        p_subject: 'Test',
        p_template_id: template.id,
        p_template_data: {},
        p_priority: 'high',
      })
      console.log('Queue email result:', { qData, qErr })

      const { data: rData, error: rErr } = await adminClient.rpc('record_verification_reminder', {
        p_user_id: users[0].id,
        p_triggered_by: users[0].id,
        p_trigger_source: 'bulk',
        p_queue_id: qData,
      })
      console.log('Record result:', { rData, rErr })
    }
  }
}
run()
