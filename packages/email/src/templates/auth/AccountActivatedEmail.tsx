import React from 'react'
import { Text, Section } from '@react-email/components'
import { UniverseLayout, BRAND } from '../../components/UniverseLayout.tsx'
import { EmailButton } from '../../components/EmailButton.tsx'

export interface AccountActivatedEmailProps {
  name: string
  dashboardUrl?: string
}

export function AccountActivatedEmail({
  name = 'Student',
  dashboardUrl = 'https://rutherkingconsult.co.uk/dashboard',
}: AccountActivatedEmailProps) {
  return (
    <UniverseLayout preview="Your Universe account has been activated! Welcome aboard." unsubscribeUrl={null}>
      <Section style={{ marginBottom: '28px' }}>
        <Text style={{ fontSize: '28px', fontWeight: '800', color: BRAND.textDark, margin: '0 0 8px', lineHeight: '1.2' }}>
          Account activated! 🎉
        </Text>
        <Text style={{ fontSize: '16px', color: BRAND.textMid, margin: '0', lineHeight: '1.6' }}>
          Hi {name}, great news — your Universe account is now active.
        </Text>
      </Section>

      <Text style={{ fontSize: '15px', color: BRAND.textMid, lineHeight: '1.7', margin: '0 0 28px' }}>
        You now have full access to Universe. Head to your dashboard to get started.
      </Text>

      <EmailButton href={dashboardUrl} variant="primary" fullWidth>
        Go to Dashboard →
      </EmailButton>
    </UniverseLayout>
  )
}
