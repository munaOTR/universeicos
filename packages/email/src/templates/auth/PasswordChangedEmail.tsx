import React from 'react'
import { Text, Section } from '@react-email/components'
import { UniverseLayout, BRAND } from '../../components/UniverseLayout.tsx'
import { EmailCallout } from '../../components/EmailCallout.tsx'

export interface PasswordChangedEmailProps {
  name: string
  changedAt?: string
  supportUrl?: string
}

export function PasswordChangedEmail({
  name = 'Student',
  changedAt,
  supportUrl = 'mailto:hello@rutherkingconsult.co.uk',
}: PasswordChangedEmailProps) {
  const timeStr = changedAt
    ? new Date(changedAt).toLocaleString('en-NG', { dateStyle: 'long', timeStyle: 'short' })
    : new Date().toLocaleString('en-NG', { dateStyle: 'long', timeStyle: 'short' })

  return (
    <UniverseLayout preview="Your Universe password was successfully changed." unsubscribeUrl={null}>
      <Section style={{ marginBottom: '28px' }}>
        <Text style={{ fontSize: '28px', fontWeight: '800', color: BRAND.textDark, margin: '0 0 8px', lineHeight: '1.2' }}>
          Password changed ✅
        </Text>
        <Text style={{ fontSize: '16px', color: BRAND.textMid, margin: '0', lineHeight: '1.6' }}>
          Hi {name}, this is a confirmation that your password was changed.
        </Text>
      </Section>

      <Text style={{ fontSize: '15px', color: BRAND.textMid, lineHeight: '1.7', margin: '0 0 24px' }}>
        Your Universe account password was successfully updated on{' '}
        <strong style={{ color: BRAND.textDark }}>{timeStr}</strong>.
      </Text>

      <EmailCallout variant="error" title="Didn't change your password?">
        If you did not make this change, your account may be compromised. Please{' '}
        <a href={supportUrl} style={{ color: BRAND.error }}>contact our support team</a>{' '}
        immediately to secure your account.
      </EmailCallout>
    </UniverseLayout>
  )
}
