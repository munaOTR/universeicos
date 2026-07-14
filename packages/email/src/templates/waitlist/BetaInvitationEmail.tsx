import React from 'react'
import { Text, Section, Row, Column } from '@react-email/components'
import { UniverseLayout, BRAND } from '../../components/UniverseLayout.tsx'
import { EmailButton } from '../../components/EmailButton.tsx'
import { EmailCallout } from '../../components/EmailCallout.tsx'

export interface BetaInvitationEmailProps {
  name: string
  accessUrl: string
  referralCount?: number
  rank?: number
  accessCode?: string
}

export function BetaInvitationEmail({
  name = 'Student',
  accessUrl = 'https://waitlist.universeicos.app/beta',
  referralCount,
  rank,
  accessCode,
}: BetaInvitationEmailProps) {
  return (
    <UniverseLayout preview={`${name}, you're invited to the Universe Beta! 🚀`} unsubscribeUrl={null}>
      {/* Hero */}
      <Section
        style={{
          background:   `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.accent})`,
          borderRadius: '12px',
          padding:      '32px 28px',
          marginBottom: '28px',
          textAlign:    'center',
        }}
      >
        <Text style={{ fontSize: '40px', margin: '0 0 12px', lineHeight: '1' }}>🚀</Text>
        <Text style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', margin: '0 0 6px', lineHeight: '1.2' }}>
          Beta Access Granted
        </Text>
        <Text style={{ fontSize: '15px', color: 'rgba(255,255,255,0.85)', margin: '0' }}>
          Welcome to the inner circle, {name}.
        </Text>
      </Section>

      {(referralCount || rank) && (
        <Row style={{ marginBottom: '24px' }}>
          {referralCount && (
            <Column style={{ textAlign: 'center', paddingRight: '8px' }}>
              <Section style={{ backgroundColor: BRAND.bgSubtle, border: `1px solid ${BRAND.borderColor}`, borderRadius: '10px', padding: '16px 12px' }}>
                <Text style={{ fontSize: '28px', fontWeight: '800', color: BRAND.primary, margin: '0' }}>
                  {referralCount}
                </Text>
                <Text style={{ fontSize: '12px', color: BRAND.textLight, margin: '4px 0 0' }}>
                  Referrals
                </Text>
              </Section>
            </Column>
          )}
          {rank && (
            <Column style={{ textAlign: 'center', paddingLeft: '8px' }}>
              <Section style={{ backgroundColor: BRAND.bgSubtle, border: `1px solid ${BRAND.borderColor}`, borderRadius: '10px', padding: '16px 12px' }}>
                <Text style={{ fontSize: '28px', fontWeight: '800', color: BRAND.accent, margin: '0' }}>
                  #{rank.toLocaleString()}
                </Text>
                <Text style={{ fontSize: '12px', color: BRAND.textLight, margin: '4px 0 0' }}>
                  Your Rank
                </Text>
              </Section>
            </Column>
          )}
        </Row>
      )}

      <Text style={{ fontSize: '15px', color: BRAND.textMid, lineHeight: '1.7', margin: '0 0 20px' }}>
        Your community-building efforts have earned you early access to Universe Beta. You're among the first Nigerian students to experience the platform.
      </Text>

      {accessCode && (
        <EmailCallout variant="brand" title="Your Beta Access Code">
          <strong style={{ fontSize: '20px', letterSpacing: '0.1em', color: BRAND.primary }}>{accessCode}</strong>
          <br />Enter this code at the link below to activate your beta access.
        </EmailCallout>
      )}

      <EmailButton href={accessUrl} variant="primary" fullWidth>
        Access the Universe Beta →
      </EmailButton>
    </UniverseLayout>
  )
}
