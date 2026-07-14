import React from 'react'
import { Text, Section, Row, Column } from '@react-email/components'
import { UniverseLayout, BRAND } from '../../components/UniverseLayout.tsx'
import { EmailButton } from '../../components/EmailButton.tsx'
import { EmailCallout } from '../../components/EmailCallout.tsx'

export interface AdminInvitationEmailProps {
  inviteeName: string
  inviterName: string
  role: string
  setPasswordUrl: string
  expiresInHours?: number
}

export function AdminInvitationEmail({
  inviteeName = 'Admin',
  inviterName = 'The Universe Team',
  role = 'Admin',
  setPasswordUrl = 'https://admin.rutherkingconsult.co.uk/auth/set-password',
  expiresInHours = 48,
}: AdminInvitationEmailProps) {
  return (
    <UniverseLayout preview={`${inviterName} invited you to join Universe as ${role}.`} unsubscribeUrl={null}>
      <Section style={{ marginBottom: '28px' }}>
        <Text style={{ fontSize: '28px', fontWeight: '800', color: BRAND.textDark, margin: '0 0 8px', lineHeight: '1.2' }}>
          You've been invited 🎉
        </Text>
        <Text style={{ fontSize: '16px', color: BRAND.textMid, margin: '0', lineHeight: '1.6' }}>
          Hi {inviteeName}, {inviterName} has invited you to join Universe.
        </Text>
      </Section>

      {/* Role badge */}
      <Section
        style={{
          backgroundColor: BRAND.bgSubtle,
          border:          `1px solid ${BRAND.borderColor}`,
          borderRadius:    '10px',
          padding:         '16px 20px',
          marginBottom:    '24px',
        }}
      >
        <Row>
          <Column>
            <Text style={{ fontSize: '13px', color: BRAND.textLight, margin: '0 0 4px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Role
            </Text>
            <Text style={{ fontSize: '18px', fontWeight: '700', color: BRAND.primary, margin: '0' }}>
              {role}
            </Text>
          </Column>
        </Row>
      </Section>

      <Text style={{ fontSize: '15px', color: BRAND.textMid, lineHeight: '1.7', margin: '0 0 28px' }}>
        Click the button below to set your password and access the Universe admin portal. This invitation expires in {expiresInHours} hours.
      </Text>

      <EmailButton href={setPasswordUrl} variant="primary" fullWidth>
        Accept Invitation & Set Password →
      </EmailButton>

      <EmailCallout variant="warning" title={`Invitation expires in ${expiresInHours} hours`}>
        If this invitation expires, contact {inviterName} to request a new one.
      </EmailCallout>
    </UniverseLayout>
  )
}
