import React from 'react'
import { Text, Section } from '@react-email/components'
import { UniverseLayout, BRAND } from '../../components/UniverseLayout.tsx'
import { EmailButton } from '../../components/EmailButton.tsx'
import { EmailCallout } from '../../components/EmailCallout.tsx'

export interface MagicLinkEmailProps {
  name: string
  magicUrl: string
  expiresInMinutes?: number
}

export function MagicLinkEmail({
  name = 'Student',
  magicUrl = 'https://rutherkingconsult.co.uk/auth/magic',
  expiresInMinutes = 15,
}: MagicLinkEmailProps) {
  return (
    <UniverseLayout preview="Your Universe login link — use it within 15 minutes." unsubscribeUrl={null}>
      <Section style={{ marginBottom: '28px' }}>
        <Text style={{ fontSize: '28px', fontWeight: '800', color: BRAND.textDark, margin: '0 0 8px', lineHeight: '1.2' }}>
          Your login link ✨
        </Text>
        <Text style={{ fontSize: '16px', color: BRAND.textMid, margin: '0', lineHeight: '1.6' }}>
          Hi {name}, click below to sign in to Universe instantly.
        </Text>
      </Section>

      <Text style={{ fontSize: '15px', color: BRAND.textMid, lineHeight: '1.7', margin: '0 0 28px' }}>
        No password needed. Click the button below to log in. This link is single-use and expires in {expiresInMinutes} minutes.
      </Text>

      <EmailButton href={magicUrl} variant="primary" fullWidth>
        Sign In to Universe →
      </EmailButton>

      <EmailCallout variant="warning" title={`Expires in ${expiresInMinutes} minutes`}>
        This login link can only be used once. If it expires, return to the login page to request a new one.
      </EmailCallout>

      <Text style={{ fontSize: '13px', color: BRAND.textLight, margin: '24px 0 0', lineHeight: '1.6' }}>
        If you didn't request this login link, you can safely ignore this email.
      </Text>
    </UniverseLayout>
  )
}
