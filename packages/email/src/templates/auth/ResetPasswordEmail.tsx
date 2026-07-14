import React from 'react'
import { Text, Section } from '@react-email/components'
import { UniverseLayout, BRAND } from '../../components/UniverseLayout.tsx'
import { EmailButton } from '../../components/EmailButton.tsx'
import { EmailCallout } from '../../components/EmailCallout.tsx'

export interface ResetPasswordEmailProps {
  name: string
  resetUrl: string
  expiresInMinutes?: number
  ipAddress?: string
}

export function ResetPasswordEmail({
  name = 'Student',
  resetUrl = 'https://universeicos.app/auth/reset',
  expiresInMinutes = 60,
  ipAddress,
}: ResetPasswordEmailProps) {
  return (
    <UniverseLayout preview="Reset your Universe password — link expires soon." unsubscribeUrl={null}>
      <Section style={{ marginBottom: '28px' }}>
        <Text style={{ fontSize: '28px', fontWeight: '800', color: BRAND.textDark, margin: '0 0 8px', lineHeight: '1.2' }}>
          Reset your password 🔐
        </Text>
        <Text style={{ fontSize: '16px', color: BRAND.textMid, margin: '0', lineHeight: '1.6' }}>
          Hi {name}, we received a request to reset your password.
        </Text>
      </Section>

      <Text style={{ fontSize: '15px', color: BRAND.textMid, lineHeight: '1.7', margin: '0 0 28px' }}>
        Click the button below to create a new password. This link expires in {expiresInMinutes} minutes for your security.
      </Text>

      <EmailButton href={resetUrl} variant="primary" fullWidth>
        Reset My Password →
      </EmailButton>

      <EmailCallout variant="error" title="Didn't request this?">
        If you didn't request a password reset, please ignore this email. Your password will remain unchanged. If you're concerned about your account security, contact us at hello@universeicos.app.
      </EmailCallout>

      {ipAddress && (
        <Text style={{ fontSize: '12px', color: BRAND.textLight, margin: '16px 0 0' }}>
          This request was initiated from IP address: {ipAddress}
        </Text>
      )}
    </UniverseLayout>
  )
}
