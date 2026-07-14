import React from 'react'
import { Text, Section } from '@react-email/components'
import { UniverseLayout, BRAND } from '../../components/UniverseLayout.tsx'
import { EmailCallout } from '../../components/EmailCallout.tsx'

export interface AccountSuspendedEmailProps {
  name: string
  reason?: string
  appealUrl?: string
  supportEmail?: string
}

export function AccountSuspendedEmail({
  name = 'Student',
  reason,
  appealUrl,
  supportEmail = 'hello@rutherkingconsult.co.uk',
}: AccountSuspendedEmailProps) {
  return (
    <UniverseLayout preview="Important notice regarding your Universe account." unsubscribeUrl={null}>
      <Section style={{ marginBottom: '28px' }}>
        <Text style={{ fontSize: '28px', fontWeight: '800', color: BRAND.error, margin: '0 0 8px', lineHeight: '1.2' }}>
          Account suspended
        </Text>
        <Text style={{ fontSize: '16px', color: BRAND.textMid, margin: '0', lineHeight: '1.6' }}>
          Hi {name}, your Universe account has been temporarily suspended.
        </Text>
      </Section>

      {reason && (
        <Text style={{ fontSize: '15px', color: BRAND.textMid, lineHeight: '1.7', margin: '0 0 24px' }}>
          <strong style={{ color: BRAND.textDark }}>Reason:</strong> {reason}
        </Text>
      )}

      <EmailCallout variant="error" title="Need help?">
        If you believe this is a mistake, please contact our support team at{' '}
        <a href={`mailto:${supportEmail}`} style={{ color: BRAND.error }}>{supportEmail}</a>
        {appealUrl ? ' or submit an appeal below.' : '.'}
      </EmailCallout>
    </UniverseLayout>
  )
}
