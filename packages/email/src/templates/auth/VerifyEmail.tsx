import React from 'react'
import { Text, Section } from '@react-email/components'
import { UniverseLayout, BRAND } from '../../components/UniverseLayout.tsx'
import { EmailButton } from '../../components/EmailButton.tsx'
import { EmailCallout } from '../../components/EmailCallout.tsx'

export interface VerifyEmailProps {
  name: string
  verifyUrl: string
  expiresInHours?: number
}

export function VerifyEmail({
  name = 'Student',
  verifyUrl = 'https://waitlist.universeicos.app/auth/verify',
  expiresInHours = 24,
}: VerifyEmailProps) {
  return (
    <UniverseLayout preview="Verify your email address to complete your Universe registration." unsubscribeUrl={null}>
      <Section style={{ marginBottom: '28px' }}>
        <Text style={{ fontSize: '28px', fontWeight: '800', color: BRAND.textDark, margin: '0 0 8px', lineHeight: '1.2' }}>
          Verify your email ✉️
        </Text>
        <Text style={{ fontSize: '16px', color: BRAND.textMid, margin: '0', lineHeight: '1.6' }}>
          Hi {name}, one quick step before you're in.
        </Text>
      </Section>

      <Text style={{ fontSize: '15px', color: BRAND.textMid, lineHeight: '1.7', margin: '0 0 28px' }}>
        Click the button below to verify your email address and complete your Universe registration. This link expires in {expiresInHours} hours.
      </Text>

      <EmailButton href={verifyUrl} variant="primary" fullWidth>
        Verify My Email Address →
      </EmailButton>

      <EmailCallout variant="warning" title="Link expires in {expiresInHours} hours">
        For security, this verification link will expire. If it expires, you can request a new one from the login page.
      </EmailCallout>

      <Text style={{ fontSize: '13px', color: BRAND.textLight, margin: '24px 0 0', lineHeight: '1.6' }}>
        If you didn't create a Universe account, you can safely ignore this email. Someone may have typed your email address by mistake.
      </Text>
    </UniverseLayout>
  )
}
